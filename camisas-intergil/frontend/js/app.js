// Ponto de partida: estado, navegação e inicialização.
const S = { v: "entrada", papel: null, criar: false, user: null, sala: 0, edit: 0, masc: null, ped: null };
const logado = () => !!S.user;

async function go(v) {
  try {
    if (v === "salas" || v === "painel") await carregarSalas();
    if (v === "salas" || v === "sacola") await carregarMeus();
    if (v === "pedidos") await carregarPedidos();
    if (v === "permissoes") await carregarPerms();
    if (v === "trofeu" || v === "campeas") await carregarCampeas();
    if (v === "campeas") await carregarSalas();
  } catch (e) {
    $("app").innerHTML = `<section class="box"><p class="err">* ${esc(e.message)}</p></section>`;
    $("bVoltar").hidden = true; $("bSair").hidden = !logado();
    dizer(e.message);
    return;
  }
  S.v = v;
  try {
    $("app").innerHTML = V[v]();
    bind(v);
    dizer(MSG[v]());
  } catch (e) {   // se algum arquivo do site estiver desatualizado, o erro aparece na tela em vez de travar em silêncio
    console.error(e);
    $("app").innerHTML = `<section class="box"><p class="err">* Erro ao abrir a tela "${esc(v)}": ${esc(e.message)}<br>Confira se todos os arquivos do site foram atualizados (a versão aparece no rodapé).</p></section>`;
  }
  $("bVoltar").hidden = !BACK[v];
  $("bSair").hidden = !logado();
  scrollTo(0, 0);
}

$("bVoltar").onclick = () => go(BACK[S.v]);
$("bSair").onclick = () => { S.user = null; S.papel = null; TOKEN = null; go("entrada"); };
$("logo").innerHTML = `<span style="width:22px">${pix(HE, "#e11d1d", 9, 7, "none")}</span>INTERGIL`;

go("entrada");
