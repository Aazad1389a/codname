(() => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (!isIOS) return;

  const STYLE_ID = "codname-ios-stability";
  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      html,body{width:100%;height:100%;min-height:100%;overflow:hidden!important;overscroll-behavior:none!important;-webkit-text-size-adjust:100%;}
      body{-webkit-overflow-scrolling:auto!important;}
      .app-shell{width:100%;height:100%;min-height:100%;overflow:hidden!important;position:fixed!important;inset:0!important;}
      .screen{height:100%;min-height:100%;overflow:auto!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;}
      #screen-menu{overflow:hidden!important;}
      #screen-menu .menu-main{overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior-y:contain!important;}
      #screen-lobby{overflow-y:auto!important;overflow-x:hidden!important;padding-bottom:calc(18px + env(safe-area-inset-bottom));}
      #screen-game{overflow-y:auto!important;overflow-x:hidden!important;padding-bottom:calc(18px + env(safe-area-inset-bottom));}
      #screen-game .gamebar{position:relative!important;transform:none!important;}
      #screen-game .cn-clue-box{position:relative!important;top:auto!important;transform:none!important;}
      #screen-game .game-layout{min-height:max-content!important;height:auto!important;}
      #screen-game .board-wrap{min-height:0!important;}
      #screen-game .board{height:auto!important;min-height:62vh!important;}
      .cnw{height:100%!important;min-height:100%!important;overflow:auto!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important;}
      dialog{overscroll-behavior:contain!important;}
    `;
    document.head.appendChild(style);
  }

  function stabilizeViewport() {
    const setHeight = () => {
      document.documentElement.style.setProperty("--ios-vh", `${window.innerHeight}px`);
      document.body.style.setProperty("--ios-vh", `${window.innerHeight}px`);
    };
    setHeight();
    window.addEventListener("resize", setHeight, { passive: true });
    window.addEventListener("orientationchange", () => setTimeout(setHeight, 250), { passive: true });

    let lastX = window.scrollX;
    let lastY = window.scrollY;
    window.addEventListener("scroll", () => {
      if (window.scrollX !== 0) window.scrollTo(0, window.scrollY);
      lastX = window.scrollX;
      lastY = window.scrollY;
    }, { passive: true });
  }

  function boot() {
    installStyles();
    stabilizeViewport();
    document.documentElement.classList.add("codname-ios");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
