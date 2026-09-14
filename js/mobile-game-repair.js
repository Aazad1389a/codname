// CODNAME mobile game hardening.
// Keeps the game visible on mobile, but never leaves stale inline styles when returning to the result/menu screens.
const STYLE_ID="codname-mobile-game-repair-v2";
const css=`
@media(max-width:700px){
  #screen-game.is-active{display:block!important;visibility:visible!important;opacity:1!important;position:fixed!important;inset:0!important;z-index:9990!important;width:100vw!important;height:100dvh!important;max-width:100vw!important;max-height:100dvh!important;overflow-x:hidden!important;overflow-y:auto!important;background:var(--bg,#05070b)!important;box-sizing:border-box!important;padding:5px 5px 18px 70px!important;}
  #screen-game.is-active .gamebar{display:flex!important;visibility:visible!important;opacity:1!important;position:relative!important;width:100%!important;min-height:40px!important;height:auto!important;margin:0 0 6px!important;box-sizing:border-box!important;}
  #screen-game.is-active .game-layout{display:flex!important;visibility:visible!important;opacity:1!important;flex-direction:column!important;width:100%!important;min-height:max-content!important;height:auto!important;box-sizing:border-box!important;margin:0!important;padding:0 8px 30px 0!important;gap:7px!important;}
  #screen-game.is-active .board-wrap{display:block!important;width:100%!important;min-width:0!important;min-height:0!important;height:auto!important;}
  #screen-game.is-active .board{display:grid!important;visibility:visible!important;opacity:1!important;width:100%!important;max-width:none!important;height:auto!important;aspect-ratio:1/1.02!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:3px!important;}
  #screen-game.is-active .word-card{display:grid!important;visibility:visible!important;opacity:1!important;width:100%!important;min-width:0!important;height:auto!important;min-height:42px!important;padding:3px!important;border-radius:6px!important;font-size:clamp(7px,2.1vw,11px)!important;line-height:1.05!important;overflow:hidden!important;}
  #screen-game.is-active .word-card .word{overflow-wrap:anywhere!important;word-break:break-word!important;}
  #screen-game.is-active .side-panel{display:block!important;visibility:visible!important;opacity:1!important;width:100%!important;max-width:none!important;order:2!important;box-sizing:border-box!important;}
  #screen-game.is-active [data-clue-box]{display:block!important;visibility:visible!important;width:100%!important;max-width:none!important;box-sizing:border-box!important;position:static!important;}
  #screen-game.is-active [data-game-role]{display:block!important;}
  #screen-result.is-active{display:flex!important;visibility:visible!important;opacity:1!important;position:fixed!important;inset:0!important;z-index:10000!important;width:100vw!important;height:100dvh!important;min-height:100dvh!important;overflow:auto!important;background:var(--bg,#05070b)!important;padding:20px 12px 24px 70px!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important;}
  #screen-result.is-active .result-card{display:flex!important;visibility:visible!important;opacity:1!important;position:relative!important;z-index:10001!important;width:min(560px,100%)!important;max-width:560px!important;margin:auto!important;box-sizing:border-box!important;}
  #screen-result.is-active [data-action="back-menu"]{display:flex!important;visibility:visible!important;opacity:1!important;position:relative!important;z-index:10002!important;pointer-events:auto!important;touch-action:manipulation!important;min-height:48px!important;}
}
`;
function install(){if(document.getElementById(STYLE_ID))return;const s=document.createElement("style");s.id=STYLE_ID;s.textContent=css;document.head.appendChild(s)}
function repair(){
  install();
  const g=document.querySelector('#screen-game');
  const r=document.querySelector('#screen-result');
  const gameActive=Boolean(g?.classList.contains('is-active'));
  if(g && !gameActive){
    g.style.removeProperty('display');
    g.style.removeProperty('visibility');
    g.style.removeProperty('opacity');
  }
  if(g && gameActive){
    g.style.setProperty('display','block','important');
    g.style.setProperty('visibility','visible','important');
    g.style.setProperty('opacity','1','important');
    g.querySelector('.board')?.style.setProperty('visibility','visible','important');
  }
  if(r && r.classList.contains('is-active')){
    r.style.setProperty('display','flex','important');
    r.style.setProperty('visibility','visible','important');
    r.style.setProperty('opacity','1','important');
  }
}
install();
document.addEventListener('DOMContentLoaded',repair,{once:true});
document.addEventListener('codname:game-state',repair);
new MutationObserver(repair).observe(document.documentElement,{attributes:true,subtree:true,attributeFilter:['class']});
