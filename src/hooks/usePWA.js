// src/hooks/usePWA.js
// Works with vite-plugin-pwa (injectManifest strategy).
// vite-plugin-pwa registers the SW automatically — we just handle:
//   1. Install-to-homescreen prompt
//   2. Push notification subscription
//   3. New version available prompt

import { useState, useEffect, useCallback } from "react";
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
  const [pushPermission,   setPushPermission]   = useState("default");
  const [pushSubscription, setPushSubscription] = useState(null);
  const [updateAvailable,  setUpdateAvailable]  = useState(false);
  const [installDismissed, setInstallDismissed] = useState(
    () => !!localStorage.getItem("pwa_install_dismissed")
  );

  // ── Detect installed state ─────────────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    setIsInstalled(mq.matches || window.navigator.standalone === true);
    const h = e => setIsInstalled(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  // ── Capture install prompt ─────────────────────────────────────────────────
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

  // ── Check for existing push subscription + notification permission ─────────
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if ("Notification" in window) setPushPermission(Notification.permission);

    navigator.serviceWorker.ready.then(reg => {
      reg.pushManager.getSubscription().then(sub => {
        if (sub) setPushSubscription(sub);
      });

      // vite-plugin-pwa fires this event when a new SW is waiting
      reg.addEventListener("updatefound", () => {
        const newSW = reg.installing;
        if (!newSW) return;
        newSW.addEventListener("statechange", () => {
          if (newSW.state === "installed" && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
          }
        });
      });
    });
  }, []);

  // ── Install ────────────────────────────────────────────────────────────────
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

  // ── Apply update ───────────────────────────────────────────────────────────
  const applyUpdate = useCallback(async () => {
    const reg = await navigator.serviceWorker.ready;
    if (reg.waiting) {
      reg.waiting.postMessage({ type: "SKIP_WAITING" });
      window.location.reload();
    }
  }, []);

  // ── Push subscribe ─────────────────────────────────────────────────────────
  const subscribePush = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY) {
      console.warn("[usePWA] VITE_VAPID_PUBLIC_KEY not set");
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission !== "granted") return false;

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
      return true;
    } catch (err) {
      console.warn("[usePWA] subscribePush failed:", err);
      return false;
    }
  }, [churchId]);

  // ── Push unsubscribe ───────────────────────────────────────────────────────
  const unsubscribePush = useCallback(async () => {
    if (!pushSubscription) return;
    await pushSubscription.unsubscribe();
    setPushSubscription(null);
    if (churchId) {
      await supabase.from("push_subscriptions").delete().eq("church_id", churchId);
    }
  }, [pushSubscription, churchId]);

  return {
    isInstalled,
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