import { signIn, signUp, signInWithGoogle, signOut } from "./auth.js";

const state = {
    refs: {}, user: null, profile: null, roomCode: null,
    authMode: "login", toastTimer: null
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export function initUI({ user, profile } = {}) {
    state.user = user || null;
    state.profile = profile || null;
    cacheRefs(); bindButtons(); bindAuth();
    renderProfile(); renderAccount(); renderAuthState();
}

function cacheRefs() {
    state.refs.loading = $("#screen-loading"); state.refs.menu = $("#screen-menu");
    state.refs.lobby = $("#screen-lobby"); state.refs.game = $("#screen-game"); state.refs.result = $("#screen-result");
    state.refs.roomCode = $("[data-room-code]"); state.refs.players = $("[data-players]"); state.refs.board = $("[data-board]");
    state.refs.clue = $("[data-clue]"); state.refs.turn = $("[data-turn]"); state.refs.scoreRed = $("[data-score-red]");
    state.refs.scoreBlue = $("[data-score-blue]"); state.refs.profile = $("[data-profile]"); state.refs.toast = $("[data-toast]");
    state.refs.authModal = $("[data-auth-modal]"); state.refs.authForm = $("[data-auth-form]");
    state.refs.authStatus = $("[data-auth-status]"); state.refs.authSubmit = $("[data-auth-submit]"); state.refs.signupOnly = $(".auth-signup-only");
}

function bindButtons() {
    document.addEventListener("click", (event) => {
        const button = event.target.closest("[data-action]");
        const action = button?.dataset.action;
        if (!action) return;

        if (["create-room", "join-room", "join-room-quick", "start-game", "end-turn"].includes(action) && !state.user) {
            openAuth("login");
            setAuthStatus("ابتدا وارد حساب شوید یا یک حساب بسازید.", false);
            return;
        }
        if (action === "create-room") document.dispatchEvent(new CustomEvent("codname:create-room", { detail: readRoomSettings() }));
        if (action === "join-room") submitJoinCode();
        if (action === "join-room-quick") submitJoinCode(true);
        if (action === "start-game") document.dispatchEvent(new CustomEvent("codname:start-game"));
        if (action === "end-turn") document.dispatchEvent(new CustomEvent("codname:end-turn"));
        if (action === "leave-room") document.dispatchEvent(new CustomEvent("codname:leave-room"));
        if (action === "back-menu" || action === "home") document.dispatchEvent(new CustomEvent("codname:back-menu"));
        if (action === "open-auth") openAuth("login");
        if (action === "close-auth") closeAuth();
        if (action === "google-login") handleGoogleLogin();
        if (action === "logout") handleLogout();
        if (action === "show-modes") document.querySelector("[data-mode-pick]")?.scrollIntoView({ block: "center" });
        if (action === "show-profile") openAuth("login");
    });

    $$('[data-mode-pick]').forEach((button) => button.addEventListener("click", () => {
        $$('[data-mode-pick]').forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        const select = $("[data-mode]");
        if (select) select.value = button.dataset.modePick || "classic";
    }));

    $("[data-join-code]")?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") submitJoinCode();
    });
}

function submitJoinCode(quick = false) {
    const input = $("[data-join-code]");
    const code = String(input?.value || "").trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) {
        showError("کد اتاق باید دقیقاً ۶ کاراکتر باشد.");
        input?.focus(); return;
    }
    document.dispatchEvent(new CustomEvent("codname:join-room", { detail: { code } }));
}

function bindAuth() {
    state.refs.authForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const email = String(form.get("email") || "").trim();
        const password = String(form.get("password") || "");
        const username = String(form.get("username") || "").trim();
        setAuthBusy(true); setAuthStatus("در حال ارتباط با سرور...", false);
        try {
            if (state.authMode === "signup") {
                const data = await signUp({ email, password, username });
                if (!data.session) {
                    setAuthStatus("حساب ساخته شد. ایمیل تأیید را بررسی کن و سپس وارد شو.", false);
                } else {
                    setAuthStatus("حساب با موفقیت ساخته شد.", false);
                    window.setTimeout(() => window.location.reload(), 400);
                }
            } else {
                await signIn({ email, password });
                setAuthStatus("ورود موفق بود.", false);
                window.setTimeout(() => window.location.reload(), 300);
            }
        } catch (error) {
            console.error("Authentication error:", error);
            setAuthStatus(authErrorMessage(error), true);
        } finally { setAuthBusy(false); }
    });
    $$('[data-auth-tab]').forEach((tab) => tab.addEventListener("click", () => switchAuthMode(tab.dataset.authTab)));
}

