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
})();
