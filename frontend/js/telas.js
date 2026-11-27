// Telas do site: cada função devolve o HTML de uma tela.
const opts = sel => TURMAS.map((t, i) => `<option value="${i}"${i === sel ? " selected" : ""}>Turma ${t.cor}</option>`).join("");

// Abas do painel. Representante: Pedido | Edição.  ADM: Salas | Pedidos | Permissões | Campeãs.
const abas = atual => `<div class="abas">${(S.papel === "adm"
  ? [["painel", "SALAS"], ["pedidos", "PEDIDOS"], ["permissoes", "PERMISSÕES"], ["campeas", "CAMPEÃS"]]
  : [["pedidos", "PEDIDO"], ["painel", "EDIÇÃO"]])
  .map(([v, t]) => `<button type="button" class="aba${v === atual ? " on" : ""}" data-aba="${v}">${t}</button>`).join("")}</div>`;

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

  acesso: () => `
    <section class="box">
      <h2 style="color:${COR[S.papel]}">${S.criar ? "CRIAR CONTA" : "ACESSAR CONTA"} · ${ROT[S.papel].toUpperCase()}</h2>
      <form id="f" novalidate>
        <label>Nome completo<input id="nome" autocomplete="name" placeholder="Ex.: Maria da Silva Souza"></label>
        <label>Número da chamada<input id="num" inputmode="numeric" placeholder="Seu número na chamada"></label>
        <label>Turma<select id="turma"><option value="">Selecione sua turma</option>${opts(-1)}</select></label>
        <label>Senha<input id="senha" type="password" autocomplete="${S.criar ? "new-password" : "current-password"}" placeholder="${S.papel !== "aluno" ? "Senha de acesso" : S.criar ? "Crie uma senha (mín. 4 caracteres)" : "Sua senha"}"></label>
        ${S.criar && S.papel === "aluno" ? '<label>Confirmar senha<input id="senha2" type="password" autocomplete="new-password" placeholder="Repita a senha"></label>' : ""}
        <p class="err" id="err" role="alert"></p>
        <button class="go" type="submit">${S.criar ? "CRIAR CONTA" : "ENTRAR"}</button>
      </form>
      ${S.papel === "aluno" ? `<p class="dim">${S.criar
        ? 'Já tem conta? <button class="link" id="alt">Acessar conta</button>'
        : 'Não tem conta? <button class="link" id="alt">Criar conta</button>'}</p>` : ""}
    </section>`,

  salas: () => `
    <div class="topo">
      <h1>Escolha a sala</h1>
      <div class="topo-btns">
      <button class="sacola" id="trofeu" aria-label="Camisas campeãs do Intergil">
        <svg viewBox="0 0 16 16" width="30" height="30" aria-hidden="true" shape-rendering="crispEdges"><rect fill="currentColor" x="4" y="1" width="8" height="7"/><rect fill="currentColor" x="1" y="2" width="3" height="4"/><rect fill="currentColor" x="12" y="2" width="3" height="4"/><rect fill="currentColor" x="7" y="8" width="2" height="3"/><rect fill="currentColor" x="5" y="11" width="6" height="2"/><rect fill="currentColor" x="4" y="13" width="8" height="2"/></svg>
      </button>
      <button class="sacola" id="sacola" aria-label="Minha sacola (${DB.meus.filter(p => p.status !== "cancelado").length} pedidos)">
        <svg viewBox="0 0 16 16" width="30" height="30" aria-hidden="true" shape-rendering="crispEdges"><path fill="currentColor" d="M5 6V4h1V3h4v1h1v2h-1V4H6v2z"/><rect fill="currentColor" x="2" y="6" width="12" height="9"/></svg>
        ${DB.meus.filter(p => p.status !== "cancelado").length ? `<span class="sac-n">${DB.meus.filter(p => p.status !== "cancelado").length}</span>` : ""}
      </button>
      </div>
    </div>
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
        <label>Número da camisa (opcional)<input id="nn" maxlength="20" placeholder="Escreva o que quiser: 10, 7+1, ★, ..."></label>
        <label>Tamanho<select id="tam"><option value="">Selecione</option>${(salaDe(S.sala).tamanhos || TAM).map(t => `<option>${esc(t)}</option>`).join("")}</select></label>
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
      <p>Camisa <b>${esc(p.nomeCamisa)}</b>${p.numCamisa !== "" ? ", nº " + esc(p.numCamisa) : ""}, tamanho ${p.tam}, ${esc(s.nome)}. Valor total: <b class="price-i">R$ ${esc(p.preco)}</b>, dividido em 2 parcelas:</p>
      ${parcelas(p.preco).map((v, i) => `<div class="ped">${i + 1}ª parcela: <b class="price-i">R$ ${v}</b></div>`).join("")}
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

  sacola: () => `
    <section class="box">
      <h2>MINHA SACOLA</h2>
      ${DB.meus.length ? DB.meus.map(p => `
        <div class="ped${p.status === "cancelado" ? " canc" : ""}">
          <b>${esc(p.sala)}</b>: "${esc(p.nome_camisa)}"${p.numero_camisa != null ? ", nº " + esc(p.numero_camisa) : ""}, tam ${esc(p.tamanho)} · R$ ${reais(p.preco_centavos)}
          (2 parcelas de R$ ${parcelas(reais(p.preco_centavos)).join(" e R$ ")}) · ${esc(ST[p.status] || p.status)}
          ${p.status === "aguardando_pagamento" ? `<br><button class="go cancelar" data-cancelar="${p.id}">CANCELAR PEDIDO</button>` : ""}
        </div>`).join("") : '<p class="dim">Você ainda não fez nenhum pedido.</p>'}
      <p class="err" id="err" role="alert"></p>
    </section>`,

  trofeu: () => `
    <section class="box">
      <h2>CAMISAS CAMPEÃS DO INTERGIL</h2>
      ${DB.campeas.length ? `<div class="camps">${DB.campeas.map(c => `
        <div class="camp">
          <div class="camp-ano">${esc(c.ano)}</div>
          <div class="foto camp-foto" style="--c:#ffd400">${c.imagem ? `<img alt="Camisa campeã de ${esc(c.ano)}" src="${esc(c.imagem)}">` : shirt("#ffd400")}</div>
          <div class="camp-rotulo">SALA CAMPEÃ</div>
          <div class="camp-nome">${esc(c.nome)}</div>
        </div>`).join("")}</div>` : '<p class="dim">A administração ainda não cadastrou as camisas campeãs.</p>'}
    </section>`,

  campeas: () => `
    <section class="box">
      <h2 style="color:${COR.adm}">PAINEL · ${ROT.adm.toUpperCase()}</h2>
      ${abas("campeas")}
      <h2>CAMISAS CAMPEÃS</h2>
      <p class="dim">Para cada ano, informe o ano, o nome da sala que ganhou e a foto da camisa. Para trocar um ano, cadastre o mesmo ano de novo.</p>
      <form id="f" novalidate>
        <label>Ano<input id="cano" inputmode="numeric" maxlength="4" placeholder="Ex.: 2025"></label>
        <label>Nome da sala campeã<input id="cnome" list="salasnomes" maxlength="40" placeholder="Ex.: Turma Verde" autocomplete="off"></label>
        <datalist id="salasnomes">${DB.salas.map(s => `<option value="${esc(s.nome)}">`).join("")}</datalist>
        <label>Foto da camisa (obrigatória)<input id="cimg" type="file" accept="image/*"></label>
        <div id="cprev" class="foto prev" style="--c:#ffd400"></div>
        <p class="err" id="err" role="alert"></p>
        <button class="go" type="submit">SALVAR CAMPEÃ</button>
      </form>
      <h2 style="margin-top:24px">CADASTRADAS (${DB.campeas.length})</h2>
      ${DB.campeas.length ? DB.campeas.map(c => `
        <div class="ped">${c.imagem ? `<img class="miniatura" alt="Camisa de ${esc(c.ano)}" src="${esc(c.imagem)}">` : ""}
          <b>${esc(c.ano)}</b> · Sala campeã: ${esc(c.nome)}${c.imagem ? "" : " · SEM FOTO (cadastre de novo com a foto)"}
          <br><button class="go cancelar" data-remcamp="${c.id}">REMOVER</button></div>`).join("") : '<p class="dim">Nenhuma camisa campeã cadastrada.</p>'}
    </section>`,

  permissoes: () => `
    <section class="box">
      <h2 style="color:${COR.adm}">PAINEL · ${ROT.adm.toUpperCase()}</h2>
      ${abas("permissoes")}
      <h2>PERMISSÕES DE REPRESENTANTE</h2>
      <p class="dim">Só entra como representante quem estiver nesta lista. Libere pela turma e pelo número da chamada.</p>
      <form id="f" novalidate>
        <label>Turma<select id="pturma"><option value="">Selecione a turma</option>${opts(-1)}</select></label>
        <label>Número da chamada<input id="pnum" inputmode="numeric" placeholder="Ex.: 12"></label>
        <label>Nome (só para você lembrar, opcional)<input id="pnome" maxlength="60" placeholder="Ex.: Maria da Silva"></label>
        <p class="err" id="err" role="alert"></p>
        <button class="go" type="submit">PERMITIR</button>
      </form>
      <h2 style="margin-top:24px">LIBERADOS (${DB.perms.length})</h2>
      ${DB.perms.length ? DB.perms.map(p => `
        <div class="ped">
          <b>${esc(p.sala)}</b> · chamada nº ${esc(p.numero_chamada)}${p.nome ? " · " + esc(p.nome) : ""}
          <br><button class="go cancelar" data-remover="${p.id}">REMOVER PERMISSÃO</button>
        </div>`).join("") : '<p class="dim">Ninguém liberado ainda.</p>'}
    </section>`,

  painel: () => {
    const adm = S.papel === "adm", i = adm ? S.edit : S.user.turma, s = salaDe(i);
    return `
    <section class="box">
      <h2 style="color:${COR[S.papel]}">PAINEL · ${ROT[S.papel].toUpperCase()}</h2>
      ${abas("painel")}
      ${adm ? `<label style="max-width:460px">Sala<select id="qual">${opts(i)}</select></label><br>` : ""}
      <form id="f" novalidate>
        <label>Nome da sala<input id="pn" value="${esc(s.nome)}" maxlength="30"></label>
        <label>Arquivo da camisa (imagem do design)<input id="pm" type="file" accept="image/*"></label>
        <div id="prev" class="foto prev">${foto(i).replace(/^<div[^>]*>|<\/div>$/g, "")}</div>
        <label>Preço da camisa (R$)<input id="pp" value="${esc(s.preco)}"></label>
        ${adm ? `<label>Tamanhos disponíveis (separe por vírgula)<input id="pt" value="${esc((s.tamanhos || TAM).join(", "))}" placeholder="P, M, G, GG, XG"></label>` : ""}
        <label>Chave PIX<input id="px" value="${esc(s.pix)}"></label>
        <label>Contato para comprovante (WhatsApp)<input id="pc" value="${esc(s.contato)}" placeholder="(81) 99999-9999"></label>
        <p class="err" id="err" role="alert"></p>
        <button class="go" type="submit">SALVAR</button>
      </form>
    </section>`;
  },

  pedidos: () => {
    const adm = S.papel === "adm", ps = DB.pedidos;  // o servidor já filtra a sala do representante; a lista vem em ordem alfabética
    return `
    <section class="box">
      <h2 style="color:${COR[S.papel]}">PAINEL · ${ROT[S.papel].toUpperCase()}</h2>
      ${abas("pedidos")}
      <h2>PEDIDOS (${ps.length}) · ORDEM ALFABÉTICA</h2>
      ${ps.length
        ? ps.map(p => `<div class="ped"><b>${esc(p.comprador)}</b> (chamada nº ${esc(p.numero_chamada)})${adm ? " · " + esc(p.sala) : ""}: "${esc(p.nome_camisa)}"${p.numero_camisa != null ? ", camisa nº " + esc(p.numero_camisa) : ""}, tam ${esc(p.tamanho)} · R$ ${reais(p.preco_centavos)} · ${esc(ST[p.status] || p.status)}</div>`).join("")
        : '<p class="dim">Nenhum pedido ainda.</p>'}
    </section>`;
  },
};

// Fala do mascote em cada tela.
const MSG = {
  entrada: () => ["Oi! Eu sou o mascote do site. Bem-vindo às camisas do Intergil!", "Escolha como você quer entrar."],
  acesso: () => S.criar ? "Vamos criar a sua conta! Preencha os campos." : "Que bom te ver! Acesse a sua conta.",
  salas: () => "Escolha a sala da sua camisa.",
  sala: () => "Olha o design e o preço! Gostou? Aperte comprar.",
  pedido: () => "Diga o nome da camisa e o tamanho.",
  pix: () => "Pedido feito! Agora é só pagar no PIX e mandar o comprovante.",
  sacola: () => { const a = S.aviso; S.aviso = null; return a || "Estes são os seus pedidos. Dá para cancelar os que ainda não foram pagos."; },
  permissoes: () => { const a = S.aviso; S.aviso = null; return a || "Aqui você libera quem pode entrar como representante."; },
  trofeu: () => "Estas são as camisas campeãs de cada ano do Intergil!",
  campeas: () => { const a = S.aviso; S.aviso = null; return a || "Aqui você cadastra a camisa campeã de cada ano."; },
  painel: () => S.papel === "adm" ? "Aqui você edita as salas: nome, design, preço, PIX e tamanhos." : "Aqui você edita a sua sala: nome, design da camisa, preço e PIX.",
  pedidos: () => S.papel === "adm" ? "Todos os pedidos de todas as salas, em ordem alfabética." : "Estes são os pedidos da sua sala, em ordem alfabética.",
};

// Para onde o botão VOLTAR leva em cada tela.
const BACK = { acesso: "entrada", sala: "salas", pedido: "sala", pix: "salas", sacola: "salas", trofeu: "salas" };
