import "./pre.js";
import "./ui-fixes.js";
import "./install-entry.js";
import "./github-auth-ui.js";
import "./menu-visuals.js";
import { createGame, joinGame, startGame, selectCard, endTurn, getGameState } from "./game.js";
import { connectRealtime, subscribeToRoom, unsubscribeFromRoom } from "./multiplayer.js";
import { initUI, showScreen, showLobby, showGame, showLoading, showError, updateGameUI, updatePlayerList } from "./ui.js";
import { getCurrentUser, createPlayerProfile, getPlayerProfile } from "./player.js";
import { getSupabase } from "./supabase.js";

const APP={version:"1.5.0",user:null,profile:null,roomId:null,roomCode:null,gameState:null,realtimeChannel:null,initialized:false};
const safe=(fn)=>{try{return fn()}catch(error){console.error(error);return null}};

async function boot(){
  showLoading("در حال آماده‌سازی CODNAME...");
  const supabase=getSupabase();
  if(!supabase)throw new Error("Supabase client is not configured.");
  APP.user=await getCurrentUser();
  if(APP.user){APP.profile=await getPlayerProfile(APP.user.id);if(!APP.profile)APP.profile=await createPlayerProfile(APP.user);}
  initUI({user:APP.user,profile:APP.profile});
  bindAppEvents();
  showScreen("menu");
  APP.initialized=true;
}

document.addEventListener("DOMContentLoaded",()=>boot().catch(error=>{console.error("CODNAME boot failed",error);showScreen("menu");setTimeout(()=>showError("بازی نتوانست راه‌اندازی شود. تنظیمات Supabase را بررسی کنید."),0)}),{once:true});

function bindAppEvents(){
  document.addEventListener("codname:create-room",async(event)=>{if(!APP.user)return showError("ابتدا وارد حساب شوید.");try{showLoading("در حال ساخت اتاق...");const result=await createGame({userId:APP.user.id,...(event.detail||{})});APP.roomId=result.roomId;APP.roomCode=result.roomCode;await enterLobby();}catch(error){console.error(error);showError(error?.message||"ساخت اتاق انجام نشد.");showScreen("menu");}});
  document.addEventListener("codname:join-room",async(event)=>{if(!APP.user)return showError("ابتدا وارد حساب شوید.");const code=String(event.detail?.code||"").trim().toUpperCase();if(!/^[A-Z0-9]{6}$/.test(code))return showError("کد اتاق باید ۶ کاراکتر باشد.");try{showLoading("در حال ورود به اتاق...");const result=await joinGame({userId:APP.user.id,code});APP.roomId=result.roomId;APP.roomCode=result.roomCode;await enterLobby();}catch(error){console.error(error);showError(error?.message||"ورود به اتاق انجام نشد.");showScreen("menu");}});
  document.addEventListener("codname:start-game",async()=>{if(!APP.user||!APP.roomId)return;try{showLoading("در حال شروع Match...");await startGame({roomId:APP.roomId,userId:APP.user.id});await refreshGameState();}catch(error){console.error(error);showError(error?.message||"شروع بازی انجام نشد.");}});
  document.addEventListener("codname:select-card",async(event)=>{if(!APP.user||!APP.roomId||!event.detail?.cardId)return;try{await selectCard({roomId:APP.roomId,userId:APP.user.id,cardId:event.detail.cardId});await refreshGameState();}catch(error){console.error(error);showError(error?.message||"انتخاب کارت انجام نشد.");}});
  document.addEventListener("codname:end-turn",async()=>{if(!APP.user||!APP.roomId)return;try{await endTurn({roomId:APP.roomId,userId:APP.user.id});await refreshGameState();}catch(error){console.error(error);showError(error?.message||"پایان نوبت انجام نشد.");}});
  document.addEventListener("codname:leave-room",async()=>{await leaveRoom();showScreen("menu");});
  document.addEventListener("codname:back-menu",async()=>{await leaveRoom();showScreen("menu");});
}

async function enterLobby(){showLobby({roomId:APP.roomId,roomCode:APP.roomCode,user:APP.user,profile:APP.profile});showScreen("lobby");await setupRealtime();await refreshGameState();}
async function setupRealtime(){if(APP.realtimeChannel)await safe(()=>unsubscribeFromRoom(APP.realtimeChannel));const connection=await connectRealtime();APP.realtimeChannel=await subscribeToRoom(connection,APP.roomId,()=>refreshGameState().catch(console.error));}
async function refreshGameState(){if(!APP.roomId)return;const state=await getGameState(APP.roomId);if(!state)return;APP.gameState=state;updatePlayerList(state.players||[]);if(state.status==="waiting"){showLobby({roomId:APP.roomId,roomCode:APP.roomCode,user:APP.user,profile:APP.profile,players:state.players||[],settings:state.settings||{}});showScreen("lobby");}else if(state.status==="playing"){showGame({roomId:APP.roomId,roomCode:APP.roomCode,user:APP.user,profile:APP.profile,game:state});updateGameUI(state);showScreen("game");}else if(state.status==="finished"){showGame({roomId:APP.roomId,roomCode:APP.roomCode,user:APP.user,profile:APP.profile,game:state});updateGameUI(state);showScreen("result");}}
async function leaveRoom(){if(APP.realtimeChannel){await safe(()=>unsubscribeFromRoom(APP.realtimeChannel));APP.realtimeChannel=null;}APP.roomId=null;APP.roomCode=null;APP.gameState=null;}

// Authentication is initialized during boot. Deliberately do not navigate or refresh on auth events.
// OAuth callbacks already arrive as a fresh document request, while email/password auth can update the UI without a page loop.
window.CODNAME={version:APP.version,getUser:()=>APP.user,getProfile:()=>APP.profile,getRoom:()=>({id:APP.roomId,code:APP.roomCode}),getGameState:()=>APP.gameState,refresh:refreshGameState,leaveRoom};
