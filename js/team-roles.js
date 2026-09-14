import { getSupabase } from "./supabase.js";

const STYLE_ID = "codname-team-roles-style-v2";
const esc = (value) => String(value ?? "").replace(/[&<>\"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#039;" }[c]));

function installStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .cn-format-box{margin:14px 0 0;padding:12px;border:1px solid rgba(255,255,255,.09);border-radius:16px;background:rgba(255,255,255,.03)}
    .cn-format-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px}.cn-format-head b{font-size:12px}.cn-format-head small{font-size:9px;opacity:.58}
    .cn-format-tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px}.cn-format-tab{min-height:48px;border:1px solid rgba(255,255,255,.1);border-radius:12px;background:rgba(255,255,255,.04);color:#dfe6f1;font:inherit;font-weight:800;cursor:pointer}.cn-format-tab small{display:block;font-size:8px;opacity:.55;margin-top:3px}.cn-format-tab.active{border-color:rgba(74,143,255,.5);background:rgba(74,143,255,.14)}.cn-format-tab:disabled{opacity:.45;cursor:not-allowed}
    .cn-team-summary{margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:8px}.cn-team-card{padding:10px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.16)}.cn-team-card h4{margin:0 0 7px;font-size:10px}.cn-team-row{padding:4px 0;font-size:9px;border-top:1px solid rgba(255,255,255,.05)}.cn-team-row:first-of-type{border-top:0}.cn-team-note{margin:8px 0 0;font-size:9px;line-height:1.7;opacity:.6}
    @media(max-width:700px){.cn-format-box{margin-top:10px}.cn-team-summary{grid-template-columns:1fr}.cn-format-tab{min-height:46px}}
  `;
  document.head.appendChild(style);
}

function playersFor(players, team) {
  return (players || []).filter((player) => player.team === team);
}

function formatOf(settings = {}, mode = "classic") {
  return settings.playerFormat || (mode === "duel" ? "1v1" : "2v2");
}

function requiredFor(format) {
  return format === "1v1" ? 2 : 4;
}

function ensureLobbyBox() {
  const visual = document.querySelector("#screen-lobby .lobby-visual");
  if (!visual) return null;
  let box = visual.querySelector("[data-format-box]");
  if (!box) {
    box = document.createElement("section");
    box.className = "cn-format-box";
    box.dataset.formatBox = "1";
    visual.appendChild(box);
  }
  return box;
}

function renderLobby(stateData) {
  const box = ensureLobbyBox();
  if (!box) return;
  const players = stateData?.players || [];
  const settings = stateData?.settings || {};
  const format = formatOf(settings, stateData?.mode);
  const me = players.find((player) => player.user_id === window.CODNAME?.getUser?.()?.id);
  const host = Boolean(me?.is_host);
  const red = playersFor(players, "red");
  const blue = playersFor(players, "blue");
  const enough = format === "1v1"
    ? players.length === 2 && red.length === 1 && blue.length === 1
    : players.length >= 4 && red.length >= 2 && blue.length >= 2;

  box.innerHTML = `
    <div class="cn-format-head"><b>نوع مسابقه</b><small>${format === "1v1" ? "۱ در برابر ۱" : "۲ به ۲ و بیشتر"}</small></div>
    <div class="cn-format-tabs">
      <button type="button" class="cn-format-tab ${format === "1v1" ? "active" : ""}" data-room-format="1v1" ${host ? "" : "disabled"}>۱ به ۱<small>هر بازیکن به نوبت بازی می‌کند</small></button>
      <button type="button" class="cn-format-tab ${format === "2v2" ? "active" : ""}" data-room-format="2v2" ${host ? "" : "disabled"}>۲ به ۲<small>تیمی و نوبتی، بدون سرنخ‌دهنده</small></button>
    </div>
    <div class="cn-team-summary">
      <div class="cn-team-card"><h4>🔴 تیم قرمز</h4><div class="cn-team-row">${red.length ? esc(red.map((p) => p.display_name || "بازیکن").join("، ")) : "هنوز بازیکنی نیست"}</div></div>
      <div class="cn-team-card"><h4>🔵 تیم آبی</h4><div class="cn-team-row">${blue.length ? esc(blue.map((p) => p.display_name || "بازیکن").join("، ")) : "هنوز بازیکنی نیست"}</div></div>
    </div>
    <p class="cn-team-note">در همه حالت‌ها سرنخ‌دهنده وجود ندارد؛ بازیکن‌ها خودشان و به نوبت کارت انتخاب می‌کنند. لیدر می‌تواند تیم هم‌تیمی‌ها را در لابی جابه‌جا کند.</p>
    ${host && !enough ? `<p class="cn-team-note">برای شروع این حالت حداقل ${requiredFor(format)} بازیکن لازم است${format === "2v2" ? " و هر تیم باید حداقل دو نفر داشته باشد" : ""}.</p>` : ""}
  `;

  box.querySelectorAll("[data-room-format]").forEach((button) => {
    button.addEventListener("click", () => changeFormat(button.dataset.roomFormat, players, settings));
  });
}

async function changeFormat(format, players, settings) {
  if (format !== "1v1" && format !== "2v2") return;
  if (format === "1v1" && players.length > 2) return toast("برای ۱ به ۱ حداکثر ۲ بازیکن باید در اتاق باشند.");
  const roomId = window.CODNAME?.getRoom?.()?.id;
  const user = window.CODNAME?.getUser?.();
  if (!roomId || !user) return;
  try {
    const supabase = getSupabase();
    const next = { ...(settings || {}), playerFormat: format, maxPlayers: format === "1v1" ? 2 : 8 };
    const { error } = await supabase.from("rooms").update({ settings: next, max_players: next.maxPlayers }).eq("id", roomId).eq("host_id", user.id);
    if (error) throw error;
    document.dispatchEvent(new CustomEvent("codname:room-format-changed", { detail: { format } }));
  } catch (error) {
    console.error(error);
    toast(error?.message || "تغییر نوع مسابقه انجام نشد.");
  }
}

function toast(message) {
  const t = document.querySelector("[data-toast]");
  if (!t) return;
  t.textContent = message;
  t.classList.add("is-visible");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => t.classList.remove("is-visible"), 3200);
}

function boot() {
  installStyles();
  document.addEventListener("codname:game-state", (event) => renderLobby(event.detail));
  document.addEventListener("codname:room-format-changed", () => window.CODNAME?.refresh?.());
  setTimeout(() => {
    const state = window.CODNAME?.getGameState?.();
    if (state) renderLobby(state);
  }, 150);
}

document.addEventListener("DOMContentLoaded", boot, { once: true });