async function handleGoogleLogin() {
    setAuthBusy(true); setAuthStatus("در حال انتقال به Google...", false);
    try { await signInWithGoogle(); }
    catch (error) { console.error(error); setAuthStatus(authErrorMessage(error), true); setAuthBusy(false); }
}

function openAuth(mode = "login") {
    switchAuthMode(mode);
    const modal = state.refs.authModal; if (!modal) return;
    if (typeof modal.showModal === "function") modal.showModal(); else modal.setAttribute("open", "");
    $("#auth-email")?.focus();
}
function closeAuth() { const modal = state.refs.authModal; if (!modal) return; if (typeof modal.close === "function") modal.close(); else modal.removeAttribute("open"); }

function switchAuthMode(mode) {
    state.authMode = mode === "signup" ? "signup" : "login";
    $$('[data-auth-tab]').forEach((tab) => tab.classList.toggle("is-active", tab.dataset.authTab === state.authMode));
    if (state.refs.signupOnly) state.refs.signupOnly.hidden = state.authMode !== "signup";
    if (state.refs.authSubmit) state.refs.authSubmit.textContent = state.authMode === "signup" ? "ساخت حساب" : "ورود";
    const password = $("#auth-password"); if (password) password.autocomplete = state.authMode === "signup" ? "new-password" : "current-password";
    setAuthStatus("", false);
}

function setAuthBusy(busy) {
    $$('[data-auth-form] input, [data-auth-form] button[type="submit"], [data-action="google-login"]').forEach((el) => { el.disabled = busy; });
    if (state.refs.authSubmit && busy) state.refs.authSubmit.textContent = "لطفاً صبر کنید...";
}
function setAuthStatus(message, isError) { if (!state.refs.authStatus) return; state.refs.authStatus.textContent = message; state.refs.authStatus.classList.toggle("is-error", Boolean(isError)); }
function authErrorMessage(error) {
    const message = String(error?.message || "");
    if (/Invalid login credentials/i.test(message)) return "ایمیل یا رمز عبور اشتباه است.";
    if (/User already registered/i.test(message)) return "این ایمیل قبلاً ثبت شده است. وارد شوید.";
    if (/Email not confirmed/i.test(message)) return "ایمیل هنوز تأیید نشده است.";
    if (/Password should be at least/i.test(message)) return "رمز عبور کوتاه است.";
    return message || "خطایی در ورود یا ثبت‌نام رخ داد.";
}
async function handleLogout() { try { await signOut(); window.location.reload(); } catch (error) { console.error(error); showError("خروج از حساب انجام نشد."); } }

