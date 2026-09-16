import { getSupabase, databaseSelect, databaseInsert, databaseUpdate } from "./supabase.js";
import { buildBoard, CARD_TYPES } from "./cards.js";
import { isHalloweenEventActive, HALLOWEEN_EVENT_END } from "./halloween-event.js";

const DEFAULTS = Object.freeze({
  classic: { boardSize: 25, targetScore: 7, maxPlayers: 8, bonus: false, darkCards: 1 },
  expanded: { boardSize: 35, targetScore: 10, maxPlayers: 8, bonus: true, darkCards: 1 },
  chaos: { boardSize: 36, targetScore: 12, maxPlayers: 8, bonus: true, darkCards: 2 },
  duel: { boardSize: 16, targetScore: 5, maxPlayers: 2, bonus: false, darkCards: 1 }
});

const MODES = new Set(Object.keys(DEFAULTS));
const FORMATS = new Set(["1v1", "2v2"]);

function settingsFor(mode, overrides = {}) { return { ...(DEFAULTS[mode] || DEFAULTS.classic), ...overrides, mode }; }
function normalizeMode(mode) { return MODES.has(mode) ? mode : "classic"; }
function normalizeFormat(format, mode) { return mode === "duel" ? "1v1" : (FORMATS.has(format) ? format : "2v2"); }
function createRoomCode() { const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let code = ""; for (let i = 0; i < 6; i += 1) code += chars[Math.floor(Math.random() * chars.length)]; return code; }
async function uniqueRoomCode() { for (let i = 0; i < 12; i += 1) { const code = createRoomCode(); const found = await databaseSelect("rooms", { eq: { code }, limit: 1 }); if (!found.length) return code; } throw new Error("Could not create a unique room code."); }

function normalizeState(room, players = []) {
  const state = room.game_state && typeof room.game_state === "object" ? room.game_state : {};
  return { ...state, roomId: room.id, status: room.status, mode: normalizeMode(room.game_mode || state.mode), settings: room.settings || state.settings || {}, currentTurn: room.current_turn ?? state.currentTurn ?? null, turnTeam: room.turn_team ?? state.turnTeam ?? "red", winnerTeam: room.winner_team ?? state.winnerTeam ?? null, players };
}
function playerFormat(settings = {}, mode = "classic") { return normalizeFormat(settings.playerFormat, mode); }
function requiredPlayers(settings = {}, mode = "classic") { return playerFormat(settings, mode) === "1v1" ? 2 : 4; }

export async function createGame({ userId, mode = "classic", maxPlayers = 8, boardSize, playerFormat: format = "2v2" } = {}) {
  if (!userId) throw new Error("Authentication required.");
  const normalizedMode = normalizeMode(mode);
  const normalizedFormat = normalizeFormat(format, normalizedMode);
  const chosen = settingsFor(normalizedMode, { maxPlayers: normalizedFormat === "1v1" ? 2 : Math.max(4, Number(maxPlayers) || 8), ...(boardSize ? { boardSize } : {}), playerFormat: normalizedFormat });
  const roomCode = await uniqueRoomCode();
  const roomState = { mode: normalizedMode, settings: chosen, board: [], turnNumber: 1, scores: { red: 0, blue: 0 }, startedAt: null, phase: "lobby", currentTurn: null, turnTeam: "red", halloweenPowerUsed: {}, bonusExtraDraws: {} };
  const rooms = await databaseInsert("rooms", { code: roomCode, host_id: userId, status: "waiting", max_players: chosen.maxPlayers, turn_team: "red", game_state: roomState, game_mode: normalizedMode, settings: chosen });
  const room = rooms[0];
  if (!room?.id) throw new Error("Room creation failed.");
  const profile = await databaseSelect("profiles", { eq: { id: userId }, limit: 1 });
  await databaseInsert("room_players", { room_id: room.id, user_id: userId, display_name: profile[0]?.username || "Player", team: "red", is_host: true });
  return { roomId: room.id, roomCode, settings: chosen };
}

export async function joinGame({ code, userId } = {}) {
  if (!code || !userId) throw new Error("Room code and user are required.");
  const rooms = await databaseSelect("rooms", { eq: { code: code.trim().toUpperCase() }, limit: 1 });
  const room = rooms[0];
  if (!room) throw new Error("Room not found.");
  if (room.status !== "waiting") throw new Error("This room has already started.");
  const maxPlayers = Number(room.max_players || 8);
  const existing = await databaseSelect("room_players", { eq: { room_id: room.id, user_id: userId }, limit: 1 });
  if (!existing.length) {
    const players = await loadPlayers(room.id);
    if (players.length >= maxPlayers) throw new Error("Room is full.");
    const profile = await databaseSelect("profiles", { eq: { id: userId }, limit: 1 });
    const red = players.filter((p) => p.team === "red").length;
    const blue = players.filter((p) => p.team === "blue").length;
    await databaseInsert("room_players", { room_id: room.id, user_id: userId, display_name: profile[0]?.username || "Player", team: red <= blue ? "red" : "blue", is_host: false });
  }
  return { roomId: room.id, roomCode: room.code };
}

