(() => {
  const key = "codname_reload_guard";
  const original = window.setTimeout.bind(window);

  window.setTimeout = (fn, delay, ...args) => {
    if (typeof fn === "function") {
      const src = Function.prototype.toString.call(fn);
      if (src.includes("location.reload()")) {
        try {
          const now = Date.now();
          const last = Number(sessionStorage.getItem(key) || 0);
          if (now - last < 15000) {
            console.warn("CODNAME: repeated reload prevented");
            return 0;
          }
          sessionStorage.setItem(key, String(now));
        } catch (_) {}
      }
    }
    return original(fn, delay, ...args);
  };

  // Never leave the user on the loading screen indefinitely.
  window.addEventListener("DOMContentLoaded", () => {
    original(() => {
      const loading = document.querySelector("#screen-loading");
      const menu = document.querySelector("#screen-menu");
      if (!loading || !menu) return;
      if (document.querySelector(".screen.is-active:not(#screen-loading)")) return;
      loading.classList.remove("is-active");
      menu.classList.add("is-active");
      console.warn("CODNAME: loading failsafe opened the main menu");
    }, 10000);
  }, { once: true });
})();
