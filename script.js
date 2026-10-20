const TURMAS = [
  ["Vermelha", "#e11d1d"],
  ["Azul", "#1e4fd8"],
  ["Verde", "#16a34a"],
  ["Preta", "#000000"],
  ["Laranja", "#f97316"],
  ["Vinho", "#722f37"],
  ["Verde Tiffany", "#0abab5"],
  ["Azul Tiffany", "#81d8d0"],
  ["Amarela", "#ffd400"],
  ["Cinza", "#9ca3af"],
  ["Roxa", "#7e22ce"],
  ["Rosa", "#ec4899"]
].map(([cor, hex]) => ({ cor, hex }));

const SENHAS = {
  rep: "intergiljdgr",
  adm: "valhallajdjr"
};

const ROT = {
  aluno: "aluno",
  rep: "representante",
  adm: "administração"
};

const COR = {
  aluno: "var(--yellow)",
  rep: "var(--blue)",
  adm: "var(--red)"
};

const TAM = ["P", "M", "G", "GG", "XG"];

const $ = id => document.getElementById(id);

const esc = s =>
  String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));

let DB = null;

try {
  DB = JSON.parse(localStorage.getItem("intergil"));
} catch (e) {}

DB = DB || {};

DB.salas = DB.salas || TURMAS.map(t => ({
  nome: "Turma " + t.cor,
  mascote: "",
  preco: "50,00",
  camisa: "",
  pix: "",
  contato: ""
}));

DB.contas = DB.contas || [];
DB.pedidos = DB.pedidos || [];

const save = () => {
  try {
    localStorage.setItem("intergil", JSON.stringify(DB));
  } catch (e) {}
};

const S = {
  v: "entrada",
  papel: null,
  criar: false,
  user: null,
  sala: 0,
  edit: 0,
  masc: null,
  ped: null
};

function pix(map, fill, w, h, st) {
  let r = "";

  map.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (c === "X") {
        r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}" stroke="${st}" stroke-width=".08"/>`;
      }
    })
  );

  return `<svg viewBox="0 0 ${w} ${h}" width="100%" aria-hidden="true">${r}</svg>`;
}

const SH = [
  "..XXX..XXX..",
  ".XXXXXXXXXX.",
  "XXXXXXXXXXXX",
  "XXXXXXXXXXXX",
  "XX.XXXXXX.XX",
  "XX.XXXXXX.XX",
  "...XXXXXX...",
  "...XXXXXX...",
  "...XXXXXX...",
  "...XXXXXX..."
];

const HE = [
  ".XX...XX.",
  "XXXX.XXXX",
  "XXXXXXXXX",
  ".XXXXXXX.",
  "..XXXXX..",
  "...XXX...",
  "....X...."
];

const shirt = h => pix(SH, h, 12, 10, "rgba(255,255,255,.55)");

$("logo").innerHTML = `
  <span style="width:22px">
    ${pix(HE, "#e11d1d", 9, 7, "none")}
  </span>
  INTERGIL
`;

const opts = sel =>
  TURMAS.map((t, i) =>
    `<option value="${i}"${i === sel ? " selected" : ""}>Turma ${t.cor}</option>`
  ).join("");

const salaDe = i => DB.salas[i];

const logado = () => !!S.user;

/* Telas do site */

