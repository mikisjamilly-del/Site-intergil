const fs = require("fs"), path = require("path"), crypto = require("crypto");
const express = require("express"), cors = require("cors"), jwt = require("jsonwebtoken"), { Pool } = require("pg");

const { DATABASE_URL, JWT_SECRET, SENHA_REPRESENTANTE, SENHA_ADM, CORS_ORIGIN, PORT = 3000 } = process.env;
if (!DATABASE_URL || !JWT_SECRET || !SENHA_REPRESENTANTE || !SENHA_ADM)
  throw new Error("Faltam variáveis: DATABASE_URL, JWT_SECRET, SENHA_REPRESENTANTE e SENHA_ADM");

// --- Banco de dados (PostgreSQL) ---
const local = /@(localhost|127\.0\.0\.1)/.test(DATABASE_URL);
const pool = new Pool({ connectionString: DATABASE_URL, ssl: local ? false : { rejectUnauthorized: false } });
const q = async (sql, params) => (await pool.query(sql, params)).rows;
const um = async (sql, params) => (await q(sql, params))[0];

const app = express();
app.set("trust proxy", 1);                         // atrás do proxy da hospedagem (IP real e https)
if (CORS_ORIGIN) app.use(cors({ origin: CORS_ORIGIN }));   // só se o site ficar em outro endereço
app.use((req, res, next) => {
  res.set({ "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "same-origin" });
  next();
});
app.use(express.json({ limit: "3mb" }));

const h = fn => (req, res, next) => fn(req, res, next).catch(next);   // erros async vão para o handler final
const reais = c => (c / 100).toFixed(2).replace(".", ",");
const centavos = s => Math.round(parseFloat(String(s).replace(",", ".")) * 100);
const limpa = s => String(s || "").trim().replace(/\s+/g, " ");
const SALA = "id, cor, hex, nome, mascote, preco_centavos, tamanhos, (camisa_imagem IS NOT NULL) AS tem_camisa, pix_chave, contato, atualizado_em";
const salaOut = s => ({ id: s.id, cor: s.cor, hex: s.hex, nome: s.nome, mascote: s.mascote || "", preco: reais(s.preco_centavos),
  camisa: s.tem_camisa ? `/salas/${s.id}/camisa?v=${new Date(s.atualizado_em).getTime()}` : "",
  pix: s.pix_chave || "", contato: s.contato || "", tamanhos: s.tamanhos.split(",") });

// --- Senhas dos alunos: guardadas só como hash (scrypt) ---
const hash = s => { const sal = crypto.randomBytes(16).toString("hex"); return sal + ":" + crypto.scryptSync(s, sal, 32).toString("hex"); };
const confere = (s, hs) => {
  if (!hs) return false;
  const [sal, k] = hs.split(":"), a = crypto.scryptSync(s, sal, 32), b = Buffer.from(k, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// --- Proteção contra adivinhar senha: 20 erros por IP a cada 15 min ---
const falhas = new Map(), JANELA = 15 * 60 * 1000;
const recentes = ip => (falhas.get(ip) || []).filter(t => Date.now() - t < JANELA);
const bloqueado = req => recentes(req.ip).length >= 20;
const recusar = (req, res, status, erro) => { falhas.set(req.ip, [...recentes(req.ip), Date.now()]); return res.status(status).json({ erro }); };

function auth(...papeis) {
  return h(async (req, res, next) => {
    try { req.user = jwt.verify((req.headers.authorization || "").replace("Bearer ", ""), JWT_SECRET); }
    catch { return res.status(401).json({ erro: "Faça login" }); }
    if (papeis.length && !papeis.includes(req.user.papel)) return res.status(403).json({ erro: "Sem permissão" });
    if (req.user.papel === "representante") {   // a administração pode retirar a permissão a qualquer momento
      const ok = await um(`SELECT 1 FROM usuarios u JOIN permissoes p ON p.sala_id=u.sala_id AND p.numero_chamada=u.numero_chamada WHERE u.id=$1`, [req.user.id]);
      if (!ok) return res.status(403).json({ erro: "A administração retirou a sua permissão de representante." });
    }
    next();
  });
}
const token = u => jwt.sign({ id: u.id, papel: u.papel, sala_id: u.sala_id }, JWT_SECRET, { expiresIn: "12h" });
const salaExiste = async id => Number.isInteger(id) && !!(await um("SELECT 1 FROM salas WHERE id=$1", [id]));

app.get("/saude", h(async (_, res) => { await q("SELECT 1"); res.json({ ok: true, versao: 9 }); }));   // a hospedagem usa para saber se está vivo

// --- Autenticação ---
app.post("/auth/criar", h(async (req, res) => {            // só alunos criam conta
  const nome = limpa(req.body.nome), senha = req.body.senha, sala_id = Number(req.body.sala_id), num = Number(req.body.numero_chamada);
  if (bloqueado(req)) return res.status(429).json({ erro: "Muitas tentativas. Espere alguns minutos." });
  if (nome.split(" ").length < 2 || !Number.isInteger(num) || num < 0 || !(await salaExiste(sala_id))) return res.status(400).json({ erro: "Preencha nome completo, número e turma" });
  if (typeof senha !== "string" || senha.length < 4) return res.status(400).json({ erro: "A senha precisa ter pelo menos 4 caracteres" });
  try {
    const u = await um("INSERT INTO usuarios (nome,numero_chamada,sala_id,papel,senha_hash) VALUES ($1,$2,$3,'aluno',$4) RETURNING id", [nome, num, sala_id, hash(senha)]);
    res.json({ token: token({ id: u.id, papel: "aluno", sala_id }) });
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ erro: "Essa conta já existe" });
    throw e;
  }
}));

app.post("/auth/entrar", h(async (req, res) => {
  const { papel = "aluno", senha } = req.body, nome = limpa(req.body.nome), sala_id = Number(req.body.sala_id), num = Number(req.body.numero_chamada);
  if (bloqueado(req)) return res.status(429).json({ erro: "Muitas tentativas. Espere alguns minutos." });
  if (!["aluno", "representante", "adm"].includes(papel)) return res.status(400).json({ erro: "Papel inválido" });
  if (!nome || !Number.isInteger(num) || !(await salaExiste(sala_id))) return res.status(400).json({ erro: "Preencha nome completo, número e turma" });
  if (papel === "representante") {
    if (senha !== SENHA_REPRESENTANTE) return recusar(req, res, 401, "Senha incorreta");
    const liberado = await um("SELECT 1 FROM permissoes WHERE sala_id=$1 AND numero_chamada=$2", [sala_id, num]);
    console.log(`login de representante: sala ${sala_id}, chamada ${num}, liberado=${!!liberado}`);   // ajuda a achar problemas nos Logs
    if (!liberado) {   // não conta como "senha errada": quem espera a liberação não fica bloqueado
      const t = await um("SELECT nome FROM salas WHERE id=$1", [sala_id]);
      const outras = await q("SELECT s.nome FROM permissoes p JOIN salas s ON s.id=p.sala_id WHERE p.numero_chamada=$1 ORDER BY p.sala_id", [num]);
      const dica = outras.length
        ? ` Esse número está liberado em: ${outras.map(o => o.nome).join(", ")}. Escolha essa turma na hora de entrar.`
        : " Peça ao ADM para liberar esse número na aba PERMISSÕES.";
      return res.status(403).json({ erro: `Não encontrei liberação para ${t.nome}, chamada nº ${num}.${dica}` });
    }
  }
  if (papel === "adm" && senha !== SENHA_ADM) return recusar(req, res, 401, "Senha incorreta");

  let u;
  if (papel === "aluno") {
    u = await um("SELECT id, papel, sala_id, senha_hash FROM usuarios WHERE lower(nome)=lower($1) AND numero_chamada=$2 AND sala_id=$3 AND papel='aluno'", [nome, num, sala_id]);
    if (!u) return recusar(req, res, 404, "Conta não encontrada. Use Criar conta.");
    if (typeof senha !== "string" || !confere(senha, u.senha_hash)) return recusar(req, res, 401, "Senha incorreta");
  } else {   // representante e ADM: a senha do servidor vale; o cadastro é criado na primeira vez
    u = await um(`INSERT INTO usuarios (nome,numero_chamada,sala_id,papel) VALUES ($1,$2,$3,$4)
      ON CONFLICT (lower(nome), numero_chamada, sala_id, papel) DO UPDATE SET papel = EXCLUDED.papel RETURNING id, papel, sala_id`, [nome, num, sala_id, papel]);
  }
  res.json({ token: token(u) });
}));

// --- Salas ---
app.get("/salas", h(async (_, res) => res.json((await q(`SELECT ${SALA} FROM salas ORDER BY id`)).map(salaOut))));

app.get("/salas/:id/camisa", h(async (req, res) => {      // imagem da camisa, guardada no banco
  const s = await um("SELECT camisa_imagem FROM salas WHERE id=$1", [+req.params.id || 0]);
  const m = s && /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(s.camisa_imagem || "");
  if (!m) return res.status(404).end();
  res.set({ "Content-Type": m[1], "Cache-Control": "public, max-age=31536000, immutable" }).send(Buffer.from(m[2], "base64"));
}));

app.put("/salas/:id", auth("representante", "adm"), h(async (req, res) => {
  const id = +req.params.id;
  if (req.user.papel === "representante" && req.user.sala_id !== id) return res.status(403).json({ erro: "Só a sua sala" });
  const s = Number.isInteger(id) && await um("SELECT * FROM salas WHERE id=$1", [id]);
  if (!s) return res.status(404).json({ erro: "Sala não existe" });
  const b = req.body; let img = s.camisa_imagem;
  if (b.camisa_base64) {
    if (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(b.camisa_base64) || b.camisa_base64.length > 2.5e6) return res.status(400).json({ erro: "Imagem inválida" });
    img = b.camisa_base64;
  }
  const preco = b.preco ? centavos(b.preco) : s.preco_centavos;
  if (!(preco >= 0)) return res.status(400).json({ erro: "Preço inválido" });
  let tamanhos = s.tamanhos;
  if (req.user.papel === "adm" && b.tamanhos != null) {     // só a administração muda os tamanhos
    const lista = [...new Set(String(b.tamanhos).split(",").map(t => t.trim()).filter(Boolean))];
    if (!lista.length || lista.length > 20 || lista.some(t => Array.from(t).length > 10 || /\p{C}/u.test(t)))
      return res.status(400).json({ erro: "Tamanhos inválidos: use até 20, de até 10 caracteres cada, separados por vírgula" });
    tamanhos = lista.join(",");
  }
  await q("UPDATE salas SET nome=$1, preco_centavos=$2, pix_chave=$3, contato=$4, camisa_imagem=$5, tamanhos=$6, atualizado_em=now() WHERE id=$7",
    [limpa(b.nome) || s.nome, preco, b.pix ?? s.pix_chave, b.contato ?? s.contato, img, tamanhos, id]);
  res.json(salaOut(await um(`SELECT ${SALA} FROM salas WHERE id=$1`, [id])));
}));

// --- Pedidos ---
app.post("/pedidos", auth(), h(async (req, res) => {
  const { nome_camisa, tamanho, numero_camisa } = req.body, sala_id = Number(req.body.sala_id);
  const s = Number.isInteger(sala_id) && await um("SELECT * FROM salas WHERE id=$1", [sala_id]);
  const n = numero_camisa == null ? null : (String(numero_camisa).trim() || null);   // opcional; pode ser número ou símbolo
  if (!s || !limpa(nome_camisa) || !s.tamanhos.split(",").includes(tamanho)) return res.status(400).json({ erro: "Dados inválidos (confira o tamanho)" });
  if (n !== null && !(Array.from(n).length <= 20 && /^[^\p{C}]+$/u.test(n))) return res.status(400).json({ erro: "O que vai na camisa pode ter até 20 caracteres" });
  const p = await um("INSERT INTO pedidos (usuario_id,sala_id,nome_camisa,numero_camisa,tamanho,preco_centavos) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
    [req.user.id, sala_id, limpa(nome_camisa), n, tamanho, s.preco_centavos]);   // preço vem do servidor
  res.status(201).json({ id: p.id, preco: reais(s.preco_centavos), pix: s.pix_chave, contato: s.contato });
}));

// Sacolinha do aluno: só os pedidos dele
app.get("/pedidos/meus", auth(), h(async (req, res) => {
  res.json(await q(`SELECT p.id, s.nome AS sala, p.nome_camisa, p.numero_camisa, p.tamanho, p.preco_centavos, p.status, p.criado_em
    FROM pedidos p JOIN salas s ON s.id=p.sala_id WHERE p.usuario_id=$1 ORDER BY p.id DESC`, [req.user.id]));
}));

// O aluno cancela o próprio pedido enquanto ele ainda aguarda pagamento
app.patch("/pedidos/:id/cancelar", auth(), h(async (req, res) => {
  const id = +req.params.id;
  const p = Number.isInteger(id) && await um("UPDATE pedidos SET status='cancelado' WHERE id=$1 AND usuario_id=$2 AND status='aguardando_pagamento' RETURNING id", [id, req.user.id]);
  if (!p) return res.status(409).json({ erro: "Só dá para cancelar pedidos que ainda aguardam pagamento. Fale com o representante." });
  res.json({ ok: true });
}));

// Representante vê só a sua sala; ADM vê todas. Ordem alfabética pelo nome do comprador.
app.get("/pedidos", auth("representante", "adm"), h(async (req, res) => {
  const adm = req.user.papel === "adm";
  res.json(await q(`SELECT p.id, p.sala_id, u.nome AS comprador, u.numero_chamada, s.nome AS sala, p.nome_camisa, p.numero_camisa,
    p.tamanho, p.preco_centavos, p.status, p.criado_em FROM pedidos p JOIN usuarios u ON u.id=p.usuario_id
    JOIN salas s ON s.id=p.sala_id ${adm ? "" : "WHERE p.sala_id = $1"} ORDER BY lower(u.nome), p.id`, adm ? [] : [req.user.sala_id]));
}));

app.patch("/pedidos/:id/status", auth("representante", "adm"), h(async (req, res) => {
  const { status } = req.body, id = +req.params.id;
  const p = Number.isInteger(id) && await um("SELECT * FROM pedidos WHERE id=$1", [id]);
  if (!p || !["aguardando_pagamento", "pago", "entregue", "cancelado"].includes(status)) return res.status(400).json({ erro: "Dados inválidos" });
  if (req.user.papel === "representante" && p.sala_id !== req.user.sala_id) return res.status(403).json({ erro: "Só a sua sala" });
  await q("UPDATE pedidos SET status=$1 WHERE id=$2", [status, id]);
  res.json({ ok: true });
}));

// --- Camisas campeãs (todos veem; só a administração cadastra) ---
const IMG = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;

app.get("/campeas", h(async (_, res) => {
  const lista = await q("SELECT id, ano, nome, (camisa_imagem IS NOT NULL) AS tem_imagem, atualizado_em FROM campeas ORDER BY ano DESC");
  res.json(lista.map(c => ({ id: c.id, ano: c.ano, nome: c.nome,
    imagem: c.tem_imagem ? `/campeas/${c.id}/imagem?v=${new Date(c.atualizado_em).getTime()}` : "" })));
}));

app.get("/campeas/:id/imagem", h(async (req, res) => {
  const c = await um("SELECT camisa_imagem FROM campeas WHERE id=$1", [+req.params.id || 0]);
  const m = c && /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(c.camisa_imagem || "");
  if (!m) return res.status(404).end();
  res.set({ "Content-Type": m[1], "Cache-Control": "public, max-age=31536000, immutable" }).send(Buffer.from(m[2], "base64"));
}));

app.post("/campeas", auth("adm"), h(async (req, res) => {
  const ano = Number(req.body.ano), nome = limpa(req.body.nome).slice(0, 40), img = req.body.imagem_base64 || null;
  if (!Number.isInteger(ano) || ano < 1900 || ano > 2100 || !nome) return res.status(400).json({ erro: "Escreva o ano e o nome da sala campeã" });
  if (img && (!IMG.test(img) || img.length > 2.5e6)) return res.status(400).json({ erro: "Imagem inválida" });
  const antiga = await um("SELECT camisa_imagem FROM campeas WHERE ano=$1", [ano]);
  if (!img && !(antiga && antiga.camisa_imagem)) return res.status(400).json({ erro: "Envie a foto da camisa campeã" });   // a foto é obrigatória
  await q(`INSERT INTO campeas (ano, nome, camisa_imagem) VALUES ($1,$2,$3)
    ON CONFLICT (ano) DO UPDATE SET nome = EXCLUDED.nome, camisa_imagem = COALESCE(EXCLUDED.camisa_imagem, campeas.camisa_imagem), atualizado_em = now()`, [ano, nome, img]);
  res.status(201).json({ ok: true });
}));

app.delete("/campeas/:id", auth("adm"), h(async (req, res) => {
  const id = +req.params.id;
  if (!Number.isInteger(id)) return res.status(404).json({ erro: "Não encontrado" });
  await q("DELETE FROM campeas WHERE id=$1", [id]);
  res.json({ ok: true });
}));

// --- Permissões de representante (só a administração) ---
app.get("/permissoes", auth("adm"), h(async (_, res) => {
  res.json(await q(`SELECT p.id, p.sala_id, s.nome AS sala, p.numero_chamada, p.nome, p.criado_em
    FROM permissoes p JOIN salas s ON s.id=p.sala_id ORDER BY p.sala_id, p.numero_chamada`));
}));

app.post("/permissoes", auth("adm"), h(async (req, res) => {
  const sala_id = Number(req.body.sala_id), num = Number(req.body.numero_chamada), nome = limpa(req.body.nome).slice(0, 60) || null;
  if (!Number.isInteger(num) || num < 0 || num > 999 || !(await salaExiste(sala_id))) return res.status(400).json({ erro: "Escolha a turma e escreva o número da chamada" });
  const p = await um(`INSERT INTO permissoes (sala_id, numero_chamada, nome) VALUES ($1,$2,$3)
    ON CONFLICT (sala_id, numero_chamada) DO UPDATE SET nome = COALESCE(EXCLUDED.nome, permissoes.nome) RETURNING id`, [sala_id, num, nome]);
  res.status(201).json({ id: p.id });
}));

app.delete("/permissoes/:id", auth("adm"), h(async (req, res) => {
  const id = +req.params.id;
  if (!Number.isInteger(id)) return res.status(404).json({ erro: "Não encontrado" });
  await q("DELETE FROM permissoes WHERE id=$1", [id]);
  res.json({ ok: true });
}));

// O próprio servidor entrega o site (pasta frontend)
app.use(express.static(path.join(__dirname, "..", "frontend")));

// Qualquer erro inesperado aparece no log (para achar a causa) e volta como JSON para o site.
app.use((err, req, res, next) => {
  console.error("ERRO em " + req.method + " " + req.url + ":", err);
  res.status(err.status || 500).json({ erro: "Erro interno do servidor. Veja os logs do servidor." });
});

(async () => {
  await pool.query(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));   // cria as tabelas se faltarem
  app.listen(PORT, () => console.log("Site e API no ar na porta " + PORT));
})().catch(e => { console.error("Não consegui iniciar (confira DATABASE_URL):", e.message); process.exit(1); });
