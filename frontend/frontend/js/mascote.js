// Mascote: balão de fala com efeito de digitação.
let tok = 0;

function dizer(msgs) {
  const L = Array.isArray(msgs) ? msgs : [msgs];
  const my = ++tok, el = $("fala"), m = $("mascot");
  const red = matchMedia("(prefers-reduced-motion:reduce)").matches;
  let i = 0;

  const prox = () => {
    if (my !== tok || i >= L.length) {
      if (my === tok) { m.classList.remove("fala"); el.classList.remove("cur"); }
      return;
    }
    const tx = "* " + L[i++];
    let n = red ? tx.length : 0;
    el.textContent = red ? tx : "";
    el.classList.add("cur");
    m.classList.add("fala");
    const t = setInterval(() => {
      if (my !== tok) { clearInterval(t); return; }
      if (n < tx.length) el.textContent = tx.slice(0, ++n);
      else { clearInterval(t); m.classList.remove("fala"); setTimeout(prox, 1800); }
    }, red ? 0 : 32);
  };
  prox();
}

// Falas quando se clica no mascote.
const PAPO = [
  "Oi! Cada sala tem a sua cor. Qual é a sua?",
  "Os representantes trocam o nome e o design da camisa de cada sala.",
  "Quem vai usar a camisa mais bonita? Eu já sei!",
];
let pp = 0;
const falarPapo = () => dizer(PAPO[pp++ % PAPO.length]);
