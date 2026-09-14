import "./pre.js";

const APP={
  version:"1.7.1",
  user:null,
  profile:null,
  roomId:null,
  roomCode:null,
  gameState:null,
  realtimeChannel:null,
  initialized:false
};

let api=null;
let appEventsBound=false;

function instantScreen(name){
  const screens={loading:document.querySelector('#screen-loading'),menu:document.querySelector('#screen-menu'),lobby:document.querySelector('#screen-lobby'),game:document.querySelector('#screen-game'),result:document.querySelector('#screen-result')};
  Object.values(screens).forEach(el=>el?.classList.remove('is-active'));
  screens[name]?.classList.add('is-active');
}
function instantMessage(text){
  const toast=document.querySelector('[data-toast]');
  if(!toast)return;
  toast.textContent=text;
  toast.classList.add('is-visible');
  window.setTimeout(()=>toast.classList.remove('is-visible'),3500);
}
function withTimeout(promise,ms,fallback=null){return Promise.race([promise,new Promise(resolve=>window.setTimeout(()=>resolve(fallback),ms))]);}

async function loadAppModules(){
  const [game,multiplayer,ui,player,supabase]=await Promise.all([import('./game.js'),import('./multiplayer.js'),import('./ui.js'),import('./player.js'),import('./supabase.js')]);
  api={game,multiplayer,ui,player,supabase};
}

async function restoreSession(){
  try{
    const client=api.supabase.getSupabase();
    const result=await withTimeout(client.auth.getSession(),4000,{data:{session:null}});
    APP.user=result?.data?.session?.user||null;
  }catch(error){console.warn('CODNAME session restore failed:',error);APP.user=null;}
}

async function loadProfile(){
  if(!APP.user)return;
  try{
    APP.profile=await withTimeout(api.player.getPlayerProfile(APP.user.id),5000,null);
    if(!APP.profile)APP.profile=await withTimeout(api.player.createPlayerProfile(APP.user),5000,null);
  }catch(error){console.warn('CODNAME profile load failed:',error);}
  try{api.ui.initUI({user:APP.user,profile:APP.profile});}catch(error){console.warn('CODNAME UI update failed:',error);}
}

function bindAppEvents(){
  if(appEventsBound)return;
  appEventsBound=true;

  document.addEventListener('codname:create-room',async event=>{
    if(!APP.user)return api.ui.showError('ابتدا وارد حساب شوید.');
    try{
      api.ui.showLoading('در حال ساخت اتاق...');
      const result=await withTimeout(api.game.createGame({userId:APP.user.id,...(event.detail||{})}),10000,null);
      if(!result)throw new Error('سرور پاسخ نداد. دوباره تلاش کنید.');
      APP.roomId=result.roomId;APP.roomCode=result.roomCode;await enterLobby();
    }catch(error){console.error(error);api.ui.showError(error?.message||'ساخت اتاق انجام نشد.');api.ui.showScreen('menu');}
  });

  document.addEventListener('codname:join-room',async event=>{
    if(!APP.user)return api.ui.showError('ابتدا وارد حساب شوید.');
    const code=String(event.detail?.code||'').trim().toUpperCase();
    if(!/^[A-Z0-9]{6}$/.test(code))return api.ui.showError('کد اتاق باید ۶ کاراکتر باشد.');
    try{
      api.ui.showLoading('در حال ورود به اتاق...');
      const result=await withTimeout(api.game.joinGame({userId:APP.user.id,code}),10000,null);
      if(!result)throw new Error('سرور پاسخ نداد. دوباره تلاش کنید.');
      APP.roomId=result.roomId;APP.roomCode=result.roomCode;await enterLobby();
    }catch(error){console.error(error);api.ui.showError(error?.message||'ورود به اتاق انجام نشد.');api.ui.showScreen('menu');}
  });

  document.addEventListener('codname:start-game',async()=>{
    if(!APP.user||!APP.roomId)return;
    try{api.ui.showLoading('در حال شروع Match...');await withTimeout(api.game.startGame({roomId:APP.roomId,userId:APP.user.id}),10000,null);await refreshGameState();}
    catch(error){console.error(error);api.ui.showError(error?.message||'شروع بازی انجام نشد.');api.ui.showScreen('lobby');}
  });

  document.addEventListener('codname:select-card',async event=>{
    if(!APP.user||!APP.roomId||!event.detail?.cardId)return;
    try{await withTimeout(api.game.selectCard({roomId:APP.roomId,userId:APP.user.id,cardId:event.detail.cardId}),10000,null);await refreshGameState();}
    catch(error){console.error(error);api.ui.showError(error?.message||'انتخاب کارت انجام نشد.');}
  });

  document.addEventListener('codname:end-turn',async()=>{
    if(!APP.user||!APP.roomId)return;
    try{await withTimeout(api.game.endTurn({roomId:APP.roomId,userId:APP.user.id}),10000,null);await refreshGameState();}
    catch(error){console.error(error);api.ui.showError(error?.message||'پایان نوبت انجام نشد.');}
  });

  document.addEventListener('codname:leave-room',async()=>{await leaveRoom();api.ui.showScreen('menu');});
  document.addEventListener('codname:back-menu',async()=>{await leaveRoom();api.ui.showScreen('menu');});
}

