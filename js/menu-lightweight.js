// CODNAME — lightweight menu layer.
// Keeps the main menu focused: rankings, recent matches and menu-level mode selection are removed.
const STYLE_ID = "codname-menu-lightweight-v2";

function install() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    #screen-menu .ranking-panel,
    #screen-menu .recent-panel,
    #screen-menu [data-action='show-modes'],
    #screen-menu .ranking-panel + *,
    #screen-menu .recent-panel + * { display:none!important; }
  `;
  document.head.appendChild(style);
}

function removeMenuExtras() {
  document.querySelectorAll("#screen-menu .ranking-panel,#screen-menu .recent-panel").forEach((el) => el.remove());
  document.querySelectorAll("#screen-menu [data-action='show-leaderboard'],#screen-menu [data-action='show-modes']").forEach((el) => el.remove());
}

function boot() {
  install();
  removeMenuExtras();
  const observer = new MutationObserver(removeMenuExtras);
  observer.observe(document.body, { childList:true, subtree:true });
}

document.addEventListener("DOMContentLoaded", boot, { once:true });
