// src/App.jsx
import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { usePWA } from "./hooks/usePWA";
import { AppLayout } from "./components/layout/AppLayout";
import { Toast } from "./components/ui/Toast";

import { supabase, ensureSession } from "./services/supabaseClient";
import {
  fetchGroups, createGroup, updateGroup, deleteGroup,
  fetchMembers, createMember, createMembersBulk, updateMember, deleteMember,
  fetchAttendance, saveAttendanceSession,
  fetchFirstTimers, createFirstTimer, updateFirstTimer, deleteFirstTimer,
  fetchFtAttendance, saveFtAttendance,
} from "./services/api";

import LandingPage    from "./pages/LandingPage";
import LoginPage      from "./pages/LoginPage";
import SignupPage     from "./pages/SignupPage";
import ForgotPage     from "./pages/ForgotPage";
import Dashboard      from "./pages/Dashboard";
import Groups         from "./pages/Groups";
import Members        from "./pages/Members";
import Attendance     from "./pages/Attendance";
import Absentees      from "./pages/Absentees";
import FirstTimers    from "./pages/FirstTimers";
import Settings       from "./pages/Settings";
import Analytics      from "./pages/Analytics";
import MessagingHome   from "./pages/messaging/MessagingHome";
import MessageComposer from "./pages/messaging/MessageComposer";
import CreditsPage     from "./pages/messaging/CreditsPage";
import MessageHistory  from "./pages/messaging/MessageHistory";
import SuperAdmin      from "./pages/SuperAdmin";

