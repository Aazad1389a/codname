// CODNAME — stable mobile scrolling layer.
// Uses only native scrolling. No touch-drag emulation, so taps/clicks remain reliable.
const STYLE_ID = "codname-mobile-scroll-final-v2";

const css = `
@media(max-width:700px){
  html,body{width:100%;height:100%;overflow:hidden!important;-webkit-text-size-adjust:100%;}
  .app-shell{width:100%;height:100dvh;min-height:100svh;overflow:hidden!important;}
  .screen:not(.is-active){display:none!important;visibility:hidden!important;pointer-events:none!important;}
  .screen.is-active{display:block!important;visibility:visible!important;pointer-events:auto!important;}
  #screen-loading.is-active{display:grid!important;}

  #screen-menu.is-active,#screen-lobby.is-active,#screen-game.is-active,#screen-result.is-active{
    position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;min-height:100svh!important;
    overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;
    overscroll-behavior-y:contain!important;touch-action:pan-y!important;
  }

  #screen-menu .menu-bg,#screen-menu .cn-menu-particles,#screen-menu .cn-hud-grid{pointer-events:none!important;}
  #screen-menu [data-action="start-game"]{display:none!important;}
  #screen-lobby [data-action="start-game"]{display:block!important;}

  #screen-menu .side-nav{position:fixed!important;left:0!important;right:auto!important;top:0!important;bottom:0!important;width:78px!important;height:100dvh!important;z-index:500!important;box-sizing:border-box!important;padding:10px 7px!important;}
  #screen-menu .side-nav nav{width:100%!important;display:flex!important;flex-direction:column!important;align-items:center!important;gap:5px!important;}
  #screen-menu .side-bottom{width:100%!important;display:flex!important;flex-direction:column!important;align-items:center!important;gap:5px!important;}
  #screen-menu .side-item{width:100%!important;min-height:51px!important;height:51px!important;padding:4px 2px!important;border-radius:11px!important;}
  #screen-menu .side-item span{font-size:15px!important;line-height:1!important;}
  #screen-menu .side-item b{font-size:6.5px!important;line-height:1.1!important;white-space:nowrap!important;}

  #screen-menu .menu-main{position:relative!important;margin-left:78px!important;width:calc(100% - 78px)!important;min-height:calc(100dvh + 1px)!important;height:auto!important;overflow:visible!important;touch-action:pan-y!important;}
  #screen-menu .menu-main>.topbar{position:relative!important;height:58px!important;min-height:58px!important;padding:0 10px!important;z-index:5!important;}
  #screen-menu .menu-main>.reference-layout{width:100%!important;height:auto!important;min-height:0!important;padding:0 10px 90px!important;box-sizing:border-box!important;}
  #screen-menu .reference-layout,#screen-menu .reference-center,#screen-menu .reference-right{display:block!important;width:100%!important;height:auto!important;min-width:0!important;min-height:0!important;overflow:visible!important;}
  #screen-menu .reference-center{padding-bottom:30px!important;}
  #screen-menu .reference-right{padding-bottom:40px!important;}
  #screen-menu .hero-actions{display:flex!important;flex-direction:column!important;gap:8px!important;}
  #screen-menu .hero-actions .xl{width:100%!important;min-height:46px!important;}

  #screen-lobby .lobby-layout,#screen-game .game-layout{min-height:max-content!important;height:auto!important;padding-bottom:40px!important;}
  #screen-lobby .lobby-visual{pointer-events:auto!important;}
  #screen-lobby [data-action="start-game"],#screen-menu button,#screen-lobby button,#screen-game button,#screen-result button{touch-action:manipulation!important;pointer-events:auto!important;}
  #screen-game .game-layout{overflow:visible!important;}
  #screen-game .board-wrap{min-height:0!important;}

  /* Keep our decorative cinematic layer out of the touch hit-test. */
  .cn-motion-trailer,.cn-motion-game{pointer-events:none!important;}
  .cnw{touch-action:pan-y!important;}
}
`;

function install(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement("style");style.id=STYLE_ID;style.textContent=css;document.head.appendChild(style);
}

function boot(){install();}
document.addEventListener("DOMContentLoaded",boot,{once:true});
window.addEventListener("pageshow",install);
