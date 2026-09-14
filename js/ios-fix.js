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

      .screen:not(.is-active){display:none!important;pointer-events:none!important;}
      .screen.is-active{pointer-events:auto!important;}

      #screen-menu{overflow:hidden!important;}
      #screen-menu .menu-main{overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior-y:contain!important;}
      #screen-menu .menu-bg,
      #screen-menu .cn-menu-particles,
      #screen-menu .cn-hud-grid{pointer-events:none!important;}
      #screen-menu [data-action="start-game"]{display:none!important;}

      #screen-lobby{overflow-y:auto!important;overflow-x:hidden!important;padding-bottom:calc(24px + env(safe-area-inset-bottom))!important;-webkit-overflow-scrolling:touch!important;}
      #screen-game{overflow-y:auto!important;overflow-x:hidden!important;padding-bottom:calc(24px + env(safe-area-inset-bottom))!important;-webkit-overflow-scrolling:touch!important;}

      #screen-game .gamebar{position:relative!important;transform:none!important;}
      #screen-game .cn-clue-box{position:relative!important;top:auto!important;transform:none!important;}
      #screen-game .game-layout{min-height:max-content!important;height:auto!important;}
      #screen-game .board-wrap{min-height:0!important;}
      #screen-game .board{height:auto!important;min-height:62vh!important;}

      .cnw:not(.open){display:none!important;pointer-events:none!important;}
      .cnw.open{display:flex!important;pointer-events:auto!important;}
      .cn-install-backdrop:not(.is-open){display:none!important;pointer-events:none!important;}
      .cn-install-backdrop.is-open{display:flex!important;pointer-events:auto!important;}
      dialog:not([open]){pointer-events:none!important;}
      dialog[open]{pointer-events:auto!important;}

      button,a,input,select{touch-action:manipulation!important;}

      @media(max-width:700px){
        #screen-menu .menu-main{padding:0 0 92px!important;min-height:0!important;}
        #screen-menu .menu-main>.reference-layout{padding:0 12px 44px!important;}
        #screen-menu .reference-center{padding-bottom:48px!important;}
        #screen-menu .reference-right{padding-bottom:24px!important;}

        .cnw{align-items:flex-start!important;justify-content:flex-start!important;padding:8px!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;}
        .cnw-box{width:100%!important;max-width:none!important;min-height:calc(100svh - 16px)!important;max-height:none!important;display:flex!important;flex-direction:column!important;}
        .cnw-side{flex:none!important;position:sticky!important;top:0!important;z-index:4!important;}
        .cnw-nav{display:flex!important;overflow-x:auto!important;-webkit-overflow-scrolling:touch!important;}
        .cnw-main{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;padding-bottom:96px!important;}
        .cnw-grid{grid-template-columns:1fr!important;}
        .cnw-cards{max-height:none!important;overflow:visible!important;}

        #screen-lobby{padding:10px 10px 88px!important;}
        #screen-lobby .lobby-layout{width:100%!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:12px!important;margin:0!important;padding-bottom:72px!important;}
        #screen-lobby .lobby-visual,#screen-lobby .players-panel{width:100%!important;flex:none!important;}
        #screen-lobby .players{max-height:none!important;overflow:visible!important;}

        #screen-game{padding:10px 10px 28px!important;}
        #screen-game .game-layout{display:flex!important;flex-direction:column!important;gap:12px!important;min-height:max-content!important;padding-bottom:56px!important;}
        #screen-game .board{height:auto!important;width:100%!important;}

        .auth-modal{z-index:100!important;}
      }
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
  }

  function stopUnexpectedBlockingLayers() {
    document.querySelectorAll(".screen:not(.is-active)").forEach(el => { el.style.pointerEvents = "none"; });
    document.querySelectorAll(".cnw:not(.open), .cn-install-backdrop:not(.is-open)").forEach(el => { el.style.pointerEvents = "none"; });
    document.querySelectorAll("dialog:not([open])").forEach(el => { el.style.pointerEvents = "none"; });
  }

  function boot() {
    installStyles();
    stabilizeViewport();
    document.documentElement.classList.add("codname-ios");
    stopUnexpectedBlockingLayers();
    const observer = new MutationObserver(() => stopUnexpectedBlockingLayers());
    observer.observe(document.body, { subtree:true, childList:true, attributes:true, attributeFilter:["class","style","open"] });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
