// Desktop scrolling for long menus, lobbies, games and result screens.
// Keeps the desktop layout intact while allowing mouse-wheel, trackpad and keyboard scrolling.
const STYLE_ID = "codname-desktop-scroll-final-v1";

const css = `
@media (min-width:701px){
  html,body{width:100%;min-height:100%;overflow:hidden!important;}
  .app-shell{width:100%;height:100dvh;overflow:hidden!important;}

  .screen.is-active{
    overflow-y:auto!important;
    overflow-x:hidden!important;
    -webkit-overflow-scrolling:touch!important;
    overscroll-behavior-y:contain!important;
    scrollbar-gutter:stable;
  }

  #screen-menu.is-active{
    display:block!important;
    overflow:hidden!important;
  }
  #screen-menu .menu-main{
    height:100%;
    min-height:100%;
    overflow-y:auto!important;
    overflow-x:hidden!important;
    overscroll-behavior-y:contain!important;
    scroll-behavior:auto!important;
    scrollbar-gutter:stable;
    padding-bottom:28px!important;
  }
  #screen-menu .reference-layout{
    min-height:max-content!important;
    height:auto!important;
    padding-bottom:70px!important;
  }
  #screen-menu .reference-center,
  #screen-menu .reference-right{
    min-height:0!important;
  }

  #screen-lobby.is-active,
  #screen-result.is-active,
  #screen-game.is-active{
    overflow-y:auto!important;
    overflow-x:hidden!important;
    padding-bottom:30px!important;
  }

  #screen-lobby .lobby-layout{
    min-height:max-content!important;
    padding-bottom:40px!important;
  }
  #screen-game .game-layout{
    min-height:max-content!important;
    padding-bottom:35px!important;
  }
  #screen-game .board-wrap{
    min-height:0!important;
  }
  #screen-result.is-active{
    min-height:100dvh;
  }
  #screen-result .result-card{
    margin-top:24px!important;
    margin-bottom:40px!important;
  }
}
`;

function install(){
  if(document.getElementById(STYLE_ID)) return;
  const style=document.createElement("style");
  style.id=STYLE_ID;
  style.textContent=css;
  document.head.appendChild(style);
}

function enableWheelFallback(){
  const targets=document.querySelectorAll("#screen-menu .menu-main,#screen-lobby.is-active,#screen-game.is-active,#screen-result.is-active");
  targets.forEach((scroller)=>{
    if(scroller.dataset.desktopWheelFallback==="1") return;
    scroller.dataset.desktopWheelFallback="1";
    scroller.addEventListener("wheel",(e)=>{
      if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){
        scroller.scrollTop += e.deltaY;
        e.preventDefault();
      }
    },{passive:false});
  });
}

function enableKeyboardFallback(){
  if(document.documentElement.dataset.desktopScrollKeys==="1") return;
  document.documentElement.dataset.desktopScrollKeys="1";
  document.addEventListener("keydown",(e)=>{
    if(["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName)) return;
    const active=document.querySelector(".screen.is-active");
    if(!active) return;
    const scroller=active.id==="screen-menu" ? active.querySelector(".menu-main") : active;
    if(!scroller) return;
    if(e.key==="PageDown") { scroller.scrollTop += scroller.clientHeight*.9; e.preventDefault(); }
    else if(e.key==="PageUp") { scroller.scrollTop -= scroller.clientHeight*.9; e.preventDefault(); }
    else if(e.key==="Home" && e.ctrlKey) { scroller.scrollTop=0; e.preventDefault(); }
    else if(e.key==="End" && e.ctrlKey) { scroller.scrollTop=scroller.scrollHeight; e.preventDefault(); }
  });
}

function boot(){
  install();
  enableWheelFallback();
  enableKeyboardFallback();
  const observer=new MutationObserver(()=>enableWheelFallback());
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
}

document.addEventListener("DOMContentLoaded",boot,{once:true});
