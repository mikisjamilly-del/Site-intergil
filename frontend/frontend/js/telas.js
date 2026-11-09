// Telas do site: cada função devolve o HTML de uma tela.
const opts = sel => TURMAS.map((t, i) => `<option value="${i}"${i === sel ? " selected" : ""}>Turma ${t.cor}</option>`).join("");

const V = {
  entrada: () => `
    <section class="hero">
      <div class="arvore">${arvore()}</div>
      <p class="tag px">CAMISAS DAS TURMAS</p>
      <h1>Tenha acesso a todas as camisas do Intergil!</h1>
      <p class="lead">Compre e tenha informações do Intergil aqui!</p>
      <div class="picks">
        <button data-papel="aluno" style="--c:#ffd400;--t:#2a1b5e">ALUNO</button>
        <button data-papel="rep" style="--c:#3b6cf5;--t:#fff">REPRESENTANTE</button>
        <button data-papel="adm" style="--c:#e11d1d;--t:#fff">ADM</button>
      </div>
      <div class="mini" aria-hidden="true">${TURMAS.map(t => shirt(t.hex)).join("")}</div>
    </section>`,

  cadastro: () => `
    <section class="box">
      <h2 style="color:${COR[S.papel]}">${ROT[S.papel].toUpperCase()}</h2>
      <h1>Você já tem cadastro?</h1>
      <div class="picks duas">
        <button data-criar="0" style="--c:#ffd400;--t:#2a1b5e">JÁ TENHO CADASTRO</button>
        <button data-criar="1" style="--c:#5cb34a;--t:#fff">AINDA NÃO TENHO</button>
      </div>
    </section>`,

  acesso: () => `
    <section class="box">
      <h2 style="color:${COR[S.papel]}">${S.criar ? "CRIAR CONTA" : "ACESSAR CONTA"} · ${ROT[S.papel].toUpperCase()}</h2>
      <form id="f" novalidate>
        <label>Nome completo<input id="nome" autocomplete="name" placeholder="Ex.: Maria da Silva Souza"></label>
        <label>Número da chamada<input id="num" inputmode="numeric" placeholder="Seu número na chamada"></label>
        <label>Turma<select id="turma"><option value="">Selecione sua turma</option>${opts(-1)}</select></label>
        ${S.papel !== "aluno" ? '<label>Senha<input id="senha" type="password" autocomplete="off" placeholder="Senha de acesso"></label>' : ""}
        <p class="err" id="err" role="alert"></p>
        <button class="go" type="submit">${S.criar ? "CRIAR CONTA" : "ENTRAR"}</button>
      </form>
      <p class="dim">${S.criar
        ? 'Já tem conta? <button class="link" id="alt">Acessar conta</button>'
        : 'Não tem conta? <button class="link" id="alt">Criar conta</button>'}</p>
    </section>`,

  salas: () => `
    <h1>Escolha a sala</h1>
    <div class="salas">${DB.salas.map((s, i) => `
      <button class="sb" data-sala="${i}" style="--c:${TURMAS[i].hex}">
        ${foto(i)}
        <span>${esc(s.nome)}</span>
        <span class="preco">R$ ${esc(s.preco)}</span>
      </button>`).join("")}
    </div>`,

  sala: () => {
    const s = salaDe(S.sala);
    return `
    <section class="box det">
      <div class="big">${foto(S.sala)}</div>
      <div>
        <h1>${esc(s.nome)}</h1>
        <p>Camisa da cor ${TURMAS[S.sala].cor.toLowerCase()}.</p>
        <p class="price">R$ ${esc(s.preco)}</p>
        <button class="go" id="comprar">COMPRAR CAMISA</button>
      </div>
    </section>`;
  },

  pedido: () => `
    <section class="box">
      <h2>CONFIRMAR PEDIDO · ${esc(salaDe(S.sala).nome)}</h2>
      <form id="f" novalidate>
        <label>Nome na camisa<input id="nc" maxlength="20" placeholder="Nome que vai estampado"></label>
        <label>Tamanho<select id="tam"><option value="">Selecione</option>${TAM.map(t => `<option>${t}</option>`).join("")}</select></label>
        <p class="price">R$ ${esc(salaDe(S.sala).preco)}</p>
        <p class="err" id="err" role="alert"></p>
        <button class="go" type="submit">CONFIRMAR</button>
      </form>
    </section>`,

  pix: () => {
    const s = salaDe(S.sala), p = S.ped, d = (s.contato || "").replace(/\D/g, "");
    return `
    <section class="box">
      <h2>PAGUE COM PIX</h2>
      <p>Camisa <b>${esc(p.nomeCamisa)}</b>, tamanho ${p.tam}, ${esc(s.nome)}. Valor: <b class="price-i">R$ ${esc(p.preco)}</b></p>
      <p class="dim">Chave PIX do representante da sala:</p>
      ${s.pix
        ? `<div class="pixk" id="chave">${esc(s.pix)}</div><button class="go" id="copiar" style="max-width:260px">COPIAR CHAVE</button>`
        : '<div class="pixk">O representante ainda não cadastrou o PIX.</div>'}
      <p class="dim">Depois de pagar, envie o comprovante para:</p>
      <p>${s.contato ? esc(s.contato) : "contato ainda não cadastrado"}</p>
      ${d.length >= 10 ? `<a class="go" style="max-width:300px" target="_blank" rel="noopener" href="https://wa.me/${d.length <= 11 ? "55" : ""}${d}">ENVIAR COMPROVANTE</a>` : ""}
      <p><button class="link" id="fim">Voltar para as salas</button></p>
    </section>`;
  },

  painel: () => {
    const adm = S.papel === "adm", i = adm ? S.edit : S.user.turma, s = salaDe(i);
    const ps = DB.pedidos.filter(p => adm || p.sala === i);
    return `
    <section class="box">
      <h2 style="color:${COR[S.papel]}">PAINEL · ${ROT[S.papel].toUpperCase()}</h2>
      ${adm ? `<label style="max-width:460px">Sala<select id="qual">${opts(i)}</select></label><br>` : ""}
      <form id="f" novalidate>
        <label>Nome da sala<input id="pn" value="${esc(s.nome)}" maxlength="30"></label>
        <label>Arquivo da camisa (imagem do design)<input id="pm" type="file" accept="image/*"></label>
        <div id="prev" class="foto prev">${foto(i).replace(/^<div[^>]*>|<\/div>$/g, "")}</div>
        <label>Preço da camisa (R$)<input id="pp" value="${esc(s.preco)}"></label>
        <label>Chave PIX<input id="px" value="${esc(s.pix)}"></label>
        <label>Contato para comprovante (WhatsApp)<input id="pc" value="${esc(s.contato)}" placeholder="(81) 99999-9999"></label>
        <p class="err" id="err" role="alert"></p>
        <button class="go" type="submit">SALVAR</button>
      </form>
      <h2 style="margin-top:24px">PEDIDOS (${ps.length})</h2>
      ${ps.length
        ? ps.map(p => `<div class="ped">${esc(p.comprador)} (nº ${esc(p.num)})${adm ? " · " + esc(salaDe(p.sala).nome) : ""}: "${esc(p.nomeCamisa)}", tam ${p.tam}</div>`).join("")
        : '<p class="dim">Nenhum pedido ainda.</p>'}
    </section>`;
  },
};

// Fala do mascote em cada tela.
const MSG = {
  entrada: () => ["Oi! Eu sou o mascote do site. Bem-vindo às camisas do Intergil!", "Escolha como você quer entrar."],
  cadastro: () => "Você já tem cadastro? Escolha uma opção.",
  acesso: () => S.criar ? "Vamos criar a sua conta! Preencha os campos." : "Que bom te ver! Acesse a sua conta.",
  salas: () => "Escolha a sala da sua camisa.",
  sala: () => "Olha o design e o preço! Gostou? Aperte comprar.",
  pedido: () => "Diga o nome da camisa e o tamanho.",
  pix: () => "Pedido feito! Agora é só pagar no PIX e mandar o comprovante.",
  painel: () => "Aqui você cuida da sala: nome, design da camisa, preço e PIX.",
};

// Para onde o botão VOLTAR leva em cada tela.
const BACK = { cadastro: "entrada", acesso: "cadastro", sala: "salas", pedido: "sala", pix: "salas" };