const V = {
  entrada: () => `
    <p class="tag px">* CAMISAS DAS TURMAS</p>

    <h1>
      Tenha acesso a todas
      <em>camisas</em> do Intergil!
    </h1>

    <p class="lead">
      Compre e tenha informações do Intergil aqui!
    </p>

    <div class="picks">
      <button data-papel="aluno" style="--c:var(--yellow)">
        ALUNO
      </button>

      <button data-papel="rep" style="--c:var(--blue)">
        REPRESENTANTE
      </button>

      <button data-papel="adm" style="--c:var(--red)">
        ADM
      </button>
    </div>

    <div class="mini" aria-hidden="true">
      ${TURMAS.map(t => shirt(t.hex)).join("")}
    </div>
  `,

  acesso: () => `
    <section class="box">
      <h2 style="color:${COR[S.papel]}">
        ${S.criar ? "CRIAR CONTA" : "ACESSAR CONTA"}
        · ${ROT[S.papel].toUpperCase()}
      </h2>

      <form id="f" novalidate>
        <label>
          Nome completo
          <input
            id="nome"
            autocomplete="name"
            placeholder="Ex.: Maria da Silva Souza"
          >
        </label>

        <label>
          Número da chamada
          <input
            id="num"
            inputmode="numeric"
            placeholder="Seu número na chamada"
          >
        </label>

        <label>
          Turma
          <select id="turma">
            <option value="">Selecione sua turma</option>
            ${opts(-1)}
          </select>
        </label>

        ${
          S.papel !== "aluno"
            ? `
              <label>
                Senha
                <input
                  id="senha"
                  type="password"
                  autocomplete="off"
                  placeholder="Senha de acesso"
                >
              </label>
            `
            : ""
        }

        <p class="err" id="err" role="alert"></p>

        <button class="go" type="submit">
          ${S.criar ? "CRIAR CONTA" : "ENTRAR"}
        </button>
      </form>

      ${
        S.papel === "aluno"
          ? `
            <p class="dim">
              ${
                S.criar
                  ? 'Já tem conta? <button class="link" id="alt">Acessar conta</button>'
                  : 'Não tem conta? <button class="link" id="alt">Criar conta</button>'
              }
            </p>
          `
          : ""
      }
    </section>
  `,

  salas: () => `
    <h1>Escolha a <em>sala</em></h1>

    <div class="salas">
      ${DB.salas.map((s, i) => `
        <button
          class="sb"
          data-sala="${i}"
          style="--c:${TURMAS[i].hex}"
        >
          <span style="width:70px">
            ${
              s.camisa
                ? `
                  <img
                    alt=""
                    src="${s.camisa}"
                    style="width:100%;height:70px;object-fit:contain;image-rendering:auto"
                  >
                `
                : shirt(TURMAS[i].hex)
            }
          </span>

          <span>${esc(s.nome)}</span>

          <span class="dim">
            R$ ${esc(s.preco)}
          </span>
        </button>
      `).join("")}
    </div>
  `,

  sala: () => {
    const s = salaDe(S.sala);

    return `
      <section class="det">
        <div class="big">
          ${
            s.camisa
              ? `
                <img
                  alt="Design da camisa"
                  src="${s.camisa}"
                  style="width:100%;height:auto"
                >
              `
              : shirt(TURMAS[S.sala].hex)
          }
        </div>

        <div>
          <h1>${esc(s.nome)}</h1>

          <p>
            Camisa da cor
            ${TURMAS[S.sala].cor.toLowerCase()}.
          </p>

          <p class="price">
            R$ ${esc(s.preco)}
          </p>

          <button class="go" id="comprar">
            COMPRAR CAMISA
          </button>
        </div>
      </section>
    `;
  },

  pedido: () => `
    <section class="box">
      <h2>
        CONFIRMAR PEDIDO ·
        ${esc(salaDe(S.sala).nome)}
      </h2>

      <form id="f" novalidate>
        <label>
          Nome na camisa
          <input
            id="nc"
            maxlength="20"
            placeholder="Nome que vai estampado"
          >
        </label>

        <label>
          Tamanho
          <select id="tam">
            <option value="">Selecione</option>
            ${TAM.map(t => `<option>${t}</option>`).join("")}
          </select>
        </label>

        <p class="price">
          R$ ${esc(salaDe(S.sala).preco)}
        </p>

        <p class="err" id="err" role="alert"></p>

        <button class="go" type="submit">
          CONFIRMAR
        </button>
      </form>
    </section>
  `,

  pix: () => {
    const s = salaDe(S.sala);
    const p = S.ped;
    const d = (s.contato || "").replace(/\D/g, "");

    return `
      <section class="box">
        <h2>PAGUE COM PIX</h2>

        <p>
          Camisa <b>${esc(p.nomeCamisa)}</b>,
          tamanho ${p.tam},
          ${esc(s.nome)}.
          Valor:
          <span style="color:var(--yellow)">
            R$ ${esc(p.preco)}
          </span>
        </p>

        <p class="dim">
          Chave PIX do representante da sala:
        </p>

        ${
          s.pix
            ? `
              <div class="pixk" id="chave">
                ${esc(s.pix)}
              </div>

              <button
                class="go"
                id="copiar"
                style="max-width:260px"
              >
                COPIAR CHAVE
              </button>
            `
            : `
              <div class="pixk">
                O representante ainda não cadastrou o PIX.
              </div>
            `
        }

        <p class="dim">
          Depois de pagar, envie o comprovante para:
        </p>

        <p>
          ${s.contato ? esc(s.contato) : "contato ainda não cadastrado"}
        </p>

        ${
          d.length >= 10
            ? `
              <a
                class="go"
                style="max-width:300px"
                target="_blank"
                rel="noopener"
                href="https://wa.me/${d.length <= 11 ? "55" : ""}${d}"
              >
                ENVIAR COMPROVANTE
              </a>
            `
            : ""
        }

        <p>
          <button class="link" id="fim">
            Voltar para as salas
          </button>
        </p>
      </section>
    `;
  },

  painel: () => {
    const adm = S.papel === "adm";
    const i = adm ? S.edit : S.user.turma;
    const s = salaDe(i);
    const ps = DB.pedidos.filter(
      p => adm || p.sala === i
    );

    return `
      <section class="box">
        <h2 style="color:${COR[S.papel]}">
          PAINEL · ${ROT[S.papel].toUpperCase()}
        </h2>

        ${
          adm
            ? `
              <label style="max-width:460px">
                Sala
                <select id="qual">
                  ${opts(i)}
                </select>
              </label>
              <br>
            `
            : ""
        }

        <form id="f" novalidate>
          <label>
            Nome da sala
            <input
              id="pn"
              value="${esc(s.nome)}"
              maxlength="30"
            >
          </label>

          <label>
            Arquivo da camisa (imagem do design)
            <input
              id="pm"
              type="file"
              accept="image/*"
            >
          </label>

          ${
            s.camisa
              ? `
                <img
                  alt="Design atual da camisa"
                  src="${s.camisa}"
                  width="120"
                >
              `
              : ""
          }

          <label>
            Preço da camisa (R$)
            <input id="pp" value="${esc(s.preco)}">
          </label>

          <label>
            Chave PIX
            <input id="px" value="${esc(s.pix)}">
          </label>

          <label>
            Contato para comprovante (WhatsApp)
            <input
              id="pc"
              value="${esc(s.contato)}"
              placeholder="(81) 99999-9999"
            >
          </label>

          <p class="err" id="err" role="alert"></p>

          <button class="go" type="submit">
            SALVAR
          </button>
        </form>

        <h2 style="margin-top:24px">
          PEDIDOS (${ps.length})
        </h2>

        ${
          ps.length
            ? ps.map(p => `
                <div class="ped">
                  ${esc(p.comprador)}
                  (nº ${esc(p.num)})
                  ${
                    adm
                      ? " · " + esc(salaDe(p.sala).nome)
                      : ""
                  }:
                  "${esc(p.nomeCamisa)}",
                  tam ${p.tam}
                </div>
              `).join("")
            : '<p class="dim">Nenhum pedido ainda.</p>'
        }
      </section>
    `;
  }
};

