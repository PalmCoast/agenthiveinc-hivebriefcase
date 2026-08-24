import { useCallback, useEffect, useState } from "react";

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function detectPlatform() {
  const ua = navigator.userAgent || "";
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const android = /Android/.test(ua);
  return { iOS, android };
}

/**
 * Wraps PWA install: captures the Android/Chrome `beforeinstallprompt` event so
 * the CTA can trigger the native prompt, and otherwise exposes platform flags so
 * the UI can show iOS "Add to Home Screen" instructions.
 */
export function useInstall() {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(isStandalone());
  const { iOS, android } = detectPlatform();

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Returns true when the native prompt was shown (so the caller can skip the
  // manual-instructions modal).
  const promptInstall = useCallback(async () => {
    if (!deferred) return false;
    deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {
      /* ignore */
    }
    setDeferred(null);
    return true;
  }, [deferred]);

  return { canPrompt: !!deferred, promptInstall, installed, iOS, android };
}
