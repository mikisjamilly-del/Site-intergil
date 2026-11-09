// Funções pequenas de uso geral.
const $ = id => document.getElementById(id);

// Escapa texto antes de colocar em HTML (evita injeção de código).
const esc = s => String(s).replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[c]));

// Nome do arquivo da foto: cor da turma em minúsculas, sem acento, com hífen (ex.: verde-tiffany).
const slug = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, "-");
const EXT = ["png", "jpg", "jpeg", "webp"];

// Foto da camisa dentro de um quadrado. Prioridade: foto salva no Painel; depois assets/camisas/<cor>.<ext>;
// se nada existir, aparece a camisinha de pixel.
function foto(i) {
  const s = DB.salas[i];
  const src = s.camisa || `assets/camisas/${slug(TURMAS[i].cor)}.${EXT[0]}`;
  return `<div class="foto" style="--c:${TURMAS[i].hex}"><img alt="Camisa ${esc(TURMAS[i].cor)}" src="${src}" data-i="${i}" data-e="0" data-p="${s.camisa ? 1 : 0}" onerror="fotoErro(this)"></div>`;
}
function fotoErro(img) {
  const i = +img.dataset.i, e = +img.dataset.e + 1;
  if (img.dataset.p !== "1" && e < EXT.length) {
    img.dataset.e = e;
    img.src = `assets/camisas/${slug(TURMAS[i].cor)}.${EXT[e]}`;
  } else {
    img.parentNode.innerHTML = shirt(TURMAS[i].hex);
  }
}