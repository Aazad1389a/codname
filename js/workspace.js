import { WORD_CARDS } from "./cards.js";

const MODES = {
  classic: { label: "کلاسیک", icon: "◈", size: 25, target: 7, players: "2–8", desc: "تعادل استاندارد برای شروع سریع و بازی تیمی." },
  expanded: { label: "گسترده", icon: "▦", size: 35, target: 10, players: "2–8", desc: "صفحه بزرگ‌تر با انتخاب‌های بیشتر و امتیاز هدف بالاتر." },
  chaos: { label: "هرج‌ومرج", icon: "✦", size: 36, target: 12, players: "2–8", desc: "تغییر ریتم بازی با کارت‌های ویژه و صفحه بزرگ." },
  duel: { label: "دوئل", icon: "⚡", size: 16, target: 5, players: "2–4", desc: "نبرد فشرده با صفحه کوچک‌تر و مسابقه سریع‌تر." }
};

const DECKS = {
  classic: { label: "مجموعه استاندارد", mode: "classic", count: 25, desc: "۲۵ کارت برای بازی متعادل و قابل پیش‌بینی." },
  expanded: { label: "مجموعه گسترده", mode: "expanded", count: 35, desc: "۳۵ کارت برای میدان بزرگ‌تر و تصمیم‌های بیشتر." },
  chaos: { label: "مجموعه هرج‌ومرج", mode: "chaos", count: 36, desc: "۳۶ کارت همراه با فضای بیشتر برای کارت‌های ویژه." },
  duel: { label: "مجموعه دوئل", mode: "duel", count: 16, desc: "۱۶ کارت برای رقابت سریع دو تا چهار نفره." }
};

const state = {
  panel: "modes",
  preferredMode: localStorage.getItem("codname-preferred-mode") || "classic",
  query: "",
  compact: localStorage.getItem("codname-compact") === "1"
};

const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" }[c]));
const modeLabel = (mode) => MODES[mode]?.label || "کلاسیک";

function injectStyles() {
  if (document.getElementById("codname-workspace-style")) return;
  const style = document.createElement("style");
  style.id = "codname-workspace-style";
  style.textContent = `
  .cw-overlay{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(3,7,14,.76);backdrop-filter:blur(14px)}
  .cw-overlay.is-open{display:flex}.cw-window{width:min(1060px,96vw);max-height:min(780px,92vh);overflow:hidden;border:1px solid rgba(255,255,255,.12);border-radius:24px;background:linear-gradient(145deg,rgba(17,24,38,.98),rgba(7,12,21,.98));box-shadow:0 30px 100px rgba(0,0,0,.45);display:grid;grid-template-columns:220px 1fr}
  .cw-side{padding:20px;border-left:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.025)}.cw-side h3{margin:4px 0 18px;font-size:18px}.cw-nav{display:grid;gap:8px}.cw-nav button,.cw-close,.cw-btn{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:inherit;border-radius:13px;padding:11px 13px;cursor:pointer;font:inherit}.cw-nav button{text-align:right}.cw-nav button.active{background:rgba(77,145,255,.16);border-color:rgba(77,145,255,.38)}
  .cw-main{padding:24px;overflow:auto}.cw-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px}.cw-head h2{margin:0}.cw-head p{margin:5px 0 0;opacity:.7}.cw-close{font-size:22px;width:42px;height:42px;padding:0}.cw-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.cw-card{padding:18px;border:1px solid rgba(255,255,255,.1);border-radius:18px;background:rgba(255,255,255,.035)}.cw-card.selected{border-color:rgba(78,154,255,.65);box-shadow:0 0 0 1px rgba(78,154,255,.12) inset}.cw-card h3{margin:0 0 6px}.cw-card p{opacity:.7;line-height:1.7}.cw-meta{display:flex;flex-wrap:wrap;gap:7px;margin:12px 0}.cw-pill{font-size:12px;padding:5px 8px;border-radius:999px;background:rgba(255,255,255,.07)}.cw-actions{display:flex;gap:8px;flex-wrap:wrap}.cw-btn.primary{background:rgba(78,154,255,.19);border-color:rgba(78,154,255,.45)}.cw-btn.strong{background:rgba(61,205,138,.16);border-color:rgba(61,205,138,.4)}
  .cw-statbar{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}.cw-stat{padding:13px;border-radius:15px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08)}.cw-stat b{display:block;font-size:20px}.cw-stat small{opacity:.65}.cw-search{width:100%;box-sizing:border-box;margin:0 0 14px;padding:12px 14px;border-radius:13px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.2);color:inherit;font:inherit}.cw-cards{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}.cw-word{padding:12px 8px;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(255,255,255,.035);text-align:center}.cw-empty{padding:28px;text-align:center;opacity:.65}.cw-footer{margin-top:16px;display:flex;justify-content:space-between;align-items:center;gap:12px;opacity:.72;font-size:12px}.cw-lobby-tools{margin:0 0 16px;padding:14px;border:1px solid rgba(255,255,255,.1);border-radius:18px;background:rgba(255,255,255,.035);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.cw-lobby-tools strong{display:block}.cw-lobby-tools small{opacity:.66}.cw-lobby-button{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:inherit;border-radius:12px;padding:10px 14px;cursor:pointer;font:inherit}.cw-dark .screen.menu-screen{filter:brightness(.85)}.cw-compact .menu-main-grid{transform:scale(.985);transform-origin:top center}
  @media(max-width:760px){.cw-window{grid-template-columns:1fr;max-height:94vh}.cw-side{border-left:0;border-bottom:1px solid rgba(255,255,255,.08);padding:12px}.cw-nav{grid-template-columns:repeat(4,1fr)}.cw-nav button{font-size:12px;text-align:center}.cw-main{padding:16px}.cw-grid{grid-template-columns:1fr}.cw-cards{grid-template-columns:repeat(3,minmax(0,1fr))}.cw-statbar{grid-template-columns:repeat(2,1fr)}}
  `;
  document.head.appendChild(style);
}

