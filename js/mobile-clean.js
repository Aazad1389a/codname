// CODNAME mobile touch-scroll layer.
// The menu scrolls vertically with finger/touch while the left navigation stays fixed.
const STYLE_ID = "codname-mobile-touch-scroll-v5";

const css = `
html,body{width:100%;min-height:100%;overflow:hidden;-webkit-text-size-adjust:100%;}
.app-shell{width:100%;height:100dvh;min-height:100svh;overflow:hidden;}
.screen:not(.is-active){display:none!important;visibility:hidden!important;pointer-events:none!important;}
.screen.is-active{display:block!important;visibility:visible!important;pointer-events:auto!important;}
#screen-loading.is-active{display:grid!important;}
#screen-menu.is-active,#screen-lobby.is-active,#screen-game.is-active,#screen-result.is-active{position:relative!important;overflow-x:hidden!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;}
#screen-menu .menu-bg,#screen-menu .cn-menu-particles,#screen-menu .cn-hud-grid{pointer-events:none!important;}
#screen-menu [data-action="start-game"]{display:none!important;}
#screen-lobby [data-action="start-game"]{display:block!important;}

#screen-menu .side-nav{position:fixed!important;left:0!important;right:auto!important;top:0!important;bottom:0!important;width:94px!important;height:100dvh!important;z-index:100!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:space-between!important;box-sizing:border-box!important;padding:18px 10px!important;}
#screen-menu .side-nav nav{width:100%!important;display:flex!important;flex-direction:column!important;align-items:center!important;gap:8px!important;}
#screen-menu .side-bottom{width:100%!important;display:flex!important;flex-direction:column!important;align-items:center!important;gap:8px!important;}
#screen-menu .side-item{width:100%!important;min-height:58px!important;height:auto!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:4px!important;}
#screen-menu .menu-main{margin-left:94px!important;width:calc(100% - 94px)!important;min-width:0!important;height:auto!important;min-height:100%!important;display:block!important;overflow:visible!important;box-sizing:border-box!important;}
#screen-menu .reference-layout{min-height:max-content!important;height:auto!important;}
#screen-menu .reference-center,#screen-menu .reference-right{height:auto!important;min-height:0!important;}

button,a,input,select{touch-action:manipulation!important;}

@media(max-width:700px){
  /* Native scrolling plus a JS touch-drag fallback for mobile browsers that keep the page locked. */
  #screen-menu.is-active{
    position:fixed!important;left:0!important;top:0!important;right:0!important;bottom:0!important;
    width:100vw!important;height:100dvh!important;min-height:100svh!important;max-height:none!important;
    overflow-y:scroll!important;overflow-x:hidden!important;
    -webkit-overflow-scrolling:touch!important;overscroll-behavior-y:auto!important;touch-action:pan-y!important;
  }
  #screen-menu .side-nav{position:fixed!important;left:0!important;right:auto!important;top:0!important;bottom:0!important;width:78px!important;height:100dvh!important;padding:10px 7px!important;z-index:100!important;}
  #screen-menu .side-brand{display:grid!important;width:46px!important;height:46px!important;margin-bottom:12px!important;}
  #screen-menu .side-brand img{width:32px!important;height:32px!important;}
  #screen-menu .side-nav nav{width:100%!important;height:auto!important;gap:5px!important;}
  #screen-menu .side-bottom{display:flex!important;gap:5px!important;}
  #screen-menu .side-item{min-height:51px!important;height:51px!important;padding:4px 2px!important;border-radius:11px!important;}
  #screen-menu .side-item span{font-size:15px!important;line-height:1!important;}
  #screen-menu .side-item b{font-size:6.5px!important;line-height:1.1!important;white-space:nowrap!important;}

  #screen-menu .menu-main{margin-left:78px!important;width:calc(100% - 78px)!important;height:auto!important;min-height:calc(100dvh + 1px)!important;padding:0 0 70px!important;overflow:visible!important;touch-action:pan-y!important;}
  #screen-menu .menu-main>.topbar{height:58px!important;min-height:58px!important;padding:0 10px!important;}
  #screen-menu .menu-main>.reference-layout{width:100%!important;height:auto!important;min-height:0!important;padding:0 10px 100px!important;box-sizing:border-box!important;}
  #screen-menu .reference-layout{display:block!important;width:100%!important;max-width:none!important;height:auto!important;}
  #screen-menu .reference-center,#screen-menu .reference-right{width:100%!important;height:auto!important;min-width:0!important;display:block!important;}
  #screen-menu .reference-center{padding-bottom:40px!important;}
  #screen-menu .reference-right{padding-bottom:50px!important;}
  #screen-menu .reference-hero{min-height:0!important;height:auto!important;margin:0 0 14px!important;}
  #screen-menu .hero-copy{padding:18px 15px!important;}
  #screen-menu .hero-copy h1{font-size:clamp(28px,8vw,42px)!important;line-height:1.05!important;}
  #screen-menu .hero-actions{display:flex!important;flex-direction:column!important;gap:8px!important;}
  #screen-menu .hero-actions .xl{width:100%!important;min-height:46px!important;}
  #screen-menu .hero-art-frame{min-height:220px!important;height:auto!important;}
  #screen-menu .primary-actions-grid,#screen-menu .lower-grid{display:grid!important;grid-template-columns:1fr!important;gap:10px!important;margin-bottom:14px!important;}
  #screen-menu .primary-actions-grid article,#screen-menu .lower-grid article{width:100%!important;min-width:0!important;height:auto!important;}
  #screen-menu .account-panel,#screen-menu .ranking-panel,#screen-menu .recent-panel{width:100%!important;min-width:0!important;height:auto!important;}
  #screen-menu .platform-bar{height:auto!important;min-height:48px!important;margin:0 0 18px!important;}

  .cnw{align-items:flex-start!important;justify-content:flex-start!important;padding:8px!important;overflow:auto!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important;}
  .cnw-box{width:100%!important;max-width:none!important;min-height:calc(100svh - 16px)!important;max-height:none!important;display:flex!important;flex-direction:column!important;}
  .cnw-main{flex:1 1 auto!important;min-height:0!important;overflow:auto!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important;padding:12px!important;}

  #screen-lobby.is-active,#screen-game.is-active{overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important;}
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

function installTouchScroll(){
  const menu=document.getElementById("screen-menu");
  if(!menu || menu.dataset.touchScrollInstalled==="1")return;
  menu.dataset.touchScrollInstalled="1";
  let startY=0;
  let startScroll=0;
  let dragging=false;
  let moved=false;
  menu.addEventListener("touchstart",event=>{
    if(window.innerWidth>700 || !menu.classList.contains("is-active"))return;
    const touch=event.touches?.[0];
    if(!touch)return;
    startY=touch.clientY;
    startScroll=menu.scrollTop;
    dragging=true;
    moved=false;
  },{passive:true});
  menu.addEventListener("touchmove",event=>{
    if(!dragging || window.innerWidth>700 || !menu.classList.contains("is-active"))return;
    const touch=event.touches?.[0];
    if(!touch)return;
    const dy=startY-touch.clientY;
    if(Math.abs(dy)>3)moved=true;
    if(moved){
      menu.scrollTop=startScroll+dy;
      event.preventDefault();
    }
  },{passive:false});
  menu.addEventListener("touchend",()=>{dragging=false;setTimeout(()=>{moved=false},0)},{passive:true});
  menu.addEventListener("touchcancel",()=>{dragging=false;moved=false},{passive:true});
}

install();
window.addEventListener("pageshow",()=>{closeAllOverlays();enforceScreens();installTouchScroll();},{once:false});
document.addEventListener("DOMContentLoaded",()=>{install();closeAllOverlays();enforceScreens();installTouchScroll();});
window.setTimeout(()=>{install();enforceScreens();installTouchScroll();},250);
window.setInterval(()=>{enforceScreens();installTouchScroll();},1000);