async function loadPlayers(roomId) { return databaseSelect("room_players", { eq: { room_id: roomId }, order: { column: "joined_at", ascending: true } }); }

export async function getGameState(roomId) {
  const rooms = await databaseSelect("rooms", { eq: { id: roomId }, limit: 1 });
  if (!rooms[0]) return null;
  const players = await loadPlayers(roomId);
  const state = normalizeState(rooms[0], players);
  if (state.matchId) state.cards = await databaseSelect("match_cards", { eq: { match_id: state.matchId }, order: { column: "position", ascending: true } });
  return state;
}
function teamForUser(players, userId) { return players.find((p) => p.user_id === userId)?.team || null; }
function nextPlayer(players, currentUserId) { if (!players.length) return null; const i = players.findIndex((p) => p.user_id === currentUserId); return players[(i < 0 ? 0 : i + 1) % players.length]?.user_id || null; }
function teamCardsRemaining(board, revealed, team) { const set = new Set((revealed || []).map(Number)); return (board || []).filter((card) => !set.has(Number(card.position)) && (card.type === team || (card.type === CARD_TYPES.BONUS && card.bonusTeam === team))).length; }
function checkWinner(state, scores, revealed) { const target = Number(state.settings?.targetScore || 7); if (scores.red >= target) return "red"; if (scores.blue >= target) return "blue"; if (teamCardsRemaining(state.board, revealed, "red") === 0) return "red"; if (teamCardsRemaining(state.board, revealed, "blue") === 0) return "blue"; return null; }

async function finishMatch(state, winnerTeam, userId, nextScores, nextRevealed, powerState) {
  const finishedState = { ...state, scores: nextScores, revealed: nextRevealed, phase: "finished", currentTurn: userId, turnTeam: teamForUser(state.players || [], userId) || state.turnTeam, winnerTeam, halloweenPowerUsed: powerState || state.halloweenPowerUsed || {} };
  await databaseUpdate("rooms", { status: "finished", winner_team: winnerTeam, current_turn: userId, game_state: finishedState }, { id: state.roomId });
  await databaseUpdate("matches", { winner_team: winnerTeam, red_score: nextScores.red, blue_score: nextScores.blue, finished_at: new Date().toISOString() }, { id: state.matchId });
  try { const supabase = getSupabase(); const { data, error } = await supabase.rpc("award_match_rewards", { p_match_id: state.matchId, p_winner_team: winnerTeam }); if (error) throw error; console.log("CODNAME rewards applied", data); } catch (error) { console.error("CODNAME reward update failed", error); }
}

