function update(){
  const start=document.querySelector('#screen-lobby [data-action="start-game"]');
  if(!start)return;
  const state=window.CODNAME?.getGameState?.();
  const user=window.CODNAME?.getUser?.();
  const players=state?.players||[];
  const format=state?.settings?.playerFormat||(state?.mode==="duel"?"1v1":"2v2");
  const me=players.find(p=>p.user_id===user?.id);
  const red=players.filter(p=>p.team==="red").length;
  const blue=players.filter(p=>p.team==="blue").length;
  const ready=format==="1v1"?players.length===2:(players.length>=4&&red>=2&&blue>=2);
  start.disabled=!(me?.is_host&&ready);
  start.title=ready?"شروع بازی":"منتظر تکمیل بازیکنان و تیم‌ها";
}
document.addEventListener('codname:game-state',update);
document.addEventListener('DOMContentLoaded',()=>setTimeout(update,200),{once:true});
setInterval(update,1200);