/* Mensagens do mascote */

const MSG = {
  entrada: () => [
    "Oi! Eu sou o mascote do site. Bem-vindo às camisas do Intergil!",
    "Escolha como você quer entrar."
  ],

  acesso: () =>
    S.criar
      ? "Vamos criar a sua conta! Preencha os campos."
      : "Que bom te ver! Acesse a sua conta.",

  salas: () => "Escolha a sala da sua camisa.",

  sala: () => "Olha o design e o preço! Gostou? Aperte comprar.",

  pedido: () => "Diga o nome da camisa e o tamanho.",

  pix: () => "Pedido feito! Agora é só pagar no PIX e mandar o comprovante.",

  painel: () => "Aqui você cuida da sala: nome, design da camisa, preço e PIX."
};

const BACK = {
  acesso: "entrada",
  sala: "salas",
  pedido: "sala",
  pix: "salas"
};

/* Navegação */

function go(v) {
  S.v = v;
  $("app").innerHTML = V[v]();
  bind(v);

  $("bVoltar").hidden = !BACK[v];
  $("bSair").hidden = !logado();

  dizer(MSG[v]());

  scrollTo(0, 0);
}

$("bVoltar").onclick = () => go(BACK[S.v]);

$("bSair").onclick = () => {
  S.user = null;
  S.papel = null;
  go("entrada");
};

const q = s => document.querySelector(s);

/* Eventos e funcionalidades */

