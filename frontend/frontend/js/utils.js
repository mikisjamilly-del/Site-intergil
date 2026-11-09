// Funções pequenas de uso geral.
const $ = id => document.getElementById(id);

// Escapa texto antes de colocar em HTML (evita injeção de código).
const esc = s => String(s).replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[c]));