// ── Loading screen ────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 20,
      background: "linear-gradient(150deg, #1a3a2a 0%, #2d5a42 60%, #1e4a34 100%)",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 13,
          background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 17,
          color: "#e8d5a0",
        }}>CT</div>
        <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700,
          fontSize: "1.4rem", color: "rgba(255,255,255,.92)", letterSpacing: "-.01em" }}>
          ChurchTrakr
        </span>
      </div>
      {/* Spinner */}
      <div style={{
        width: 28, height: 28,
        border: "2.5px solid rgba(255,255,255,.12)",
        borderTop: "2.5px solid rgba(201,168,76,.75)",
        borderRadius: "50%",
        animation: "spin 0.75s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Banner component ─────────────────────────────────────────────────────────
function Banner({ icon, title, subtitle, primaryAction, primaryLabel, secondaryAction, secondaryLabel, gradient }) {
  return (
    <div style={{
      background: gradient || "linear-gradient(135deg, #1a3a2a, #2d5a42)",
      padding: "13px 18px",
      display: "flex", alignItems: "center", gap: 12,
      flexWrap: "wrap", justifyContent: "space-between",
      borderBottom: "1px solid rgba(255,255,255,.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 13, color: "#fff" }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "rgba(255,255,255,.58)", marginTop: 1 }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        {secondaryAction && (
          <button onClick={secondaryAction} style={{
            background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.18)",
            color: "rgba(255,255,255,.68)", borderRadius: 8, padding: "7px 13px",
            fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 12, cursor: "pointer",
          }}>{secondaryLabel}</button>
        )}
        {primaryAction && (
          <button onClick={primaryAction} style={{
            background: "#fff", border: "none", color: "#1a3a2a",
            borderRadius: 8, padding: "7px 16px",
            fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 12, cursor: "pointer",
          }}>{primaryLabel}</button>
        )}
      </div>
    </div>
  );
}

const FT_GROUP_NAME = "First Timers";

function AppShell() {
  const { church, signOut, updateChurch } = useAuth();
  const churchId = church.id;

  const [groups,            setGroupsRaw]      = useState([]);
  const [members,           setMembersRaw]     = useState([]);
  const [attendanceHistory, setAtHistory]      = useState([]);
  const [firstTimers,       setFirstTimersRaw] = useState([]);
  const [ftAttendance,      setFtAttRaw]       = useState({});
  const [ftGroupId,         setFtGroupId]      = useState(null);
  const [toast,             setToast]          = useState(null);
  const [dataLoading,       setDataLoading]    = useState(true);
  const [dataError,         setDataError]      = useState(null);

  const showToast = useCallback((msg) => setToast(msg), []);

  const loadAll = useCallback(async () => {
    setDataLoading(true);
    setDataError(null);
    try {
      const [g, m, a, ft, fta] = await Promise.all([
        fetchGroups(churchId),
        fetchMembers(churchId),
        fetchAttendance(churchId),
        fetchFirstTimers(churchId),
        fetchFtAttendance(churchId),
      ]);
      if (g.error) throw g.error;
      const allGroups = g.data ?? [];
      const ftAll = allGroups.filter(x => x.name === FT_GROUP_NAME);
      let ftGroup = ftAll[0] || null;
      for (let i = 1; i < ftAll.length; i++) {
        await supabase.from("groups").delete().eq("id", ftAll[i].id);
      }
      let cleanGroups = ftAll.length > 1
        ? allGroups.filter(x => x.name !== FT_GROUP_NAME || x.id === ftGroup?.id)
        : [...allGroups];
      if (!ftGroup) {
        const { data: newFtG } = await supabase.from("groups")
          .insert({ church_id: churchId, name: FT_GROUP_NAME, leader: "" })
          .select().single();
        if (newFtG) { ftGroup = newFtG; cleanGroups = [...cleanGroups, newFtG]; }
      }
      setGroupsRaw(cleanGroups);
      if (ftGroup) setFtGroupId(ftGroup.id);
      const allMembers = m.data ?? [];
      setMembersRaw(allMembers);
      if (ftGroup && ft.data?.length) {
        const ftGroupMembers = allMembers.filter(mb => (mb.groupIds || []).includes(ftGroup.id));
        const ftMemberNames  = new Set(ftGroupMembers.map(mb => mb.name.trim().toLowerCase()));
        const missing = (ft.data ?? []).filter(v => !ftMemberNames.has(v.name.trim().toLowerCase()));
        for (const visitor of missing) {
          const { data: newM } = await supabase.from("members")
            .insert({ church_id: churchId, name: visitor.name.trim(), phone: visitor.phone || "",
              address: visitor.address || "", groupIds: [ftGroup.id], status: "active" })
            .select().single();
          if (newM) allMembers.push(newM);
        }
        if (missing.length) setMembersRaw([...allMembers]);
      }
      setAtHistory((a.data ?? []).map(s => ({
        id: s.id, groupId: s.group_id, date: s.date, church_id: s.church_id,
        records: (s.records ?? []).map(r => ({ memberId: r.member_id, name: r.name, present: r.present })),
      })));
      setFirstTimersRaw(ft.data ?? []);
      setFtAttRaw(fta.data ?? {});
    } catch (e) {
      setDataError(e?.message || "Failed to load data");
    } finally {
      setDataLoading(false);
    }
  }, [churchId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    let lastLoaded = Date.now();
    const STALE_MS = 5 * 60 * 1000;
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        if (Date.now() - lastLoaded > STALE_MS) { lastLoaded = Date.now(); loadAll(); }
      } else { lastLoaded = Date.now(); }
    };
    lastLoaded = Date.now();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [loadAll]);

  // ── CRUD helpers ──────────────────────────────────────────────────────────
  const addGroup    = useCallback(async g    => { await ensureSession(); const r = await createGroup({ ...g, church_id: churchId }); if (!r.error && r.data) setGroupsRaw(p => [...p, r.data]); return r; }, [churchId]);
  const editGroup   = useCallback(async (id, u) => { await ensureSession(); const r = await updateGroup(id, u); if (!r.error && r.data) setGroupsRaw(p => p.map(x => x.id === id ? r.data : x)); return r; }, []);
  const removeGroup = useCallback(async id  => { await ensureSession(); const r = await deleteGroup(id); if (!r.error) setGroupsRaw(p => p.filter(x => x.id !== id)); return r; }, []);

  const addMember      = useCallback(async m    => { await ensureSession(); const r = await createMember({ ...m, church_id: churchId }); if (!r.error && r.data) setMembersRaw(p => [...p, r.data]); return r; }, [churchId]);
  const bulkAddMembers = useCallback(async ms   => { await ensureSession(); const r = await createMembersBulk(ms.map(m => ({ ...m, church_id: churchId }))); if (!r.error && r.data) setMembersRaw(p => [...p, ...r.data]); return r; }, [churchId]);
  const editMember     = useCallback(async (id, u) => { await ensureSession(); const r = await updateMember(id, u); if (!r.error && r.data) setMembersRaw(p => p.map(x => x.id === id ? r.data : x)); return r; }, []);
  const removeMember   = useCallback(async id  => { await ensureSession(); const r = await deleteMember(id); if (!r.error) setMembersRaw(p => p.filter(x => x.id !== id)); return r; }, []);

  // ── Offline queue ─────────────────────────────────────────────────────────
  const OFFLINE_KEY = "churchtrakr_offline_attendance";

  const getOfflineQueue = useCallback(() => {
    try { return JSON.parse(localStorage.getItem(OFFLINE_KEY) || "[]"); }
    catch { return []; }
  }, []);

  const flushOfflineQueue = useCallback(async () => {
    const queue = getOfflineQueue();
    if (!queue.length) return;
    const remaining = [];
    for (const session of queue) {
      const r = await saveAttendanceSession({ ...session, church_id: churchId });
      if (r.error) { remaining.push(session); }
      else if (r.data) {
        const sessId = r.data.id;
        const normalised = (session.records || []).map(rec => ({
          memberId: rec.memberId || rec.member_id || null,
          name: rec.name, present: rec.present,
        }));
        setAtHistory(h => {
          const i = h.findIndex(s => s.id === sessId || s.id === session.id);
          return i >= 0 ? h.map((s, j) => j === i ? { ...session, id: sessId, records: normalised } : s)
                        : [...h, { ...session, id: sessId, records: normalised }];
        });
      }
    }
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(remaining));
    if (remaining.length < queue.length) {
      showToast(`✅ ${queue.length - remaining.length} offline session${queue.length - remaining.length > 1 ? "s" : ""} synced`);
    }
  }, [churchId, getOfflineQueue, showToast]);

  useEffect(() => {
    const handler = e => { if (e.data?.type === "FLUSH_OFFLINE_QUEUE") flushOfflineQueue(); };
    navigator.serviceWorker?.addEventListener("message", handler);
    return () => navigator.serviceWorker?.removeEventListener("message", handler);
  }, [flushOfflineQueue]);

  useEffect(() => {
    const onOnline = () => flushOfflineQueue();
    window.addEventListener("online", onOnline);
    flushOfflineQueue();
    return () => window.removeEventListener("online", onOnline);
  }, [flushOfflineQueue]);

  const saveAttendance = useCallback(async session => {
    await ensureSession();
    let r = await saveAttendanceSession({ ...session, church_id: churchId });
    if (r.error) {
      const msg = (r.error?.message || "").toLowerCase();
      const isAuthErr = msg.includes("jwt") || msg.includes("auth") ||
                        msg.includes("permission") || msg.includes("policy") ||
                        msg.includes("401") || msg.includes("403");
      if (isAuthErr) {
        await supabase.auth.refreshSession();
        r = await saveAttendanceSession({ ...session, church_id: churchId });
      }
    }
    if (r.error) {
      const msg = (r.error?.message || "").toLowerCase();
      const isNetworkErr = msg.includes("network") || msg.includes("fetch") ||
                           msg.includes("failed to fetch") || !navigator.onLine;
      if (isNetworkErr || !navigator.onLine) {
        const queue = getOfflineQueue();
        const exists = queue.findIndex(s => s.groupId === session.groupId && s.date === session.date);
        if (exists >= 0) queue[exists] = { ...session, church_id: churchId };
        else queue.push({ ...session, church_id: churchId });
        localStorage.setItem(OFFLINE_KEY, JSON.stringify(queue));
        navigator.serviceWorker?.ready.then(reg => { reg.sync?.register("attendance-sync").catch(() => {}); });
        const localSession = { ...session, id: session.id || `offline-${Date.now()}`, records: session.records };
        setAtHistory(h => {
          const i = h.findIndex(s => s.groupId === session.groupId && s.date === session.date);
          return i >= 0 ? h.map((s, j) => j === i ? localSession : s) : [...h, localSession];
        });
        return { data: localSession, error: null, offline: true };
      }
    }
    if (!r.error && r.data) {
      const sessId = r.data.id;
      const normalised = (session.records || []).map(rec => ({
        memberId: rec.memberId || rec.member_id || null, name: rec.name, present: rec.present,
      }));
      const saved = { ...session, id: sessId, records: normalised };
      setAtHistory(h => {
        const i = h.findIndex(s => s.id === sessId || s.id === session.id);
        return i >= 0 ? h.map((s, j) => j === i ? saved : s) : [...h, saved];
      });
    }
    return r;
  }, [churchId, getOfflineQueue]);

  const addFirstTimer = useCallback(async ft => {
    await ensureSession();
    const r = await createFirstTimer({ ...ft, church_id: churchId });
    if (!r.error && r.data) {
      setFirstTimersRaw(p => [r.data, ...p]);
      if (ftGroupId) {
        const { data: existing } = await supabase.from("members")
          .select("id, groupIds").eq("church_id", churchId)
          .eq("name", ft.name.trim()).maybeSingle();
        if (existing) {
          const grpIds = existing.groupIds || [];
          if (!grpIds.includes(ftGroupId)) {
            const updated = await updateMember(existing.id, { groupIds: [...grpIds, ftGroupId] });
            if (updated.data) setMembersRaw(p => p.map(x => x.id === existing.id ? updated.data : x));
          }
        } else {
          const { data: newM } = await createMember({
            church_id: churchId, name: ft.name.trim(), phone: ft.phone || "",
            address: ft.address || "", groupIds: [ftGroupId], status: "active",
          });
          if (newM) setMembersRaw(p => [...p, newM]);
        }
      }
    }
    return r;
  }, [churchId, ftGroupId]);

  const editFirstTimer   = useCallback(async (id, u) => { const r = await updateFirstTimer(id, u); if (!r.error && r.data) setFirstTimersRaw(p => p.map(x => x.id === id ? r.data : x)); return r; }, []);
  const removeFirstTimer = useCallback(async (id, name) => {
    const r = await deleteFirstTimer(id);
    if (!r.error) {
      setFirstTimersRaw(p => p.filter(x => x.id !== id));
      if (ftGroupId && name) {
        setMembersRaw(prev => {
          const ftMember = prev.find(m => (m.groupIds || []).includes(ftGroupId) && m.name === name);
          if (ftMember) { deleteMember(ftMember.id); return prev.filter(x => x.id !== ftMember.id); }
          return prev;
        });
      }
    }
    return r;
  }, [ftGroupId]);

  const setFtAttendance = useCallback((updOrVal) => {
    setFtAttRaw(prev => {
      const next = typeof updOrVal === "function" ? updOrVal(prev) : updOrVal;
      saveFtAttendance(churchId, next);
      return next;
    });
  }, [churchId]);

  const { showInstallBanner, promptInstall, dismissInstall, updateAvailable, applyUpdate,
          pushPermission, pushSubscription, subscribePush } = usePWA(churchId);

  const [showPushPrompt, setShowPushPrompt] = useState(false);
  useEffect(() => {
    if (pushSubscription) return;
    if (pushPermission === "denied") return;
    if (pushPermission === "granted" && !pushSubscription) return;
    const snoozedUntil = parseInt(localStorage.getItem("push_snooze_until") || "0");
    if (Date.now() < snoozedUntil) return;
    const t = setTimeout(() => setShowPushPrompt(true), 3000);
    return () => clearTimeout(t);
  }, [pushPermission, pushSubscription]);

  const handleEnableNotifications = async () => { setShowPushPrompt(false); await subscribePush(); };
  const handleSnoozeNotifications = () => {
    localStorage.setItem("push_snooze_until", String(Date.now() + 3 * 24 * 60 * 60 * 1000));
    setShowPushPrompt(false);
  };

  const shared = {
    groups, members, attendanceHistory, firstTimers, ftAttendance, ftGroupId,
    addGroup, editGroup, removeGroup,
    addMember, bulkAddMembers, editMember, removeMember,
    setAttendanceHistory: setAtHistory, saveAttendance,
    addFirstTimer, editFirstTimer, removeFirstTimer,
    setFtAttendance, showToast, updateChurch, signOut,
  };

  return (
    <>
      <AppLayout>
        {/* ── Banners ── */}
        {showPushPrompt && (
          <Banner
            icon="🔔" title="Enable notifications"
            subtitle="Sunday reminders, birthday alerts & absentee follow-ups"
            primaryAction={handleEnableNotifications} primaryLabel="Enable"
            secondaryAction={handleSnoozeNotifications} secondaryLabel="Later"
            gradient="linear-gradient(135deg, #0f6e56, #1a3a2a)"
          />
        )}
        {updateAvailable && (
          <Banner
            icon="✨" title="A new version of ChurchTrakr is ready"
            primaryAction={applyUpdate} primaryLabel="Update now"
          />
        )}
        {showInstallBanner && (
          <Banner
            icon="📱" title="Add ChurchTrakr to your home screen"
            subtitle="Works offline · Faster access · No app store needed"
            primaryAction={promptInstall} primaryLabel="Install"
            secondaryAction={dismissInstall} secondaryLabel="Not now"
          />
        )}

        {/* ── Error banner ── */}
        {dataError && (
          <div style={{
            background: "#fef2f2", borderBottom: "2px solid #fecaca",
            padding: "11px 22px", fontSize: 13, color: "#dc2626",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          }}>
            <span style={{ fontWeight: 500 }}>⚠️ {dataError}</span>
            <button onClick={loadAll} style={{
              background: "#dc2626", color: "#fff", border: "none",
              borderRadius: 7, padding: "6px 14px", cursor: "pointer",
              fontSize: 12, fontWeight: 700,
            }}>Retry</button>
          </div>
        )}

        {/* ── Progress bar ── */}
        {dataLoading && <div className="progress-bar" />}

        <Routes>
          <Route path="/"                  element={<Dashboard      {...shared} />} />
          <Route path="/groups/*"          element={<Groups         {...shared} />} />
          <Route path="/members"           element={<Members        {...shared} />} />
          <Route path="/attendance"        element={<Attendance     {...shared} />} />
          <Route path="/absentees"         element={<Absentees      {...shared} />} />
          <Route path="/firsttimers"       element={<FirstTimers    {...shared} />} />
          <Route path="/settings"          element={<Settings       {...shared} />} />
          <Route path="/analytics"         element={<Analytics      {...shared} />} />
          <Route path="/messaging"         element={<MessagingHome   showToast={showToast} />} />
          <Route path="/messaging/send"    element={<MessageComposer {...shared} />} />
          <Route path="/messaging/credits" element={<CreditsPage     showToast={showToast} />} />
          <Route path="/messaging/history" element={<MessageHistory  showToast={showToast} />} />
          <Route path="*"                  element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </>
  );
}

function Root() {
  const { loading, isAuthenticated, church } = useAuth();

  if (window.location.pathname.startsWith("/superadmin")) return <SuperAdmin />;
  if (loading) return <LoadingScreen />;
  if (isAuthenticated && church) return <AppShell />;

  return (
    <Routes>
      <Route path="/"           element={<LandingPage />} />
      <Route path="/login"      element={<LoginPage />} />
      <Route path="/signup"     element={<SignupPage />} />
      <Route path="/forgot"     element={<ForgotPage />} />
      <Route path="/superadmin" element={<SuperAdmin />} />
      <Route path="*"           element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  );
}