function bind(v) {
  if (v === "entrada") {
    document.querySelectorAll(".picks button").forEach(b => {
      b.onclick = () => {
        S.papel = b.dataset.papel;
        S.criar = false;
        go("acesso");
      };
    });
  }

  if (v === "acesso") {
    const a = $("alt");

    if (a) {
      a.onclick = () => {
        S.criar = !S.criar;
        go("acesso");
      };
    }

    $("f").onsubmit = e => {
      e.preventDefault();

      const nome = $("nome").value.trim();
      const num = $("num").value.trim();
      const t = $("turma").value;

      const er = m => {
        $("err").textContent = "* " + m;
        dizer(m);
      };

      if (
        nome.split(/\s+/).length < 2 ||
        !num ||
        t === ""
      ) {
        return er(
          "Preencha nome completo, número da chamada e turma."
        );
      }

      if (
        S.papel !== "aluno" &&
        $("senha").value !== SENHAS[S.papel]
      ) {
        return er("Senha incorreta. Tente de novo.");
      }

      const u = {
        nome,
        num,
        turma: +t
      };

      const k = c =>
        [c.nome.toLowerCase(), c.num, c.turma].join("|");

      const ex = DB.contas.some(c => k(c) === k(u));

      if (S.papel === "aluno") {
        if (S.criar) {
          if (ex) {
            return er("Essa conta já existe. Acesse a conta.");
          }

          DB.contas.push(u);
          save();
        } else if (!ex) {
          return er("Conta não encontrada. Use Criar conta.");
        }
      }

      S.user = u;
      S.edit = u.turma;

      go(
        S.papel === "aluno"
          ? "salas"
          : "painel"
      );
    };
  }

  if (v === "salas") {
    document.querySelectorAll("[data-sala]").forEach(b => {
      b.onclick = () => {
        S.sala = +b.dataset.sala;
        go("sala");
      };
    });
  }

  if (v === "sala") {
    $("comprar").onclick = () => go("pedido");
  }

  if (v === "pedido") {
    $("f").onsubmit = e => {
      e.preventDefault();

      const nc = $("nc").value.trim();
      const tam = $("tam").value;

      if (!nc || !tam) {
        $("err").textContent =
          "* Preencha o nome da camisa e o tamanho.";
        return;
      }

      S.ped = {
        sala: S.sala,
        nomeCamisa: nc,
        tam,
        preco: salaDe(S.sala).preco,
        comprador: S.user.nome,
        num: S.user.num
      };

      DB.pedidos.push(S.ped);
      save();

      go("pix");
    };
  }

  if (v === "pix") {
    const c = $("copiar");

    if (c) {
      c.onclick = () => {
        try {
          navigator.clipboard.writeText(
            salaDe(S.sala).pix
          );

          dizer("Chave copiada!");
        } catch (e) {
          dizer(
            "Não deu para copiar. Copie a chave na mão."
          );
        }
      };
    }

    $("fim").onclick = () => go("salas");
  }

  if (v === "painel") {
    S.masc = null;

    const ql = $("qual");

    if (ql) {
      ql.onchange = () => {
        S.edit = +ql.value;
        go("painel");
      };
    }

    $("pm").onchange = e => {
      const f = e.target.files[0];

      if (!f) return;

      const im = new Image();

      im.onload = () => {
        const r = 480 / Math.max(im.width, im.height);
        const c = document.createElement("canvas");

        c.width = im.width * r;
        c.height = im.height * r;

        c.getContext("2d").drawImage(
          im,
          0,
          0,
          c.width,
          c.height
        );

        S.masc = c.toDataURL("image/webp", 0.85);

        dizer(
          "Design da camisa carregado! Aperte salvar."
        );
      };

      im.src = URL.createObjectURL(f);
    };

    $("f").onsubmit = e => {
      e.preventDefault();

      const s = salaDe(
        S.papel === "adm"
          ? S.edit
          : S.user.turma
      );

      if (!$("pn").value.trim()) {
        $("err").textContent =
          "* A sala precisa de um nome.";
        return;
      }

      s.nome = $("pn").value.trim();
      s.preco = $("pp").value.trim() || s.preco;
      s.pix = $("px").value.trim();
      s.contato = $("pc").value.trim();

      if (S.masc) {
        s.camisa = S.masc;
      }

      save();

      dizer("Salvo! A sala já está atualizada.");
      go("painel");
    };
  }
}

/* Animação da fala */

let tok = 0;

function dizer(msgs) {
  const L = Array.isArray(msgs) ? msgs : [msgs];
  const my = ++tok;
  const el = $("fala");
  const m = $("mascot");
  const red = matchMedia(
    "(prefers-reduced-motion:reduce)"
  ).matches;

  let i = 0;

  const prox = () => {
    if (my !== tok || i >= L.length) {
      if (my === tok) {
        m.classList.remove("fala");
        el.classList.remove("cur");
      }

      return;
    }

    const tx = "* " + L[i++];
    let n = red ? tx.length : 0;

    el.textContent = red ? tx : "";
    el.classList.add("cur");
    m.classList.add("fala");

    const t = setInterval(() => {
      if (my !== tok) {
        clearInterval(t);
        return;
      }

      if (n < tx.length) {
        el.textContent = tx.slice(0, ++n);
      } else {
        clearInterval(t);
        m.classList.remove("fala");

        setTimeout(prox, 1800);
      }
    }, red ? 0 : 32);
  };

  prox();
}

/* Conversas do mascote */

const PAPO = [
  "Oi! Cada sala tem a sua cor. Qual é a sua?",
  "Os representantes trocam o nome e o design da camisa de cada sala.",
  "Quem vai usar a camisa mais bonita? Eu já sei!"
];

let pp = 0;

$("mascot").onclick = () =>
  dizer(PAPO[pp++ % PAPO.length]);

/* Inicia o site */

go("entrada");