function buildOverlay() {
  if (document.getElementById("codname-workspace")) return;
  const overlay = document.createElement("div");
  overlay.id = "codname-workspace";
  overlay.className = "cw-overlay";
  overlay.innerHTML = `
    <div class="cw-window" role="dialog" aria-modal="true" aria-label="پنجره CODNAME">
      <aside class="cw-side"><h3>CODNAME</h3><nav class="cw-nav">
        <button data-cw-panel="modes">بازی</button><button data-cw-panel="profile">پروفایل</button><button data-cw-panel="leaderboard">رتبه‌بندی</button><button data-cw-panel="decks">دسته کارت</button><button data-cw-panel="settings">تنظیمات</button>
      </nav></aside>
      <section class="cw-main"><header class="cw-head"><div><h2 data-cw-title></h2><p data-cw-subtitle></p></div><button class="cw-close" data-cw-close aria-label="بستن">×</button></header><div data-cw-content></div></section>
    </div>`;
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeWorkspace(); });
  document.body.appendChild(overlay);
}

function openWorkspace(panel = "modes") {
  injectStyles(); buildOverlay(); state.panel = panel; renderWorkspace(); document.getElementById("codname-workspace")?.classList.add("is-open");
}
function closeWorkspace() { document.getElementById("codname-workspace")?.classList.remove("is-open"); }

