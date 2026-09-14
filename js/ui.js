import { signIn, signUp, signInWithGoogle, signOut } from "./auth.js";

const state = { refs: {}, user: null, profile: null, roomCode: null, authMode: "login", toastTimer: null, roomSettings: { mode: "classic", maxPlayers: 8, boardSize: 25 } };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export function initUI({ user, profile } = {}) {
  state.user = user || null;
  state.profile = profile || null;
  cacheRefs();
  bindButtons();
  bindAuth();
  renderProfile();
  renderAccount();
  renderAuthState();
}

function cacheRefs() {
  state.refs.loading=$("#screen-loading"); state.refs.menu=$("#screen-menu"); state.refs.lobby=$("#screen-lobby"); state.refs.game=$("#screen-game"); state.refs.result=$("#screen-result");
  state.refs.roomCode=$("[data-room-code]"); state.refs.players=$("[data-players]"); state.refs.board=$("[data-board]"); state.refs.clue=$("[data-clue]"); state.refs.turn=$("[data-turn]"); state.refs.scoreRed=$("[data-score-red]"); state.refs.scoreBlue=$("[data-score-blue]"); state.refs.profile=$("[data-profile]"); state.refs.toast=$("[data-toast]");
  state.refs.authModal=$("[data-auth-modal]"); state.refs.authForm=$("[data-auth-form]"); state.refs.authStatus=$("[data-auth-status]"); state.refs.authSubmit=$("[data-auth-submit]"); state.refs.signupOnly=$(".auth-signup-only");
  state.refs.joinModal=$("[data-join-modal]"); state.refs.joinForm=$("[data-join-form]");
}

function openWorkspaceFallback(panel){
  const workspace = window.CODNAME_WORKSPACE;
  if (workspace?.open) {
    workspace.open(panel);
    return true;
  }
  return false;
}

function bindButtons() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    const action = button?.dataset.action;
    if (!action) return;

    if (["create-room","join-room","join-room-quick","start-game","end-turn"].includes(action) && !state.user) {
      openAuth("login");
      setAuthStatus("ابتدا وارد حساب شوید یا یک حساب بسازید.", false);
      return;
    }

    if (action === "create-room") document.dispatchEvent(new CustomEvent("codname:create-room", { detail: { ...state.roomSettings } }));
    if (action === "join-room" || action === "join-room-quick") openJoin();
    if (action === "start-game") document.dispatchEvent(new CustomEvent("codname:start-game"));
    if (action === "end-turn") document.dispatchEvent(new CustomEvent("codname:end-turn"));
    if (action === "leave-room") document.dispatchEvent(new CustomEvent("codname:leave-room"));
    if (action === "back-menu" || action === "home") document.dispatchEvent(new CustomEvent("codname:back-menu"));
    if (action === "open-auth") openAuth("login");
    if (action === "close-auth") closeAuth();
    if (action === "google-login") handleGoogleLogin();
    if (action === "logout") handleLogout();
    if (action === "close-join") closeJoin();

    if (action === "show-profile") {
      if (!openWorkspaceFallback("profile")) focusSection(".account-panel", "پروفایل");
      return;
    }
    if (action === "show-leaderboard") {
      if (!openWorkspaceFallback("leaderboard")) focusSection(".ranking-panel", "رتبه‌بندی");
      return;
    }
    if (action === "show-decks") {
      if (!openWorkspaceFallback("decks")) focusSection(".lower-grid", "دسته‌های کارت");
      return;
    }
    if (action === "show-settings") {
      if (!openWorkspaceFallback("settings")) showError("تنظیمات در دسترس نیست.");
      return;
    }
    if (action === "show-modes") {
      if (!openWorkspaceFallback("modes")) focusSection(".primary-actions-grid", "حالت‌های بازی");
      return;
    }
  });

  $$('[data-mode-pick]').forEach(button => button.addEventListener("click", () => {
    $$('[data-mode-pick]').forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    const mode = button.dataset.modePick || "classic";
    state.roomSettings.mode = mode;
    state.roomSettings.boardSize = mode === "duel" ? 16 : mode === "classic" ? 25 : mode === "expanded" ? 35 : 36;
    showError(`حالت ${modeLabel(mode)} انتخاب شد.`);
  }));
}

function focusSection(selector, label) {
  const element = $(selector);
  if (!element) return showError(`${label} در این صفحه پیدا نشد.`);
  element.classList.remove("nav-focus");
  void element.offsetWidth;
  element.classList.add("nav-focus");
  showError(`${label} انتخاب شد.`);
}

function modeLabel(mode) { return ({ classic:"کلاسیک", expanded:"گسترده", chaos:"هرج‌ومرج", duel:"دوئل" }[mode] || mode); }

