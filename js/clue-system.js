import { submitClue } from "./game.js";

const STYLE_ID = "codname-clue-system-style";

function installStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .cn-clue-box{width:min(620px,100%);margin:0 auto 10px;padding:12px 14px;border:1px solid rgba(255,255,255,.1);border-radius:16px;background:linear-gradient(145deg,rgba(10,16,26,.9),rgba(5,9,15,.82));box-shadow:0 14px 40px rgba(0,0,0,.25)}
    .cn-clue-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:9px}.cn-clue-head strong{font-size:13px}.cn-clue-head small{font-size:10px;opacity:.62}
    .cn-clue-form{display:grid;grid-template-columns:minmax(0,1fr) 120px auto;gap:8px;align-items:end}.cn-clue-field{display:flex;flex-direction:column;gap:5px}.cn-clue-field label{font-size:9px;opacity:.6}.cn-clue-field input{width:100%;height:42px;border:1px solid rgba(255,255,255,.11);border-radius:11px;background:rgba(255,255,255,.045);color:#fff;padding:0 11px;outline:none}.cn-clue-field input:focus{border-color:rgba(74,143,255,.65);box-shadow:0 0 0 3px rgba(74,143,255,.1)}.cn-clue-submit{height:42px;border:0;border-radius:11px;padding:0 15px;background:linear-gradient(135deg,#ff3a49,#ca1128);color:#fff;font-weight:800;cursor:pointer}.cn-clue-submit:disabled{opacity:.4;cursor:not-allowed}.cn-clue-info{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.cn-clue-pill{padding:7px 10px;border-radius:10px;background:rgba(255,255,255,.05);font-size:10px}.cn-clue-pill b{font-size:13px;margin-right:4px}.cn-clue-warning{font-size:10px;color:#ffb6bd;line-height:1.7;margin-top:7px}
    @media(max-width:700px){.cn-clue-box{margin-bottom:8px;padding:10px}.cn-clue-form{grid-template-columns:1fr 92px}.cn-clue-submit{grid-column:1/-1;width:100%}.cn-clue-field input{height:40px}.cn-clue-box{position:sticky;top:0;z-index:8}}
  `;
  document.head.appendChild(style);
}

function currentName(state, userId) {
  return state?.players?.find(p => p.user_id === userId)?.display_name || "بازیکن";
}

function mount() {
  installStyles();
  const gamebar = document.querySelector("#screen-game .gamebar");
  if (!gamebar) return null;
  let box = gamebar.querySelector("[data-clue-box]");
  if (!box) {
    box = document.createElement("div");
    box.dataset.clueBox = "1";
    box.className = "cn-clue-box";
    gamebar.parentNode.insertBefore(box, gamebar.nextSibling);
  }
  return box;
}

function render(state) {
  const box = mount();
  if (!box || !state) return;
  const user = window.CODNAME?.getUser?.();
  const myId = user?.id;
  const clueGiver = state.clueGiver === myId;
  const myTurn = state.currentTurn === myId;
  const teamLabel = state.turnTeam === "red" ? "قرمز" : "آبی";
  const clue = state.clue;

  if (state.status !== "playing") {
    box.innerHTML = "";
    box.style.display = "none";
    return;
  }

  box.style.display = "block";
  if (state.phase === "clue" && clueGiver) {
    box.innerHTML = `<div class="cn-clue-head"><strong>🎯 سرنخ تیم ${teamLabel}</strong><small>یک کلمه + تعداد کارت‌های مرتبط</small></div>
      <form class="cn-clue-form" data-clue-form>
        <div class="cn-clue-field"><label for="cn-clue-text">سرنخ</label><input id="cn-clue-text" name="clue" maxlength="40" autocomplete="off" placeholder="مثلاً: دریا"></div>
        <div class="cn-clue-field"><label for="cn-clue-number">تعداد کارت</label><input id="cn-clue-number" name="number" type="number" min="1" max="9" step="1" inputmode="numeric" placeholder="مثلاً 2" required></div>
        <button class="cn-clue-submit" type="submit">ثبت سرنخ</button>
      </form>
      <div class="cn-clue-warning">عدد نشان می‌دهد چند کارت روی صفحه با این سرنخ ارتباط دارند.</div>`;
    const form = box.querySelector("[data-clue-form]");
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const text = String(new FormData(form).get("clue") || "").trim();
      const number = Number(new FormData(form).get("number"));
      const button = form.querySelector("button");
      button.disabled = true;
      button.textContent = "در حال ثبت...";
      try {
        await submitClue({ roomId: window.CODNAME?.getRoom?.()?.id, userId: myId, text, number });
        await window.CODNAME?.refresh?.();
      } catch (error) {
        console.error(error);
        window.dispatchEvent(new CustomEvent("codname:clue-error", { detail: { message: error?.message || "ثبت سرنخ انجام نشد." } }));
        button.disabled = false;
        button.textContent = "ثبت سرنخ";
      }
    });
    box.querySelector("#cn-clue-text")?.focus();
    return;
  }

  if (state.phase === "clue") {
    box.innerHTML = `<div class="cn-clue-head"><strong>🎯 انتظار برای سرنخ تیم ${teamLabel}</strong><small>سرنخ‌دهنده: ${currentName(state, state.clueGiver)}</small></div>`;
    return;
  }

  box.innerHTML = `<div class="cn-clue-head"><strong>🧠 نوبت حدس تیم ${teamLabel}</strong><small>${myTurn ? "الان نوبت توست" : `نوبت: ${currentName(state, state.currentTurn)}`}</small></div>
    <div class="cn-clue-info">
      <div class="cn-clue-pill">سرنخ: <b>${escapeHtml(clue?.text || "—")}</b></div>
      <div class="cn-clue-pill">تعداد کارت: <b>${Number(clue?.number || 0)}</b></div>
      <div class="cn-clue-pill">حدس باقی‌مانده: <b>${Number(state.guessesLeft || 0)}</b></div>
    </div>`;
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function boot() {
  document.addEventListener("codname:game-state", e => render(e.detail));
  document.addEventListener("codname:clue-error", e => {
    const message = e.detail?.message || "ثبت سرنخ انجام نشد.";
    const toast = document.querySelector("[data-toast]");
    if (toast) {
      toast.textContent = message;
      toast.classList.add("is-visible");
      setTimeout(() => toast.classList.remove("is-visible"), 3500);
    }
  });
  setTimeout(() => render(window.CODNAME?.getGameState?.()), 100);
}

document.addEventListener("DOMContentLoaded", boot, { once: true });
