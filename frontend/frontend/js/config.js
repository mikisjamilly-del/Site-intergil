// Configurações fixas do site (turmas, papéis, tamanhos).
const TURMAS = [
  ["Vermelha", "#e11d1d"], ["Azul", "#1e4fd8"], ["Verde", "#16a34a"], ["Preta", "#000000"],
  ["Laranja", "#f97316"], ["Vinho", "#722f37"], ["Verde Tiffany", "#0abab5"], ["Azul Tiffany", "#81d8d0"],
  ["Amarela", "#ffd400"], ["Cinza", "#9ca3af"], ["Roxa", "#7e22ce"], ["Rosa", "#ec4899"],
].map(([cor, hex]) => ({ cor, hex }));

// ATENÇÃO: senhas no front-end ficam visíveis para qualquer pessoa.
// Quando o back end for ligado, elas devem sair daqui (ficam no .env do servidor).
const SENHAS = { rep: "intergiljdgr", adm: "valhallajdjr" };

const ROT = { aluno: "aluno", rep: "representante", adm: "administração" };
const COR = { aluno: "var(--yellow)", rep: "var(--blue)", adm: "var(--red)" };
const TAM = ["P", "M", "G", "GG", "XG"];
