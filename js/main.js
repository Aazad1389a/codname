import "./pre.js";
import "./ios-fix.js";
import "./ui-fixes.js";
import "./install-entry.js";
import "./github-auth-ui.js";
import "./menu-visuals.js";
import "./menu-lightweight.js";
import "./workspace-v2.js";
import "./mobile-clean.js";
import "./mobile-scroll-final.js";
import "./desktop-scroll-final.js";
import "./team-roles.js";
import "./mobile-game-fix.js";
import "./mobile-game-repair.js";
import "./lobby-mode-control.js";
import "./visual-motion.js";
import "./gold-card-fix.js";
import "./bugfixes-v3.js";
import "./settings-cleanup.js";
import "./leader-team-controls.js";
import "./lobby-format-guard.js";
import "./halloween-event.js";
import { createGame, joinGame, startGame, selectCard, endTurn, useHalloweenSpirit, getGameState } from "./game.js";
import { connectRealtime, subscribeToRoom, unsubscribeFromRoom } from "./multiplayer.js";
import { initUI, showScreen, showLobby, showGame, showLoading, showError, updateGameUI, updatePlayerList } from "./ui.js";
import { getCurrentUser, createPlayerProfile, getPlayerProfile } from "./player.js";
import { getSupabase, databaseUpdate } from "./supabase.js";

const APP = { version: "2.0.7", user: null, profile: null, roomId: null, roomCode: null, gameState: null, realtimeChannel: null, initialized: false };
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
      const detail = { ...(e.detail || {}), mode: "classic", playerFormat: "2v2", maxPlayers: 8 };
      localStorage.setItem("codname-mode", "classic");
      localStorage.setItem("codname-format", "2v2");
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
    if (!APP.user || !APP.roomId) return showError("ابتدا وارد یک اتاق شوید؛ مود فقط داخل اتاق تغییر می‌کند.");
    try {
      const cur = await getGameState(APP.roomId);
      if (!cur) throw new Error("اتاق پیدا نشد.");
      if (cur.status !== "waiting") throw new Error("مود فقط قبل از شروع بازی قابل تغییر است.");
      const me = cur.players?.find((p) => p.user_id === APP.user.id);
      if (!me?.is_host) throw new Error("فقط لیدر اتاق می‌تواند مود را تغییر دهد.");
      const previousFormat = cur.settings?.playerFormat || cur.playerFormat || (mode === "duel" ? "1v1" : (localStorage.getItem("codname-format") || "2v2"));
      const format = mode === "duel" ? "1v1" : (previousFormat === "1v1" ? "1v1" : "2v2");
      const defaults = { classic: { boardSize: 25, targetScore: 7, bonus: false, darkCards: 1 }, expanded: { boardSize: 35, targetScore: 10, bonus: true, darkCards: 1 }, chaos: { boardSize: 36, targetScore: 12, bonus: true, darkCards: 2 }, duel: { boardSize: 16, targetScore: 5, bonus: false, darkCards: 1 } }[mode];
      const settings = { ...defaults, playerFormat: format, maxPlayers: format === "1v1" ? 2 : 8, mode };
      const rows = await databaseUpdate("rooms", { game_mode: mode, max_players: settings.maxPlayers, settings, game_state: { ...(cur || {}), mode, settings } }, { id: APP.roomId, status: "waiting" });
      if (!rows.length) throw new Error("تغییر مود در اتاق ذخیره نشد. دوباره تلاش کن.");
      localStorage.setItem("codname-mode", mode);
      localStorage.setItem("codname-format", format);
      await refreshGameState();
      showError(`مود ${mode} با حالت ${format === "1v1" ? "۱ به ۱" : "۲ به ۲"} اعمال شد.`);
    } catch (error) { console.error(error); showError(error?.message || "تغییر مود انجام نشد."); }
  });

  document.addEventListener("codname:change-room-format", async (e) => {
    const requested = String(e.detail?.format || "");
    if (!APP.user || !APP.roomId) return showError("ابتدا وارد یک اتاق شوید.");
    if (!(["1v1", "2v2"].includes(requested))) return showError("فرمت بازی معتبر نیست.");
    try {
      const cur = await getGameState(APP.roomId);
      if (!cur || cur.status !== "waiting") throw new Error("فرمت فقط قبل از شروع بازی قابل تغییر است.");
      const me = cur.players?.find((p) => p.user_id === APP.user.id);
      if (!me?.is_host) throw new Error("فقط لیدر اتاق می‌تواند فرمت بازی را تغییر دهد.");
      if (cur.mode === "duel" && requested !== "1v1") throw new Error("مود دوئل فقط 1 به 1 است.");
      const newMax = requested === "1v1" ? 2 : 8;
      if (requested === "1v1" && (cur.players || []).length > 2) throw new Error("برای 1 به 1 ابتدا بازیکن اضافی باید از اتاق خارج شود.");
      const mode = VALID_MODES.has(cur.mode) ? cur.mode : "classic";
      const defaults = { classic: { boardSize: 25, targetScore: 7, bonus: false, darkCards: 1 }, expanded: { boardSize: 35, targetScore: 10, bonus: true, darkCards: 1 }, chaos: { boardSize: 36, targetScore: 12, bonus: true, darkCards: 2 }, duel: { boardSize: 16, targetScore: 5, bonus: false, darkCards: 1 } }[mode];
      const settings = { ...defaults, playerFormat: requested, maxPlayers: newMax, mode };
      const rows = await databaseUpdate("rooms", { max_players: newMax, settings, game_state: { ...(cur || {}), settings, playerFormat: requested } }, { id: APP.roomId, status: "waiting" });
      if (!rows.length) throw new Error("تغییر فرمت بازی ذخیره نشد. دوباره تلاش کن.");
      localStorage.setItem("codname-format", requested);
      await refreshGameState();
      showError(`حالت بازی روی ${requested === "1v1" ? "۱ به ۱" : "۲ به ۲"} قرار گرفت.`);
    } catch (error) { console.error(error); showError(error?.message || "تغییر فرمت انجام نشد."); }
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
      const rsMode = rs.mode || rs.settings?.mode || "classic";
      const rsFormat = rs.settings?.playerFormat || rs.playerFormat || "2v2";
      if (rsFormat === "1v1" && rs.players.filter((p) => p.team === team).length >= 1) return showError("در 1 به 1 هر تیم فقط یک بازیکن دارد.");
      await databaseUpdate("room_players", { team }, { room_id: APP.roomId, user_id: targetUserId });
      await refreshGameState();
    } catch (error) { console.error(error); showError(error?.message || "تغییر تیم انجام نشد."); }
  });

  document.addEventListener("codname:start-game", async () => {
    if (!APP.user || !APP.roomId) return;
    try { showLoading("در حال ساخت مسابقه..."); await startGame({ roomId: APP.roomId, userId: APP.user.id }); await refreshGameState(); }
    catch (error) { console.error(error); showError(error?.message || "شروع بازی انجام نشد."); await refreshGameState().catch(() => {}); }
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
    if (!APP.user || !APP.roomId) return;
    try { await useHalloweenSpirit({ roomId: APP.roomId, userId: APP.user.id, cardId: e.detail?.cardId || null }); await refreshGameState(); }
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

window.CODNAME = { version: APP.version, getUser: () => APP.user, getProfile: () => APP.profile, getRoom: () => ({ id: APP.roomId, code: APP.roomCode }), getGameState: () => APP.gameState, refresh: refreshGameState, leaveRoom };