function renderWorkspace() {
  const panel = state.panel;
  const overlay = document.getElementById("codname-workspace"); if (!overlay) return;
  overlay.classList.toggle("cw-compact", state.compact);
  overlay.querySelectorAll("[data-cw-panel]").forEach((b) => b.classList.toggle("active", b.dataset.cwPanel === panel));
  const title = overlay.querySelector("[data-cw-title]"), sub = overlay.querySelector("[data-cw-subtitle]"), content = overlay.querySelector("[data-cw-content]");
  const data = {
    modes: ["حالت‌های بازی", "مود را همین‌جا انتخاب کن؛ در ساخت اتاق یا لابی اعمال می‌شود."],
    profile: ["پروفایل", "اطلاعات حساب، سطح و پیشرفت فعلی."],
    leaderboard: ["رتبه‌بندی", "نمایش آمار موجود و آماده برای جدول آنلاین."],
    decks: ["دسته کارت", "انتخاب مجموعه، پیش‌نمایش کارت‌ها و اعمال به اتاق."],
    settings: ["تنظیمات", "کنترل نمایش و تنظیمات محلی بازی."]
  }[panel] || ["CODNAME", ""];
  title.textContent = data[0]; sub.textContent = data[1];
  content.innerHTML = panel === "modes" ? modesPanel() : panel === "profile" ? profilePanel() : panel === "leaderboard" ? leaderboardPanel() : panel === "decks" ? decksPanel() : settingsPanel();
  wirePanel();
}

function modesPanel() {
  return `<div class="cw-grid">${Object.entries(MODES).map(([key, m]) => `<article class="cw-card ${state.preferredMode === key ? "selected" : ""}"><h3>${m.icon} ${m.label}</h3><p>${m.desc}</p><div class="cw-meta"><span class="cw-pill">${m.size} کارت</span><span class="cw-pill">هدف ${m.target}</span><span class="cw-pill">${m.players} نفر</span></div><div class="cw-actions"><button class="cw-btn primary" data-cw-select-mode="${key}">${state.preferredMode === key ? "انتخاب شده" : "انتخاب مود"}</button>${document.getElementById("screen-lobby")?.classList.contains("is-active") ? `<button class="cw-btn strong" data-cw-apply-room="${key}">اعمال به لابی</button>` : ""}</div></article>`).join("")}</div>`;
}

function profilePanel() {
  const api = window.CODNAME;
  const p = api?.getProfile?.(); const u = api?.getUser?.();
  const name = p?.username || u?.email?.split("@")[0] || "مهمان";
  return `<div class="cw-statbar"><div class="cw-stat"><small>نام</small><b>${esc(name)}</b></div><div class="cw-stat"><small>سطح</small><b>${p?.level ?? "—"}</b></div><div class="cw-stat"><small>XP</small><b>${p?.xp ?? "—"}</b></div><div class="cw-stat"><small>برد</small><b>${p?.games_won ?? "—"}</b></div></div><div class="cw-card"><h3>وضعیت حساب</h3><p>${u ? "حساب وارد شده و آماده‌ی بازی آنلاین است." : "هنوز وارد حساب نشده‌ای. برای ذخیره پیشرفت و بازی آنلاین وارد شو."}</p><div class="cw-actions"><button class="cw-btn primary" data-cw-action="account">${u ? "مدیریت حساب" : "ورود / ساخت حساب"}</button></div></div>`;
}

function leaderboardPanel() {
  const rows = [
    [1, "MysticWolf", 4820, 25], [2, "ShadowFox", 2980, 12], [3, "RedLion", 2750, 18], [4, "SilentArrow", 2410, 14]
  ];
  return `<div class="cw-card"><h3>برترین بازیکنان</h3><p>این پنل از ساختار فعلی رتبه‌بندی منو استفاده می‌کند و بعداً می‌تواند مستقیماً به جدول profiles متصل شود.</p>${rows.map(r => `<div class="cw-lobby-tools"><div><strong>#${r[0]} ${r[1]}</strong><small>سطح ${r[3]}</small></div><b>${r[2]} XP</b></div>`).join("")}</div>`;
}

