import { getSupabase, databaseSelect, databaseInsert, databaseUpdate } from "./supabase.js";
import { buildBoard, CARD_TYPES } from "./cards.js";
import { isHalloweenEventActive, HALLOWEEN_EVENT_END } from "./halloween-event.js";

const DEFAULTS = Object.freeze({
  classic: { boardSize: 25, targetScore: 7, maxPlayers: 8, bonus: false, darkCards: 1 },
  expanded: { boardSize: 35, targetScore: 10, maxPlayers: 8, bonus: true, darkCards: 1 },
  chaos: { boardSize: 36, targetScore: 12, maxPlayers: 8, bonus: true, darkCards: 2 },
  duel: { boardSize: 16, targetScore: 5, maxPlayers: 2, bonus: false, darkCards: 1 }
});

function settingsFor(mode, overrides = {}) {
  return { ...(DEFAULTS[mode] || DEFAULTS.classic), ...overrides };
}

function createRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function uniqueRoomCode() {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = createRoomCode();
    const found = await databaseSelect("rooms", { eq: { code }, limit: 1 });
    if (!found.length) return code;
  }
  throw new Error("Could not create a unique room code.");
}

function normalizeState(room, players = []) {
  const state = room.game_state && typeof room.game_state === "object" ? room.game_state : {};
  return {
    ...state,
    roomId: room.id,
    status: room.status,
    mode: room.game_mode || "classic",
    settings: room.settings || {},
    currentTurn: room.current_turn,
    turnTeam: room.turn_team,
    winnerTeam: room.winner_team,
    players
  };
}

function playerFormat(settings = {}, mode = "classic") {
  return settings.playerFormat || (mode === "duel" ? "1v1" : "2v2");
}

function requiredPlayers(settings = {}, mode = "classic") {
  return playerFormat(settings, mode) === "1v1" ? 2 : 4;
}

export async function createGame({ userId, mode = "classic", maxPlayers = 8, boardSize, playerFormat: format = "2v2" } = {}) {
  if (!userId) throw new Error("Authentication required.");
  const normalizedFormat = format === "1v1" ? "1v1" : "2v2";
  const chosen = settingsFor(mode, {
    maxPlayers: normalizedFormat === "1v1" ? 2 : Math.max(4, Number(maxPlayers) || 8),
    ...(boardSize ? { boardSize } : {}),
    playerFormat: normalizedFormat
  });
  const roomCode = await uniqueRoomCode();
  const roomState = {
    board: [],
    turnNumber: 1,
    scores: { red: 0, blue: 0 },
    startedAt: null,
    phase: "lobby",
    currentTurn: null,
    turnTeam: "red",
    halloweenPowerUsed: {}
  };
  const rooms = await databaseInsert("rooms", {
    code: roomCode,
    host_id: userId,
    status: "waiting",
    max_players: chosen.maxPlayers,
    turn_team: "red",
    game_state: roomState,
    game_mode: mode,
    settings: chosen
  });
  const room = rooms[0];
  if (!room?.id) throw new Error("Room creation failed.");
  const profile = await databaseSelect("profiles", { eq: { id: userId }, limit: 1 });
  const displayName = profile[0]?.username || "Player";
  await databaseInsert("room_players", { room_id: room.id, user_id: userId, display_name: displayName, team: "red", is_host: true });
  return { roomId: room.id, roomCode, settings: chosen };
}

export async function joinGame({ code, userId } = {}) {
  if (!code || !userId) throw new Error("Room code and user are required.");
  const rooms = await databaseSelect("rooms", { eq: { code: code.trim().toUpperCase() }, limit: 1 });
  const room = rooms[0];
  if (!room) throw new Error("Room not found.");
  if (room.status !== "waiting") throw new Error("This room has already started.");
  const existing = await databaseSelect("room_players", { eq: { room_id: room.id, user_id: userId }, limit: 1 });
  if (!existing.length) {
    const players = await databaseSelect("room_players", { eq: { room_id: room.id } });
    if (players.length >= room.max_players) throw new Error("Room is full.");
    const profile = await databaseSelect("profiles", { eq: { id: userId }, limit: 1 });
    const displayName = profile[0]?.username || "Player";
    const redCount = players.filter((p) => p.team === "red").length;
    const blueCount = players.filter((p) => p.team === "blue").length;
    const team = redCount <= blueCount ? "red" : "blue";
    await databaseInsert("room_players", { room_id: room.id, user_id: userId, display_name: displayName, team, is_host: false });
  }
  return { roomId: room.id, roomCode: room.code };
}

async function loadPlayers(roomId) {
  return databaseSelect("room_players", { eq: { room_id: roomId }, order: { column: "joined_at", ascending: true } });
}

export async function getGameState(roomId) {
  const rooms = await databaseSelect("rooms", { eq: { id: roomId }, limit: 1 });
  if (!rooms[0]) return null;
  const players = await loadPlayers(roomId);
  const state = normalizeState(rooms[0], players);
  if (state.matchId) {
    state.cards = await databaseSelect("match_cards", { eq: { match_id: state.matchId }, order: { column: "position", ascending: true } });
  }
  return state;
}

