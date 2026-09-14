// Lobby leader controls: the room host can move non-host teammates between red and blue teams.
import { getSupabase } from "./supabase.js";

const STYLE_ID = "codname-leader-team-controls-v2";

const css = `
.cn-leader-team-controls{display:flex!important;grid-column:1/-1!important;gap:5px!important;margin-top:5px!important}
.cn-leader-team-controls button{flex:1;min-height:32px;border:1px solid rgba(255,255,255,.1);border-radius:8px;background:rgba(255,255,255,.05);color:#dfe6f0;font:inherit;font-size:9px;font-weight:800;cursor:pointer}
.cn-leader-team-controls button.active-red{background:rgba(255,36,56,.18);border-color:rgba(255,36,56,.45);color:#ff9aa2}
.cn-leader-team-controls button.active-blue{background:rgba(45,124,255,.18);border-color:rgba(45,124,255,.45);color:#9ec4ff}
`;

function install() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = css;
  document.head.appendChild(style);
}

function decorate() {
  install();

  const state = window.CODNAME?.getGameState?.();
  const user = window.CODNAME?.getUser?.();

  if (!state || state.status !== "waiting" || !user) return;

  const me = (state.players || []).find((p) => p.user_id === user.id);
  if (!me?.is_host) return;

  const container = document.querySelector("#screen-lobby .players-panel .players");
  if (!container) return;

  [...container.children].forEach((item) => {
    if (item.querySelector(".cn-leader-team-controls")) return;

    const nameEl = item.querySelector("strong");
    if (!nameEl) return;

    const text = nameEl.textContent?.trim();
    const player = (state.players || []).find(
      (p) => p.display_name === text && !p.is_host
    );
    if (!player) return;

    const current = player.team || "neutral";
    const controls = document.createElement("div");
    controls.className = "cn-leader-team-controls";

    for (const [team, label] of [
      ["red", "قرمز"],
      ["blue", "آبی"],
    ]) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `انتقال به ${label}`;
      button.className =
        team === "red" && current === "red"
          ? "active-red"
          : team === "blue" && current === "blue"
            ? "active-blue"
            : "";

      button.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (player.team === team) return;

        button.disabled = true;

        try {
          const supabase = getSupabase();
          const { error } = await supabase
            .from("room_players")
            .update({ team })
            .eq("room_id", state.roomId)
            .eq("user_id", player.user_id);

          if (error) throw error;

          window.CODNAME?.refresh?.();
        } catch (err) {
          console.error("Team change failed:", err);
          const toast = document.querySelector("[data-toast]");
          if (toast) {
            toast.textContent = err?.message || "تغییر تیم انجام نشد.";
            toast.classList.add("is-visible");
            setTimeout(() => toast.classList.remove("is-visible"), 3000);
          }
        } finally {
          button.disabled = false;
        }
      });

      controls.appendChild(button);
    }

    item.appendChild(controls);
  });
}

document.addEventListener(
  "DOMContentLoaded",
  () => {
    decorate();
    document.addEventListener("codname:game-state", decorate);

    new MutationObserver(() => decorate()).observe(
      document.querySelector("#screen-lobby .players") || document.body,
      { childList: true, subtree: true }
    );
  },
  { once: true }
);
