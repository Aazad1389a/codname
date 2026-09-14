// Final mobile menu scrolling fix.
// Uses a dedicated scroll container instead of scrolling the fixed app screen itself.
const STYLE_ID = "codname-mobile-scroll-final-v1";

const css = `
@media (max-width:700px){
  html,body{width:100%;height:100%;overflow:hidden!important;overscroll-behavior:none!important;}
  .app-shell{width:100%;height:100dvh;overflow:hidden!important;}
  #screen-menu.is-active{
    position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;
    overflow:hidden!important;display:block!important;touch-action:none!important;
  }
  #screen-menu .side-nav{
    position:fixed!important;left:0!important;top:0!important;bottom:0!important;
    width:78px!important;height:100dvh!important;z-index:500!important;
  }
  #screen-menu .menu-main{
    position:absolute!important;left:78px!important;right:0!important;top:0!important;bottom:0!important;
    width:auto!important;height:100%!important;min-height:0!important;
    margin:0!important;padding:0!important;
    overflow-y:auto!important;overflow-x:hidden!important;
    -webkit-overflow-scrolling:touch!important;
    overscroll-behavior-y:contain!important;
    touch-action:pan-y!important;
    scroll-behavior:auto!important;
  }
  #screen-menu .menu-main>.topbar{position:relative!important;z-index:2!important;}
  #screen-menu .menu-main>.reference-layout{
    min-height:max-content!important;height:auto!important;width:100%!important;
    padding-bottom:80px!important;
  }
  #screen-menu .reference-layout,
  #screen-menu .reference-center,
  #screen-menu .reference-right{overflow:visible!important;height:auto!important;min-height:0!important;}

  .cn-halloween-modal{pointer-events:none!important;display:none!important;}
  .cn-halloween-modal.open{display:flex!important;pointer-events:auto!important;}
  .cn-halloween-dialog{pointer-events:auto!important;touch-action:pan-y!important;}
}
`;

function install(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement("style");
  style.id=STYLE_ID;
  style.textContent=css;
  document.head.appendChild(style);
}

function enableTouchFallback(){
  const scroller=document.querySelector("#screen-menu .menu-main");
  if(!scroller || scroller.dataset.touchFallback === "1") return;
  scroller.dataset.touchFallback="1";

  let startY=0;
  let startScroll=0;
  let dragging=false;

  scroller.addEventListener("touchstart",(e)=>{
    if(e.touches.length!==1) return;
    const target=e.target;
    if(target.closest("button,a,input,select,textarea,[role=button],dialog,.cn-halloween-modal")) return;
    startY=e.touches[0].clientY;
    startScroll=scroller.scrollTop;
    dragging=true;
  },{passive:true});

  scroller.addEventListener("touchmove",(e)=>{
    if(!dragging || e.touches.length!==1) return;
    const y=e.touches[0].clientY;
    const delta=startY-y;
    if(Math.abs(delta)<1) return;
    scroller.scrollTop=startScroll+delta;
  },{passive:true});

  scroller.addEventListener("touchend",()=>{dragging=false;},{passive:true});
  scroller.addEventListener("touchcancel",()=>{dragging=false;},{passive:true});
}

function boot(){
  install();
  enableTouchFallback();
  const observer=new MutationObserver(()=>enableTouchFallback());
  observer.observe(document.body,{childList:true,subtree:true});
}

document.addEventListener("DOMContentLoaded",boot,{once:true});
