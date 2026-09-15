import "./pre.js";
import "./ios-fix.js";
import "./ui-fixes.js";
import "./install-entry.js";
import "./github-auth-ui.js";
import "./menu-visuals.js";
import "./workspace-v2.js";
import "./mobile-clean.js";
import "./mobile-scroll-final.js";
import "./desktop-scroll-final.js";
import "./team-roles.js";
import "./mobile-game-fix.js";
import "./mobile-game-repair.js";
import "./settings-cleanup.js";
import "./leader-team-controls.js";
import "./lobby-format-guard.js";
import "./halloween-event.js";
import { createGame, joinGame, startGame, selectCard, endTurn, useHalloweenSpirit, getGameState } from "./game.js";
import { connectRealtime, subscribeToRoom, unsubscribeFromRoom } from "./multiplayer.js";
import { initUI, showScreen, showLobby, showGame, showLoading, showError, updateGameUI, updatePlayerList } from "./ui.js";
import { getCurrentUser, createPlayerProfile, getPlayerProfile } from "./player.js";
import { getSupabase, databaseUpdate } from "./supabase.js";

const APP = { version: "2.0.3", user: null, profile: null, roomId: null, roomCode: null, gameState: null, realtimeChannel: null, initialized: false };
const safe = (fn) => { try { return fn(); } catch (error) { console.error(error); return null; } };
const VALID_MODES = new Set(["classic", "expanded", "chaos", "duel"]);

async function boot() {
  showLoading("در حال آماده‌سازی CODNAME...");
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase client is not configured.");
  APP.user = await getCurrentUser();
  if (APP.user) {
    APP.profile = await getPlayerProfile(APP.user.id);
    if (!APP.profile) APP.profile = await createPlayerProfile(APP.user);
  }
  initUI({ user: APP.user, profile: APP.profile });
  bindAppEvents();
  showScreen("menu");
  APP.initialized = true;
}

document.addEventListener("DOMContentLoaded", () => boot().catch((error) => {
  console.error("CODNAME boot failed", error);
  showScreen("menu");
  setTimeout(() => showError("بازی نتوانست راه‌اندازی شود. تنظیمات Supabase را بررسی کنید."), 0);
}), { once: true });

