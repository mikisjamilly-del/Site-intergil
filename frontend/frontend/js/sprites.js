// Desenhos em pixel art (camisa e logo).
function pix(map, fill, w, h, st) {
  let r = "";
  map.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === "X") r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}" stroke="${st}" stroke-width=".08"/>`;
  }));
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" aria-hidden="true">${r}</svg>`;
}

const SH = ["..XXX..XXX..", ".XXXXXXXXXX.", "XXXXXXXXXXXX", "XXXXXXXXXXXX", "XX.XXXXXX.XX",
            "XX.XXXXXX.XX", "...XXXXXX...", "...XXXXXX...", "...XXXXXX...", "...XXXXXX..."];
const HE = [".XX...XX.", "XXXX.XXXX", "XXXXXXXXX", ".XXXXXXX.", "..XXXXX..", "...XXX...", "....X..."];

const shirt = hex => pix(SH, hex, 12, 10, "rgba(255,255,255,.55)");

// Árvore dourada em pixel art (visual do topo da tela inicial).
function arvore() {
  const W = 40, linhas = [];
  let r = "";
  const cp = [["#f2c75c", "#d9a63a"], ["#ffe08a", "#f2c75c"]];
  for (let y = 0; y < 22; y++) {
    const t = (y - 10.5) / 10.5, meia = Math.round(19 * Math.sqrt(Math.max(0, 1 - t * t)));
    for (let x = 20 - meia; x < 20 + meia; x++) {
      const claro = ((x * 7 + y * 13) % 5 === 0) ? 1 : 0;
      r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${cp[(x + y) % 9 === 0 ? 1 : 0][claro]}"/>`;
    }
  }
  for (let y = 22; y < 34; y++) {
    const w = y < 28 ? 3 : 5 + (y - 28);
    r += `<rect x="${20 - w}" y="${y}" width="${w * 2}" height="1" fill="${y % 2 ? "#7a4a22" : "#8a5a2c"}"/>`;
  }
  return `<svg viewBox="0 0 ${W} 36" width="100%" aria-hidden="true">${r}</svg>`;
}