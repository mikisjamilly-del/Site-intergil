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
