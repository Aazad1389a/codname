import { submitClue } from "./game.js";

const STYLE_ID = "codname-clue-system-style";
function installStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .cn-clue-box{width:min(620px,100%);margin:0 auto 10px;padding:12px 14px;border:1px solid rgba(255,255,255,.1);border-radius:16px;background:linear-gradient(145deg,rgba(10,16,26,.9),rgba(5,9,15,.82));box-shadow:0 14px 40px rgba(0,0,0,.25)}
    .cn-clue-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:9px}.cn-clue-head strong{font-size:13px}.cn-clue-head small{font-size:10px;opacity:.62}
    .cn-clue-form{display:grid;grid-template-columns:minmax(0,1fr) 120px auto;gap:8px;align-items:end}.cn-clue-field{display:flex;flex-direction:column;gap:5px}.cn-clue-field label{font-size:9px;opacity:.6}.cn-clue-field input{width:100%;height:42px;box-sizing:border-box;border:1px solid rgba(255,255,255,.11);border-radius:11px;background:rgba(255,255,255,.045);color:#fff;padding:0 11px;outline:none}.cn-clue-field input:focus{border-color:rgba(74,143,255,.65);box-shadow:0 0 0 3px rgba(74,143,255,.1)}.cn-clue-submit{height:42px;border:0;border-radius:11px;padding:0 15px;background:linear-gradient(135deg,#ff3a49,#ca1128);color:#fff;font-weight:800;cursor:pointer}.cn-clue-submit:disabled{opacity:.4;cursor:not-allowed}.cn-clue-info{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.cn-clue-pill{padding:7px 10px;border-radius:10px;background:rgba(255,255,255,.05);font-size:10px}.cn-clue-pill b{font-size:13px;margin-right:4px}.cn-clue-warning{font-size:10px;color:#ffb6bd;line-height:1.7;margin-top:7px}
    .cn-role-lock{padding:10px;border-radius:11px;background:rgba(255,255,255,.035);font-size:10px;line-height:1.8;text-align:center}
    @media(max-width:700px){.cn-clue-box{margin-bottom:8px;padding:10px}.cn-clue-form{grid-template-columns:1fr 92px}.cn-clue-submit{grid-column:1/-1;width:100%}.cn-clue-field input{height:40px}}
  `;
  document.head.appendChild(style);
}
function currentName(state,userId){return state?.players?.find(p=>p.user_id===userId)?.display_name||"بازیکن"}
function roleFor(state,userId){
  const team=state?.players?.find(p=>p.user_id===userId)?.team;
  const role=team&&state?.teamRoles?.[team];
  return{team,clueGiver:role?.clueGiver||null,guessers:role?.guessers||[]};
}
function mount(){
  installStyles();
  const gamebar=document.querySelector("#screen-game .gamebar");
  if(!gamebar)return null;
  let box=gamebar.parentNode.querySelector("[data-clue-box]");
  if(!box){box=document.createElement("div");box.dataset.clueBox="1";box.className="cn-clue-box";gamebar.parentNode.insertBefore(box,gamebar.nextSibling)}
  return box;
}
function render(state){
  const box=mount();
  if(!box||!state)return;
  const myId=window.CODNAME?.getUser?.()?.id;
  if(state.status!=="playing"){box.innerHTML="";box.style.display="none";return}
  const {team,clueGiver,guessers}=roleFor(state,myId);
  const activeTeam=state.turnTeam;
  const teamLabel=activeTeam==="red"?"قرمز":"آبی";
  const isActiveClueGiver=myId===clueGiver&&team===activeTeam;
  const isActiveGuesser=guessers.includes(myId)&&team===activeTeam;
  const oneOnOne=(state.playerFormat||state.settings?.playerFormat)==="1v1";
  box.style.display="block";

  if(state.phase==="clue"){
    if(isActiveClueGiver){
      box.innerHTML=`<div class="cn-clue-head"><strong>🎯 سرنخ تیم ${teamLabel}</strong><small>${oneOnOne?"۱ به ۱ — سرنخ و پاسخ با خودت":"۲ به ۲+ — فقط سرنخ تیم خودت"}</small></div>
        <form class="cn-clue-form" data-clue-form>
          <div class="cn-clue-field"><label for="cn-clue-text">سرنخ</label><input id="cn-clue-text" name="clue" maxlength="40" autocomplete="off" placeholder="مثلاً: دریا"></div>
          <div class="cn-clue-field"><label for="cn-clue-number">تعداد کارت</label><input id="cn-clue-number" name="number" type="number" min="1" max="9" step="1" inputmode="numeric" placeholder="۲" required></div>
          <button class="cn-clue-submit" type="submit">ثبت سرنخ</button>
        </form>
        <div class="cn-clue-warning">این فرم فقط برای سرنخ‌دهنده تیم فعال است؛ دستگاه تو سرنخ تیم مقابل را نمایش یا دریافت نمی‌کند.</div>`;
      const form=box.querySelector("[data-clue-form]");
      form.addEventListener("submit",async e=>{e.preventDefault();const fd=new FormData(form);const text=String(fd.get("clue")||"").trim();const number=Number(fd.get("number"));const button=form.querySelector("button");button.disabled=true;button.textContent="در حال ثبت...";try{await submitClue({roomId:window.CODNAME?.getRoom?.()?.id,userId:myId,text,number});await window.CODNAME?.refresh?.()}catch(error){console.error(error);button.disabled=false;button.textContent="ثبت سرنخ";const t=document.querySelector("[data-toast]");if(t){t.textContent=error?.message||"ثبت سرنخ انجام نشد.";t.classList.add("is-visible")}}});
      return;
    }
    if(isActiveGuesser){
      box.innerHTML=`<div class="cn-clue-head"><strong>🧠 منتظر سرنخ</strong><small>پیدا کننده: ${currentName(state,myId)}</small></div><div class="cn-role-lock">سرنخ‌دهنده ${currentName(state,clueGiver)} در حال ثبت سرنخ تیم ${teamLabel} است.</div>`;
      return;
    }
    box.innerHTML=`<div class="cn-clue-head"><strong>🎯 نوبت تیم ${teamLabel}</strong><small>سرنخ‌دهنده: ${currentName(state,clueGiver)}</small></div>`;
    return;
  }

  if(isActiveGuesser || (oneOnOne && myId===clueGiver)){
    const clue=state.clue;
    box.innerHTML=`<div class="cn-clue-head"><strong>🧠 نوبت پیدا کردن کارت</strong><small>${isActiveGuesser?"پیدا کننده":"۱ به ۱ — خودت پاسخ می‌دهی"}</small></div><div class="cn-clue-info"><div class="cn-clue-pill">سرنخ: <b>${escapeHtml(clue?.text||"—")}</b></div><div class="cn-clue-pill">تعداد کارت: <b>${Number(clue?.number||0)}</b></div><div class="cn-clue-pill">حدس باقی‌مانده: <b>${Number(state.guessesLeft||0)}</b></div></div>`;
    return;
  }
  if(myId===clueGiver){
    box.innerHTML=`<div class="cn-clue-head"><strong>✅ سرنخ ثبت شد</strong><small>حالا پیدا کننده‌های تیم جواب می‌دهند.</small></div><div class="cn-role-lock">سرنخ تو: ${escapeHtml(state.clue?.text||"—")} × ${Number(state.clue?.number||0)}</div>`;
    return;
  }
  box.innerHTML=`<div class="cn-clue-head"><strong>🧠 حدس تیم ${teamLabel}</strong><small>نوبت: ${currentName(state,state.currentTurn)}</small></div><div class="cn-role-lock">سرنخ این تیم فقط برای بازیکنان همان تیم نمایش داده می‌شود.</div>`;
}
function escapeHtml(value){return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function boot(){document.addEventListener("codname:game-state",e=>render(e.detail));setTimeout(()=>render(window.CODNAME?.getGameState?.()),100)}
document.addEventListener("DOMContentLoaded",boot,{once:true});
