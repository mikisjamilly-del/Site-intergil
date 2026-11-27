// Fala do site: balão de texto com efeito de digitação (sem imagem).
let tok = 0;

function dizer(msgs) {
  const L = Array.isArray(msgs) ? msgs : [msgs];
  const my = ++tok, el = $("fala");
  const red = matchMedia("(prefers-reduced-motion:reduce)").matches;
  let i = 0;

  const prox = () => {
    if (my !== tok || i >= L.length) {
      if (my === tok) el.classList.remove("cur");
      return;
    }
    const tx = "* " + L[i++];
    let n = red ? tx.length : 0;
    el.textContent = red ? tx : "";
    el.classList.add("cur");
    const t = setInterval(() => {
      if (my !== tok) { clearInterval(t); return; }
      if (n < tx.length) el.textContent = tx.slice(0, ++n);
      else { clearInterval(t); setTimeout(prox, 1800); }
    }, red ? 0 : 32);
  };
  prox();
}
