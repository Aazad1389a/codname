// Settings cleanup: remove the registered-player count panel and keep version/card count current.
const STYLE_ID="codname-settings-cleanup-v1";
const CSS=`.cn-registered-count-hide{display:none!important;}`;
function install(){if(document.getElementById(STYLE_ID))return;const s=document.createElement('style');s.id=STYLE_ID;s.textContent=CSS;document.head.appendChild(s)}
function clean(){install();document.querySelectorAll('#cn-workspace-v2 .cnw-card').forEach(card=>{const text=card.textContent||'';if(text.includes('بازیکنان ثبت‌نام‌شده')||text.includes('تعداد پروفایل‌های بازی ثبت‌شده'))card.classList.add('cn-registered-count-hide');if(text.includes('۱۵۰۰ کارت')||text.includes('1500 کارت')){card.innerHTML=card.innerHTML.replaceAll('۱۵۰۰ کارت','۲۰۰۰ کارت').replaceAll('1500 کارت','2000 کارت')}});document.querySelectorAll('#cn-workspace-v2 .cnw-version,.cn-menu-version-v2').forEach(el=>{if(el.textContent?.match(/^v1\.6\.0$/))el.textContent='v1.9.0'})}
install();document.addEventListener('DOMContentLoaded',()=>{clean();new MutationObserver(clean).observe(document.body,{childList:true,subtree:true})},{once:true});
