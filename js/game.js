import { getSupabase, databaseSelect, databaseInsert, databaseUpdate } from "./supabase.js";
import { buildBoard, CARD_TYPES } from "./cards.js";

const DEFAULTS = Object.freeze({
    classic: { boardSize: 25, targetScore: 7, maxPlayers: 8, bonus: false, darkCards: 1 },
    expanded: { boardSize: 35, targetScore: 10, maxPlayers: 8, bonus: true, darkCards: 1 },
    chaos: { boardSize: 36, targetScore: 12, maxPlayers: 8, bonus: true, darkCards: 2 },
    duel: { boardSize: 16, targetScore: 5, maxPlayers: 4, bonus: false, darkCards: 1 }
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
    return { ...state, roomId: room.id, status: room.status, mode: room.game_mode || "classic", settings: room.settings || {}, currentTurn: room.current_turn, turnTeam: room.turn_team, winnerTeam: room.winner_team, players };
}
export async function createGame({ userId, mode = "classic", maxPlayers = 8, boardSize } = {}) {
    if (!userId) throw new Error("Authentication required.");
    const chosen = settingsFor(mode, { maxPlayers, ...(boardSize ? { boardSize } : {}) });
    const roomCode = await uniqueRoomCode();
    const roomState = { board: [], turnNumber: 1, clue: null, guessesLeft: 0, scores: { red: 0, blue: 0 }, startedAt: null, phase: "lobby", clueGiver: null };
    const rooms = await databaseInsert("rooms", { code: roomCode, host_id: userId, status: "waiting", max_players: chosen.maxPlayers, turn_team: "red", game_state: roomState, game_mode: mode, settings: chosen });
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
async function loadPlayers(roomId) { return databaseSelect("room_players", { eq: { room_id: roomId }, order: { column: "joined_at", ascending: true } }); }
export async function getGameState(roomId) {
    const rooms = await databaseSelect("rooms", { eq: { id: roomId }, limit: 1 });
    if (!rooms[0]) return null;
    const players = await loadPlayers(roomId);
    const roomState = normalizeState(rooms[0], players);
    if (roomState.matchId) {
        const cards = await databaseSelect("match_cards", { eq: { match_id: roomState.matchId }, order: { column: "position", ascending: true } });
        const clues = await databaseSelect("match_clues", { eq: { match_id: roomState.matchId }, order: { column: "turn_number", ascending: true } });
        roomState.cards = cards;
        roomState.clues = clues;
        if (!roomState.clue && clues.length) {
            const latest = clues[clues.length - 1];
            roomState.clue = { text: latest.clue_text, number: latest.clue_number, team: latest.team, turnNumber: latest.turn_number };
        }
    }
    return roomState;
}
function firstTeamPlayer(players, team) { return players.find((p) => p.team === team)?.user_id || null; }
function chooseClueGiver(players, team) { return firstTeamPlayer(players, team); }
function chooseGuesser(players, team, clueGiver) { return players.find((p) => p.team === team && p.user_id !== clueGiver)?.user_id || clueGiver || firstTeamPlayer(players, team); }
function buildMatchBoard(size, mode, firstTeam) { return buildBoard(size, mode, firstTeam); }
export async function startGame({ roomId, userId } = {}) {
    const rooms = await databaseSelect("rooms", { eq: { id: roomId }, limit: 1 });
    const room = rooms[0];
    if (!room || room.host_id !== userId) throw new Error("Only the room host can start the match.");
    if (room.status !== "waiting") throw new Error("Match is not waiting.");
    const players = await loadPlayers(roomId);
    if (players.length < 2) throw new Error("At least two players are required.");
    if (!players.some((p) => p.team === "red") || !players.some((p) => p.team === "blue")) throw new Error("Both teams need at least one player.");
    const mode = room.game_mode || "classic";
    const settings = settingsFor(mode, room.settings || {});
    const firstTeam = "red";
    const board = buildMatchBoard(settings.boardSize, mode, firstTeam);
    const matches = await databaseInsert("matches", { room_id: roomId, game_mode: mode, board_size: settings.boardSize, target_score: settings.targetScore, round_number: 1, started_at: new Date().toISOString() });
    const match = matches[0];
    if (!match?.id) throw new Error("Could not create match.");
    await databaseInsert("match_players", players.map((p) => ({ match_id: match.id, user_id: p.user_id, team: p.team, score: 0 })));
    await databaseInsert("match_cards", board.map((card, position) => ({ match_id: match.id, position, card_id: null, card_type: card.type, revealed: false, reveal_value: card.type === CARD_TYPES.BONUS ? 2 : 1 })));
    const clueGiver = chooseClueGiver(players, firstTeam);
    const nextState = { board, matchId: match.id, turnNumber: 1, clue: null, guessesLeft: 0, scores: { red: 0, blue: 0 }, startedAt: new Date().toISOString(), revealed: [], usedClues: [], phase: "clue", clueGiver };
    await databaseUpdate("rooms", { status: "playing", current_turn: clueGiver, turn_team: firstTeam, game_state: nextState, winner_team: null }, { id: roomId });
    await databaseInsert("match_events", { match_id: match.id, actor_id: userId, event_type: "match_started", payload: { mode, boardSize: settings.boardSize, clueGiver } });
    return { matchId: match.id, gameState: nextState };
}
function teamForUser(players, userId) { return players.find((p) => p.user_id === userId)?.team || null; }
export async function submitClue({ roomId, userId, text, number } = {}) {
    const state = await getGameState(roomId);
    if (!state || state.status !== "playing") throw new Error("Match is not active.");
    if (state.phase !== "clue") throw new Error("الان زمان دادن سرنخ نیست.");
    if (state.turnTeam !== teamForUser(state.players || [], userId)) throw new Error("You are not on the active team.");
    if (state.clueGiver !== userId || state.currentTurn !== userId) throw new Error("Only the clue giver can submit the clue.");
    const clueText = String(text || "").trim().slice(0, 40);
    const clueNumber = Number(number);
    const maxNumber = Math.max(1, Math.min((state.board || []).length, 9));
    if (!clueText) throw new Error("سرنخ را وارد کن.");
    if (!Number.isInteger(clueNumber) || clueNumber < 1 || clueNumber > maxNumber) throw new Error(`عدد سرنخ باید بین ۱ تا ${maxNumber} باشد.`);
    await databaseInsert("match_clues", { match_id: state.matchId, team: state.turnTeam, turn_number: state.turnNumber || 1, clue_text: clueText, clue_number: clueNumber, created_by: userId });
    const nextUser = chooseGuesser(state.players || [], state.turnTeam, userId);
    if (!nextUser) throw new Error("حداقل یک بازیکن در تیم لازم است.");
    const nextState = { ...state, clue: { text: clueText, number: clueNumber, team: state.turnTeam, turnNumber: state.turnNumber || 1 }, guessesLeft: clueNumber, phase: "guess", currentTurn: nextUser, clueGiver: userId, usedClues: [...(state.usedClues || []), clueText] };
    await databaseUpdate("rooms", { current_turn: nextUser, turn_team: state.turnTeam, game_state: nextState }, { id: roomId });
    await databaseInsert("match_events", { match_id: state.matchId, actor_id: userId, event_type: "clue_submitted", payload: { clue: clueText, number: clueNumber, team: state.turnTeam } });
    return getGameState(roomId);
}
function checkWinner(scores, targetScore, remaining) {
    if (scores.red >= targetScore) return "red";
    if (scores.blue >= targetScore) return "blue";
    if (remaining <= 0) return scores.red === scores.blue ? null : (scores.red > scores.blue ? "red" : "blue");
    return null;
}
export async function selectCard({ roomId, userId, cardId } = {}) {
    const state = await getGameState(roomId);
    if (!state || state.status !== "playing") throw new Error("Match is not active.");
    if (state.phase === "clue") throw new Error("ابتدا سرنخ و تعداد کارت را ثبت کن.");
    if (state.currentTurn !== userId) throw new Error("الان نوبت حدس تو نیست.");
    if (!Array.isArray(state.cards)) throw new Error("Board is unavailable.");
    const players = state.players || [];
    const team = teamForUser(players, userId);
    if (!team || team !== state.turnTeam) throw new Error("You are not on the active team.");
    if (state.guessesLeft <= 0) throw new Error("تعداد حدس‌های این سرنخ تمام شده است.");
    const card = state.board.find((c) => c.id === cardId) || state.board.find((c) => String(c.position) === String(cardId));
    if (!card) throw new Error("Card not found.");
    const position = Number(card.position);
    const matchCard = state.cards.find((c) => Number(c.position) === position);
    if (!matchCard || matchCard.revealed) throw new Error("Card is already revealed.");
    const nextScores = { ...(state.scores || { red: 0, blue: 0 }) };
    const nextRevealed = [...(state.revealed || []), position];
    let nextTeam = state.turnTeam;
    let turnEnded = false;
    let gameFinished = false;
    let points = 0;
    if (card.type === team) points = card.bonus ? 2 : 1;
    if (card.type === CARD_TYPES.NEUTRAL) points = 0;
    if (card.type === CARD_TYPES.DARK) points = -2;
    nextScores[team] = Math.max(0, (nextScores[team] || 0) + points);
    await databaseUpdate("match_cards", { revealed: true, revealed_by: userId, reveal_value: points }, { match_id: state.matchId, position });
    await databaseInsert("match_events", { match_id: state.matchId, actor_id: userId, event_type: "card_revealed", payload: { position, type: card.type, points } });
    const totalRemaining = state.board.filter((c) => !nextRevealed.includes(c.position) && c.type !== CARD_TYPES.DARK).length;
    const winner = checkWinner(nextScores, state.settings?.targetScore || 7, totalRemaining);
    if (winner) {
        gameFinished = true; turnEnded = true;
        await databaseUpdate("rooms", { status: "finished", winner_team: winner, current_turn: userId, game_state: { ...state, scores: nextScores, revealed: nextRevealed, turnEnded: true, phase: "finished" } }, { id: roomId });
        await databaseUpdate("matches", { winner_team: winner, red_score: nextScores.red, blue_score: nextScores.blue, finished_at: new Date().toISOString() }, { id: state.matchId });
        return { turnEnded, gameFinished, gameState: await getGameState(roomId) };
    }
    const nextGuesses = Math.max(0, (state.guessesLeft || 1) - 1);
    const wrongCard = card.type !== team || card.type === CARD_TYPES.DARK || card.type === CARD_TYPES.NEUTRAL;
    if (wrongCard || nextGuesses === 0) {
        turnEnded = true;
        nextTeam = state.turnTeam === "red" ? "blue" : "red";
        const nextClueGiver = chooseClueGiver(players, nextTeam);
        const nextState = { ...state, scores: nextScores, revealed: nextRevealed, clue: null, guessesLeft: 0, phase: "clue", turnNumber: (state.turnNumber || 1) + 1, clueGiver: nextClueGiver };
        await databaseUpdate("rooms", { current_turn: nextClueGiver, turn_team: nextTeam, game_state: nextState }, { id: roomId });
        return { turnEnded, gameFinished, gameState: await getGameState(roomId) };
    }
    const nextUser = chooseGuesser(players, team, state.clueGiver) || userId;
    const nextState = { ...state, scores: nextScores, revealed: nextRevealed, guessesLeft: nextGuesses, currentTurn: nextUser, phase: "guess" };
    await databaseUpdate("rooms", { current_turn: nextUser, turn_team: team, game_state: nextState }, { id: roomId });
    return { turnEnded, gameFinished, gameState: await getGameState(roomId) };
}
export async function endTurn({ roomId, userId } = {}) {
    const state = await getGameState(roomId);
    if (!state || state.status !== "playing") throw new Error("Match is not active.");
    if (state.phase !== "guess") throw new Error("ابتدا سرنخ را ثبت کن.");
    if (state.currentTurn !== userId) throw new Error("It is not your turn.");
    const players = state.players || [];
    const nextTeam = state.turnTeam === "red" ? "blue" : "red";
    const nextClueGiver = chooseClueGiver(players, nextTeam);
    const nextState = { ...state, clue: null, guessesLeft: 0, phase: "clue", turnNumber: (state.turnNumber || 1) + 1, clueGiver: nextClueGiver };
    await databaseUpdate("rooms", { current_turn: nextClueGiver, turn_team: nextTeam, game_state: nextState }, { id: roomId });
    await databaseInsert("match_events", { match_id: state.matchId, actor_id: userId, event_type: "turn_ended", payload: { nextTeam, nextUser: nextClueGiver } });
    return getGameState(roomId);
}
export { DEFAULTS };
