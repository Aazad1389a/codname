import "./pre.js";

// CODNAME mobile layout + install experience
const CSS = `
/* Keep every screen usable on touch devices. */
html,body{width:100%;min-height:100%;overflow:hidden;overscroll-behavior:none;-webkit-text-size-adjust:100%;}
.app-shell{width:100%;height:100dvh;min-height:100svh;overflow:hidden;}
#screen-menu,#screen-lobby,#screen-game,#screen-result{overscroll-behavior:contain;-webkit-overflow-scrolling:touch;}

#screen-menu .side-nav{position:absolute!important;left:0!important;right:auto!important;top:0!important;bottom:0!important;width:94px!important;height:100%!important;z-index:50!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:space-between!important;padding:18px 10px!important;background:linear-gradient(180deg,rgba(3,6,12,.96),rgba(4,7,13,.88))!important;border-right:1px solid rgba(255,255,255,.1)!important;border-left:0!important;box-shadow:18px 0 55px rgba(0,0,0,.28)!important}
#screen-menu .side-brand{width:54px;height:54px;display:grid;place-items:center;border-radius:16px;background:linear-gradient(145deg,rgba(255,39,58,.18),rgba(45,124,255,.12));border:1px solid rgba(255,255,255,.1);margin-bottom:18px}
#screen-menu .side-brand img{width:38px;height:38px;display:block}
#screen-menu .side-nav nav,#screen-menu .side-bottom{width:100%;display:flex;flex-direction:column;align-items:center;gap:8px}
#screen-menu .side-item{appearance:none!important;-webkit-appearance:none!important;width:100%!important;min-height:58px!important;padding:8px 5px!important;border:1px solid transparent!important;border-radius:14px!important;background:transparent!important;color:#aab4c4!important;cursor:pointer!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:4px!important;box-shadow:none!important;font-family:inherit!important}
#screen-menu .side-item span{font-size:19px!important;line-height:1!important}#screen-menu .side-item b{font-size:8px!important;font-weight:700!important;white-space:nowrap!important}
#screen-menu .side-item:hover{color:#fff!important;background:rgba(255,255,255,.055)!important;border-color:rgba(255,255,255,.07)!important;transform:translateX(2px)!important}
#screen-menu .side-item.is-active{color:#fff!important;background:linear-gradient(135deg,rgba(255,39,58,.16),rgba(255,255,255,.035))!important;border-color:rgba(255,57,76,.22)!important;box-shadow:inset 3px 0 0 #ff2940,0 12px 30px rgba(0,0,0,.16)!important}
#screen-menu .menu-main{margin-left:94px!important;padding-left:0!important;min-width:0!important;height:100%!important;display:flex!important;flex-direction:column!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior-y:contain!important}
#screen-menu .menu-main>.topbar{padding-left:22px!important;padding-right:22px!important}
#screen-menu .reference-layout{width:100%!important;max-width:none!important}
.github-login-btn{background:linear-gradient(135deg,#24292f,#111418)!important;color:#fff!important;border:1px solid rgba(255,255,255,.12)!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:10px!important}
.github-login-btn:hover{filter:brightness(1.12)!important;transform:translateY(-1px)!important}
.github-mark{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#fff;color:#111;font-size:9px;font-weight:900;font-family:Arial,sans-serif}

.cn-install-backdrop{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.72);backdrop-filter:blur(12px);display:none;align-items:center;justify-content:center;padding:18px}
.cn-install-backdrop.is-open{display:flex;animation:cnInstallFade .22s ease both}
.cn-install-card{width:min(620px,100%);border:1px solid rgba(255,255,255,.12);border-radius:28px;padding:28px;background:linear-gradient(145deg,rgba(15,21,32,.97),rgba(5,8,14,.96));box-shadow:0 40px 120px rgba(0,0,0,.58);position:relative;overflow:hidden}
.cn-install-card:before{content:"";position:absolute;width:300px;height:300px;right:-90px;top:-120px;border-radius:50%;background:radial-gradient(circle,rgba(45,124,255,.18),transparent 68%);pointer-events:none}
.cn-install-close{position:absolute;right:16px;top:14px;width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:#fff;cursor:pointer;font-size:22px}
.cn-install-head{display:flex;align-items:center;gap:14px;margin-bottom:20px}.cn-install-head img{width:56px;height:56px}.cn-install-head h2{margin:0;font-size:25px}.cn-install-head p{margin:5px 0 0;color:#8995a9;font-size:11px}
.cn-install-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:16px 0}.cn-install-option{border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:16px;background:rgba(255,255,255,.035);color:#fff;text-align:center}.cn-install-option .icon{font-size:26px;margin-bottom:7px}.cn-install-option b{display:block;font-size:12px}.cn-install-option small{display:block;color:#7f8ba0;font-size:9px;line-height:1.7;margin-top:5px}
.cn-install-primary{width:100%;min-height:48px;border:0;border-radius:14px;background:linear-gradient(135deg,#ff3a49,#ca1128);color:#fff;font-weight:800;cursor:pointer;box-shadow:0 14px 32px rgba(255,36,56,.18)}.cn-install-secondary{width:100%;min-height:44px;margin-top:8px;border-radius:14px;border:1px solid rgba(255,255,255,.11);background:rgba(255,255,255,.045);color:#e9edf4;cursor:pointer}.cn-install-note{margin:14px 2px 0;color:#7e899b;font-size:9px;line-height:1.8}@keyframes cnInstallFade{from{opacity:0;transform:scale(.985)}to{opacity:1;transform:none}}

.team-switch{grid-column:1 / -1;display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:4px}.team-btn{min-height:34px;border-radius:9px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.045);color:#dce3ed;cursor:pointer;font-size:10px;font-weight:800}.team-btn-red.is-selected{background:rgba(255,36,56,.2);border-color:rgba(255,36,56,.5);color:#ff8a94}.team-btn-blue.is-selected{background:rgba(45,124,255,.2);border-color:rgba(45,124,255,.5);color:#82b3ff}

#screen-lobby{overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior-y:contain!important;}
#screen-lobby .lobby-layout{min-height:max-content!important;padding-bottom:120px!important;}
#screen-lobby .players-panel{min-width:0}
#screen-game{overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior-y:contain!important;}

@media(max-width:700px){
  #screen-menu .side-nav{left:0!important;right:0!important;top:auto!important;bottom:0!important;width:100%!important;height:64px!important;min-height:64px!important;padding:4px 7px!important;flex-direction:row!important;border-right:0!important;border-top:1px solid rgba(255,255,255,.1)!important;border-radius:0!important}
  #screen-menu .side-brand,#screen-menu .side-bottom{display:none!important}
  #screen-menu .side-nav nav{width:100%!important;height:100%!important;display:grid!important;grid-template-columns:repeat(6,1fr)!important;gap:4px!important;align-items:stretch!important}
  #screen-menu .side-item{min-height:50px!important;height:50px!important;padding:4px!important;border-radius:11px!important}
  #screen-menu .side-item span{font-size:16px!important}
  #screen-menu .side-item b{font-size:7px!important}
  #screen-menu .menu-main{margin-left:0!important;padding:0 0 82px!important;min-height:0!important;overflow-y:auto!important;overscroll-behavior-y:contain!important}
  #screen-menu .menu-main>.topbar{height:64px!important;min-height:64px!important;padding:0 12px!important}
  #screen-menu .menu-main>.reference-layout{padding:0 12px 34px!important}
  #screen-menu .reference-center{padding-bottom:40px!important}
  #screen-menu .reference-right{padding-bottom:20px!important}
  #screen-menu .reference-hero{min-height:430px!important;margin-bottom:14px!important}
  #screen-menu .hero-copy{padding:22px 18px!important}
  #screen-menu .hero-copy h1{font-size:clamp(32px,10vw,48px)!important;letter-spacing:-1px!important}
  #screen-menu .hero-actions{flex-direction:column!important;gap:9px!important}
  #screen-menu .hero-actions .xl{width:100%!important}
  #screen-menu .primary-actions-grid,#screen-menu .lower-grid{grid-template-columns:1fr!important}
  #screen-menu .primary-actions-grid{gap:12px!important}
  #screen-menu .lower-grid{gap:10px!important;padding-bottom:18px!important}
  #screen-menu .reference-right{display:grid!important;grid-template-columns:1fr!important;gap:12px!important}
  #screen-menu .account-panel,#screen-menu .ranking-panel,#screen-menu .recent-panel{width:100%!important;min-width:0!important}
  #screen-menu .platform-bar{height:auto!important;min-height:52px!important;display:flex!important;flex-wrap:wrap!important;gap:8px!important;padding:12px 14px!important;margin-top:10px!important}
  #screen-menu .platforms{flex-wrap:wrap!important;gap:8px 12px!important}

  /* The mode selector opens inside a scrollable workspace on mobile. */
  .cnw{align-items:flex-start!important;justify-content:flex-start!important;padding:8px!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important}
  .cnw-box{width:100%!important;max-width:none!important;min-height:calc(100svh - 16px)!important;max-height:none!important;grid-template-columns:1fr!important;display:flex!important;flex-direction:column!important}
  .cnw-side{flex:none!important;border-left:0!important;border-bottom:1px solid rgba(255,255,255,.08)!important;padding:10px!important;position:sticky!important;top:0!important;z-index:3!important;background:linear-gradient(145deg,#121a29,#070c15)!important}
  .cnw-nav{display:flex!important;gap:6px!important;overflow-x:auto!important;padding-bottom:2px!important;-webkit-overflow-scrolling:touch!important;scrollbar-width:none!important}
  .cnw-nav::-webkit-scrollbar{display:none}
  .cnw-nav button{flex:0 0 auto!important;min-width:82px!important;white-space:nowrap!important;text-align:center!important;font-size:11px!important;padding:9px 10px!important}
  .cnw-main{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;padding:12px!important;padding-bottom:80px!important}
  .cnw-grid{grid-template-columns:1fr!important}
  .cnw-stats{grid-template-columns:repeat(2,1fr)!important}
  .cnw-cards{grid-template-columns:repeat(3,minmax(0,1fr))!important;max-height:none!important;overflow:visible!important}
  .cnw-card{min-width:0!important}

  /* Prevent a giant centered start CTA from covering the mobile menu. */
  #screen-menu [data-action="start-game"],
  #screen-menu .start-game-overlay,
  #screen-menu .mobile-start-overlay{position:static!important;transform:none!important;}

  #screen-lobby{padding:10px 10px 84px!important;display:block!important;}
  #screen-lobby .topbar{height:58px!important;min-height:58px!important;padding:0 6px!important}
  #screen-lobby .topbar .brand img{width:140px!important}
  #screen-lobby .lobby-layout{width:100%!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:12px!important;margin:0!important;padding-bottom:60px!important}
  #screen-lobby .lobby-visual,#screen-lobby .players-panel{width:100%!important;padding:18px!important;border-radius:18px!important;flex:none!important}
  #screen-lobby .lobby-visual{min-height:320px!important}
  #screen-lobby .players-panel{min-height:320px!important}
  #screen-lobby .players{max-height:none!important;overflow:visible!important}
  #screen-lobby .player-item{grid-template-columns:20px 1fr auto!important;gap:7px!important}
  #screen-lobby .team-switch{grid-column:1 / -1!important}
  #screen-lobby .lobby-visual .primary-btn{width:100%!important}

  #screen-game{padding:10px 10px 24px!important;min-height:100dvh!important}
  #screen-game .game-layout{display:flex!important;flex-direction:column!important;gap:12px!important;min-height:max-content!important;padding-bottom:50px!important}
  #screen-game .board-wrap{min-height:unset!important}
  #screen-game .board{height:auto!important;aspect-ratio:1 / 1.05;width:100%!important;gap:6px!important}
  #screen-game .side-panel{width:100%!important;order:2!important}
  #screen-game .gamebar{flex:none!important}
}
@media(min-width:701px){
  #screen-lobby,#screen-game{overflow-y:auto!important;}
}
@media(prefers-reduced-motion:reduce){.cn-install-backdrop.is-open{animation:none!important}}
`;
function installStyles(){if(document.getElementById('codname-ui-fixes'))return;const style=document.createElement('style');style.id='codname-ui-fixes';style.textContent=CSS;document.head.appendChild(style)}
let deferredPrompt=null;
function createInstallModal(){if(document.getElementById('cn-install'))return;const modal=document.createElement('div');modal.id='cn-install';modal.className='cn-install-backdrop';modal.innerHTML=`<section class="cn-install-card" role="dialog" aria-modal="true" aria-labelledby="cn-install-title"><button class="cn-install-close" type="button" data-install-close aria-label="بستن">×</button><div class="cn-install-head"><img src="./assets/icon-192.svg" alt="CODNAME"><div><h2 id="cn-install-title">نصب CODNAME</h2><p>بازی را مثل یک اپلیکیشن روی دستگاهت داشته باش.</p></div></div><div class="cn-install-grid"><div class="cn-install-option"><div class="icon">▣</div><b>Windows / Chrome</b><small>دکمه نصب را بزن و برنامه را به دسکتاپ اضافه کن.</small></div><div class="cn-install-option"><div class="icon">◆</div><b>Android</b><small>از Chrome گزینه Add to Home screen یا Install App را انتخاب کن.</small></div><div class="cn-install-option"><div class="icon">●</div><b>iPhone / iPad</b><small>Share → Add to Home Screen را انتخاب کن.</small></div></div><button class="cn-install-primary" type="button" data-install-now>نصب برنامه</button><button class="cn-install-secondary" type="button" data-install-refresh>راهنمای نصب را دوباره نشان بده</button><p class="cn-install-note" data-install-note>در مرورگرهایی که نصب خودکار را پشتیبانی نمی‌کنند، راهنمای مربوط به همان دستگاه نمایش داده می‌شود.</p></section>`;document.body.appendChild(modal);const close=()=>modal.classList.remove('is-open');modal.addEventListener('click',e=>{if(e.target===modal)close()});modal.querySelector('[data-install-close]').addEventListener('click',close);modal.querySelector('[data-install-now]').addEventListener('click',async()=>{if(deferredPrompt){deferredPrompt.prompt();try{await deferredPrompt.userChoice}catch{}deferredPrompt=null;close();return}const note=modal.querySelector('[data-install-note]');const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);const standalone=window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone;if(standalone){note.textContent='CODNAME همین حالا به‌صورت برنامه نصب‌شده اجرا می‌شود.';return}note.textContent=isIOS?'در iPhone/iPad: Share → Add to Home Screen را بزن.':'از منوی مرورگر گزینه Install app یا Add to home screen را انتخاب کن.'});modal.querySelector('[data-install-refresh]').addEventListener('click',()=>{modal.querySelector('[data-install-note]').textContent=deferredPrompt?'این دستگاه آماده‌ی نصب مستقیم است. روی «نصب برنامه» بزن.':'برای این مرورگر، راهنمای نصب دستی نمایش داده می‌شود.'})}
function openInstall(){createInstallModal();document.getElementById('cn-install')?.classList.add('is-open')}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredPrompt=event;const button=document.querySelector('[data-action="show-install"]');if(button)button.classList.add('install-ready')});window.addEventListener('appinstalled',()=>{deferredPrompt=null});document.addEventListener('click',event=>{const action=event.target.closest('[data-action]')?.dataset.action;if(action==='show-install')openInstall()});document.addEventListener('keydown',event=>{if(event.key==='Escape')document.getElementById('cn-install')?.classList.remove('is-open')});installStyles();createInstallModal();