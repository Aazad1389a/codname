// CODNAME — lightweight menu layer.
// Removes heavy decorative data panels from the DOM after the menu is mounted.
const STYLE_ID = "codname-menu-lightweight-v1";

function install() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    #screen-menu .ranking-panel,
    #screen-menu .recent-panel { display:none!important; }
    #screen-menu .reference-right { gap:12px!important; }
  `;
  document.head.appendChild(style);
}

function removeHeavySections() {
  document.querySelectorAll("#screen-menu .ranking-panel,#screen-menu .recent-panel").forEach((el) => el.remove());
  document.querySelectorAll("#screen-menu [data-action='show-leaderboard']").forEach((el) => {
    if (el.closest(".sidebar-nav,.lower-grid,.topbar-actions")) el.remove();
  });
}

function boot() {
  install();
  removeHeavySections();
  const observer = new MutationObserver(removeHeavySections);
  observer.observe(document.body, { childList:true, subtree:true });
}

document.addEventListener("DOMContentLoaded", boot, { once:true });