function decksPanel() {
  const deck = DECKS[state.preferredMode] || DECKS.classic;
  const words = WORD_CARDS.filter((w) => !state.query || w.includes(state.query)).slice(0, deck.count);
  return `<div class="cw-statbar"><div class="cw-stat"><small>مجموعه</small><b>${deck.label}</b></div><div class="cw-stat"><small>تعداد</small><b>${deck.count}</b></div><div class="cw-stat"><small>مود</small><b>${modeLabel(deck.mode)}</b></div><div class="cw-stat"><small>نمایش</small><b>${words.length}</b></div></div><input class="cw-search" data-cw-search placeholder="جست‌وجوی کلمه در مجموعه کارت..." value="${esc(state.query)}"><div class="cw-cards">${words.length ? words.map((w, i) => `<span class="cw-word">${i + 1}. ${esc(w)}</span>`).join("") : `<div class="cw-empty">کارتی با این جست‌وجو پیدا نشد.</div>`}</div><div class="cw-actions" style="margin-top:16px"><button class="cw-btn primary" data-cw-shuffle>تعویض پیش‌نمایش</button><button class="cw-btn strong" data-cw-apply-deck>اعمال مجموعه ${deck.label} به ${document.getElementById("screen-lobby")?.classList.contains("is-active") ? "لابی" : "بازی جدید"}</button></div><div class="cw-footer"><span>${deck.desc}</span><span>پیش‌نمایش فقط کلمات مجموعه را نشان می‌دهد.</span></div>`;
}

function settingsPanel() {
  const user = window.CODNAME?.getUser?.();
  return `<div class="cw-card"><h3>نمایش</h3><p>حالت فشرده فضای بیشتری برای منو و پنل‌ها ایجاد می‌کند.</p><div class="cw-actions"><button class="cw-btn primary" data-cw-compact>${state.compact ? "غیرفعال کردن حالت فشرده" : "فعال کردن حالت فشرده"}</button></div></div><div class="cw-card" style="margin-top:12px"><h3>اتصال</h3><p>${user ? "حساب متصل است. داده‌های آنلاین از Supabase دریافت می‌شوند." : "برای امکانات آنلاین باید وارد حساب شوید."}</p><div class="cw-meta"><span class="cw-pill">Realtime</span><span class="cw-pill">Online Save</span><span class="cw-pill">Touch Ready</span></div></div>`;
}

function setPreferredMode(mode) {
  if (!MODES[mode]) return;
  state.preferredMode = mode;
  localStorage.setItem("codname-preferred-mode", mode);
  document.dispatchEvent(new CustomEvent("codname:preferred-mode", { detail: { mode } }));
  renderWorkspace();
}

function wirePanel() {
  const root = document.getElementById("codname-workspace");
  root.querySelectorAll("[data-cw-panel]").forEach((b) => b.onclick = () => { state.panel = b.dataset.cwPanel; renderWorkspace(); });
  root.querySelector("[data-cw-close]")?.addEventListener("click", closeWorkspace);
  root.querySelector("[data-cw-search]")?.addEventListener("input", (e) => { state.query = e.target.value; renderWorkspace(); const input = root.querySelector("[data-cw-search]"); input?.focus(); input?.setSelectionRange(input.value.length, input.value.length); });
  root.querySelectorAll("[data-cw-select-mode]").forEach((b) => b.addEventListener("click", () => setPreferredMode(b.dataset.cwSelectMode)));
  root.querySelectorAll("[data-cw-apply-room]").forEach((b) => b.addEventListener("click", () => { const mode=b.dataset.cwApplyRoom; setPreferredMode(mode); document.dispatchEvent(new CustomEvent("codname:change-room-mode", { detail: { mode } })); closeWorkspace(); }));
  root.querySelector("[data-cw-apply-deck]")?.addEventListener("click", () => { const mode=state.preferredMode; if(document.getElementById("screen-lobby")?.classList.contains("is-active")){ document.dispatchEvent(new CustomEvent("codname:change-room-mode", { detail:{mode} })); closeWorkspace(); } else { closeWorkspace(); document.dispatchEvent(new CustomEvent("codname:toast", {detail:{message:`مجموعه ${DECKS[mode].label} برای اتاق‌های جدید انتخاب شد.`}})); } });
  root.querySelector("[data-cw-shuffle]")?.addEventListener("click", () => { state.query=""; const seed=Date.now(); localStorage.setItem("codname-deck-preview",String(seed)); renderWorkspace(); });
  root.querySelector("[data-cw-compact]")?.addEventListener("click", () => { state.compact=!state.compact; localStorage.setItem("codname-compact",state.compact?"1":"0"); renderWorkspace(); });
  root.querySelector("[data-cw-action='account']")?.addEventListener("click", () => { closeWorkspace(); document.querySelector("[data-action='open-auth']")?.click(); });
}

