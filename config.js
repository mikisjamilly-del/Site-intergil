// Configurações fixas do site (turmas, papéis, tamanhos).
const TURMAS = [
  ["Vermelha", "#e11d1d"], ["Azul", "#1e4fd8"], ["Verde", "#16a34a"], ["Preta", "#000000"],
  ["Laranja", "#f97316"], ["Vinho", "#722f37"], ["Verde Tiffany", "#0abab5"], ["Azul Tiffany", "#81d8d0"],
  ["Amarela", "#ffd400"], ["Cinza", "#9ca3af"], ["Roxa", "#7e22ce"], ["Rosa", "#ec4899"],
].map(([cor, hex]) => ({ cor, hex }));

// As senhas de representante e ADM ficam só no servidor (backend/.env).
const PAPEL_API = { aluno: "aluno", rep: "representante", adm: "adm" };
const ST = { aguardando_pagamento: "aguardando pagamento", pago: "pago", entregue: "entregue", cancelado: "cancelado" };

const ROT = { aluno: "aluno", rep: "representante", adm: "administração" };
const COR = { aluno: "#a86a00", rep: "#2a4fc7", adm: "#c0182b" };
const TAM = ["PP INF", "P INF", "M INF", "G INF", "PP", "P", "M", "G", "GG", "G1", "G2", "G3", "G4", "G5"];
