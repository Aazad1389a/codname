// Temporary Halloween event: five days from 2026-09-14 09:17 (+03:30).
export const HALLOWEEN_EVENT_END = "2026-09-19T05:47:00Z";
export const HALLOWEEN_EVENT_NAME = "روح‌های هالووینی";

export function isHalloweenEventActive() {
  return Date.now() < new Date(HALLOWEEN_EVENT_END).getTime();
}

const STYLE_ID = "codname-halloween-event-style";
const SELECTOR = "[data-halloween-event]";

function esc(value) {
  return String(value ?? "").replace(/[&<>\"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#039;" }[c]));
}

function remainingText() {
  const diff = Math.max(0, new Date(HALLOWEEN_EVENT_END).getTime() - Date.now());
  if (!diff) return "پایان یافت";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${days} روز و ${hours} ساعت و ${minutes} دقیقه`;
}

function installStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .cn-halloween-banner{margin:0 0 12px;padding:13px 15px;border:1px solid rgba(255,124,32,.34);border-radius:16px;background:radial-gradient(circle at 92% 25%,rgba(255,105,22,.18),transparent 34%),linear-gradient(135deg,rgba(38,15,7,.94),rgba(12,10,16,.94));box-shadow:0 14px 45px rgba(0,0,0,.2);color:#fff3e8}
    .cn-halloween-banner b{display:block;font-size:14px}.cn-halloween-banner span{display:block;margin-top:4px;font-size:9px;opacity:.7;line-height:1.7}.cn-halloween-banner em{display:block;margin-top:6px;font-size:9px;color:#ffbd8a;font-style:normal}
    .cn-halloween-power{width:100%;margin:0 0 10px;padding:11px 13px;border:1px solid rgba(255,124,32,.38);border-radius:13px;background:linear-gradient(135deg,rgba(255,91,18,.18),rgba(98,27,108,.16));color:#fff;cursor:pointer;font:inherit;font-weight:900}.cn-halloween-power small{display:block;margin-top:3px;font-size:8px;opacity:.65;font-weight:600}.cn-halloween-power.used{opacity:.42;cursor:not-allowed}
    .cn-halloween-modal{position:fixed;inset:0;z-index:12000;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(0,0,0,.65);backdrop-filter:blur(6px)}.cn-halloween-modal.open{display:flex}.cn-halloween-dialog{width:min(560px,100%);max-height:min(78vh,640px);overflow:auto;padding:16px;border:1px solid rgba(255,124,32,.32);border-radius:18px;background:#101016;box-shadow:0 25px 80px rgba(0,0,0,.45)}.cn-halloween-dialog h3{margin:0 0 4px}.cn-halloween-dialog p{margin:0 0 12px;font-size:10px;opacity:.65}.cn-halloween-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.cn-halloween-card{min-height:54px;border:1px solid rgba(255,255,255,.09);border-radius:11px;background:rgba(255,255,255,.045);color:#fff;font:inherit;font-size:11px;font-weight:800;cursor:pointer}.cn-halloween-card:hover{border-color:rgba(255,124,32,.55);background:rgba(255,124,32,.12)}.cn-halloween-close{width:100%;margin-top:10px;height:40px;border:0;border-radius:11px;background:rgba(255,255,255,.07);color:#fff;font:inherit;font-weight:800;cursor:pointer}
    @media(max-width:700px){.cn-halloween-cards{grid-template-columns:repeat(2,minmax(0,1fr))}.cn-halloween-banner{margin-bottom:8px}}
  `;
  document.head.appendChild(style);
}

function ensureModal() {
  let modal = document.querySelector(".cn-halloween-modal");
  if (modal) return modal;
  modal = document.createElement("div");
  modal.className = "cn-halloween-modal";
  modal.innerHTML = `<div class="cn-halloween-dialog" role="dialog" aria-modal="true"><h3>👻 روح هالووینی</h3><p>یک کارت خودی را انتخاب کن. این قدرت فقط یک‌بار در هر مسابقه برای هر بازیکن فعال است.</p><div class="cn-halloween-cards" data-halloween-cards></div><button type="button" class="cn-halloween-close" data-halloween-close>بستن</button></div>`;
  document.body.appendChild(modal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.closest("[data-halloween-close]")) modal.classList.remove("open");
  });
  return modal;
}

