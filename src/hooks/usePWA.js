// src/hooks/usePWA.js
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../services/supabaseClient";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export function usePWA(churchId) {
  const [installPrompt,    setInstallPrompt]    = useState(null);
  const [isInstalled,      setIsInstalled]      = useState(false);
  const [pushPermission,   setPushPermission]   = useState(
    "Notification" in window ? Notification.permission : "default"
  );
  const [pushSubscription, setPushSubscription] = useState(null);
  const [updateAvailable,  setUpdateAvailable]  = useState(false);
  const [swRegistration,   setSwRegistration]   = useState(null);
  const [installDismissed, setInstallDismissed] = useState(
    () => !!localStorage.getItem("pwa_install_dismissed")
  );
  const waitingSWRef = useRef(null);

  // ── 1. Detect if already installed (standalone mode) ──────────────────────
  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    setIsInstalled(mq.matches || window.navigator.standalone === true);
    const h = e => setIsInstalled(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  // ── 2. Capture the install prompt (Chrome/Android) ────────────────────────
  useEffect(() => {
    const onPrompt = e => { e.preventDefault(); setInstallPrompt(e); };
    const onInstalled = () => { setIsInstalled(true); setInstallPrompt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // ── 3. Wait for SW to be ready, get existing subscription, watch for updates
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.ready.then(reg => {
      setSwRegistration(reg);

      // Get any existing push subscription
      reg.pushManager.getSubscription().then(sub => {
        if (sub) setPushSubscription(sub);
      });

      // If there's already a waiting SW when we load, show the banner
      if (reg.waiting) {
        waitingSWRef.current = reg.waiting;
        setUpdateAvailable(true);
      }

      // Watch for a NEW sw installing in the future
      reg.addEventListener("updatefound", () => {
        const newSW = reg.installing;
        if (!newSW) return;
        newSW.addEventListener("statechange", () => {
          if (newSW.state === "installed" && navigator.serviceWorker.controller) {
            waitingSWRef.current = newSW;
            setUpdateAvailable(true);
          }
        });
      });
    });

    // When the SW actually takes control (after skip waiting), reload
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  }, []);

  // ── Install to home screen ────────────────────────────────────────────────
  const promptInstall = useCallback(async () => {
    if (!installPrompt) return false;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    setInstallPrompt(null);
    return outcome === "accepted";
  }, [installPrompt]);

  const dismissInstall = useCallback(() => {
    localStorage.setItem("pwa_install_dismissed", "1");
    setInstallDismissed(true);
    setInstallPrompt(null);
  }, []);

  // ── Apply update — tell the waiting SW to skip waiting ───────────────────
  // The controllerchange listener above will then reload the page.
  const applyUpdate = useCallback(() => {
    const sw = waitingSWRef.current;
    if (sw) {
      sw.postMessage({ type: "SKIP_WAITING" });
    } else {
      // Fallback: just reload and let the browser sort it out
      window.location.reload();
    }
  }, []);

  // ── Enable push notifications ─────────────────────────────────────────────
  const subscribePush = useCallback(async () => {
    // Step 1: check SW is available
    if (!("serviceWorker" in navigator)) {
      console.warn("[usePWA] Service workers not supported");
      return { ok: false, reason: "unsupported" };
    }

    // Step 2: check VAPID key is configured
    if (!VAPID_PUBLIC_KEY) {
      console.warn("[usePWA] VITE_VAPID_PUBLIC_KEY is not set in .env");
      return { ok: false, reason: "no_vapid_key" };
    }

    // Step 3: request notification permission
    let permission;
    try {
      permission = await Notification.requestPermission();
      setPushPermission(permission);
    } catch (err) {
      console.warn("[usePWA] requestPermission failed:", err);
      return { ok: false, reason: "permission_error" };
    }

    if (permission !== "granted") {
      return { ok: false, reason: "denied" };
    }

    // Step 4: subscribe via pushManager
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      setPushSubscription(sub);

      // Step 5: save to Supabase
      if (churchId) {
        await supabase.from("push_subscriptions").upsert({
          church_id:    churchId,
          subscription: JSON.stringify(sub),
          updated_at:   new Date().toISOString(),
        }, { onConflict: "church_id" });
      }

      return { ok: true };
    } catch (err) {
      console.warn("[usePWA] pushManager.subscribe failed:", err);
      return { ok: false, reason: "subscribe_error", error: err };
    }
  }, [churchId]);

  // ── Disable push notifications ────────────────────────────────────────────
  const unsubscribePush = useCallback(async () => {
    if (!pushSubscription) return;
    try {
      await pushSubscription.unsubscribe();
    } catch (err) {
      console.warn("[usePWA] unsubscribe failed:", err);
    }
    setPushSubscription(null);
    if (churchId) {
      await supabase.from("push_subscriptions").delete().eq("church_id", churchId);
    }
  }, [pushSubscription, churchId]);

  return {
    isInstalled,
    swRegistration,
    pushPermission,
    pushSubscription,
    updateAvailable,
    showInstallBanner: !!installPrompt && !isInstalled && !installDismissed,
    promptInstall,
    dismissInstall,
    applyUpdate,
    subscribePush,
    unsubscribePush,
  };
}