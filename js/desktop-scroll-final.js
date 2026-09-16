// CODNAME — isolated desktop scrolling controller.
// Only controls desktop menu/lobby/result scrolling.
// Does not intercept clicks, pointer events, or touch events.
const STYLE_ID = "codname-desktop-scroll-final-v2";

const css = `
@media (min-width:701px){
  html,body{width:100%;min-height:100%;overflow-x:hidden!important;overflow-y:auto!important;}
  .app-shell{width:100%;min-height:100dvh;height:auto!important;overflow:visible!important;}

  /* Menu gets its own vertical scroll area. */
  #screen-menu.is-active{
    display:block!important;
    position:relative!important;
    min-height:100dvh!important;
    height:auto!important;
    overflow:visible!important;
  }
  #screen-menu .menu-main{
    height:auto!important;
    min-height:100dvh!important;
    max-height:none!important;
    overflow:visible!important;
    padding-bottom:90px!important;
  }

  /* Keep menu controls clickable; scrolling must never sit above buttons. */
  #screen-menu .menu-main,
  #screen-menu .menu-main *{
    pointer-events:auto;
  }

  /* Other desktop screens can naturally extend beyond the viewport. */
  #screen-lobby.is-active,
  #screen-game.is-active,
  #screen-result.is-active{
    position:relative!important;
    min-height:100dvh!important;
    height:auto!important;
    max-height:none!important;
    overflow:visible!important;
    padding-bottom:50px!important;
  }

  #screen-lobby .lobby-layout,
  #screen-game .game-layout,
  #screen-result .result-card{
    min-height:0!important;
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

function getPageScroller(){
  return document.scrollingElement || document.documentElement;
}

function enableKeyboardFallback(){
  if(document.documentElement.dataset.desktopScrollKeysV2==="1") return;
  document.documentElement.dataset.desktopScrollKeysV2="1";

  document.addEventListener("keydown",(e)=>{
    if(!window.matchMedia("(min-width:701px)").matches) return;
    if(["INPUT","TEXTAREA","SELECT","BUTTON"].includes(document.activeElement?.tagName)) return;

    const scroller=getPageScroller();
    if(!scroller) return;

    if(e.key==="PageDown"){
      scroller.scrollTop += window.innerHeight * 0.85;
      e.preventDefault();
    }else if(e.key==="PageUp"){
      scroller.scrollTop -= window.innerHeight * 0.85;
      e.preventDefault();
    }else if(e.key==="Home" && e.ctrlKey){
      scroller.scrollTo({top:0,behavior:"auto"});
      e.preventDefault();
    }else if(e.key==="End" && e.ctrlKey){
      scroller.scrollTo({top:scroller.scrollHeight,behavior:"auto"});
      e.preventDefault();
    }
  },{passive:false});
}

function boot(){
  install();
  enableKeyboardFallback();
}

document.addEventListener("DOMContentLoaded",boot,{once:true});