export async function startGame({ roomId, userId } = {}) {
  const rooms = await databaseSelect("rooms", { eq: { id: roomId }, limit: 1 });
  const room = rooms[0];
  if (!room || room.host_id !== userId) throw new Error("Only the room host can start the match.");
  if (room.status !== "waiting") throw new Error("Match is not waiting.");
  const players = await loadPlayers(roomId);
  const mode = normalizeMode(room.game_mode || room.game_state?.mode);
  const format = playerFormat(room.settings || room.game_state?.settings || {}, mode);
  const minimum = requiredPlayers({ ...(room.settings || {}), playerFormat: format }, mode);
  if (players.length < minimum) throw new Error(format === "1v1" ? "برای شروع 1 به 1 باید ۲ بازیکن وارد اتاق باشند." : "برای شروع 2 به 2 باید حداقل ۴ بازیکن وارد اتاق باشند.");
  const redCount = players.filter((p) => p.team === "red").length;
  const blueCount = players.filter((p) => p.team === "blue").length;
  if (!redCount || !blueCount) throw new Error("هر دو تیم باید حداقل یک بازیکن داشته باشند.");
  if (format === "2v2" && (redCount < 2 || blueCount < 2)) throw new Error("در حالت 2 به 2 هر تیم باید حداقل ۲ بازیکن داشته باشد.");
  if (format === "1v1" && players.length > 2) throw new Error("در حالت 1 به 1 فقط ۲ بازیکن مجاز هستند.");
  if (mode === "duel" && format !== "1v1") throw new Error("مود دوئل فقط 1 به 1 است.");

  const settings = settingsFor(mode, { ...(room.settings || {}), playerFormat: format, maxPlayers: format === "1v1" ? 2 : 8 });
  const halloween = isHalloweenEventActive();
  const board = buildBoard(settings.boardSize, mode, "red", halloween ? "halloween" : "normal");
  if (!Array.isArray(board) || board.length !== Number(settings.boardSize)) throw new Error("ساخت صفحه بازی انجام نشد.");

  const matches = await databaseInsert("matches", { room_id: roomId, game_mode: mode, board_size: settings.boardSize, target_score: settings.targetScore, round_number: 1, started_at: new Date().toISOString() });
  const match = matches[0];
  if (!match?.id) throw new Error("ساخت مسابقه انجام نشد.");

  try {
    // card_id intentionally stays NULL: buildBoard creates client-side UUIDs, but card_id has an FK to word_cards.
    await databaseInsert("match_players", players.map((p) => ({ match_id: match.id, user_id: p.user_id, team: p.team, score: 0 })));
    await databaseInsert("match_cards", board.map((card, position) => ({ match_id: match.id, position, card_id: null, card_type: card.type, revealed: false, revealed_by: null, reveal_value: 0 })));
  } catch (error) {
    console.error("CODNAME: match setup failed", error);
    console.error("CODNAME: failed match id", match.id);
    throw new Error(`ساخت کارت‌های مسابقه انجام نشد: ${error?.message || "خطای دیتابیس"}`);
  }

  const firstPlayer = players.find((p) => p.team === "red")?.user_id || players[0]?.user_id;
  const firstTeam = teamForUser(players, firstPlayer) || "red";
  const nextState = { ...settings, board, matchId: match.id, mode, settings, turnNumber: 1, scores: { red: 0, blue: 0 }, startedAt: new Date().toISOString(), revealed: [], phase: "turn", currentTurn: firstPlayer, turnTeam: firstTeam, playerFormat: format, halloweenEvent: halloween, halloweenPowerUsed: {}, halloweenEventEndsAt: halloween ? HALLOWEEN_EVENT_END : null, bonusExtraDraws: {} };
  const updatedRooms = await databaseUpdate("rooms", { status: "playing", current_turn: firstPlayer, turn_team: firstTeam, game_state: nextState, winner_team: null }, { id: roomId, status: "waiting" });
  if (!updatedRooms.length) throw new Error("این اتاق هم‌زمان توسط درخواست دیگری شروع شد. بازی را تازه کن.");
  await databaseInsert("match_events", { match_id: match.id, actor_id: userId, event_type: "match_started", payload: { mode, boardSize: settings.boardSize, playerFormat: format, halloween } });
  return { matchId: match.id, gameState: nextState };
}

export async function selectCard({ roomId, userId, cardId } = {}) {
  const state = await getGameState(roomId);
  if (!state || state.status !== "playing") throw new Error("Match is not active.");
  if (state.phase !== "turn") throw new Error("الان زمان انتخاب کارت نیست.");
  if (state.currentTurn !== userId) throw new Error("الان نوبت تو نیست.");
  const team = teamForUser(state.players || [], userId);
  if (!team) throw new Error("تیم بازیکن پیدا نشد.");
  const card = (state.board || []).find((c) => c.id === cardId || String(c.position) === String(cardId));
  if (!card) throw new Error("Card not found.");
  const position = Number(card.position);
  const matchCard = (state.cards || []).find((c) => Number(c.position) === position);
  if (!matchCard || matchCard.revealed) throw new Error("Card is already revealed.");
  const points = card.type === CARD_TYPES.BONUS ? (card.bonusTeam === team ? 2 : -2) : (card.type === CARD_TYPES.DARK ? -1 : (card.type === team ? 1 : 0));
  const nextScores = { ...(state.scores || { red: 0, blue: 0 }) };
  nextScores[team] = (nextScores[team] || 0) + points;
  const nextRevealed = [...new Set([...(state.revealed || []).map(Number), position])];
  const revealedRows = await databaseUpdate("match_cards", { revealed: true, revealed_by: userId, reveal_value: points }, { match_id: state.matchId, position, revealed: false });
  if (!revealedRows.length) throw new Error("این کارت همین الان توسط بازیکن دیگری انتخاب شد. بازی را تازه کن.");
  await databaseInsert("match_events", { match_id: state.matchId, actor_id: userId, event_type: "card_revealed", payload: { position, type: card.type, bonusTeam: card.type === CARD_TYPES.BONUS ? (card.bonusTeam || null) : null, points, source: "normal_turn" } });

  const winner = checkWinner(state, nextScores, nextRevealed);
  if (winner) { await finishMatch(state, winner, userId, nextScores, nextRevealed, state.halloweenPowerUsed); return { turnEnded: true, gameFinished: true, gameState: await getGameState(roomId) }; }

  let extraDraws = Number(state.bonusExtraDraws?.[userId] || 0);
  if (card.type === CARD_TYPES.BONUS && card.bonusTeam === team) extraDraws += 1;
  const nextExtraDraws = { ...(state.bonusExtraDraws || {}) };
  if (extraDraws > 0) {
    nextExtraDraws[userId] = extraDraws - 1;
    const nextState = { ...state, scores: nextScores, revealed: nextRevealed, currentTurn: userId, turnTeam: team, phase: "turn", bonusExtraDraws: nextExtraDraws, turnNumber: (state.turnNumber || 1) + 1 };
    const updated = await databaseUpdate("rooms", { current_turn: userId, turn_team: team, game_state: nextState }, { id: roomId, current_turn: userId, status: "playing" });
    if (!updated.length) throw new Error("به‌روزرسانی نوبت انجام نشد.");
    return { turnEnded: false, gameFinished: false, extraDraw: true, gameState: await getGameState(roomId) };
  }

  const nextUser = nextPlayer(state.players || [], userId);
  const nextTeam = teamForUser(state.players || [], nextUser) || (team === "red" ? "blue" : "red");
  const nextState = { ...state, scores: nextScores, revealed: nextRevealed, currentTurn: nextUser, turnTeam: nextTeam, phase: "turn", bonusExtraDraws: nextExtraDraws, turnNumber: (state.turnNumber || 1) + 1 };
  const updated = await databaseUpdate("rooms", { current_turn: nextUser, turn_team: nextTeam, game_state: nextState }, { id: roomId, current_turn: userId, status: "playing" });
  if (!updated.length) throw new Error("نوبت قبلاً توسط بازیکن دیگری تغییر کرده است. بازی را تازه کن.");
  return { turnEnded: true, gameFinished: false, extraDraw: false, gameState: await getGameState(roomId) };
}