function openJoin() { const modal=state.refs.joinModal; if(!modal)return; if(typeof modal.showModal==="function")modal.showModal();else modal.setAttribute("open",""); setTimeout(()=>$("#join-code")?.focus(),40); }
function closeJoin() { const modal=state.refs.joinModal; if(!modal)return; if(typeof modal.close==="function")modal.close();else modal.removeAttribute("open"); }

function submitJoin() {
  const input=$("#join-code");
  const code=String(input?.value||"").trim().toUpperCase();
  if(!/^[A-Z0-9]{6}$/.test(code)){ showError("کد اتاق باید دقیقاً ۶ کاراکتر باشد."); input?.focus(); return false; }
  document.dispatchEvent(new CustomEvent("codname:join-room",{detail:{code}}));
  closeJoin();
  return true;
}

function bindAuth() {
  state.refs.joinForm?.addEventListener("submit", event => { event.preventDefault(); submitJoin(); });
  state.refs.authForm?.addEventListener("submit", async event => {
    event.preventDefault();
    const form=new FormData(event.currentTarget);
    const email=String(form.get("email")||"").trim();
    const password=String(form.get("password")||"");
    const username=String(form.get("username")||"").trim();
    setAuthBusy(true);
    setAuthStatus("در حال ارتباط با سرور...", false);
    try {
      if(state.authMode === "signup") {
        const data=await signUp({email,password,username});
        if(!data.session) {
          setAuthStatus("حساب ساخته شد. ایمیل تأیید را بررسی کن و سپس وارد شو.", false);
        } else {
          setAuthStatus("حساب با موفقیت ساخته شد.", false);
          setTimeout(()=>location.reload(),400);
        }
      } else {
        await signIn({email,password});
        setAuthStatus("ورود موفق بود.", false);
        setTimeout(()=>location.reload(),300);
      }
    } catch(error) {
      console.error(error);
      setAuthStatus(authErrorMessage(error), true);
    } finally { setAuthBusy(false); }
  });
  $$('[data-auth-tab]').forEach(tab => tab.addEventListener("click",()=>switchAuthMode(tab.dataset.authTab)));
}

async function handleGoogleLogin() {
  setAuthBusy(true);
  setAuthStatus("در حال انتقال به Google...", false);
  try { await signInWithGoogle(); }
  catch(error) { console.error(error); setAuthStatus(authErrorMessage(error), true); setAuthBusy(false); }
}

function openAuth(mode="login") { switchAuthMode(mode); const modal=state.refs.authModal; if(!modal)return; if(typeof modal.showModal==="function")modal.showModal();else modal.setAttribute("open",""); $("#auth-email")?.focus(); }
function closeAuth() { const modal=state.refs.authModal; if(!modal)return; if(typeof modal.close==="function")modal.close();else modal.removeAttribute("open"); }
function switchAuthMode(mode) { state.authMode=mode==="signup"?"signup":"login"; $$('[data-auth-tab]').forEach(tab=>tab.classList.toggle("is-active",tab.dataset.authTab===state.authMode)); if(state.refs.signupOnly)state.refs.signupOnly.hidden=state.authMode!=="signup"; setAuthSubmitText(); setAuthStatus("",false); }
function setAuthSubmitText() { if(state.refs.authSubmit)state.refs.authSubmit.textContent=state.authMode==="signup"?"ساخت حساب":"ورود"; }
function setAuthBusy(busy) { $$('[data-auth-form] input,[data-auth-form] button[type="submit"],[data-action="google-login"]').forEach(el=>el.disabled=busy); if(state.refs.authSubmit)state.refs.authSubmit.textContent=busy?"لطفاً صبر کنید...":(state.authMode==="signup"?"ساخت حساب":"ورود"); }
function setAuthStatus(message,isError){if(!state.refs.authStatus)return;state.refs.authStatus.textContent=message;state.refs.authStatus.classList.toggle("is-error",Boolean(isError));}
function authErrorMessage(error){const message=String(error?.message||"");if(/Invalid login credentials/i.test(message))return"ایمیل یا رمز عبور اشتباه است.";if(/User already registered/i.test(message))return"این ایمیل قبلاً ثبت شده است. وارد شوید.";if(/Email not confirmed/i.test(message))return"ایمیل هنوز تأیید نشده است.";if(/Password should be at least/i.test(message))return"رمز عبور کوتاه است.";if(/provider.*disabled|Unsupported provider/i.test(message))return"ورود با Google هنوز در Supabase فعال نشده است.";if(/redirect/i.test(message))return"آدرس بازگشت Google در Supabase تنظیم نشده است.";return message||"خطایی در ورود یا ثبت‌نام رخ داد.";}
async function handleLogout(){try{await signOut();location.reload();}catch(error){console.error(error);showError("خروج از حساب انجام نشد.");}}

