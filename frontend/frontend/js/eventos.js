// Eventos de cada tela (cliques e envio de formulários).
function bindEntrada() {
  document.querySelectorAll(".picks button").forEach(b => b.onclick = () => {
    S.papel = b.dataset.papel; S.criar = false; go("cadastro");
  });
}

function bindCadastro() {
  document.querySelectorAll("[data-criar]").forEach(b => b.onclick = () => {
    S.criar = b.dataset.criar === "1"; go("acesso");
  });
}

function bindAcesso() {
  const a = $("alt");
  if (a) a.onclick = () => { S.criar = !S.criar; go("acesso"); };

  $("f").onsubmit = e => {
    e.preventDefault();
    const nome = $("nome").value.trim(), num = $("num").value.trim(), t = $("turma").value;
    const er = m => { $("err").textContent = "* " + m; dizer(m); };

    if (nome.split(/\s+/).length < 2 || !num || t === "") return er("Preencha nome completo, número da chamada e turma.");
    if (S.papel !== "aluno" && $("senha").value !== SENHAS[S.papel]) return er("Senha incorreta. Tente de novo.");

    const u = { nome, num, turma: +t, papel: S.papel };
    const k = c => [c.nome.toLowerCase(), c.num, c.turma, c.papel || "aluno"].join("|");
    const ex = DB.contas.some(c => k(c) === k(u));

    if (S.criar) {
      if (ex) return er("Essa conta já existe. Acesse a conta.");
      DB.contas.push(u); save();
    } else if (!ex) return er("Conta não encontrada. Use Criar conta.");
    S.user = u; S.edit = u.turma;
    go(S.papel === "aluno" ? "salas" : "painel");
  };
}

function bindSalas() {
  document.querySelectorAll("[data-sala]").forEach(b => b.onclick = () => { S.sala = +b.dataset.sala; go("sala"); });
}

function bindSala() {
  $("comprar").onclick = () => go("pedido");
}

function bindPedido() {
  $("f").onsubmit = e => {
    e.preventDefault();
    const nc = $("nc").value.trim(), tam = $("tam").value;
    if (!nc || !tam) { $("err").textContent = "* Preencha o nome da camisa e o tamanho."; return; }
    S.ped = { sala: S.sala, nomeCamisa: nc, tam, preco: salaDe(S.sala).preco, comprador: S.user.nome, num: S.user.num };
    DB.pedidos.push(S.ped); save(); go("pix");
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

function bindPainel() {
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

  $("f").onsubmit = e => {
    e.preventDefault();
    const s = salaDe(S.papel === "adm" ? S.edit : S.user.turma);
    if (!$("pn").value.trim()) { $("err").textContent = "* A sala precisa de um nome."; return; }
    s.nome = $("pn").value.trim();
    s.preco = $("pp").value.trim() || s.preco;
    s.pix = $("px").value.trim();
    s.contato = $("pc").value.trim();
    if (S.masc) s.camisa = S.masc;
    save(); dizer("Salvo! A sala já está atualizada."); go("painel");
  };
}

const BINDS = {
  entrada: bindEntrada, cadastro: bindCadastro, acesso: bindAcesso, salas: bindSalas,
  sala: bindSala, pedido: bindPedido, pix: bindPix, painel: bindPainel,
};
const bind = v => BINDS[v]();