export async function endTurn({ roomId, userId } = {}) {
  const state = await getGameState(roomId);
  if (!state || state.status !== "playing") throw new Error("Match is not active.");
  if (state.phase !== "turn") throw new Error("الان نوبت انتخاب کارت نیست.");
  if (state.currentTurn !== userId) throw new Error("الان نوبت تو نیست.");
  if (Number(state.bonusExtraDraws?.[userId] || 0) > 0) throw new Error("به‌خاطر کارت طلایی هنوز یک انتخاب اضافه باقی مانده است.");
  const nextUser = nextPlayer(state.players || [], userId);
  const nextTeam = teamForUser(state.players || [], nextUser) || (state.turnTeam === "red" ? "blue" : "red");
  const nextState = { ...state, currentTurn: nextUser, turnTeam: nextTeam, turnNumber: (state.turnNumber || 1) + 1 };
  const updated = await databaseUpdate("rooms", { current_turn: nextUser, turn_team: nextTeam, game_state: nextState }, { id: roomId, current_turn: userId, status: "playing" });
  if (!updated.length) throw new Error("نوبت قبلاً تغییر کرده است. بازی را تازه کن.");
  return { gameState: await getGameState(roomId) };
}

export async function useHalloweenSpirit({ roomId, userId, cardId } = {}) {
  const state = await getGameState(roomId);
  if (!state || state.status !== "playing") throw new Error("Match is not active.");
  if (!state.halloweenEvent || !isHalloweenEventActive()) throw new Error("رویداد هالووین فعال نیست.");
  if (state.halloweenPowerUsed?.[userId]) throw new Error("قدرت هالووینی قبلاً استفاده شده است.");
  if (state.currentTurn !== userId) throw new Error("این قدرت فقط در نوبت خودت قابل استفاده است.");
  const team = teamForUser(state.players || [], userId);
  const revealed = new Set((state.revealed || []).map(Number));
  const eligible = (state.board || []).filter((card) => card.type === team && !revealed.has(Number(card.position)));
  if (!eligible.length) throw new Error("کارت خودیِ رو نشده‌ای باقی نمانده است.");
  const chosen = cardId ? eligible.find((card) => card.id === cardId || String(card.position) === String(cardId)) || eligible[0] : eligible[0];
  const result = await selectCard({ roomId, userId, cardId: chosen.id });
  const latest = await getGameState(roomId);
  if (latest && latest.status === "playing") {
    const nextPower = { ...(latest.halloweenPowerUsed || {}), [userId]: true };
    await databaseUpdate("rooms", { game_state: { ...latest, halloweenPowerUsed: nextPower } }, { id: roomId });
    return { ...result, halloweenPowerUsed: nextPower };
  }
  return result;
}
