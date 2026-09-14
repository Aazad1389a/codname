import { signInWithGithub } from "./auth.js";

function setStatus(message, isError = false) {
  const el = document.querySelector("[data-auth-status]");
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("is-error", isError);
}

function setBusy(busy) {
  document.querySelectorAll("[data-auth-form] input, [data-auth-form] button, [data-action=github-login]").forEach(el => {
    el.disabled = busy;
  });
}

function installGithubUI() {
  const button = document.querySelector("[data-action=google-login], [data-action=github-login]");
  if (!button || button.dataset.githubController === "true") return;

  button.dataset.githubController = "true";
  button.dataset.action = "github-login";
  button.setAttribute("aria-label", "ورود با GitHub");
  button.innerHTML = '<span class="github-mark">GH</span> ورود با GitHub';
  button.classList.add("github-login-btn");

  // Capture before ui.js's old document-level Google handler so the old action can never run.
  document.addEventListener("click", async event => {
    const target = event.target.closest("[data-action=github-login]");
    if (!target) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (target.dataset.authPending === "true") return;
    target.dataset.authPending = "true";
    setBusy(true);
    setStatus("در حال انتقال به GitHub...", false);

    try {
      await signInWithGithub();
    } catch (error) {
      console.error("GitHub sign-in failed:", error);
      const message = String(error?.message || "");
      setStatus(
        /provider.*disabled|unsupported provider/i.test(message)
          ? "ورود با GitHub هنوز در Supabase فعال نشده است."
          : message || "ورود با GitHub انجام نشد.",
        true
      );
      setBusy(false);
      target.dataset.authPending = "false";
    }
  }, true);
}

document.addEventListener("DOMContentLoaded", installGithubUI, { once: true });
