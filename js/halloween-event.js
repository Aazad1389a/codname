// Temporary Halloween event.
export const HALLOWEEN_EVENT_END = "2026-09-19T05:47:00Z";
export const HALLOWEEN_EVENT_NAME = "روح‌های هالووینی";

export function isHalloweenEventActive() {
  return Date.now() < new Date(HALLOWEEN_EVENT_END).getTime();
}

const STYLE_ID = "codname-halloween-event-style-v2";
const SELECTOR = "[data-halloween-event]";

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
    .cn-halloween-power{width:100%;margin:0 0 10px;padding:11px 13px;border:1px solid rgba(255,124,32,.38);border-radius:13px;background:linear-gradient(135deg,rgba(255,91,18,.18),rgba(98,27,108,.16));color:#fff;cursor:pointer;font:inherit;font-weight:900}
    .cn-halloween-power small{display:block;margin-top:3px;font-size:8px;opacity:.65;font-weight:600}.cn-halloween-power.used{opacity:.42;cursor:not-allowed}.cn-halloween-power.busy{opacity:.65;cursor:wait}
    @media(max-width:700px){.cn-halloween-banner{margin-bottom:8px}}
  `;
  document.head.appendChild(style);
}

function gameState() {
  return window.CODNAME?.getGameState?.() || null;
}

function myPlayer(state) {
  const id = window.CODNAME?.getUser?.()?.id;
  return (state?.players || []).find((p) => p.user_id === id) || null;
}

function renderCountdown() {
  document.querySelectorAll("[data-halloween-countdown]").forEach((el) => {
    el.textContent = isHalloweenEventActive() ? `⏳ ${remainingText()} تا پایان رویداد` : "رویداد به پایان رسید";
  });
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
    button.addEventListener("click", activateSpirit);
  }

  const id = window.CODNAME?.getUser?.()?.id;
  const used = Boolean(game.halloweenPowerUsed?.[id]);
  button.className = `cn-halloween-power${used ? " used" : ""}`;
  button.disabled = used;
  button.innerHTML = `👻 روح هالووینی${used ? " — استفاده شد" : " — آماده"}<small>با یک لمس، یک کارت خودی به‌صورت تصادفی رو می‌شود</small>`;
}

function renderMenuAndLobby() {
  if (!isHalloweenEventActive()) {
    document.querySelectorAll(SELECTOR).forEach((el) => el.remove());
    return;
  }

  const targets = [
    document.querySelector("#screen-menu .reference-center"),
    document.querySelector("#screen-lobby .lobby-visual")
  ].filter(Boolean);

  targets.forEach((target) => {
    let banner = target.querySelector(SELECTOR);
    if (!banner) {
      banner = document.createElement("section");
      banner.dataset.halloweenEvent = "1";
      banner.className = "cn-halloween-banner";
      target.insertBefore(banner, target.firstChild);
    }
    banner.innerHTML = `<b>🎃 ${HALLOWEEN_EVENT_NAME}</b><span>کدو، خفاش، شبح، جادوگر و کلمات مرموز هالووینی وارد بازی شده‌اند. هر بازیکن یک بار قدرت ویژه دارد.</span><em data-halloween-countdown>${remainingText()} تا پایان رویداد</em>`;
  });
}

function activateSpirit() {
  const state = gameState();
  const me = myPlayer(state);
  if (!state || !me || !state.halloweenEvent || !isHalloweenEventActive()) return;
  if (state.halloweenPowerUsed?.[me.user_id]) return;

  const revealed = new Set((state.revealed || []).map(Number));
  const revealedByDb = new Set((state.cards || []).filter((card) => card.revealed).map((card) => Number(card.position)));
  const ownCards = (state.board || []).filter((card) => {
    const position = Number(card.position);
    return card.type === me.team && !revealed.has(position) && !revealedByDb.has(position);
  });

  if (!ownCards.length) {
    const toast = document.querySelector("[data-toast]");
    if (toast) {
      toast.textContent = "کارت خودیِ رو نشده‌ای باقی نمانده است.";
      toast.classList.add("is-visible");
      setTimeout(() => toast.classList.remove("is-visible"), 2500);
    }
    return;
  }

  const button = document.querySelector("[data-halloween-power]");
  if (button) {
    button.disabled = true;
    button.classList.add("busy");
    button.innerHTML = "👻 روح هالووینی — در حال اجرا...<small>یک کارت خودی به‌صورت خودکار انتخاب می‌شود</small>";
  }

  const chosen = ownCards[Math.floor(Math.random() * ownCards.length)];
  document.dispatchEvent(new CustomEvent("codname:halloween-spirit", {
    detail: { cardId: chosen.id }
  }));
}

function boot() {
  installStyles();
  renderMenuAndLobby();
  renderGamePower();
  renderCountdown();
  document.addEventListener("codname:game-state", () => {
    renderMenuAndLobby();
    renderGamePower();
    renderCountdown();
  });
  setInterval(() => {
    renderMenuAndLobby();
    renderGamePower();
    renderCountdown();
  }, 15000);
}

document.addEventListener("DOMContentLoaded", boot, { once: true });
