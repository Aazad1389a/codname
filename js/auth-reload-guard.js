(() => {
  const KEY = "codname_auth_reload_guard";
  const originalSetTimeout = window.setTimeout.bind(window);

  window.setTimeout = (handler, timeout, ...args) => {
    if (typeof handler === "function") {
      const source = Function.prototype.toString.call(handler);
      if (source.includes("window.location.reload()")) {
        try {
          const now = Date.now();
          const previous = Number(sessionStorage.getItem(KEY) || 0);
          if (now - previous < 15000) {
            console.warn("CODNAME: blocked repeated auth reload");
            return 0;
          }
          sessionStorage.setItem(KEY, String(now));
        } catch (_) {}
      }
    }
    return originalSetTimeout(handler, timeout, ...args);
  };
})();
