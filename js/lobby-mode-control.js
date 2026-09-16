// CODNAME — in-room mode + format selector.
// Classic / Expanded / Chaos can all run as 1v1 or 2v2. Duel is locked to 1v1.
const STYLE_ID = "codname-lobby-mode-control-v2";
const MODES = Object.freeze({
  classic: { label: "کلاسیک", size: 25, target: 7 },
  expanded: { label: "گسترده", size: 35, target: 10 },
  chaos: { label: "هرج‌ومرج", size: 36, target: 12 },
  duel: { label: "دوئل", size: 16, target: 5 }
});

const css = `
.cn-lobby-mode{margin-top:14px;padding:12px;border:1px solid rgba(255,255,255,.08);border-radius:16px;background:rgba(255,255,255,.035)}
.cn-lobby-mode-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:9px}.cn-lobby-mode-head b{font-size:13px}.cn-lobby-mode-current{font-size:10px;opacity:.65}
.cn-lobby-mode-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.cn-lobby-mode-btn{font:inherit;color:inherit;border:1px solid rgba(255,255,255,.1);border-radius:11px;padding:9px 6px;background:rgba(255,255,255,.035);cursor:pointer;transition:transform .15s ease,border-color .15s ease,background .15s ease}.cn-lobby-mode-btn:hover{transform:translateY(-1px)}.cn-lobby-mode-btn.is-active{border-color:rgba(74,143,255,.55);background:rgba(74,143,255,.15)}.cn-lobby-mode-btn:disabled{opacity:.52;cursor:not-allowed;transform:none}.cn-lobby-mode-btn small{display:block;margin-top:3px;opacity:.6;font-size:8px}
.cn-lobby-format{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px}.cn-lobby-format-btn{font:inherit;color:inherit;border:1px solid rgba(255,255,255,.1);border-radius:11px;padding:10px;background:rgba(255,255,255,.03);cursor:pointer}.cn-lobby-format-btn.is-active{border-color:rgba(222,177,65,.65);background:rgba(222,177,65,.12)}.cn-lobby-format-btn:disabled{opacity:.5;cursor:not-allowed}.cn-lobby-format-btn small{display:block;margin-top:3px;opacity:.58;font-size:8px}.cn-lobby-mode-note{margin-top:8px;font-size:9px;line-height:1.6;opacity:.6}
@media(max-width:700px){.cn-lobby-mode{margin-top:10px;padding:10px}.cn-lobby-mode-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.cn-lobby-mode-btn{min-height:48px}}
`;

function installStyles(){if(document.getElementById(STYLE_ID))return;const style=document.createElement("style");style.id=STYLE_ID;style.textContent=css;document.head.appendChild(style)}
function currentMode(state){return String(state?.mode||state?.settings?.mode||state?.settings?.gameMode||"classic")}
function currentFormat(state){return currentMode(state)==="duel"?"1v1":String(state?.settings?.playerFormat||state?.playerFormat||localStorage.getItem("codname-format")||"2v2")==="1v1"?"1v1":"2v2"}
function getHost(state){const id=window.CODNAME?.getUser?.()?.id;return Boolean((state?.players||[]).find((p)=>p.user_id===id)?.is_host)}

function render(state){
  const root=document.querySelector("#screen-lobby .lobby-visual");
  if(!root||!state||state.status!=="waiting"){document.querySelectorAll(".cn-lobby-mode").forEach((el)=>el.remove());return}
  let panel=root.querySelector(".cn-lobby-mode");
  if(!panel){
    panel=document.createElement("section");panel.className="cn-lobby-mode";
    const start=root.querySelector("[data-action='start-game']");if(start)root.insertBefore(panel,start);else root.appendChild(panel);
    panel.addEventListener("click",(event)=>{
      const modeBtn=event.target.closest("[data-lobby-mode]");
      if(modeBtn&&!modeBtn.disabled){document.dispatchEvent(new CustomEvent("codname:change-room-mode",{detail:{mode:modeBtn.dataset.lobbyMode}}));return}
      const formatBtn=event.target.closest("[data-lobby-format]");
      if(formatBtn&&!formatBtn.disabled)document.dispatchEvent(new CustomEvent("codname:change-room-format",{detail:{format:formatBtn.dataset.lobbyFormat}}));
    });
  }
  const mode=currentMode(state),format=currentFormat(state),host=getHost(state),duel=mode==="duel";
  panel.innerHTML=`<div class="cn-lobby-mode-head"><b>تنظیم مسابقه</b><span class="cn-lobby-mode-current">${MODES[mode]?.label||mode} • ${format==="1v1"?"۱ به ۱":"۲ به ۲"}</span></div><div class="cn-lobby-mode-grid">${Object.entries(MODES).map(([key,v])=>`<button type="button" class="cn-lobby-mode-btn ${mode===key?"is-active":""}" data-lobby-mode="${key}" ${host?"":"disabled"}>${v.label}<small>${v.size} کارت • هدف ${v.target}</small></button>`).join("")}</div><div class="cn-lobby-format"><button type="button" class="cn-lobby-format-btn ${format==="1v1"?"is-active":""}" data-lobby-format="1v1" ${host?"":"disabled"}>۱ به ۱<small>۲ بازیکن • یک نفر در هر تیم</small></button><button type="button" class="cn-lobby-format-btn ${format==="2v2"?"is-active":""}" data-lobby-format="2v2" ${host&&!duel?"":"disabled"}>۲ به ۲<small>۴ تا ۸ بازیکن • حداقل ۲ نفر در هر تیم</small></button></div><div class="cn-lobby-mode-note">در Classic، Expanded و Chaos هر دو فرمت ۱ به ۱ و ۲ به ۲ فعال است. Duel فقط ۱ به ۱ است. تغییر تنظیمات فقط برای لیدر ممکن است.</div>`;
}

function boot(){installStyles();document.addEventListener("codname:game-state",(event)=>render(event.detail))}
document.addEventListener("DOMContentLoaded",boot,{once:true});
