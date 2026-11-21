const fs = require("fs"), path = require("path"), crypto = require("crypto");
const express = require("express"), cors = require("cors"), jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");

const { JWT_SECRET, SENHA_REPRESENTANTE, SENHA_ADM, PORT = 3000,
  DB_HOST = "localhost", DB_PORT = 3306, DB_USER, DB_PASSWORD = "", DB_NAME = "intergil" } = process.env;
if (!JWT_SECRET || !SENHA_REPRESENTANTE || !SENHA_ADM || !DB_USER) throw new Error("Defina as variáveis do .env");

// O banco é criado antes, rodando o schema.sql no VS Code.
const pool = mysql.createPool({
  host: DB_HOST, port: +DB_PORT, user: DB_USER, password: DB_PASSWORD, database: DB_NAME,
  charset: "utf8mb4", waitForConnections: true, connectionLimit: 10,
});
const q = async (sql, args = []) => (await pool.query(sql, args))[0];     // devolve as linhas (ou o resultado do INSERT/UPDATE)
const um = async (sql, args = []) => (await q(sql, args))[0];             // devolve só a primeira linha
async function tx(fn) {                                                   // várias mudanças juntas: ou entram todas ou nenhuma
  const c = await pool.getConnection();
  try { await c.beginTransaction(); const r = await fn(c); await c.commit(); return r; }
  catch (e) { await c.rollback(); throw e; }
  finally { c.release(); }
}

const UP = path.join(__dirname, "uploads"); fs.mkdirSync(UP, { recursive: true });                 // fotos das camisas (públicas)
const COMP = path.join(__dirname, "comprovantes"); fs.mkdirSync(COMP, { recursive: true });        // comprovantes (privados)

const app = express();
app.use(cors()); app.use(express.json({ limit: "3mb" })); app.use("/uploads", express.static(UP));

const h = fn => (req, res, next) => fn(req, res, next).catch(next);       // erros de rotas async vão para o tratador no fim
const reais = c => (c / 100).toFixed(2).replace(".", ",");
const centavos = s => Math.round(parseFloat(String(s).replace(",", ".")) * 100);
const salaOut = s => ({ id: s.id, cor: s.cor, hex: s.hex, nome: s.nome, mascote: s.mascote, preco: reais(s.preco_centavos),
  camisa: s.camisa_imagem, pix: s.pix_chave, contato: s.contato });

function auth(...papeis) {
  return (req, res, next) => {
    try {
      req.user = jwt.verify((req.headers.authorization || "").replace("Bearer ", ""), JWT_SECRET);
      if (papeis.length && !papeis.includes(req.user.papel)) return res.status(403).json({ erro: "Sem permissão" });
      next();
    } catch { res.status(401).json({ erro: "Faça login" }); }
  };
}