function teamForUser(players, userId) {
  return players.find((p) => p.user_id === userId)?.team || null;
}

function nextPlayer(players, currentUserId) {
  if (!players.length) return null;
  const index = players.findIndex((p) => p.user_id === currentUserId);
  return players[(index < 0 ? 0 : index + 1) % players.length]?.user_id || null;
}

function teamCardsRemaining(board, revealed, team) {
  return (board || []).filter((card) => card.type === team && !revealed.includes(card.position)).length;
}

function checkWinner(state, scores, revealed) {
  const target = Number(state.settings?.targetScore || 7);
  if (scores.red >= target) return "red";
  if (scores.blue >= target) return "blue";
  if (teamCardsRemaining(state.board, revealed, "red") === 0) return "red";
  if (teamCardsRemaining(state.board, revealed, "blue") === 0) return "blue";
  return null;
}

async function finishMatch(state, winnerTeam, userId, nextScores, nextRevealed, powerState) {
  await databaseUpdate("rooms", {
    status: "finished",
    winner_team: winnerTeam,
    current_turn: userId,
    game_state: {
      ...state,
      scores: nextScores,
      revealed: nextRevealed,
      phase: "finished",
      currentTurn: userId,
      halloweenPowerUsed: powerState || state.halloweenPowerUsed || {}
    }
  }, { id: state.roomId });
  await databaseUpdate("matches", {
    winner_team: winnerTeam,
    red_score: nextScores.red,
    blue_score: nextScores.blue,
    finished_at: new Date().toISOString()
  }, { id: state.matchId });
  try {
    const supabase = getSupabase();
    const { data: rewardData, error: rewardError } = await supabase.rpc("award_match_rewards", { p_match_id: state.matchId, p_winner_team: winnerTeam });
    if (rewardError) throw rewardError;
    console.log("CODNAME rewards applied", rewardData);
  } catch (error) {
    console.error("CODNAME reward update failed", error);
  }
}

export async function startGame({ roomId, userId } = {}) {
  const rooms = await databaseSelect("rooms", { eq: { id: roomId }, limit: 1 });
  const room = rooms[0];
  if (!room || room.host_id !== userId) throw new Error("Only the room host can start the match.");
  if (room.status !== "waiting") throw new Error("Match is not waiting.");
  const players = await loadPlayers(roomId);
  const format = playerFormat(room.settings || {}, room.game_mode || "classic");
  const minimum = requiredPlayers(room.settings || {}, room.game_mode || "classic");
  if (players.length < minimum) throw new Error(format === "1v1" ? "برای شروع 1 به 1 باید ۲ بازیکن وارد اتاق باشند." : "برای شروع 2 به 2 باید حداقل ۴ بازیکن وارد اتاق باشند.");
  if (!players.some((p) => p.team === "red") || !players.some((p) => p.team === "blue")) throw new Error("هر دو تیم باید حداقل یک بازیکن داشته باشند.");
  if (format === "2v2" && (players.filter((p) => p.team === "red").length < 2 || players.filter((p) => p.team === "blue").length < 2)) {
    throw new Error("در حالت 2 به 2 هر تیم باید حداقل ۲ بازیکن داشته باشد.");
  }

  const mode = room.game_mode || "classic";
  const settings = settingsFor(mode, room.settings || {});
  const halloween = isHalloweenEventActive();
  const board = buildBoard(settings.boardSize, mode, "red", halloween ? "halloween" : "normal");
  const matches = await databaseInsert("matches", {
    room_id: roomId,
    game_mode: mode,
    board_size: settings.boardSize,
    target_score: settings.targetScore,
    round_number: 1,
    started_at: new Date().toISOString()
  });
  const match = matches[0];
  if (!match?.id) throw new Error("Could not create match.");
  await databaseInsert("match_players", players.map((p) => ({ match_id: match.id, user_id: p.user_id, team: p.team, score: 0 })));
  await databaseInsert("match_cards", board.map((card, position) => ({
    match_id: match.id,
    position,
    card_id: null,
    card_type: card.type,
    revealed: false,
    reveal_value: card.type === CARD_TYPES.BONUS ? 2 : 1
  })));

  const firstPlayer = players.find((p) => p.team === "red")?.user_id || players[0]?.user_id;
  const firstTeam = teamForUser(players, firstPlayer) || "red";
  const nextState = {
    board,
    matchId: match.id,
    turnNumber: 1,
    scores: { red: 0, blue: 0 },
    startedAt: new Date().toISOString(),
    revealed: [],
    phase: "turn",
    currentTurn: firstPlayer,
    turnTeam: firstTeam,
    playerFormat: format,
    halloweenEvent: halloween,
    halloweenPowerUsed: {},
    halloweenEventEndsAt: halloween ? HALLOWEEN_EVENT_END : null
  };
  await databaseUpdate("rooms", { status: "playing", current_turn: firstPlayer, turn_team: firstTeam, game_state: nextState, winner_team: null }, { id: roomId });
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

  const nextScores = { ...(state.scores || { red: 0, blue: 0 }) };
  const nextRevealed = [...(state.revealed || []), position];
  const points = card.type === team ? (card.bonus ? 2 : 1) : 0;
  nextScores[team] = Math.max(0, (nextScores[team] || 0) + points);

  await databaseUpdate("match_cards", { revealed: true, revealed_by: userId, reveal_value: points }, { match_id: state.matchId, position });
  await databaseInsert("match_events", { match_id: state.matchId, actor_id: userId, event_type: "card_revealed", payload: { position, type: card.type, points, source: "normal_turn" } });

  const winner = checkWinner(state, nextScores, nextRevealed);
  if (winner) {
    await finishMatch(state, winner, userId, nextScores, nextRevealed, state.halloweenPowerUsed);
    return { turnEnded: true, gameFinished: true, gameState: await getGameState(roomId) };
  }

  const nextUser = nextPlayer(state.players || [], userId);
  const nextTeam = teamForUser(state.players || [], nextUser) || (team === "red" ? "blue" : "red");
  const nextState = { ...state, scores: nextScores, revealed: nextRevealed, currentTurn: nextUser, turnTeam: nextTeam, phase: "turn", turnNumber: (state.turnNumber || 1) + 1 };
  await databaseUpdate("rooms", { current_turn: nextUser, turn_team: nextTeam, game_state: nextState }, { id: roomId });
  return { turnEnded: true, gameFinished: false, gameState: await getGameState(roomId) };
}