function gameState() { return window.CODNAME?.getGameState?.() || null; }
function myPlayer(state) { const id = window.CODNAME?.getUser?.()?.id; return (state?.players || []).find((p) => p.user_id === id) || null; }

function renderCountdown() {
  document.querySelectorAll("[data-halloween-countdown]").forEach((el) => { el.textContent = isHalloweenEventActive() ? `⏳ ${remainingText()} تا پایان رویداد` : "رویداد به پایان رسید"; });
}

function renderGamePower() {
  const game = gameState();
  if (!game || game.status !== "playing" || !game.halloweenEvent || !isHalloweenEventActive()) {
    document.querySelectorAll("[data-halloween-power]").forEach((el) => el.remove());
    return;
  }
  const root = document.querySelector("#screen-game .side-panel");
  if (!root) return;
  let button = root.querySelector("[data-halloween-power]");
  if (!button) {
    button = document.createElement("button");
    button.type = "button";
    button.dataset.halloweenPower = "1";
    root.insertBefore(button, root.firstChild);
    button.addEventListener("click", openPicker);
  }
  const id = window.CODNAME?.getUser?.()?.id;
  const used = Boolean(game.halloweenPowerUsed?.[id]);
  button.className = `cn-halloween-power${used ? " used" : ""}`;
  button.disabled = used;
  button.innerHTML = `👻 روح هالووینی${used ? " — استفاده شد" : " — آماده"}<small>یک کارت خودی را هر زمان خواستی رو کن</small>`;
}

function renderMenuAndLobby() {
  if (!isHalloweenEventActive()) { document.querySelectorAll(SELECTOR).forEach((el) => el.remove()); return; }
  const targets = [document.querySelector("#screen-menu .reference-center"), document.querySelector("#screen-lobby .lobby-visual")].filter(Boolean);
  targets.forEach((target) => {
    let banner = target.querySelector(SELECTOR);
    if (!banner) { banner = document.createElement("section"); banner.dataset.halloweenEvent = "1"; banner.className = "cn-halloween-banner"; target.insertBefore(banner, target.firstChild); }
    banner.innerHTML = `<b>🎃 ${HALLOWEEN_EVENT_NAME}</b><span>کدو، خفاش، شبح، جادوگر و کلمات مرموز هالووینی وارد بازی شده‌اند. هر بازیکن یک بار قدرت ویژه دارد.</span><em data-halloween-countdown>${remainingText()} تا پایان رویداد</em>`;
  });
}

function openPicker() {
  const state = gameState();
  const me = myPlayer(state);
  if (!state || !me || !state.halloweenEvent || !isHalloweenEventActive() || state.halloweenPowerUsed?.[me.user_id]) return;
  const modal = ensureModal();
  const list = modal.querySelector("[data-halloween-cards]");
  const revealed = new Set(state.revealed || []);
  const revealedByDb = new Set((state.cards || []).filter((card) => card.revealed).map((card) => Number(card.position)));
  const own = (state.board || []).filter((card) => card.type === me.team && !revealed.has(Number(card.position)) && !revealedByDb.has(Number(card.position)));
  list.innerHTML = own.map((card) => `<button type="button" class="cn-halloween-card" data-spirit-card="${esc(card.id)}">${esc(card.word)}</button>`).join("");
  if (!own.length) list.innerHTML = `<div style="grid-column:1/-1;padding:14px;text-align:center;font-size:10px;opacity:.65">کارت خودیِ رو نشده‌ای باقی نمانده است.</div>`;
  list.querySelectorAll("[data-spirit-card]").forEach((button) => {
    button.addEventListener("click", () => {
      button.disabled = true;
      document.dispatchEvent(new CustomEvent("codname:halloween-spirit", { detail: { cardId: button.dataset.spiritCard } }));
      modal.classList.remove("open");
    });
  });
  modal.classList.add("open");
}

function boot() {
  installStyles();
  ensureModal();
  renderMenuAndLobby();
  renderGamePower();
  renderCountdown();
  document.addEventListener("codname:game-state", () => { renderMenuAndLobby(); renderGamePower(); renderCountdown(); });
  setInterval(() => { renderMenuAndLobby(); renderGamePower(); renderCountdown(); }, 15000);
}

document.addEventListener("DOMContentLoaded", boot, { once: true });
