const state = {
    refs: {},
    user: null,
    profile: null,
    roomCode: null
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export function initUI({ user, profile } = {}) {
    state.user = user || null;
    state.profile = profile || null;
    cacheRefs();
    bindButtons();
    renderProfile();
}

function cacheRefs() {
    state.refs.loading = $("#screen-loading");
    state.refs.menu = $("#screen-menu");
    state.refs.lobby = $("#screen-lobby");
    state.refs.game = $("#screen-game");
    state.refs.result = $("#screen-result");
    state.refs.roomCode = $("[data-room-code]");
    state.refs.players = $("[data-players]");
    state.refs.board = $("[data-board]");
    state.refs.clue = $("[data-clue]");
    state.refs.turn = $("[data-turn]");
    state.refs.scoreRed = $("[data-score-red]");
    state.refs.scoreBlue = $("[data-score-blue]");
    state.refs.profile = $("[data-profile]");
    state.refs.toast = $("[data-toast]");
}

function bindButtons() {
    document.addEventListener("click", (event) => {
        const action = event.target.closest("[data-action]")?.dataset.action;
        if (!action) return;
        if (action === "create-room") document.dispatchEvent(new CustomEvent("codname:create-room", { detail: readRoomSettings() }));
        if (action === "join-room") document.dispatchEvent(new CustomEvent("codname:join-room", { detail: { code: $("[data-join-code]")?.value || "" } }));
        if (action === "start-game") document.dispatchEvent(new CustomEvent("codname:start-game"));
        if (action === "end-turn") document.dispatchEvent(new CustomEvent("codname:end-turn"));
        if (action === "leave-room") document.dispatchEvent(new CustomEvent("codname:leave-room"));
        if (action === "back-menu") document.dispatchEvent(new CustomEvent("codname:back-menu"));
    });
}

function readRoomSettings() {
    return {
        mode: $("[data-mode]")?.value || "classic",
        maxPlayers: Number($("[data-max-players]")?.value || 8),
        boardSize: Number($("[data-board-size]")?.value || 25)
    };
}

export function showScreen(name) {
    const mapping = {
        loading: state.refs.loading,
        menu: state.refs.menu,
        lobby: state.refs.lobby,
        game: state.refs.game,
        result: state.refs.result
    };
    Object.values(mapping).forEach((el) => el?.classList.remove("is-active"));
    mapping[name]?.classList.add("is-active");
}

export function showLoading(message = "Loading...") {
    if (state.refs.loading) {
        const text = state.refs.loading.querySelector("[data-loading-text]");
        if (text) text.textContent = message;
    }
    showScreen("loading");
}

export function showError(message) {
    console.error(message);
    if (state.refs.toast) {
        state.refs.toast.textContent = message;
        state.refs.toast.classList.add("is-visible");
        window.clearTimeout(state.toastTimer);
        state.toastTimer = window.setTimeout(() => state.refs.toast?.classList.remove("is-visible"), 3500);
    } else {
        alert(message);
    }
}

export function showLobby(data = {}) {
    state.roomCode = data.roomCode || state.roomCode;
    if (state.refs.roomCode) state.refs.roomCode.textContent = state.roomCode || "------";
    renderPlayers(data.players || []);
    const start = $("[data-action='start-game']");
    const isHost = data.players?.find((p) => p.user_id === data.user?.id)?.is_host;
    if (start) start.disabled = !isHost || (data.players || []).length < 2;
}

export function showGame({ game } = {}) {
    renderBoard(game?.board || [], game?.revealed || [], game?.currentTurn);
    renderPlayers(game?.players || []);
}

export function updatePlayerList(players = []) {
    renderPlayers(players);
}

function renderPlayers(players) {
    if (!state.refs.players) return;
    state.refs.players.innerHTML = "";
    for (const player of players) {
        const item = document.createElement("div");
        item.className = `player-item team-${player.team || "neutral"}`;
        const online = player.last_seen_at ? "●" : "○";
        item.innerHTML = `<span>${online}</span><strong>${escapeHtml(player.display_name || "Player")}</strong><small>${escapeHtml(player.team || "pending")}</small>${player.is_host ? "<em>HOST</em>" : ""}`;
        state.refs.players.appendChild(item);
    }
}

function renderBoard(board, revealed = [], currentTurn) {
    if (!state.refs.board) return;
    state.refs.board.innerHTML = "";
    const isTurn = currentTurn && state.user?.id === currentTurn;
    for (const card of board) {
        const revealedNow = revealed.includes(card.position) || card.revealed;
        const button = document.createElement("button");
        button.type = "button";
        button.className = `word-card ${revealedNow ? "is-revealed" : ""} ${card.bonus ? "is-bonus" : ""}`;
        button.dataset.cardId = card.id;
        button.disabled = revealedNow || !isTurn;
        button.innerHTML = `<span class="word">${escapeHtml(card.word)}</span><span class="card-index">${card.position + 1}</span>`;
        if (revealedNow && card.type) button.dataset.type = card.type;
        button.addEventListener("click", () => document.dispatchEvent(new CustomEvent("codname:select-card", { detail: { cardId: card.id } })));
        state.refs.board.appendChild(button);
    }
}

export function updateGameUI(game = {}) {
    renderBoard(game.board || [], game.revealed || [], game.currentTurn);
    renderPlayers(game.players || []);
    if (state.refs.clue) state.refs.clue.textContent = game.clue ? `${game.clue.text} × ${game.clue.number}` : "بدون سرنخ";
    if (state.refs.turn) state.refs.turn.textContent = game.turnTeam ? `نوبت تیم ${game.turnTeam === "red" ? "قرمز" : "آبی"}` : "-";
    if (state.refs.scoreRed) state.refs.scoreRed.textContent = String(game.scores?.red || 0);
    if (state.refs.scoreBlue) state.refs.scoreBlue.textContent = String(game.scores?.blue || 0);
    if (game.winnerTeam) showResult(game.winnerTeam, game.scores);
}

function showResult(team, scores = {}) {
    const winner = $("[data-winner]");
    if (winner) winner.textContent = team === "red" ? "تیم قرمز برنده شد" : "تیم آبی برنده شد";
    const score = $("[data-final-score]");
    if (score) score.textContent = `${scores.red || 0} - ${scores.blue || 0}`;
}

function renderProfile() {
    if (!state.refs.profile) return;
    state.refs.profile.textContent = state.profile?.username || state.user?.email || "Guest";
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
