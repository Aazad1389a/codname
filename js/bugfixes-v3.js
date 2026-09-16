// CODNAME — runtime bug fixes and UI hardening.
// Keeps hidden bonus ownership hidden until a card is actually revealed.
const STYLE_ID = "codname-bugfixes-v3";

function installStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .word-card.codname-gold-revealed:not(.is-revealed){
      background:initial!important;
      border-color:initial!important;
      box-shadow:initial!important;
    }
    .codname-turn-notice{
      margin:8px auto 0;
      max-width:720px;
      padding:7px 11px;
      border:1px solid rgba(242,212,119,.28);
      border-radius:999px;
      background:rgba(184,138,34,.10);
      font-size:11px;
      line-height:1.5;
      text-align:center;
      opacity:.9;
    }
    [data-action="end-turn"][disabled]{opacity:.45!important;cursor:not-allowed!important}
  `;
  document.head.appendChild(style);
}

function currentUser() { return window.CODNAME?.getUser?.() || null; }
function currentTeam(state) {
  const id = currentUser()?.id;
  return (state?.players || []).find((player) => player.user_id === id)?.team || null;
}
function isDuel(state) {
  return (state?.settings?.playerFormat || state?.playerFormat) === "1v1" || state?.mode === "duel";
}

function syncLobby(state) {
  if (!state || state.status !== "waiting") return;
  const players = state.players || [];
  const start = document.querySelector("#screen-lobby [data-action='start-game']");
  if (!start) return;
  const format = isDuel(state) ? "1v1" : "2v2";
  const required = format === "1v1" ? 2 : 4;
  const me = players.find((player) => player.user_id === currentUser()?.id);
  const red = players.filter((player) => player.team === "red").length;
  const blue = players.filter((player) => player.team === "blue").length;
  const readyTeams = red > 0 && blue > 0 && (format === "1v1" || (red >= 2 && blue >= 2));
  const canStart = Boolean(me?.is_host) && players.length >= required && readyTeams;
  start.disabled = !canStart;
  start.title = canStart ? "شروع بازی" : (format === "1v1" ? "برای شروع ۲ بازیکن لازم است." : "برای شروع ۴ بازیکن؛ دو نفر در هر تیم لازم است.");
}

function syncGameControls(state) {
  if (!state || (state.status !== "playing" && state.status !== "finished")) return;
  const userId = currentUser()?.id;
  const myTurn = Boolean(userId && state.currentTurn === userId && state.status === "playing" && state.phase === "turn");
  const remainingExtra = Number(state.bonusExtraDraws?.[userId] || 0);
  const endTurn = document.querySelector("#screen-game [data-action='end-turn']");
  if (endTurn) endTurn.disabled = !myTurn || remainingExtra > 0;
}

function syncBoard(state) {
  const board = state?.board || [];
  const revealed = new Set((state?.revealed || []).map(Number));
  const buttons = [...document.querySelectorAll("#screen-game .word-card")];
  for (const button of buttons) {
    const position = Number((button.querySelector(".card-index")?.textContent || "").trim()) - 1;
    const card = board.find((item) => Number(item.position) === position);
    if (!card) continue;
    const shown = revealed.has(position) || card.revealed;
    // The gold state must not be visible before reveal.
    button.classList.toggle("is-bonus", shown && Boolean(card.bonus));
    button.classList.toggle("codname-gold-revealed", shown && Boolean(card.bonus));
    if (shown && card.bonus) {
      button.dataset.type = "bonus";
      if (card.bonusTeam) button.dataset.bonusTeam = card.bonusTeam;
    } else {
      delete button.dataset.bonusTeam;
      if (!shown) delete button.dataset.type;
    }
  }
}

function ensureTurnNotice() {
  const host = document.querySelector("#screen-game .turn-center");
  if (!host) return null;
  let notice = host.querySelector(".codname-turn-notice");
  if (!notice) {
    notice = document.createElement("div");
    notice.className = "codname-turn-notice";
    notice.hidden = true;
    host.appendChild(notice);
  }
  return notice;
}

function showGoldFeedback(card, state) {
  const user = currentUser();
  if (!user || !card || card.type !== "bonus") return;
  const team = currentTeam(state);
  const notice = ensureTurnNotice();
  if (!notice) return;
  notice.hidden = false;
  if (card.bonusTeam === team) {
    notice.textContent = "کارت طلایی تیم تو: +۲ امتیاز و یک انتخاب اضافه.";
  } else {
    notice.textContent = "کارت طلایی حریف: −۲ امتیاز.";
  }
  clearTimeout(notice._timer);
  notice._timer = setTimeout(() => { notice.hidden = true; }, 4200);
}

function renderState(state) {
  installStyles();
  syncLobby(state);
  syncGameControls(state);
  syncBoard(state);
}

document.addEventListener("codname:game-state", (event) => renderState(event.detail), { passive: true });

document.addEventListener("codname:select-card", (event) => {
  const state = window.CODNAME?.getGameState?.();
  const cardId = event.detail?.cardId;
  if (!state || !cardId || state.currentTurn !== currentUser()?.id) return;
  const card = (state.board || []).find((item) => item.id === cardId || String(item.position) === String(cardId));
  if (card?.bonus) setTimeout(() => showGoldFeedback(card, state), 250);
}, { passive: true });

document.addEventListener("DOMContentLoaded", () => {
  installStyles();
  const state = window.CODNAME?.getGameState?.();
  if (state) renderState(state);
}, { once: true });

installStyles();
