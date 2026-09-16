// CODNAME — lightweight cinematic motion layer.
// Pure HTML/CSS/SVG; no external video dependency and no pointer interception.
const STYLE_ID = "codname-visual-motion-v1";

const css = `
.cn-motion-trailer{position:relative;min-height:220px;margin:12px 0 14px;overflow:hidden;border:1px solid rgba(255,255,255,.1);border-radius:20px;background:radial-gradient(circle at 75% 35%,rgba(70,140,255,.22),transparent 32%),radial-gradient(circle at 20% 70%,rgba(255,80,120,.16),transparent 34%),linear-gradient(135deg,#07101f,#090b14);isolation:isolate}
.cn-motion-trailer::before{content:"";position:absolute;inset:-30%;background:conic-gradient(from 0deg,transparent,rgba(87,153,255,.18),transparent 28%,rgba(255,90,130,.12),transparent 54%);animation:cnMotionSpin 10s linear infinite;z-index:-1}
.cn-motion-trailer::after{content:"";position:absolute;left:-20%;right:-20%;bottom:26%;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.8),transparent);box-shadow:0 0 22px rgba(100,160,255,.6);animation:cnMotionScan 4.5s ease-in-out infinite;opacity:.7}
.cn-motion-inner{position:absolute;inset:0;display:flex;align-items:center;justify-content:space-between;gap:18px;padding:22px 26px;box-sizing:border-box}
.cn-motion-copy{max-width:48%;position:relative;z-index:2}.cn-motion-copy small{display:block;font-size:9px;letter-spacing:.16em;opacity:.65}.cn-motion-copy b{display:block;margin-top:6px;font-size:clamp(20px,2.4vw,34px);line-height:1.05}.cn-motion-copy span{display:block;margin-top:8px;font-size:10px;opacity:.65;line-height:1.7}
.cn-motion-board{position:relative;width:min(310px,46%);aspect-ratio:1.15;transform:perspective(600px) rotateY(-12deg) rotateX(4deg);animation:cnMotionFloat 4.4s ease-in-out infinite;filter:drop-shadow(0 18px 35px rgba(0,0,0,.35))}
.cn-motion-card{position:absolute;width:25%;height:35%;display:grid;place-items:center;border-radius:10px;border:1px solid rgba(255,255,255,.16);font-weight:900;font-size:14px;background:linear-gradient(145deg,rgba(255,255,255,.1),rgba(255,255,255,.025));box-shadow:inset 0 1px 0 rgba(255,255,255,.1);animation:cnCardPulse 3.2s ease-in-out infinite}
.cn-motion-card:nth-child(1){left:0;top:0;animation-delay:.1s}.cn-motion-card:nth-child(2){left:29%;top:0;animation-delay:.3s}.cn-motion-card:nth-child(3){left:58%;top:0;animation-delay:.5s}.cn-motion-card:nth-child(4){left:15%;top:42%;animation-delay:.7s}.cn-motion-card:nth-child(5){left:44%;top:42%;animation-delay:.9s}.cn-motion-card:nth-child(6){left:73%;top:42%;animation-delay:1.1s}.cn-motion-card.red{box-shadow:0 0 24px rgba(255,70,90,.16),inset 0 1px 0 rgba(255,255,255,.1)}.cn-motion-card.blue{box-shadow:0 0 24px rgba(75,140,255,.16),inset 0 1px 0 rgba(255,255,255,.1)}
.cn-motion-game{position:fixed;top:74px;left:50%;transform:translateX(-50%);width:min(360px,62vw);height:4px;z-index:30;pointer-events:none;border-radius:999px;background:rgba(255,255,255,.05);overflow:hidden;opacity:.8}.cn-motion-game i{display:block;height:100%;width:35%;background:linear-gradient(90deg,transparent,rgba(110,170,255,.95),transparent);animation:cnGameSweep 3.6s ease-in-out infinite}
@keyframes cnMotionSpin{to{transform:rotate(360deg)}}
@keyframes cnMotionScan{0%,100%{transform:translateX(-25%);opacity:0}50%{transform:translateX(25%);opacity:.9}}
@keyframes cnMotionFloat{0%,100%{transform:perspective(600px) rotateY(-12deg) rotateX(4deg) translateY(0)}50%{transform:perspective(600px) rotateY(-8deg) rotateX(2deg) translateY(-8px)}}
@keyframes cnCardPulse{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-4px) scale(1.03)}}
@keyframes cnGameSweep{0%,100%{transform:translateX(-100%)}50%{transform:translateX(260%)}}
@media(max-width:700px){.cn-motion-trailer{min-height:170px;border-radius:16px}.cn-motion-inner{padding:16px}.cn-motion-copy{max-width:52%}.cn-motion-copy b{font-size:20px}.cn-motion-board{width:45%;}.cn-motion-card{font-size:9px;border-radius:7px}.cn-motion-game{top:62px;width:54vw}}
@media(prefers-reduced-motion:reduce){.cn-motion-trailer::before,.cn-motion-trailer::after,.cn-motion-board,.cn-motion-card,.cn-motion-game i{animation:none!important}}
`;

function installStyles(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement("style");s.id=STYLE_ID;s.textContent=css;document.head.appendChild(s);
}

function addMenuTrailer(){
  const host=document.querySelector("#screen-menu .reference-center");
  if(!host || host.querySelector(".cn-motion-trailer"))return;
  const trailer=document.createElement("section");
  trailer.className="cn-motion-trailer";
  trailer.setAttribute("aria-label","CODNAME cinematic preview");
  trailer.innerHTML=`<div class="cn-motion-inner"><div class="cn-motion-copy"><small>CODNAME // CINEMATIC PREVIEW</small><b>کلمات حرکت می‌کنند.</b><span>هر اتاق یک صحنه‌ی تازه است؛ انتخاب کن، هماهنگ شو و بازی را شروع کن.</span></div><div class="cn-motion-board" aria-hidden="true"><i class="cn-motion-card red">آینه</i><i class="cn-motion-card blue">دیوار</i><i class="cn-motion-card">در</i><i class="cn-motion-card blue">ماه</i><i class="cn-motion-card red">باران</i><i class="cn-motion-card">راز</i></div></div>`;
  const hero=host.querySelector(".reference-hero");
  if(hero) hero.after(trailer); else host.prepend(trailer);
}

function addGameMotion(){
  const game=document.querySelector("#screen-game");
  if(!game || game.querySelector(".cn-motion-game"))return;
  const bar=document.createElement("div");bar.className="cn-motion-game";bar.setAttribute("aria-hidden","true");bar.innerHTML="<i></i>";game.appendChild(bar);
}

function boot(){
  installStyles();
  addMenuTrailer();
  addGameMotion();
  new MutationObserver(()=>{addMenuTrailer();addGameMotion();}).observe(document.body,{childList:true,subtree:true});
}

document.addEventListener("DOMContentLoaded",boot,{once:true});
