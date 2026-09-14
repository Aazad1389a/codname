import "./pre.js";
import "./ui-fixes.js";
import "./install-entry.js";
import "./github-auth-ui.js";
import "./menu-visuals.js";
import { createGame, joinGame, startGame, selectCard, endTurn, getGameState } from "./game.js";
import { connectRealtime, subscribeToRoom, unsubscribeFromRoom } from "./multiplayer.js";
import { initUI, showScreen, showLobby, showGame, showLoading, showError, updateGameUI, updatePlayerList } from "./ui.js";
import { createPlayerProfile, getPlayerProfile } from "./player.js";
import { getSupabase } from "./supabase.js";

const APP={version:"1.6.0",user:null,profile:null,roomId:null,roomCode:null,gameState:null,realtimeChannel:null,initialized:false};
let appEventsBound=false;

function withTimeout(promise,ms,fallback=null){
  return Promise.race([promise,new Promise(resolve=>window.setTimeout(()=>resolve(fallback),ms))]);
}

async function boot(){
  const supabase=getSupabase();
  if(!supabase) throw new Error("Supabase client is not configured.");

  // Mobile-safe startup: restore the persisted session without waiting on a user-info network call.
  try{
    const result=await withTimeout(supabase.auth.getSession(),4000,{data:{session:null}});
    APP.user=result?.data?.session?.user||null;
  }catch(error){
    console.warn("CODNAME session restore failed:",error);
    APP.user=null;
  }

  // Never block the first screen on profile/realtime/database work.
  initUI({user:APP.user,profile:null});
  bindAppEvents();
  showScreen("menu");
  APP.initialized=true;

  if(APP.user) void loadProfileInBackground(APP.user);
}

async function loadProfileInBackground(user){
  try{
    APP.profile=await withTimeout(getPlayerProfile(user.id),5000,null);
    if(!APP.profile) APP.profile=await withTimeout(createPlayerProfile(user),5000,null);
  }catch(error){
    console.warn("CODNAME profile load failed:",error);
  }
  try{initUI({user:APP.user,profile:APP.profile});}catch(error){console.warn("CODNAME UI refresh failed:",error);}
}

function bindAppEvents(){
  if(appEventsBound)return;
  appEventsBound=true;

  document.addEventListener("codname:create-room",async event=>{
    if(!APP.user)return showError("ابتدا وارد حساب شوید.");
    try{
      showLoading("در حال ساخت اتاق...");
      const result=await withTimeout(createGame({userId:APP.user.id,...(event.detail||{})}),10000,null);
      if(!result)throw new Error("سرور پاسخ نداد. دوباره تلاش کنید.");
      APP.roomId=result.roomId;APP.roomCode=result.roomCode;
      await enterLobby();
    }catch(error){console.error(error);showError(error?.message||"ساخت اتاق انجام نشد.");showScreen("menu");}
  });

  document.addEventListener("codname:join-room",async event=>{
    if(!APP.user)return showError("ابتدا وارد حساب شوید.");
    const code=String(event.detail?.code||"").trim().toUpperCase();
    if(!/^[A-Z0-9]{6}$/.test(code))return showError("کد اتاق باید ۶ کاراکتر باشد.");
    try{
      showLoading("در حال ورود به اتاق...");
      const result=await withTimeout(joinGame({userId:APP.user.id,code}),10000,null);
      if(!result)throw new Error("سرور پاسخ نداد. دوباره تلاش کنید.");
      APP.roomId=result.roomId;APP.roomCode=result.roomCode;
      await enterLobby();
    }catch(error){console.error(error);showError(error?.message||"ورود به اتاق انجام نشد.");showScreen("menu");}
  });

  document.addEventListener("codname:start-game",async()=>{
    if(!APP.user||!APP.roomId)return;
    try{showLoading("در حال شروع Match...");await withTimeout(startGame({roomId:APP.roomId,userId:APP.user.id}),10000,null);await refreshGameState();}
    catch(error){console.error(error);showError(error?.message||"شروع بازی انجام نشد.");showScreen("lobby");}
  });

  document.addEventListener("codname:select-card",async event=>{
    if(!APP.user||!APP.roomId||!event.detail?.cardId)return;
    try{await withTimeout(selectCard({roomId:APP.roomId,userId:APP.user.id,cardId:event.detail.cardId}),10000,null);await refreshGameState();}
    catch(error){console.error(error);showError(error?.message||"انتخاب کارت انجام نشد.");}
  });

  document.addEventListener("codname:end-turn",async()=>{
    if(!APP.user||!APP.roomId)return;
    try{await withTimeout(endTurn({roomId:APP.roomId,userId:APP.user.id}),10000,null);await refreshGameState();}
    catch(error){console.error(error);showError(error?.message||"پایان نوبت انجام نشد.");}
  });

  document.addEventListener("codname:leave-room",async()=>{await leaveRoom();showScreen("menu");});
  document.addEventListener("codname:back-menu",async()=>{await leaveRoom();showScreen("menu");});
}

async function enterLobby(){
  showLobby({roomId:APP.roomId,roomCode:APP.roomCode,user:APP.user,profile:APP.profile});
  showScreen("lobby");
  await setupRealtime();
  await refreshGameState();
}

async function setupRealtime(){
  if(APP.realtimeChannel){await safeAsync(()=>unsubscribeFromRoom(APP.realtimeChannel));APP.realtimeChannel=null;}
  const connection=await withTimeout(connectRealtime(),5000,null);
  if(!connection){console.warn("CODNAME realtime connection timed out");return;}
  APP.realtimeChannel=await withTimeout(subscribeToRoom(connection,APP.roomId,()=>refreshGameState().catch(console.error)),5000,null);
}

async function refreshGameState(){
  if(!APP.roomId)return;
  const state=await withTimeout(getGameState(APP.roomId),7000,null);
  if(!state){console.warn("CODNAME game-state request timed out");return;}
  APP.gameState=state;updatePlayerList(state.players||[]);
  if(state.status==="waiting"){
    showLobby({roomId:APP.roomId,roomCode:APP.roomCode,user:APP.user,profile:APP.profile,players:state.players||[],settings:state.settings||{}});showScreen("lobby");
  }else if(state.status==="playing"){
    showGame({roomId:APP.roomId,roomCode:APP.roomCode,user:APP.user,profile:APP.profile,game:state});updateGameUI(state);showScreen("game");
  }else if(state.status==="finished"){
    showGame({roomId:APP.roomId,roomCode:APP.roomCode,user:APP.user,profile:APP.profile,game:state});updateGameUI(state);showScreen("result");
  }
}

async function leaveRoom(){
  if(APP.realtimeChannel){await safeAsync(()=>unsubscribeFromRoom(APP.realtimeChannel));APP.realtimeChannel=null;}
  APP.roomId=null;APP.roomCode=null;APP.gameState=null;
}

async function safeAsync(fn){try{return await fn();}catch(error){console.warn("CODNAME cleanup warning:",error);return null;}}

window.CODNAME={version:APP.version,getUser:()=>APP.user,getProfile:()=>APP.profile,getRoom:()=>({id:APP.roomId,code:APP.roomCode}),getGameState:()=>APP.gameState,refresh:refreshGameState,leaveRoom};

document.addEventListener("DOMContentLoaded",()=>{
  boot().catch(error=>{console.error("CODNAME boot failed:",error);showScreen("menu");showError("بازی در حالت آفلاین شروع شد؛ اتصال سرور را بررسی کنید.");});
},{once:true});