export async function endTurn({ roomId, userId } = {}) {
  const state = await getGameState(roomId);
  if (!state || state.status !== "playing") throw new Error("Match is not active.");
  if (state.phase !== "turn") throw new Error("الان نوبت انتخاب کارت نیست.");
  if (state.currentTurn !== userId) throw new Error("الان نوبت تو نیست.");
  const nextUser = nextPlayer(state.players || [], userId);
  const nextTeam = teamForUser(state.players || [], nextUser) || (state.turnTeam === "red" ? "blue" : "red");
  const nextState = { ...state, currentTurn: nextUser, turnTeam: nextTeam, turnNumber: (state.turnNumber || 1) + 1 };
  await databaseUpdate("rooms", { current_turn: nextUser, turn_team: nextTeam, game_state: nextState }, { id: roomId });
  await databaseInsert("match_events", { match_id: state.matchId, actor_id: userId, event_type: "turn_ended", payload: { nextTeam, nextUser } });
  return getGameState(roomId);
}

export async function useHalloweenSpirit({ roomId, userId, cardId } = {}) {
  const state = await getGameState(roomId);
  if (!state || state.status !== "playing") throw new Error("Match is not active.");
  if (!state.halloweenEvent || !isHalloweenEventActive()) throw new Error("رویداد هالووین به پایان رسیده است.");
  const player = (state.players || []).find((p) => p.user_id === userId);
  if (!player) throw new Error("بازیکن در این مسابقه پیدا نشد.");
  const used = state.halloweenPowerUsed || {};
  if (used[userId]) throw new Error("قدرت روح هالووینی قبلاً استفاده شده است.");

  const card = (state.board || []).find((c) => c.id === cardId || String(c.position) === String(cardId));
  if (!card) throw new Error("کارت پیدا نشد.");
  if (card.type !== player.team) throw new Error("روح هالووینی فقط کارت خودی را رو می‌کند.");
  const position = Number(card.position);
  const matchCard = (state.cards || []).find((c) => Number(c.position) === position);
  if (!matchCard || matchCard.revealed || (state.revealed || []).includes(position)) throw new Error("این کارت قبلاً رو شده است.");

  const nextScores = { ...(state.scores || { red: 0, blue: 0 }) };
  const points = card.bonus ? 2 : 1;
  nextScores[player.team] = Math.max(0, (nextScores[player.team] || 0) + points);
  const nextRevealed = [...(state.revealed || []), position];
  const nextPowerState = { ...used, [userId]: true };

  await databaseUpdate("match_cards", { revealed: true, revealed_by: userId, reveal_value: points }, { match_id: state.matchId, position });
  await databaseInsert("match_events", { match_id: state.matchId, actor_id: userId, event_type: "halloween_spirit", payload: { position, team: player.team, points } });

  const winner = checkWinner(state, nextScores, nextRevealed);
  if (winner) {
    await finishMatch({ ...state, halloweenPowerUsed: nextPowerState }, winner, userId, nextScores, nextRevealed, nextPowerState);
    return { gameFinished: true, powerUsed: true, gameState: await getGameState(roomId) };
  }

  const nextState = { ...state, scores: nextScores, revealed: nextRevealed, halloweenPowerUsed: nextPowerState };
  await databaseUpdate("rooms", { game_state: nextState }, { id: roomId });
  return { gameFinished: false, powerUsed: true, gameState: await getGameState(roomId) };
}

export { DEFAULTS };
