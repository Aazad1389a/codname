// CODNAME final responsive stability layer.
// One screen at a time + the same left-sidebar navigation on desktop and mobile.
const STYLE_ID = "codname-mobile-clean-v3";

const css = `
html,body{width:100%;height:100%;min-height:100%;overflow:hidden;-webkit-text-size-adjust:100%;}
.app-shell{width:100%;height:100dvh;min-height:100svh;overflow:hidden;}
.screen:not(.is-active){display:none!important;visibility:hidden!important;pointer-events:none!important;}
.screen.is-active{display:block!important;visibility:visible!important;pointer-events:auto!important;}
#screen-loading.is-active{display:grid!important;}
#screen-menu.is-active,#screen-lobby.is-active,#screen-game.is-active,#screen-result.is-active{position:relative!important;overflow-x:hidden!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;}
#screen-menu .menu-bg,#screen-menu .cn-menu-particles,#screen-menu .cn-hud-grid{pointer-events:none!important;}
#screen-menu [data-action="start-game"]{display:none!important;}
#screen-lobby [data-action="start-game"]{display:block!important;}
#screen-menu .side-nav{position:absolute!important;left:0!important;right:auto!important;top:0!important;bottom:0!important;width:94px!important;height:100%!important;z-index:50!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:space-between!important;box-sizing:border-box!important;padding:18px 10px!important;}
#screen-menu .side-nav nav{width:100%!important;display:flex!important;flex-direction:column!important;align-items:center!important;gap:8px!important;}
#screen-menu .side-bottom{width:100%!important;display:flex!important;flex-direction:column!important;align-items:center!important;gap:8px!important;}
#screen-menu .side-item{width:100%!important;min-height:58px!important;height:auto!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:4px!important;}
#screen-menu .menu-main{margin-left:94px!important;width:auto!important;min-width:0!important;height:auto!important;min-height:100%!important;display:block!important;overflow:visible!important;box-sizing:border-box!important;}
#screen-menu .reference-layout{min-height:max-content!important;}
#screen-lobby.is-active{overflow-y:auto!important;padding-bottom:24px!important;}
#screen-game.is-active{overflow-y:auto!important;}
.cnw:not(.open){display:none!important;pointer-events:none!important;visibility:hidden!important;}
.cnw.open{display:flex!important;pointer-events:auto!important;visibility:visible!important;}
.cn-install-backdrop:not(.is-open){display:none!important;pointer-events:none!important;visibility:hidden!important;}
.cn-install-backdrop.is-open{display:flex!important;pointer-events:auto!important;visibility:visible!important;}
dialog:not([open]){display:none!important;pointer-events:none!important;visibility:hidden!important;}
dialog[open]{pointer-events:auto!important;visibility:visible!important;}
button,a,input,select{touch-action:manipulation!important;}

@media(max-width:700px){
  /* The menu itself is the scroll container on phones. */
  #screen-menu.is-active{height:100dvh!important;min-height:100svh!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior-y:contain!important;}
  #screen-menu .side-nav{position:fixed!important;left:0!important;right:auto!important;top:0!important;bottom:0!important;width:78px!important;height:100dvh!important;padding:10px 7px!important;}
  #screen-menu .side-brand{display:grid!important;width:46px!important;height:46px!important;margin-bottom:12px!important;}
  #screen-menu .side-brand img{width:32px!important;height:32px!important;}
  #screen-menu .side-nav nav{width:100%!important;height:auto!important;gap:5px!important;}
  #screen-menu .side-bottom{display:flex!important;gap:5px!important;}
  #screen-menu .side-item{min-height:51px!important;height:51px!important;padding:4px 2px!important;border-radius:11px!important;}
  #screen-menu .side-item span{font-size:15px!important;line-height:1!important;}
  #screen-menu .side-item b{font-size:6.5px!important;line-height:1.1!important;white-space:nowrap!important;}
  #screen-menu .menu-main{margin-left:78px!important;width:calc(100% - 78px)!important;height:auto!important;min-height:100%!important;padding:0 0 18px!important;overflow:visible!important;}
  #screen-menu .menu-main>.topbar{height:58px!important;min-height:58px!important;padding:0 10px!important;}
  #screen-menu .menu-main>.reference-layout{width:100%!important;min-height:max-content!important;padding:0 10px 36px!important;box-sizing:border-box!important;}
  #screen-menu .reference-layout{display:block!important;width:100%!important;max-width:none!important;}
  #screen-menu .reference-center,#screen-menu .reference-right{width:100%!important;min-width:0!important;}
  #screen-menu .reference-center{padding-bottom:26px!important;}
  #screen-menu .reference-right{padding-bottom:18px!important;display:grid!important;grid-template-columns:1fr!important;gap:10px!important;}
  #screen-menu .reference-hero{min-height:0!important;margin:0 0 12px!important;}
  #screen-menu .hero-copy{padding:18px 15px!important;}
  #screen-menu .hero-copy h1{font-size:clamp(28px,8vw,42px)!important;line-height:1.05!important;}
  #screen-menu .hero-actions{display:flex!important;flex-direction:column!important;gap:8px!important;}
  #screen-menu .hero-actions .xl{width:100%!important;min-height:46px!important;}
  #screen-menu .hero-art-frame{min-height:220px!important;}
  #screen-menu .primary-actions-grid,#screen-menu .lower-grid{display:grid!important;grid-template-columns:1fr!important;gap:10px!important;margin-bottom:14px!important;}
  #screen-menu .primary-actions-grid article,#screen-menu .lower-grid article{width:100%!important;min-width:0!important;}
  #screen-menu .account-panel,#screen-menu .ranking-panel,#screen-menu .recent-panel{width:100%!important;min-width:0!important;}
  #screen-menu .platform-bar{height:auto!important;min-height:48px!important;margin:0 0 14px!important;}

  .cnw{align-items:flex-start!important;justify-content:flex-start!important;padding:8px!important;overflow:auto!important;-webkit-overflow-scrolling:touch!important;}
  .cnw-box{width:100%!important;max-width:none!important;min-height:calc(100svh - 16px)!important;max-height:none!important;display:flex!important;flex-direction:column!important;}
  .cnw-side{flex:none!important;border-left:0!important;border-bottom:1px solid rgba(255,255,255,.08)!important;position:sticky!important;top:0!important;z-index:4!important;padding:9px!important;}
  .cnw-nav{display:flex!important;gap:6px!important;overflow-x:auto!important;-webkit-overflow-scrolling:touch!important;scrollbar-width:none!important;}
  .cnw-nav::-webkit-scrollbar{display:none!important;}
  .cnw-nav button{flex:0 0 auto!important;min-width:84px!important;white-space:nowrap!important;text-align:center!important;}
  .cnw-main{flex:1 1 auto!important;min-height:0!important;overflow:auto!important;-webkit-overflow-scrolling:touch!important;padding:12px!important;}
  .cnw-grid{grid-template-columns:1fr!important;}
  .cnw-stats{grid-template-columns:repeat(2,1fr)!important;}
  .cnw-cards{grid-template-columns:repeat(2,minmax(0,1fr))!important;max-height:none!important;overflow:visible!important;}

  #screen-lobby.is-active{padding:10px 10px 24px 88px!important;box-sizing:border-box!important;}
  #screen-lobby .lobby-layout{width:100%!important;display:flex!important;flex-direction:column!important;gap:12px!important;margin:0!important;padding:0 0 28px!important;}
  #screen-lobby .lobby-visual,#screen-lobby .players-panel{width:100%!important;min-width:0!important;box-sizing:border-box!important;}
  #screen-lobby .lobby-visual{min-height:0!important;}
  #screen-lobby .players-panel{min-height:0!important;}
  #screen-lobby .players{max-height:none!important;overflow:visible!important;}

  #screen-game.is-active{padding:10px 10px 24px 88px!important;min-height:100dvh!important;box-sizing:border-box!important;}
  #screen-game .game-layout{width:100%!important;display:flex!important;flex-direction:column!important;gap:12px!important;min-height:max-content!important;padding-bottom:36px!important;}
  #screen-game .board-wrap{width:100%!important;min-height:0!important;}
  #screen-game .board{width:100%!important;height:auto!important;aspect-ratio:1/1.05!important;}
  #screen-game .side-panel{width:100%!important;order:2!important;}

  .auth-modal[open]{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;margin:0!important;padding:14px!important;overflow:auto!important;background:rgba(0,0,0,.72)!important;}
  .auth-modal::backdrop{background:rgba(0,0,0,.72)!important;}
  .auth-card{width:min(520px,100%)!important;margin:auto!important;max-height:none!important;}
}
`;

function install(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement("style");
  style.id=STYLE_ID;
  style.textContent=css;
  document.head.appendChild(style);
}

function closeAllOverlays(){
  document.querySelectorAll(".cnw.open").forEach(el=>el.classList.remove("open"));
  document.querySelectorAll(".cn-install-backdrop.is-open").forEach(el=>el.classList.remove("is-open"));
  document.querySelectorAll("dialog[open]").forEach(dialog=>{try{dialog.close()}catch(_){dialog.removeAttribute("open")}});
}

function enforceScreens(){
  const active=document.querySelector(".screen.is-active");
  if(!active)return;
  document.querySelectorAll(".screen").forEach(screen=>{
    const visible=screen===active;
    screen.style.display=visible?(screen.id==="screen-loading"?"grid":"block"):"none";
    screen.style.pointerEvents=visible?"auto":"none";
    screen.style.visibility=visible?"visible":"hidden";
  });
}

install();
window.addEventListener("pageshow",()=>{closeAllOverlays();enforceScreens();},{once:false});
document.addEventListener("DOMContentLoaded",()=>{install();closeAllOverlays();enforceScreens();});
window.setTimeout(()=>{install();enforceScreens();},250);
window.setInterval(enforceScreens,1000);
