// CODNAME — visual rules for revealed bonus cards.
// No icon, badge or symbol is shown: the gold color itself identifies a bonus card.
const STYLE_ID = "codname-gold-card-fix-v1";

function install() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .word-card.is-bonus.is-revealed{
      background:linear-gradient(145deg,#5b4310,#b78a22 48%,#e7c35f 100%)!important;
      border-color:#f2d477!important;
      color:#140f03!important;
      box-shadow:0 0 0 1px rgba(255,214,103,.35),0 10px 28px rgba(210,164,48,.26)!important;
    }
    .word-card.is-bonus.is-revealed::before,
    .word-card.is-bonus.is-revealed::after{
      content:none!important;
      display:none!important;
    }
    .word-card.is-bonus .card-index{color:inherit!important;opacity:.65;}
  `;
  document.head.appendChild(style);
}

document.addEventListener("DOMContentLoaded", install, { once:true });
install();