async function enterLobby(){
  api.ui.showLobby({roomId:APP.roomId,roomCode:APP.roomCode,user:APP.user,profile:APP.profile});
  api.ui.showScreen('lobby');
  await setupRealtime();
  await refreshGameState();
}

async function setupRealtime(){
  if(APP.realtimeChannel){try{await api.multiplayer.unsubscribeFromRoom(APP.realtimeChannel);}catch(error){console.warn(error);}APP.realtimeChannel=null;}
  const connection=await withTimeout(api.multiplayer.connectRealtime(),5000,null);
  if(!connection)return;
  APP.realtimeChannel=await withTimeout(api.multiplayer.subscribeToRoom(connection,APP.roomId,()=>refreshGameState().catch(console.error)),5000,null);
}

async function refreshGameState(){
  if(!APP.roomId)return;
  const state=await withTimeout(api.game.getGameState(APP.roomId),7000,null);
  if(!state)return;
  APP.gameState=state;api.ui.updatePlayerList(state.players||[]);
  if(state.status==='waiting'){
    api.ui.showLobby({roomId:APP.roomId,roomCode:APP.roomCode,user:APP.user,profile:APP.profile,players:state.players||[],settings:state.settings||{}});api.ui.showScreen('lobby');
  }else if(state.status==='playing'){
    api.ui.showGame({roomId:APP.roomId,roomCode:APP.roomCode,user:APP.user,profile:APP.profile,game:state});api.ui.updateGameUI(state);api.ui.showScreen('game');
  }else if(state.status==='finished'){
    api.ui.showGame({roomId:APP.roomId,roomCode:APP.roomCode,user:APP.user,profile:APP.profile,game:state});api.ui.updateGameUI(state);api.ui.showScreen('result');
  }
}

async function leaveRoom(){
  if(APP.realtimeChannel&&api?.multiplayer){try{await api.multiplayer.unsubscribeFromRoom(APP.realtimeChannel);}catch(error){console.warn(error);}}
  APP.realtimeChannel=null;APP.roomId=null;APP.roomCode=null;APP.gameState=null;
}

async function boot(){
  // Paint the menu before importing any remote dependency. This is the critical mobile fix.
  instantScreen('menu');
  try{await withTimeout(loadAppModules(),7000,null);}catch(error){console.error('CODNAME module load failed:',error);instantMessage('منوی بازی آماده است؛ اتصال آنلاین در پس‌زمینه در حال آماده‌شدن است.');return;}
  if(!api){instantMessage('اتصال آنلاین فعلاً در دسترس نیست.');return;}
  bindAppEvents();
  await restoreSession();
  try{api.ui.initUI({user:APP.user,profile:null});api.ui.showScreen('menu');}catch(error){console.warn(error);}
  void loadProfile();
  APP.initialized=true;
}

window.CODNAME={version:APP.version,getUser:()=>APP.user,getProfile:()=>APP.profile,getRoom:()=>({id:APP.roomId,code:APP.roomCode}),getGameState:()=>APP.gameState,refresh:refreshGameState,leaveRoom};

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>void boot(),{once:true});else void boot();
