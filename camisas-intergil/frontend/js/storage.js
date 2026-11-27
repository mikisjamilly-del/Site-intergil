// Camada de dados: conversa com a API (backend/server.js), que guarda tudo no banco SQLite.
// O servidor também entrega o site, então o endereço da API é o mesmo do site.
const API = "";
let TOKEN = null;
const DB = { salas: [], pedidos: [], meus: [], perms: [], campeas: [] };

async function api(rota, metodo = "GET", corpo) {
  let r;
  try {
    r = await fetch(API + rota, {
      method: metodo,
      headers: { "Content-Type": "application/json", ...(TOKEN ? { Authorization: "Bearer " + TOKEN } : {}) },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
  } catch (e) { throw new Error("Sem conexão com o servidor."); }
  const d = await r.json().catch(() => null);
  if (!r.ok) throw new Error(d?.erro || (r.status === 404 || r.status === 405
    ? "O site não está ligado ao servidor. Abra http://localhost:3000 com o npm start rodando."
    : "Erro no servidor (código " + r.status + "). Veja a mensagem no terminal do npm start."));
  return d || {};
}

const salaDe = i => DB.salas[i];   // i = posição de 0 a 11 (no banco o id é i + 1)
const carregarSalas = async () => { DB.salas = await api("/salas"); };

const carregarMeus = async () => { DB.meus = await api("/pedidos/meus"); };   // sacolinha do aluno

const carregarPerms = async () => { DB.perms = await api("/permissoes"); };   // quem o ADM liberou como representante

const carregarCampeas = async () => { DB.campeas = await api("/campeas"); };   // camisas campeãs de cada ano

// Pedidos em ordem alfabética pelo nome do comprador (respeita acentos).
const carregarPedidos = async () => {
  DB.pedidos = (await api("/pedidos")).sort((a, b) =>
    a.comprador.localeCompare(b.comprador, "pt-BR", { sensitivity: "base" }) || a.id - b.id);
};
