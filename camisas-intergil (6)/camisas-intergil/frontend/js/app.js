// Ponto de partida: estado, navegação e inicialização.
const S = { v: "entrada", papel: null, criar: false, user: null, sala: 0, edit: 0, masc: null, ped: null };
const logado = () => !!S.user;

async function go(v) {
  try {
    if (v === "salas" || v === "painel") await carregarSalas();
    if (v === "painel") await carregarPedidos();
  } catch (e) {
    $("app").innerHTML = `<section class="box"><p class="err">* ${esc(e.message)}</p></section>`;
    $("bVoltar").hidden = true; $("bSair").hidden = !logado();
    dizer(e.message);
    return;
  }
  S.v = v;
  $("app").innerHTML = V[v]();
  bind(v);
  $("bVoltar").hidden = !BACK[v];
  $("bSair").hidden = !logado();
  dizer(MSG[v]());
  scrollTo(0, 0);
}

$("bVoltar").onclick = () => go(BACK[S.v]);
$("bSair").onclick = () => { S.user = null; S.papel = null; TOKEN = null; go("entrada"); };
$("logo").innerHTML = `<span style="width:22px">${pix(HE, "#e11d1d", 9, 7, "none")}</span>INTERGIL`;

go("entrada");