function installMenuInterceptors() {
  document.addEventListener("click", (event) => {
    const actionEl = event.target.closest("[data-action]");
    const action = actionEl?.dataset.action;
    if (["show-modes", "show-profile", "show-leaderboard", "show-decks", "show-settings"].includes(action)) {
      event.stopImmediatePropagation();
      event.preventDefault();
      openWorkspace(action === "show-modes" ? "modes" : action === "show-profile" ? "profile" : action === "show-leaderboard" ? "leaderboard" : action === "show-decks" ? "decks" : "settings");
      return;
    }
    if (event.target.closest(".lang-btn")) {
      event.stopImmediatePropagation(); event.preventDefault(); openWorkspace("settings"); return;
    }
    const view = event.target.closest(".icon-btn:not(.auth-trigger)");
    if (view) {
      event.stopImmediatePropagation(); event.preventDefault(); state.compact=!state.compact; localStorage.setItem("codname-compact",state.compact?"1":"0"); document.body.classList.toggle("codname-compact",state.compact); return;
    }
  }, true);

  document.addEventListener("click", (event) => {
    const lobbyButton = event.target.closest("[data-cw-lobby-mode]");
    if (lobbyButton) { openWorkspace("modes"); event.preventDefault(); event.stopPropagation(); }
  }, true);

  document.addEventListener("codname:create-room", (event) => {
    if (event.detail && typeof event.detail === "object") event.detail.mode = state.preferredMode;
  }, true);
}

function ensureLobbyTools() {
  const lobby = document.getElementById("screen-lobby");
  if (!lobby?.classList.contains("is-active")) return;
  let tools = lobby.querySelector(".cw-lobby-tools");
  if (!tools) {
    const header = lobby.querySelector(".lobby-layout");
    if (!header) return;
    tools = document.createElement("div"); tools.className="cw-lobby-tools";
    tools.innerHTML=`<div><strong>حالت بازی: <span data-cw-lobby-mode-label>${modeLabel(state.preferredMode)}</span></strong><small>مود را قبل از شروع Match تغییر بده.</small></div><button class="cw-lobby-button" data-cw-lobby-mode>انتخاب مود</button>`;
    header.parentElement.insertBefore(tools, header);
  }
  const gameState = window.CODNAME?.getGameState?.();
  const current = gameState?.mode || gameState?.settings?.mode || state.preferredMode;
  const label = tools.querySelector("[data-cw-lobby-mode-label]"); if(label) label.textContent=modeLabel(current);
}

function installLobbyObserver() {
  const observer = new MutationObserver(ensureLobbyTools);
  observer.observe(document.body, {subtree:true,attributes:true,attributeFilter:["class"]});
  setInterval(ensureLobbyTools,1000);
}

function installVersionBadge() {
  const footer = document.querySelector(".platform-bar");
  if (!footer || footer.querySelector("[data-cw-version]")) return;
  const span=document.createElement("span"); span.dataset.cwVersion=""; span.textContent=`CODNAME v${window.CODNAME?.version || "1.5.0"}`; span.style.marginInlineStart="12px"; span.style.opacity=".7"; footer.appendChild(span);
}

function installToastBridge() {
  document.addEventListener("codname:toast", (e) => {
    const toast=document.querySelector("[data-toast]"); if(!toast)return;
    toast.textContent=e.detail?.message || "انجام شد."; toast.classList.add("is-visible"); setTimeout(()=>toast.classList.remove("is-visible"),3000);
  });
}

function boot() {
  injectStyles(); buildOverlay(); installMenuInterceptors(); installLobbyObserver(); installToastBridge(); setTimeout(installVersionBadge,300); setInterval(installVersionBadge,1500);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true}); else boot();
