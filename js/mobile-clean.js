// CODNAME mobile stability layer.
// Keeps the original page order, removes accidental overlays, and makes every panel scroll naturally.
const STYLE_ID = "codname-mobile-clean-v1";

const css = `
html,body{width:100%;min-height:100%;overflow:hidden;-webkit-text-size-adjust:100%;}
.app-shell{width:100%;height:100dvh;min-height:100svh;overflow:hidden;}
.screen{display:none!important;pointer-events:none!important;}
.screen.is-active{display:block!important;pointer-events:auto!important;}
#screen-loading.is-active{display:grid!important;}
#screen-menu.is-active,#screen-lobby.is-active,#screen-game.is-active,#screen-result.is-active{overflow-x:hidden!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;}
#screen-menu.is-active{position:relative!important;}
#screen-menu .menu-bg,#screen-menu .cn-menu-particles,#screen-menu .cn-hud-grid{pointer-events:none!important;}
#screen-menu [data-action="start-game"]{display:none!important;}
.cnw:not(.open){display:none!important;pointer-events:none!important;}
.cnw.open{display:flex!important;pointer-events:auto!important;}
.cn-install-backdrop:not(.is-open){display:none!important;pointer-events:none!important;}
.cn-install-backdrop.is-open{display:flex!important;pointer-events:auto!important;}
dialog:not([open]){display:none!important;pointer-events:none!important;}
dialog[open]{pointer-events:auto!important;}
button,a,input,select{touch-action:manipulation!important;}

@media(max-width:700px){
  #screen-menu.is-active{padding:0!important;}
  #screen-menu .side-nav{position:fixed!important;left:0!important;right:0!important;top:auto!important;bottom:0!important;width:100%!important;height:62px!important;min-height:62px!important;z-index:500!important;display:flex!important;flex-direction:row!important;padding:4px 8px!important;background:rgba(4,8,14,.97)!important;border-top:1px solid rgba(255,255,255,.12)!important;border-right:0!important;}
  #screen-menu .side-brand,#screen-menu .side-bottom{display:none!important;}
  #screen-menu .side-nav nav{width:100%!important;height:100%!important;display:grid!important;grid-template-columns:repeat(6,1fr)!important;gap:4px!important;}
  #screen-menu .side-item{width:100%!important;height:54px!important;min-height:54px!important;padding:4px 2px!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:3px!important;border-radius:10px!important;}
  #screen-menu .side-item span{font-size:16px!important;line-height:1!important;}
  #screen-menu .side-item b{font-size:7px!important;line-height:1.1!important;}
  #screen-menu .menu-main{margin:0!important;width:100%!important;min-width:0!important;height:auto!important;min-height:100%!important;display:flex!important;flex-direction:column!important;overflow:visible!important;padding:0 0 82px!important;}
  #screen-menu .menu-main>.topbar{height:62px!important;min-height:62px!important;padding:0 12px!important;}
  #screen-menu .reference-layout{display:flex!important;flex-direction:column!important;width:100%!important;max-width:none!important;padding:0 12px 28px!important;gap:14px!important;}
  #screen-menu .reference-center,#screen-menu .reference-right{width:100%!important;min-width:0!important;padding:0!important;display:block!important;}
  #screen-menu .reference-hero{min-height:0!important;margin:0 0 14px!important;}
  #screen-menu .hero-copy{padding:20px 16px!important;}
  #screen-menu .hero-copy h1{font-size:clamp(30px,9vw,46px)!important;line-height:1.05!important;}
  #screen-menu .hero-actions{display:flex!important;flex-direction:column!important;gap:9px!important;}
  #screen-menu .hero-actions button{width:100%!important;min-height:46px!important;}
  #screen-menu .hero-art-frame{min-height:230px!important;}
  #screen-menu .primary-actions-grid,#screen-menu .lower-grid{display:grid!important;grid-template-columns:1fr!important;gap:12px!important;margin:0 0 14px!important;}
  #screen-menu .primary-actions-grid article,#screen-menu .lower-grid article{width:100%!important;min-width:0!important;}
  #screen-menu .reference-right{display:grid!important;grid-template-columns:1fr!important;gap:12px!important;}
  #screen-menu .account-panel,#screen-menu .ranking-panel,#screen-menu .recent-panel{width:100%!important;min-width:0!important;}
  #screen-menu .platform-bar{height:auto!important;min-height:0!important;display:flex!important;flex-wrap:wrap!important;gap:8px!important;padding:10px 12px!important;margin:0 12px 14px!important;}

  #screen-lobby.is-active{padding:10px 10px 84px!important;}
  #screen-lobby .lobby-layout{width:100%!important;display:flex!important;flex-direction:column!important;gap:12px!important;margin:0!important;padding:0 0 28px!important;}
  #screen-lobby .lobby-visual,#screen-lobby .players-panel{width:100%!important;min-width:0!important;}
  #screen-lobby .lobby-visual{min-height:0!important;}
  #screen-lobby .players-panel{min-height:0!important;}
  #screen-lobby .players{max-height:none!important;overflow:visible!important;}

  #screen-game.is-active{padding:10px 10px 24px!important;}
  #screen-game .game-layout{width:100%!important;display:flex!important;flex-direction:column!important;gap:12px!important;min-height:max-content!important;padding-bottom:36px!important;}
  #screen-game .board-wrap{width:100%!important;min-height:0!important;}
  #screen-game .board{width:100%!important;height:auto!important;aspect-ratio:1/1.05!important;}
  #screen-game .side-panel{width:100%!important;order:2!important;}

  .cnw{align-items:flex-start!important;justify-content:flex-start!important;padding:8px!important;overflow:auto!important;-webkit-overflow-scrolling:touch!important;}
  .cnw-box{width:100%!important;max-width:none!important;min-height:calc(100svh - 16px)!important;max-height:none!important;display:flex!important;flex-direction:column!important;grid-template-columns:1fr!important;}
  .cnw-side{flex:none!important;border-left:0!important;border-bottom:1px solid rgba(255,255,255,.08)!important;position:sticky!important;top:0!important;z-index:4!important;padding:9px!important;background:linear-gradient(145deg,#121a29,#070c15)!important;}
  .cnw-nav{display:flex!important;gap:6px!important;overflow-x:auto!important;-webkit-overflow-scrolling:touch!important;scrollbar-width:none!important;}
  .cnw-nav::-webkit-scrollbar{display:none!important;}
  .cnw-nav button{flex:0 0 auto!important;min-width:84px!important;white-space:nowrap!important;text-align:center!important;}
  .cnw-main{flex:1 1 auto!important;min-height:0!important;overflow:visible!important;padding:12px!important;}
  .cnw-grid{grid-template-columns:1fr!important;}
  .cnw-stats{grid-template-columns:repeat(2,1fr)!important;}
  .cnw-cards{grid-template-columns:repeat(2,minmax(0,1fr))!important;max-height:none!important;overflow:visible!important;}

  .auth-modal[open]{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;margin:0!important;padding:14px!important;overflow:auto!important;background:rgba(0,0,0,.72)!important;}
  .auth-modal::backdrop{background:rgba(0,0,0,.72)!important;}
  .auth-card{width:min(520px,100%)!important;margin:auto!important;max-height:none!important;}
}
`;

function install(){
  if(document.getElementById(STYLE_ID)) return;
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

function normalizeText(){
  document.querySelectorAll("body *").forEach(el=>{
    if(el.children.length===0 && typeof el.textContent==="string" && el.textContent.includes("۱۵۰۰")){
      el.textContent=el.textContent.replaceAll("۱۵۰۰","۱۰٬۰۰۰");
    }
  });
}

function enforceScreens(){
  const active=document.querySelector(".screen.is-active");
  if(!active) return;
  document.querySelectorAll(".screen").forEach(screen=>{
    screen.style.pointerEvents=screen===active?"auto":"none";
    screen.style.display=screen===active?"block":"none";
  });
}

install();
window.addEventListener("pageshow",()=>{closeAllOverlays();enforceScreens();normalizeText();},{once:false});
document.addEventListener("DOMContentLoaded",()=>{install();closeAllOverlays();enforceScreens();normalizeText();});
window.setTimeout(()=>{install();closeAllOverlays();enforceScreens();normalizeText();},250);
window.setInterval(()=>{enforceScreens();},1000);
