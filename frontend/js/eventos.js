// Eventos de cada tela (cliques e envio de formulários).
function bindEntrada() {
  document.querySelectorAll(".picks button").forEach(b => b.onclick = () => {
    S.papel = b.dataset.papel; S.criar = false; go("acesso");
  });
}

function bindAcesso() {
  const a = $("alt");
  if (a) a.onclick = () => { S.criar = !S.criar; go("acesso"); };

  $("f").onsubmit = async e => {
    e.preventDefault();
    const nome = $("nome").value.trim().replace(/\s+/g, " "), num = $("num").value.trim(), t = $("turma").value, senha = $("senha").value;
    const er = m => { $("err").textContent = "* " + m; dizer(m); };
    const criando = S.papel === "aluno" && S.criar;

    if (nome.split(" ").length < 2 || !num || t === "") return er("Preencha nome completo, número da chamada e turma.");
    if (!/^\d{1,3}$/.test(num)) return er("O número da chamada deve ter só números.");
    if (!senha) return er("Digite a senha.");
    if (criando) {
      if (senha.length < 4) return er("A senha precisa ter pelo menos 4 caracteres.");
      if (senha !== $("senha2").value) return er("As senhas não são iguais.");
    }

    const dados = { nome, numero_chamada: +num, sala_id: +t + 1, senha };
    try {
      const r = criando ? await api("/auth/criar", "POST", dados)
                        : await api("/auth/entrar", "POST", { ...dados, papel: PAPEL_API[S.papel] });
      TOKEN = r.token; S.user = { nome, num, turma: +t }; S.edit = +t;
      go(S.papel === "aluno" ? "salas" : S.papel === "rep" ? "pedidos" : "painel");
    } catch (x) { er(x.message); }
  };
}

function bindSalas() {
  document.querySelectorAll("[data-sala]").forEach(b => b.onclick = () => { S.sala = +b.dataset.sala; go("sala"); });
  $("sacola").onclick = () => go("sacola");
}

function bindSacola() {
  document.querySelectorAll("[data-cancelar]").forEach(b => b.onclick = async () => {
    if (!confirm("Cancelar este pedido?")) return;
    try { await api("/pedidos/" + b.dataset.cancelar + "/cancelar", "PATCH"); S.aviso = "Pedido cancelado."; go("sacola"); }
    catch (x) { $("err").textContent = "* " + x.message; dizer(x.message); }
  });
}

function bindSala() {
  $("comprar").onclick = () => go("pedido");
}

function bindPedido() {
  $("f").onsubmit = async e => {
    e.preventDefault();
    const nc = $("nc").value.trim(), tam = $("tam").value, n = $("nn").value.trim();
    const er = m => { $("err").textContent = "* " + m; dizer(m); };
    if (!nc || !tam) return er("Preencha o nome da camisa e o tamanho.");
    if (Array.from(n).length > 20) return er("O que vai na camisa pode ter até 20 caracteres.");
    try {
      const r = await api("/pedidos", "POST", { sala_id: S.sala + 1, nome_camisa: nc, numero_camisa: n === "" ? null : n, tamanho: tam });
      S.ped = { nomeCamisa: nc, numCamisa: n, tam, preco: r.preco };
      go("pix");
    } catch (x) { er(x.message); }
  };
}

function bindPix() {
  const c = $("copiar");
  if (c) c.onclick = () => {
    try { navigator.clipboard.writeText(salaDe(S.sala).pix); dizer("Chave copiada!"); }
    catch (e) { dizer("Não deu para copiar. Copie a chave na mão."); }
  };
  $("fim").onclick = () => go("salas");
}

function bindAbas() {
  document.querySelectorAll("[data-aba]").forEach(b => b.onclick = () => go(b.dataset.aba));
}

function bindPermissoes() {
  bindAbas();
  $("f").onsubmit = async e => {
    e.preventDefault();
    const t = $("pturma").value, num = $("pnum").value.trim(), nome = $("pnome").value.trim();
    const er = m => { $("err").textContent = "* " + m; dizer(m); };
    if (t === "" || !/^\d{1,3}$/.test(num)) return er("Escolha a turma e escreva o número da chamada (só números).");
    try {
      await api("/permissoes", "POST", { sala_id: +t + 1, numero_chamada: +num, nome });
      S.aviso = "Liberado! A partir de agora essa pessoa já pode entrar como representante.";
      go("permissoes");
    } catch (x) { er(x.message); }
  };
  document.querySelectorAll("[data-remover]").forEach(b => b.onclick = async () => {
    if (!confirm("Retirar a permissão desta pessoa?")) return;
    try { await api("/permissoes/" + b.dataset.remover, "DELETE"); S.aviso = "Permissão retirada."; go("permissoes"); }
    catch (x) { $("err").textContent = "* " + x.message; dizer(x.message); }
  });
}

function bindPainel() {
  bindAbas();
  S.masc = null;
  const ql = $("qual");
  if (ql) ql.onchange = () => { S.edit = +ql.value; go("painel"); };

  // Redimensiona a imagem escolhida para no máximo 480px antes de guardar.
  $("pm").onchange = e => {
    const f = e.target.files[0];
    if (!f) return;
    const im = new Image();
    im.onload = () => {
      const r = 480 / Math.max(im.width, im.height), c = document.createElement("canvas");
      c.width = im.width * r; c.height = im.height * r;
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      S.masc = c.toDataURL("image/webp", .85);
      $("prev").innerHTML = `<img alt="Prévia da camisa" src="${S.masc}">`;
      dizer("Design da camisa carregado! Aperte salvar.");
    };
    im.src = URL.createObjectURL(f);
  };

  $("f").onsubmit = async e => {
    e.preventDefault();
    if (!$("pn").value.trim()) { $("err").textContent = "* A sala precisa de um nome."; return; }
    const i = S.papel === "adm" ? S.edit : S.user.turma;
    const corpo = { nome: $("pn").value.trim(), preco: $("pp").value.trim(), pix: $("px").value.trim(), contato: $("pc").value.trim() };
    if (S.masc) corpo.camisa_base64 = S.masc;
    if (S.papel === "adm") corpo.tamanhos = $("pt").value.trim();
    try { await api("/salas/" + (i + 1), "PUT", corpo); go("painel"); }
    catch (x) { $("err").textContent = "* " + x.message; dizer(x.message); }
  };
}

const BINDS = {
  pedidos: bindAbas,
  entrada: bindEntrada, acesso: bindAcesso, salas: bindSalas,
  sala: bindSala, pedido: bindPedido, pix: bindPix, painel: bindPainel, sacola: bindSacola, permissoes: bindPermissoes,
};
const bind = v => BINDS[v]();
