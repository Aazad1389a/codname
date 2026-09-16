// CODNAME — mobile stability layer.
// Keeps mobile screens stable without synthetic touch scrolling or recurring inline rewrites.
const STYLE_ID = "codname-mobile-stability-v6";

const css = `
@media(max-width:700px){
  html,body{width:100%;height:100%;overflow:hidden!important;-webkit-text-size-adjust:100%;}
  .app-shell{width:100%;height:100dvh;min-height:100svh;overflow:hidden!important;}
  .screen:not(.is-active){display:none!important;visibility:hidden!important;pointer-events:none!important;}
  .screen.is-active{display:block!important;visibility:visible!important;pointer-events:auto!important;}
  #screen-loading.is-active{display:grid!important;}
  #screen-menu .menu-bg,#screen-menu .cn-menu-particles,#screen-menu .cn-hud-grid{pointer-events:none!important;}
  #screen-menu button,#screen-menu a,#screen-lobby button,#screen-lobby a,#screen-game button,#screen-game a,#screen-result button,#screen-result a{pointer-events:auto!important;touch-action:manipulation!important;}
  #screen-menu [data-action="start-game"]{display:none!important;}
  #screen-lobby [data-action="start-game"]{display:block!important;}
  #screen-menu .side-nav{position:fixed!important;left:0!important;top:0!important;bottom:0!important;width:78px!important;height:100dvh!important;z-index:500!important;}
  #screen-menu .menu-main{position:absolute!important;left:78px!important;right:0!important;top:0!important;bottom:0!important;width:auto!important;height:100%!important;min-height:0!important;margin:0!important;padding:0!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior-y:contain!important;touch-action:pan-y!important;}
  #screen-menu .menu-main>.topbar{position:relative!important;z-index:5!important;}
  #screen-menu .menu-main>.reference-layout{min-height:max-content!important;height:auto!important;width:100%!important;padding:0 10px 90px!important;box-sizing:border-box!important;}
  #screen-menu .reference-layout,#screen-menu .reference-center,#screen-menu .reference-right{display:block!important;width:100%!important;height:auto!important;min-height:0!important;overflow:visible!important;}
  #screen-lobby.is-active,#screen-game.is-active,#screen-result.is-active{overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important;}
  #screen-lobby .lobby-layout,#screen-game .game-layout{height:auto!important;min-height:max-content!important;padding-bottom:40px!important;}
  .cn-motion-trailer,.cn-motion-game{pointer-events:none!important;}
}
`;

function install(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement("style");style.id=STYLE_ID;style.textContent=css;document.head.appendChild(style);
}

function closeStaleOverlays(){
  document.querySelectorAll("dialog[open]").forEach((dialog)=>{try{dialog.close()}catch(_){dialog.removeAttribute("open")}});
  document.querySelectorAll(".cnw.open").forEach((el)=>el.classList.remove("open"));
}

function boot(){install();closeStaleOverlays();}
document.addEventListener("DOMContentLoaded",boot,{once:true});
window.addEventListener("pageshow",install);
