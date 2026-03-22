// src/hooks/usePWA.js
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../services/supabaseClient";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

// ── Module-level prompt capture ───────────────────────────────────────────────
// `beforeinstallprompt` can fire BEFORE React even mounts. We capture it at
// the module level so it's never missed regardless of when the hook runs.
let _capturedPrompt = null;
let _promptListeners = [];

function notifyPromptListeners() {
  _promptListeners.forEach(fn => fn(_capturedPrompt));
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    _capturedPrompt = e;
    notifyPromptListeners();
  });
  window.addEventListener("appinstalled", () => {
    _capturedPrompt = null;
    notifyPromptListeners();
  });
}

// ── Snooze helpers ────────────────────────────────────────────────────────────
const SNOOZE_KEY      = "pwa_install_snooze_until";
const SNOOZE_DAYS     = 3;   // re-prompt after 3 days if dismissed
const IOS_SNOOZE_KEY  = "pwa_ios_snooze_until";

function isSnoozed(key) {
  try {
    const until = parseInt(localStorage.getItem(key) || "0");
    return Date.now() < until;
  } catch { return false; }
}

function snooze(key, days = SNOOZE_DAYS) {
  try {
    localStorage.setItem(key, String(Date.now() + days * 86_400_000));
  } catch {}
}

// ── iOS / Safari detection ────────────────────────────────────────────────────
function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isInStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function usePWA(churchId) {
  const [installPrompt,    setInstallPrompt]    = useState(_capturedPrompt);
  const [isInstalled,      setIsInstalled]      = useState(isInStandaloneMode);
  const [pushPermission,   setPushPermission]   = useState(
    "Notification" in window ? Notification.permission : "default"
  );
  const [pushSubscription, setPushSubscription] = useState(null);
  const [updateAvailable,  setUpdateAvailable]  = useState(false);
  const [swRegistration,   setSwRegistration]   = useState(null);

  // Re-render trigger for snooze state (no useState needed — computed inline)
  const [, forceRender] = useState(0);

  const waitingSWRef = useRef(null);

  // ── 1. Sync module-level prompt into React state ──────────────────────────
  useEffect(() => {
    // Register as a listener so we get updates if the event fires later
    const handler = (prompt) => {
      setInstallPrompt(prompt);
      forceRender(n => n + 1);
    };
    _promptListeners.push(handler);

    // Sync immediately in case it was already captured before this hook ran
    if (_capturedPrompt) setInstallPrompt(_capturedPrompt);

    return () => {
      _promptListeners = _promptListeners.filter(fn => fn !== handler);
    };
  }, []);

  // ── 2. Track standalone mode changes ─────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    setIsInstalled(mq.matches || window.navigator.standalone === true);
    const h = e => setIsInstalled(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  // ── 3. SW ready → get push sub + watch for updates ───────────────────────
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.ready.then(reg => {
      setSwRegistration(reg);

      reg.pushManager.getSubscription().then(sub => {
        if (sub) setPushSubscription(sub);
      });

      if (reg.waiting) {
        waitingSWRef.current = reg.waiting;
        setUpdateAvailable(true);
      }

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

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  }, []);

  // ── Install actions ───────────────────────────────────────────────────────
  const promptInstall = useCallback(async () => {
    if (!installPrompt) return false;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      _capturedPrompt = null;
      setInstallPrompt(null);
    }
    return outcome === "accepted";
  }, [installPrompt]);

  // Snooze for SNOOZE_DAYS — not permanent, so it re-prompts after 3 days
  const dismissInstall = useCallback(() => {
    snooze(SNOOZE_KEY, SNOOZE_DAYS);
    forceRender(n => n + 1);
  }, []);

  // iOS-specific: snooze the manual install instructions banner
  const dismissIosInstall = useCallback(() => {
    snooze(IOS_SNOOZE_KEY, SNOOZE_DAYS);
    forceRender(n => n + 1);
  }, []);

  // ── Apply update ──────────────────────────────────────────────────────────
  const applyUpdate = useCallback(() => {
    const sw = waitingSWRef.current;
    if (sw) sw.postMessage({ type: "SKIP_WAITING" });
    else window.location.reload();
  }, []);

  // ── Push notifications ────────────────────────────────────────────────────
  const subscribePush = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return { ok: false, reason: "unsupported" };
    if (!VAPID_PUBLIC_KEY) {
      console.warn("[usePWA] VITE_VAPID_PUBLIC_KEY not set");
      return { ok: false, reason: "no_vapid_key" };
    }
    let permission;
    try {
      permission = await Notification.requestPermission();
      setPushPermission(permission);
    } catch (err) {
      return { ok: false, reason: "permission_error" };
    }
    if (permission !== "granted") return { ok: false, reason: "denied" };
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      setPushSubscription(sub);
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

  const unsubscribePush = useCallback(async () => {
    if (!pushSubscription) return;
    try { await pushSubscription.unsubscribe(); } catch {}
    setPushSubscription(null);
    if (churchId) {
      await supabase.from("push_subscriptions").delete().eq("church_id", churchId);
    }
  }, [pushSubscription, churchId]);

  // ── Derived booleans ──────────────────────────────────────────────────────
  const showInstallBanner = (
    !!installPrompt &&
    !isInstalled &&
    !isSnoozed(SNOOZE_KEY)
  );

  // Show iOS manual-install instructions on Safari when not yet installed
  const showIosInstallBanner = (
    isIOS() &&
    !isInstalled &&
    !isSnoozed(IOS_SNOOZE_KEY)
  );

  return {
    isInstalled,
    swRegistration,
    pushPermission,
    pushSubscription,
    updateAvailable,
    showInstallBanner,
    showIosInstallBanner,
    promptInstall,
    dismissInstall,
    dismissIosInstall,
    applyUpdate,
    subscribePush,
    unsubscribePush,
  };
}