function renderProfile(){ if(state.refs.profile)state.refs.profile.textContent=state.profile?.username||state.user?.email||"مهمان"; }
function renderAccount(){
  const n=$("[data-account-name]"),s=$("[data-account-status]"),l=$("[data-account-level]"),x=$("[data-account-xp]"),w=$("[data-account-wins]");
  if(n)n.textContent=state.profile?.username||state.user?.email?.split("@")[0]||"مهمان";
  if(s)s.textContent=state.user?"عملیات آماده است":"وارد نشده";
  if(l)l.textContent=state.profile?.level??"—";
  if(x)x.textContent=state.profile?.xp??"—";
  if(w)w.textContent=state.profile?.games_won??"—";
}
function renderAuthState(){ $$('.auth-trigger').forEach(el=>el.hidden=Boolean(state.user)); const logout=$("[data-action='logout']"); if(logout)logout.hidden=!state.user; }
export function showScreen(name){const m={loading:state.refs.loading,menu:state.refs.menu,lobby:state.refs.lobby,game:state.refs.game,result:state.refs.result};Object.values(m).forEach(el=>el?.classList.remove("is-active"));m[name]?.classList.add("is-active");}
export function showLoading(message="Loading..."){const text=state.refs.loading?.querySelector("[data-loading-text]");if(text)text.textContent=message;showScreen("loading");}
export function showError(message){console.error(message);if(state.refs.toast){state.refs.toast.textContent=message;state.refs.toast.classList.add("is-visible");clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>state.refs.toast?.classList.remove("is-visible"),3500);}}
export function showLobby(data={}){state.roomCode=data.roomCode||state.roomCode;$$('[data-room-code]').forEach(el=>el.textContent=state.roomCode||"------");renderPlayers(data.players||[]);const start=$("[data-action='start-game']");const isHost=data.players?.find(p=>p.user_id===data.user?.id)?.is_host;if(start)start.disabled=!isHost||(data.players||[]).length<2;}
export function showGame({game}={}){renderBoard(game?.board||[],game?.revealed||[],game?.currentTurn);renderPlayers(game?.players||[]);}
export function updatePlayerList(players=[]){renderPlayers(players);}
function renderPlayers(players){if(!state.refs.players)return;state.refs.players.innerHTML="";for(const player of players){const item=document.createElement("div");item.className=`player-item team-${player.team||"neutral"}`;item.innerHTML=`<span>${player.last_seen_at?"●":"○"}</span><strong>${escapeHtml(player.display_name||"Player")}</strong><small>${escapeHtml(player.team||"pending")}</small>${player.is_host?"<em>HOST</em>":""}`;state.refs.players.appendChild(item);}}
function renderBoard(board=[],revealed=[],currentTurn){if(!state.refs.board)return;state.refs.board.innerHTML="";const isTurn=currentTurn&&state.user?.id===currentTurn;for(const card of board){const shown=revealed.includes(card.position)||card.revealed;const button=document.createElement("button");button.type="button";button.className=`word-card ${shown?"is-revealed":""} ${card.bonus?"is-bonus":""}`;button.disabled=shown||!isTurn;button.dataset.cardId=card.id;button.innerHTML=`<span class="word">${escapeHtml(card.word)}</span><span class="card-index">${card.position+1}</span>`;if(shown&&card.type)button.dataset.type=card.type;button.addEventListener("click",()=>document.dispatchEvent(new CustomEvent("codname:select-card",{detail:{cardId:card.id}})));state.refs.board.appendChild(button);}}
export function updateGameUI(game={}){renderBoard(game.board||[],game.revealed||[],game.currentTurn);renderPlayers(game.players||[]);if(state.refs.clue)state.refs.clue.textContent=game.clue?`${game.clue.text} × ${game.clue.number}`:"بدون سرنخ";if(state.refs.turn)state.refs.turn.textContent=game.turnTeam?`نوبت تیم ${game.turnTeam==="red"?"قرمز":"آبی"}`:"-";if(state.refs.scoreRed)state.refs.scoreRed.textContent=String(game.scores?.red||0);if(state.refs.scoreBlue)state.refs.scoreBlue.textContent=String(game.scores?.blue||0);if(game.winnerTeam)showResult(game.winnerTeam,game.scores);}
function showResult(team,scores={}){$("[data-winner]")&&($("[data-winner]").textContent=team==="red"?"تیم قرمز برنده شد":"تیم آبی برنده شد");$("[data-final-score]")&&($("[data-final-score]").textContent=`${scores.red||0} - ${scores.blue||0}`);}
function escapeHtml(value){return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