const PAPEIS = ["aluno", "representante", "adm"];
const hashSenha = p => { const sal = crypto.randomBytes(16).toString("hex"); return sal + ":" + crypto.scryptSync(p, sal, 64).toString("hex"); };
const confere = (p, hs) => {
  if (!hs) return false;
  const [sal, k] = hs.split(":"), a = Buffer.from(k, "hex"), b = crypto.scryptSync(p, sal, 64);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
// Muda o status do pedido e anota no histórico. `c` é a conexão da transação.
const mudarStatus = async (c, pedidoId, anterior, novo, usuarioId) => {
  await c.query("UPDATE pedidos SET status=? WHERE id=?", [novo, pedidoId]);
  await c.query("INSERT INTO historico_pedidos (pedido_id,status_anterior,status_novo,usuario_id) VALUES (?,?,?,?)", [pedidoId, anterior, novo, usuarioId]);
};
const token = u => jwt.sign({ id: u.id, papel: u.papel, sala_id: u.sala_id }, JWT_SECRET, { expiresIn: "12h" });

// --- Autenticação ---
// Aluno cria a própria senha. Representante e adm usam a senha do .env (só quem a conhece consegue se cadastrar).
app.post("/auth/criar", h(async (req, res) => {
  const { nome, numero_chamada, sala_id, papel = "aluno", senha } = req.body;
  if (!PAPEIS.includes(papel)) return res.status(400).json({ erro: "Papel inválido" });
  if (!nome || nome.trim().split(/\s+/).length < 2 || !Number.isInteger(+numero_chamada) || !sala_id) return res.status(400).json({ erro: "Preencha nome completo, número e turma" });
  if (!(await um("SELECT 1 FROM salas WHERE id=?", [sala_id]))) return res.status(400).json({ erro: "Turma inválida" });
  if (papel === "representante" && senha !== SENHA_REPRESENTANTE) return res.status(401).json({ erro: "Senha incorreta" });
  if (papel === "adm" && senha !== SENHA_ADM) return res.status(401).json({ erro: "Senha incorreta" });
  if (papel === "aluno" && String(senha || "").length < 4) return res.status(400).json({ erro: "A senha precisa ter pelo menos 4 caracteres" });
  try {
    const r = await q("INSERT INTO usuarios (nome,numero_chamada,sala_id,papel,senha_hash) VALUES (?,?,?,?,?)",
      [nome.trim(), +numero_chamada, sala_id, papel, papel === "aluno" ? hashSenha(String(senha)) : null]);
    res.status(201).json({ token: token({ id: r.insertId, papel, sala_id }) });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return res.status(409).json({ erro: "Essa conta já existe" });
    throw e;
  }
}));

app.post("/auth/entrar", h(async (req, res) => {
  const { nome, numero_chamada, sala_id, papel = "aluno", senha = "" } = req.body;
  if (!PAPEIS.includes(papel)) return res.status(400).json({ erro: "Papel inválido" });
  const u = await um("SELECT * FROM usuarios WHERE nome=? AND numero_chamada=? AND sala_id=? AND papel=?", [String(nome || "").trim(), numero_chamada, sala_id, papel]);
  if (!u) return res.status(404).json({ erro: "Conta não encontrada" });
  if (papel === "aluno") {
    if (!u.senha_hash) await q("UPDATE usuarios SET senha_hash=? WHERE id=?", [hashSenha(String(senha)), u.id]);   // conta sem senha: esta passa a valer
    else if (!confere(String(senha), u.senha_hash)) return res.status(401).json({ erro: "Senha incorreta" });
  } else if (senha !== (papel === "adm" ? SENHA_ADM : SENHA_REPRESENTANTE)) return res.status(401).json({ erro: "Senha incorreta" });
  res.json({ token: token(u) });
}));

// --- Salas ---
app.get("/salas", h(async (_, res) => res.json((await q("SELECT * FROM salas ORDER BY id")).map(salaOut))));

app.put("/salas/:id", auth("representante", "adm"), h(async (req, res) => {
  const id = +req.params.id;
  if (req.user.papel === "representante" && req.user.sala_id !== id) return res.status(403).json({ erro: "Só a sua sala" });
  const s = await um("SELECT * FROM salas WHERE id=?", [id]);
  if (!s) return res.status(404).json({ erro: "Sala não existe" });
  const b = req.body; let img = s.camisa_imagem;
  if (b.camisa_base64) {
    const m = /^data:image\/(png|jpe?g|webp);base64,(.+)$/.exec(b.camisa_base64);
    if (!m) return res.status(400).json({ erro: "Imagem inválida" });
    img = `/uploads/sala-${id}-${Date.now()}.${m[1] === "jpeg" ? "jpg" : m[1]}`;
    fs.writeFileSync(path.join(__dirname, img), Buffer.from(m[2], "base64"));
  }
  const preco = b.preco ? centavos(b.preco) : s.preco_centavos;
  if (!(preco >= 0)) return res.status(400).json({ erro: "Preço inválido" });
  await q("UPDATE salas SET nome=?, preco_centavos=?, pix_chave=?, contato=?, camisa_imagem=? WHERE id=?",
    [(b.nome || s.nome).trim(), preco, b.pix ?? s.pix_chave, b.contato ?? s.contato, img, id]);
  res.json(salaOut(await um("SELECT * FROM salas WHERE id=?", [id])));
}));

// --- Pedidos ---
const SELECT_PEDIDO = `SELECT p.id, u.nome AS comprador, u.numero_chamada, s.nome AS sala, p.nome_camisa, p.tamanho,
    p.preco_centavos, p.status, p.criado_em,
    (SELECT g.status FROM pagamentos g WHERE g.pedido_id=p.id ORDER BY g.id DESC LIMIT 1) AS pagamento_status,
    (SELECT g.id FROM pagamentos g WHERE g.pedido_id=p.id ORDER BY g.id DESC LIMIT 1) AS pagamento_id
  FROM pedidos p JOIN usuarios u ON u.id=p.usuario_id JOIN salas s ON s.id=p.sala_id`;

app.post("/pedidos", auth(), h(async (req, res) => {
  const { sala_id, nome_camisa, tamanho } = req.body;
  const s = await um("SELECT * FROM salas WHERE id=?", [sala_id]);
  if (!s || !nome_camisa?.trim() || !["P", "M", "G", "GG", "XG"].includes(tamanho)) return res.status(400).json({ erro: "Dados inválidos" });
  const id = await tx(async c => {
    const [r] = await c.query("INSERT INTO pedidos (usuario_id,sala_id,nome_camisa,tamanho,preco_centavos) VALUES (?,?,?,?,?)",
      [req.user.id, sala_id, nome_camisa.trim(), tamanho, s.preco_centavos]);   // preço vem do servidor
    await c.query("INSERT INTO historico_pedidos (pedido_id,status_anterior,status_novo,usuario_id) VALUES (?,NULL,'aguardando_pagamento',?)", [r.insertId, req.user.id]);
    return r.insertId;
  });
  res.status(201).json({ id, preco: reais(s.preco_centavos), pix: s.pix_chave, contato: s.contato });
}));

app.get("/pedidos/meus", auth(), h(async (req, res) =>
  res.json(await q(SELECT_PEDIDO + " WHERE p.usuario_id=? ORDER BY p.id DESC", [req.user.id]))));

app.get("/pedidos", auth("representante", "adm"), h(async (req, res) => {
  const adm = req.user.papel === "adm";
  res.json(await q(SELECT_PEDIDO + (adm ? "" : " WHERE p.sala_id=?") + " ORDER BY p.id DESC", adm ? [] : [req.user.sala_id]));
}));

app.patch("/pedidos/:id/status", auth("representante", "adm"), h(async (req, res) => {
  const { status } = req.body, p = await um("SELECT * FROM pedidos WHERE id=?", [req.params.id]);
  if (!p || !["aguardando_pagamento", "pago", "entregue", "cancelado"].includes(status)) return res.status(400).json({ erro: "Dados inválidos" });
  if (req.user.papel === "representante" && p.sala_id !== req.user.sala_id) return res.status(403).json({ erro: "Só a sua sala" });
  if ((status === "pago" || status === "entregue") && !(await um("SELECT 1 FROM pagamentos WHERE pedido_id=? AND status='confirmado'", [p.id])))
    return res.status(409).json({ erro: "Confirme o pagamento antes" });
  await tx(c => mudarStatus(c, p.id, p.status, status, req.user.id));
  res.json({ ok: true });
}));

// --- Pagamentos ---
// 1) o aluno avisa que pagou (com ou sem foto do comprovante)
app.post("/pedidos/:id/pagamento", auth(), h(async (req, res) => {
  const p = await um("SELECT * FROM pedidos WHERE id=?", [req.params.id]);
  if (!p || p.usuario_id !== req.user.id) return res.status(404).json({ erro: "Pedido não encontrado" });
  if (p.status !== "aguardando_pagamento") return res.status(409).json({ erro: "Esse pedido não está aguardando pagamento" });
  if (await um("SELECT 1 FROM pagamentos WHERE pedido_id=? AND status='informado'", [p.id])) return res.status(409).json({ erro: "Você já avisou. Aguarde a conferência" });

  let arquivo = null;
  const b64 = req.body.comprovante_base64;
  if (b64) {
    const m = /^data:image\/(png|jpe?g|webp);base64,(.+)$/.exec(b64);
    if (!m) return res.status(400).json({ erro: "Comprovante inválido (use png, jpg ou webp)" });
    arquivo = `comprovante-${p.id}-${Date.now()}.${m[1] === "jpeg" ? "jpg" : m[1]}`;
    fs.writeFileSync(path.join(COMP, arquivo), Buffer.from(m[2], "base64"));
  }
  const sala = await um("SELECT pix_chave FROM salas WHERE id=?", [p.sala_id]);
  try {
    const r = await q("INSERT INTO pagamentos (pedido_id,usuario_id,valor_centavos,pix_chave_usada,comprovante_arquivo) VALUES (?,?,?,?,?)",
      [p.id, req.user.id, p.preco_centavos, sala.pix_chave, arquivo]);   // valor vem do pedido, não do navegador
    res.status(201).json({ id: r.insertId, status: "informado" });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return res.status(409).json({ erro: "Você já avisou. Aguarde a conferência" });
    throw e;
  }
}));

// 2) representante (ou adm) lista os pagamentos para conferir
app.get("/pagamentos", auth("representante", "adm"), h(async (req, res) => {
  const adm = req.user.papel === "adm", st = req.query.status;
  const cond = [adm ? "1=1" : "p.sala_id=?", st ? "g.status=?" : "1=1"];
  const args = [...(adm ? [] : [req.user.sala_id]), ...(st ? [st] : [])];
  res.json(await q(`SELECT g.id, g.pedido_id, u.nome AS comprador, s.nome AS sala, g.valor_centavos, g.metodo, g.status,
      g.observacao, g.informado_em, g.conferido_em, g.comprovante_arquivo IS NOT NULL AS tem_comprovante
    FROM pagamentos g JOIN pedidos p ON p.id=g.pedido_id JOIN usuarios u ON u.id=g.usuario_id JOIN salas s ON s.id=p.sala_id
    WHERE ${cond.join(" AND ")} ORDER BY g.id DESC`, args));
}));

// 3) confirmar ou recusar. Confirmar também marca o pedido como pago.
app.patch("/pagamentos/:id", auth("representante", "adm"), h(async (req, res) => {
  const { status, observacao } = req.body;
  const g = await um("SELECT g.*, p.sala_id, p.status AS pedido_status FROM pagamentos g JOIN pedidos p ON p.id=g.pedido_id WHERE g.id=?", [req.params.id]);
  if (!g || !["confirmado", "recusado"].includes(status)) return res.status(400).json({ erro: "Dados inválidos" });
  if (req.user.papel === "representante" && g.sala_id !== req.user.sala_id) return res.status(403).json({ erro: "Só a sua sala" });
  if (g.status !== "informado") return res.status(409).json({ erro: "Esse pagamento já foi conferido" });
  await tx(async c => {
    await c.query("UPDATE pagamentos SET status=?, observacao=?, conferido_por=?, conferido_em=NOW() WHERE id=?",
      [status, observacao || null, req.user.id, g.id]);
    if (status === "confirmado") await mudarStatus(c, g.pedido_id, g.pedido_status, "pago", req.user.id);
  });
  res.json({ ok: true });
}));

// 4) ver o comprovante: só o dono do pagamento, o representante da sala ou o adm
app.get("/pagamentos/:id/comprovante", auth(), h(async (req, res) => {
  const g = await um("SELECT g.*, p.sala_id FROM pagamentos g JOIN pedidos p ON p.id=g.pedido_id WHERE g.id=?", [req.params.id]);
  if (!g || !g.comprovante_arquivo) return res.status(404).json({ erro: "Sem comprovante" });
  const pode = req.user.papel === "adm" || g.usuario_id === req.user.id || (req.user.papel === "representante" && g.sala_id === req.user.sala_id);
  if (!pode) return res.status(403).json({ erro: "Sem permissão" });
  res.sendFile(path.join(COMP, path.basename(g.comprovante_arquivo)));
}));

// Qualquer erro inesperado (ex.: MySQL desligado) vira uma resposta clara, sem derrubar o servidor.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erro: "Erro no servidor. Confira se o MySQL está ligado e o .env está certo." });
});

app.listen(PORT, () => console.log("API rodando na porta " + PORT));
