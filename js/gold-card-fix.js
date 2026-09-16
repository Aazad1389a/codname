// CODNAME — clean bonus-card styling.
// Bonus cards use their gold color as the visual indicator; no icon or symbol is added.
const STYLE_ID = "codname-gold-card-fix-v2";

function install() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .word-card.is-bonus::before,
    .word-card.is-bonus::after{
      content:none!important;
      display:none!important;
    }
    .word-card.is-bonus.is-revealed{
      background:linear-gradient(145deg,#5b4310,#b78a22 48%,#e7c35f 100%)!important;
      border-color:#f2d477!important;
      color:#140f03!important;
      box-shadow:0 0 0 1px rgba(255,214,103,.35),0 10px 28px rgba(210,164,48,.26)!important;
    }
    .word-card.is-bonus.is-revealed .card-index{color:inherit!important;opacity:.65;}
  `;
  document.head.appendChild(style);
}

document.addEventListener("DOMContentLoaded", install, { once:true });
install();
