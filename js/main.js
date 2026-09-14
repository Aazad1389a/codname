import "./pre.js";
import "./ios-fix.js";
import "./ui-fixes.js";
import "./install-entry.js";
import "./github-auth-ui.js";
import "./menu-visuals.js";
import "./workspace-v2.js";
import "./clue-system.js";
import { createGame, joinGame, startGame, submitClue, selectCard, endTurn, getGameState } from "./game.js";
import { connectRealtime, subscribeToRoom, unsubscribeFromRoom } from "./multiplayer.js";
import { initUI, showScreen, showLobby, showGame, showLoading, showError, updateGameUI, updatePlayerList } from "./ui.js";
import { getCurrentUser, createPlayerProfile, getPlayerProfile } from "./player.js";
import { getSupabase, databaseUpdate } from "./supabase.js";

const APP={version:"1.7.1",user:null,profile:null,roomId:null,roomCode:null,gameState:null,realtimeChannel:null,initialized:false};
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
  document.addEventListener("codname:change-room-mode",async(event)=>{if(!APP.user||!APP.roomId)return;const mode=String(event.detail?.mode||"");const allowed={classic:true,expanded:true,chaos:true,duel:true};if(!allowed[mode])return showError("مود انتخاب‌شده معتبر نیست.");try{const defaults={classic:{boardSize:25,targetScore:7,maxPlayers:8,bonus:false,darkCards:1},expanded:{boardSize:35,targetScore:10,maxPlayers:8,bonus:true,darkCards:1},chaos:{boardSize:36,targetScore:12,maxPlayers:8,bonus:true,darkCards:2},duel:{boardSize:16,targetScore:5,maxPlayers:4,bonus:false,darkCards:1}};const settings=defaults[mode];await databaseUpdate("rooms",{game_mode:mode,max_players:settings.maxPlayers,settings},{id:APP.roomId,host_id:APP.user.id});await refreshGameState();}catch(error){console.error(error);showError(error?.message||"تغییر مود انجام نشد.");}});
  document.addEventListener("codname:change-team",async(event)=>{if(!APP.user||!APP.roomId)return;const team=String(event.detail?.team||"");if(team!=="red"&&team!=="blue")return showError("تیم انتخاب‌شده معتبر نیست.");try{const roomState=await getGameState(APP.roomId);if(!roomState||roomState.status!=="waiting")return showError("بعد از شروع بازی امکان تغییر تیم وجود ندارد.");const me=roomState.players?.find(player=>player.user_id===APP.user.id);if(!me)return showError("بازیکن فعلی در این اتاق پیدا نشد.");if(me.team===team)return;await databaseUpdate("room_players",{team},{room_id:APP.roomId,user_id:APP.user.id});await refreshGameState();}catch(error){console.error(error);showError(error?.message||"تغییر تیم انجام نشد.");}});
  document.addEventListener("codname:submit-clue",async(event)=>{if(!APP.user||!APP.roomId)return;try{await submitClue({roomId:APP.roomId,userId:APP.user.id,text:event.detail?.text,number:event.detail?.number});await refreshGameState();}catch(error){console.error(error);showError(error?.message||"ثبت سرنخ انجام نشد.");}});
  document.addEventListener("codname:start-game",async()=>{if(!APP.user||!APP.roomId)return;try{showLoading("در حال شروع Match...");await startGame({roomId:APP.roomId,userId:APP.user.id});await refreshGameState();}catch(error){console.error(error);showError(error?.message||"شروع بازی انجام نشد.");}});
  document.addEventListener("codname:select-card",async(event)=>{if(!APP.user||!APP.roomId||!event.detail?.cardId)return;try{await selectCard({roomId:APP.roomId,userId:APP.user.id,cardId:event.detail.cardId});await refreshGameState();}catch(error){console.error(error);showError(error?.message||"انتخاب کارت انجام نشد.");}});
  document.addEventListener("codname:end-turn",async()=>{if(!APP.user||!APP.roomId)return;try{await endTurn({roomId:APP.roomId,userId:APP.user.id});await refreshGameState();}catch(error){console.error(error);showError(error?.message||"پایان نوبت انجام نشد.");}});
  document.addEventListener("codname:leave-room",async()=>{await leaveRoom();showScreen("menu");});
  document.addEventListener("codname:back-menu",async()=>{await leaveRoom();showScreen("menu");});
}

async function enterLobby(){showLobby({roomId:APP.roomId,roomCode:APP.roomCode,user:APP.user,profile:APP.profile});showScreen("lobby");await setupRealtime();await refreshGameState();}
async function setupRealtime(){if(APP.realtimeChannel)await safe(()=>unsubscribeFromRoom(APP.realtimeChannel));const connection=await connectRealtime();APP.realtimeChannel=await subscribeToRoom(connection,APP.roomId,()=>refreshGameState().catch(console.error));}
async function refreshGameState(){if(!APP.roomId)return;const state=await getGameState(APP.roomId);if(!state)return;APP.gameState=state;updatePlayerList(state.players||[]);if(state.status==="waiting"){showLobby({roomId:APP.roomId,roomCode:APP.roomCode,user:APP.user,profile:APP.profile,players:state.players||[],settings:state.settings||{}});showScreen("lobby");}else if(state.status==="playing"){showGame({roomId:APP.roomId,roomCode:APP.roomCode,user:APP.user,profile:APP.profile,game:state});updateGameUI(state);showScreen("game");}else if(state.status==="finished"){showGame({roomId:APP.roomId,roomCode:APP.roomCode,user:APP.user,profile:APP.profile,game:state});updateGameUI(state);showScreen("result");}document.dispatchEvent(new CustomEvent("codname:game-state",{detail:state}));}
async function leaveRoom(){if(APP.realtimeChannel){await safe(()=>unsubscribeFromRoom(APP.realtimeChannel));APP.realtimeChannel=null;}APP.roomId=null;APP.roomCode=null;APP.gameState=null;}

window.CODNAME={version:APP.version,getUser:()=>APP.user,getProfile:()=>APP.profile,getRoom:()=>({id:APP.roomId,code:APP.roomCode}),getGameState:()=>APP.gameState,refresh:refreshGameState,leaveRoom};
