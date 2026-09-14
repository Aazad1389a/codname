// Mobile game viewport fix: keep the board visible, compact UI, and never let lobby layers cover it.
const s=document.createElement('style');s.id='codname-mobile-game-fix';s.textContent=`
@media(max-width:700px){
  #screen-game.is-active{display:block!important;position:relative!important;z-index:100!important;overflow-x:hidden!important;overflow-y:auto!important;padding:4px 6px 14px 70px!important;box-sizing:border-box!important;min-height:100dvh!important;background:transparent!important}
  #screen-game .gamebar{width:100%!important;height:auto!important;min-height:42px!important;margin:0 0 5px!important;padding:5px 7px!important;border-radius:10px!important;gap:4px!important}
  #screen-game .score strong{font-size:17px!important}.score span{font-size:7px!important}.turn-center span{font-size:8px!important}.turn-center small{font-size:6px!important}
  #screen-game .game-layout{display:flex!important;flex-direction:column!important;width:100%!important;gap:6px!important;min-height:auto!important;margin:0!important;padding:0 10px 18px 0!important}
  #screen-game .board-wrap{display:block!important;width:100%!important;height:auto!important;min-height:0!important;margin:0!important}
  #screen-game .board{display:grid!important;width:100%!important;height:auto!important;aspect-ratio:1/1.02!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:3px!important}
  #screen-game .word-card{width:100%!important;min-width:0!important;min-height:0!important;height:auto!important;padding:4px 2px!important;border-radius:6px!important;font-size:clamp(7px,2.2vw,11px)!important;line-height:1!important;box-shadow:0 2px 0 #716a5b!important}
  #screen-game .side-panel{width:100%!important;display:block!important;order:2!important;margin:0!important;padding:8px!important;border-radius:11px!important}
  #screen-game [data-clue-box]{width:100%!important;margin:0 0 5px!important;position:static!important}
  #screen-game [data-game-role]{font-size:7px!important;padding:5px 6px!important;margin:4px auto 0!important}
  #screen-lobby.is-active{z-index:90!important}
}
`;document.head.appendChild(s);
