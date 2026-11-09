// Camada de dados. Hoje usa localStorage; para ligar ao back end,
// troque o conteúdo deste arquivo por chamadas fetch() à API.
let DB = null;
try { DB = JSON.parse(localStorage.getItem("intergil")); } catch (e) {}
DB = DB || {};
DB.salas = DB.salas || TURMAS.map(t => ({ nome: "Turma " + t.cor, mascote: "", preco: "50,00", camisa: "", pix: "", contato: "" }));
DB.contas = DB.contas || [];
DB.pedidos = DB.pedidos || [];

const save = () => {
  try { localStorage.setItem("intergil", JSON.stringify(DB)); } catch (e) {}
};
const salaDe = i => DB.salas[i];