function bindAppEvents() {
  document.addEventListener("codname:create-room", async (e) => {
    if (!APP.user) return showError("ابتدا وارد حساب شوید.");
    try {
      const detail = { ...(e.detail || {}) };
      const preferredMode = localStorage.getItem("codname-mode");
      if (VALID_MODES.has(preferredMode)) detail.mode = preferredMode;
      showLoading("در حال ساخت اتاق...");
      const r = await createGame({ userId: APP.user.id, ...detail });
      APP.roomId = r.roomId; APP.roomCode = r.roomCode;
      await enterLobby();
    } catch (error) { console.error(error); showError(error?.message || "ساخت اتاق انجام نشد."); showScreen("menu"); }
  });

  document.addEventListener("codname:join-room", async (e) => {
    if (!APP.user) return showError("ابتدا وارد حساب شوید.");
    const code = String(e.detail?.code || "").trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) return showError("کد اتاق باید ۶ کاراکتر باشد.");
    try { showLoading("در حال ورود به اتاق..."); const r = await joinGame({ userId: APP.user.id, code }); APP.roomId = r.roomId; APP.roomCode = r.roomCode; await enterLobby(); }
    catch (error) { console.error(error); showError(error?.message || "ورود به اتاق انجام نشد."); showScreen("menu"); }
  });

  document.addEventListener("codname:change-room-mode", async (e) => {
    const mode = String(e.detail?.mode || "");
    if (!VALID_MODES.has(mode)) return showError("مود انتخاب‌شده معتبر نیست.");
    localStorage.setItem("codname-mode", mode);
    if (!APP.user || !APP.roomId) {
      showError(`مود ${mode} برای ساخت اتاق بعدی ذخیره شد.`);
      return;
    }
    try {
      const cur = await getGameState(APP.roomId);
      if (!cur) throw new Error("اتاق پیدا نشد.");
      if (cur.status !== "waiting") throw new Error("مود فقط قبل از شروع بازی قابل تغییر است.");
      const me = cur.players?.find((p) => p.user_id === APP.user.id);
      if (!me?.is_host) throw new Error("فقط لیدر اتاق می‌تواند مود را تغییر دهد.");
      const defaults = {
        classic: { boardSize: 25, targetScore: 7, bonus: false, darkCards: 1 },
        expanded: { boardSize: 35, targetScore: 10, bonus: true, darkCards: 1 },
        chaos: { boardSize: 36, targetScore: 12, bonus: true, darkCards: 2 },
        duel: { boardSize: 16, targetScore: 5, bonus: false, darkCards: 1 }
      }[mode];
      const playerFormat = mode === "duel" ? "1v1" : "2v2";
      const settings = { ...defaults, playerFormat, maxPlayers: playerFormat === "1v1" ? 2 : 8 };
      const rows = await databaseUpdate("rooms", {
        game_mode: mode,
        max_players: settings.maxPlayers,
        settings,
        turn_team: "red"
      }, { id: APP.roomId });
      if (!rows.length) throw new Error("تغییر مود در اتاق ذخیره نشد. دسترسی لیدر را بررسی کن.");
      await refreshGameState();
      showError(`مود ${mode} با موفقیت روی اتاق اعمال شد.`);
    } catch (error) { console.error(error); showError(error?.message || "تغییر مود انجام نشد."); }
  });

  document.addEventListener("codname:change-team", async (e) => {
    if (!APP.user || !APP.roomId) return;
    const team = String(e.detail?.team || "");
    const targetUserId = String(e.detail?.targetUserId || APP.user.id);
    if (team !== "red" && team !== "blue") return showError("تیم انتخاب‌شده معتبر نیست.");
    try {
      const rs = await getGameState(APP.roomId);
      if (!rs || rs.status !== "waiting") return showError("بعد از شروع بازی امکان تغییر تیم وجود ندارد.");
      const me = rs.players?.find((p) => p.user_id === APP.user.id);
      const target = rs.players?.find((p) => p.user_id === targetUserId);
      if (!me || !target) return showError("بازیکن موردنظر پیدا نشد.");
      if (target.is_host && target.user_id !== APP.user.id) return showError("تیم لیدر قابل تغییر نیست.");
      if (!me.is_host && targetUserId !== APP.user.id) return showError("فقط لیدر می‌تواند تیم هم‌تیمی‌ها را تغییر دهد.");
      if (target.team === team) return;
      await databaseUpdate("room_players", { team }, { room_id: APP.roomId, user_id: targetUserId });
      await refreshGameState();
    } catch (error) { console.error(error); showError(error?.message || "تغییر تیم انجام نشد."); }
  });

  document.addEventListener("codname:start-game", async () => {
    if (!APP.user || !APP.roomId) return;
    try { showError("در حال ورود به بازی..."); await startGame({ roomId: APP.roomId, userId: APP.user.id }); await refreshGameState(); }
    catch (error) { console.error(error); showError(error?.message || "شروع بازی انجام نشد."); }
  });

  document.addEventListener("codname:select-card", async (e) => {
    if (!APP.user || !APP.roomId || !e.detail?.cardId) return;
    try { await selectCard({ roomId: APP.roomId, userId: APP.user.id, cardId: e.detail.cardId }); await refreshGameState(); }
    catch (error) { console.error(error); showError(error?.message || "انتخاب کارت انجام نشد."); }
  });

  document.addEventListener("codname:end-turn", async () => {
    if (!APP.user || !APP.roomId) return;
    try { await endTurn({ roomId: APP.roomId, userId: APP.user.id }); await refreshGameState(); }
    catch (error) { console.error(error); showError(error?.message || "پایان نوبت انجام نشد."); }
  });

  document.addEventListener("codname:halloween-spirit", async (e) => {
    if (!APP.user || !APP.roomId || !e.detail?.cardId) return;
    try { await useHalloweenSpirit({ roomId: APP.roomId, userId: APP.user.id, cardId: e.detail.cardId }); await refreshGameState(); }
    catch (error) { console.error(error); showError(error?.message || "فعال‌سازی روح هالووینی انجام نشد."); }
  });

  document.addEventListener("codname:leave-room", async () => { await leaveRoom(); showScreen("menu"); });
  document.addEventListener("codname:back-menu", async () => { await leaveRoom(); showScreen("menu"); });
}

async function enterLobby() {
  showLobby({ roomId: APP.roomId, roomCode: APP.roomCode, user: APP.user, profile: APP.profile });
  showScreen("lobby");
  await setupRealtime();
  await refreshGameState();
}

async function setupRealtime() {
  if (APP.realtimeChannel) await safe(() => unsubscribeFromRoom(APP.realtimeChannel));
  const channel = await connectRealtime();
  APP.realtimeChannel = await subscribeToRoom(channel, APP.roomId, () => refreshGameState().catch(console.error));
}

async function refreshGameState() {
  if (!APP.roomId) return;
  const current = await getGameState(APP.roomId);
  if (!current) return;
  APP.gameState = current;
  updatePlayerList(current.players || []);
  if (current.status === "waiting") {
    showLobby({ roomId: APP.roomId, roomCode: APP.roomCode, user: APP.user, profile: APP.profile, players: current.players || [], settings: current.settings || {}, mode: current.mode });
    showScreen("lobby");
  } else if (current.status === "playing") {
    showGame({ roomId: APP.roomId, roomCode: APP.roomCode, user: APP.user, profile: APP.profile, game: current });
    updateGameUI(current);
    showScreen("game");
  } else if (current.status === "finished") {
    showGame({ roomId: APP.roomId, roomCode: APP.roomCode, user: APP.user, profile: APP.profile, game: current });
    updateGameUI(current);
    showScreen("result");
  }
  document.dispatchEvent(new CustomEvent("codname:game-state", { detail: current }));
}

async function leaveRoom() {
  if (APP.realtimeChannel) { await safe(() => unsubscribeFromRoom(APP.realtimeChannel)); APP.realtimeChannel = null; }
  APP.roomId = null;
  APP.roomCode = null;
  APP.gameState = null;
}

window.CODNAME = {
  version: APP.version,
  getUser: () => APP.user,
  getProfile: () => APP.profile,
  getRoom: () => ({ id: APP.roomId, code: APP.roomCode }),
  getGameState: () => APP.gameState,
  refresh: refreshGameState,
  leaveRoom
};