function readRoomSettings() { return { mode: $("[data-mode]")?.value || "classic", maxPlayers: Number($("[data-max-players]")?.value || 8), boardSize: Number($("[data-board-size]")?.value || 25) }; }
export function showScreen(name) { const mapping = { loading: state.refs.loading, menu: state.refs.menu, lobby: state.refs.lobby, game: state.refs.game, result: state.refs.result }; Object.values(mapping).forEach((el) => el?.classList.remove("is-active")); mapping[name]?.classList.add("is-active"); }
export function showLoading(message = "Loading...") { const text = state.refs.loading?.querySelector("[data-loading-text]"); if (text) text.textContent = message; showScreen("loading"); }
export function showError(message) { console.error(message); if (state.refs.toast) { state.refs.toast.textContent = message; state.refs.toast.classList.add("is-visible"); window.clearTimeout(state.toastTimer); state.toastTimer = window.setTimeout(() => state.refs.toast?.classList.remove("is-visible"), 3500); } }
export function showLobby(data = {}) { state.roomCode = data.roomCode || state.roomCode; $$('[data-room-code]').forEach((el) => { el.textContent = state.roomCode || "------"; }); renderPlayers(data.players || []); const start = $("[data-action='start-game']"); const isHost = data.players?.find((p) => p.user_id === data.user?.id)?.is_host; if (start) start.disabled = !isHost || (data.players || []).length < 2; }
export function showGame({ game } = {}) { renderBoard(game?.board || [], game?.revealed || [], game?.currentTurn); renderPlayers(game?.players || []); }
export function updatePlayerList(players = []) { renderPlayers(players); }
function renderPlayers(players) { if (!state.refs.players) return; state.refs.players.innerHTML = ""; for (const player of players) { const item = document.createElement("div"); item.className = `player-item team-${player.team || "neutral"}`; const online = player.last_seen_at ? "●" : "○"; item.innerHTML = `<span>${online}</span><strong>${escapeHtml(player.display_name || "Player")}</strong><small>${escapeHtml(player.team || "pending")}</small>${player.is_host ? "<em>HOST</em>" : ""}`; state.refs.players.appendChild(item); } }
function renderBoard(board, revealed = [], currentTurn) { if (!state.refs.board) return; state.refs.board.innerHTML = ""; const isTurn = currentTurn && state.user?.id === currentTurn; for (const card of board) { const revealedNow = revealed.includes(card.position) || card.revealed; const button = document.createElement("button"); button.type = "button"; button.className = `word-card ${revealedNow ? "is-revealed" : ""} ${card.bonus ? "is-bonus" : ""}`; button.dataset.cardId = card.id; button.disabled = revealedNow || !isTurn; button.innerHTML = `<span class="word">${escapeHtml(card.word)}</span><span class="card-index">${card.position + 1}</span>`; if (revealedNow && card.type) button.dataset.type = card.type; button.addEventListener("click", () => document.dispatchEvent(new CustomEvent("codname:select-card", { detail: { cardId: card.id } }))); state.refs.board.appendChild(button); } }
export function updateGameUI(game = {}) { renderBoard(game.board || [], game.revealed || [], game.currentTurn); renderPlayers(game.players || []); if (state.refs.clue) state.refs.clue.textContent = game.clue ? `${game.clue.text} × ${game.clue.number}` : "بدون سرنخ"; if (state.refs.turn) state.refs.turn.textContent = game.turnTeam ? `نوبت تیم ${game.turnTeam === "red" ? "قرمز" : "آبی"}` : "-"; if (state.refs.scoreRed) state.refs.scoreRed.textContent = String(game.scores?.red || 0); if (state.refs.scoreBlue) state.refs.scoreBlue.textContent = String(game.scores?.blue || 0); if (game.winnerTeam) showResult(game.winnerTeam, game.scores); }
function showResult(team, scores = {}) { const winner = $("[data-winner]"); if (winner) winner.textContent = team === "red" ? "تیم قرمز برنده شد" : "تیم آبی برنده شد"; const score = $("[data-final-score]"); if (score) score.textContent = `${scores.red || 0} - ${scores.blue || 0}`; }
function renderProfile() { if (!state.refs.profile) return; state.refs.profile.textContent = state.profile?.username || state.user?.email || "مهمان"; }
function renderAccount() { $("[data-account-name]") && ($("[data-account-name]").textContent = state.profile?.username || state.user?.email?.split("@")[0] || "مهمان"); $("[data-account-status]") && ($("[data-account-status]").textContent = state.user ? "عملیات آماده است" : "وارد نشده"); $("[data-account-level]") && ($("[data-account-level]").textContent = state.profile?.level ?? "—"); $("[data-account-xp]") && ($("[data-account-xp]").textContent = state.profile?.xp ?? "—"); $("[data-account-wins]") && ($("[data-account-wins]").textContent = state.profile?.games_won ?? "—"); }
function renderAuthState() { $$('[data-action="open-auth"]').forEach((el) => { if (el.classList.contains("auth-trigger")) el.hidden = Boolean(state.user); else el.hidden = false; }); const logout = $("[data-action='logout']"); if (logout) logout.hidden = !state.user; }
function escapeHtml(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
