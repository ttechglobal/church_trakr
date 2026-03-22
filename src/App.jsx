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

// ── Loading spinner ──────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      minHeight:"100vh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      gap:16,
      background:"linear-gradient(150deg, #1a3a2a 0%, #2d5a42 60%, #1e4a34 100%)",
    }}>
      <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:"1.4rem",
        fontWeight:700, color:"rgba(255,255,255,.9)", letterSpacing:"-.01em" }}>
        ChurchTrakr
      </div>
      <div style={{
        width:32, height:32,
        border:"3px solid rgba(255,255,255,.15)",
        borderTop:"3px solid rgba(201,168,76,.8)",
        borderRadius:"50%",
        animation:"spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── First Timers group ───────────────────────────────────────────────────────
const FT_GROUP_NAME = "First Timers";

// ── App shell (authenticated) ────────────────────────────────────────────────
function AppShell() {
  const { church, signOut, updateChurch } = useAuth();
  const churchId = church.id;

  const [groups,            setGroupsRaw]   = useState([]);
  const [members,           setMembersRaw]  = useState([]);
  const [attendanceHistory, setAtHistory]   = useState([]);
  const [firstTimers,       setFirstTimersRaw] = useState([]);
  const [ftAttendance,      setFtAttRaw]    = useState({});
  const [ftGroupId,         setFtGroupId]   = useState(null);
  const [toast,             setToast]       = useState(null);
  const [dataLoading,       setDataLoading] = useState(true);
  const [dataError,         setDataError]   = useState(null);

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

  // Re-fetch data when the user returns to the tab, but only if data is
  // more than 5 minutes old — prevents the loading bar flashing on every
  // tab switch for users who are actively working.
  useEffect(() => {
    let lastLoaded = Date.now();
    const STALE_MS = 5 * 60 * 1000; // 5 minutes

    const origLoadAll = loadAll;
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        if (Date.now() - lastLoaded > STALE_MS) {
          lastLoaded = Date.now();
          loadAll();
        }
      } else {
        lastLoaded = Date.now();
      }
    };

    // Record when initial load completes
    lastLoaded = Date.now();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [loadAll]);

  const addGroup    = useCallback(async g    => { await ensureSession(); const r = await createGroup({ ...g, church_id: churchId }); if (!r.error && r.data) setGroupsRaw(p => [...p, r.data]); return r; }, [churchId]);
  const editGroup   = useCallback(async (id, u) => { await ensureSession(); const r = await updateGroup(id, u); if (!r.error && r.data) setGroupsRaw(p => p.map(x => x.id === id ? r.data : x)); return r; }, []);
  const removeGroup = useCallback(async id  => { await ensureSession(); const r = await deleteGroup(id); if (!r.error) setGroupsRaw(p => p.filter(x => x.id !== id)); return r; }, []);

  const addMember      = useCallback(async m    => { await ensureSession(); const r = await createMember({ ...m, church_id: churchId }); if (!r.error && r.data) setMembersRaw(p => [...p, r.data]); return r; }, [churchId]);
  const bulkAddMembers = useCallback(async ms   => { await ensureSession(); const r = await createMembersBulk(ms.map(m => ({ ...m, church_id: churchId }))); if (!r.error && r.data) setMembersRaw(p => [...p, ...r.data]); return r; }, [churchId]);
  const editMember     = useCallback(async (id, u) => { await ensureSession(); const r = await updateMember(id, u); if (!r.error && r.data) setMembersRaw(p => p.map(x => x.id === id ? r.data : x)); return r; }, []);
  const removeMember   = useCallback(async id  => { await ensureSession(); const r = await deleteMember(id); if (!r.error) setMembersRaw(p => p.filter(x => x.id !== id)); return r; }, []);

  // ── Offline queue helpers ─────────────────────────────────────────────────
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

  // Listen for SW telling us to flush the offline queue
  useEffect(() => {
    const handler = e => {
      if (e.data?.type === "FLUSH_OFFLINE_QUEUE") flushOfflineQueue();
    };
    navigator.serviceWorker?.addEventListener("message", handler);
    return () => navigator.serviceWorker?.removeEventListener("message", handler);
  }, [flushOfflineQueue]);

  // Flush on app startup and when coming back online
  useEffect(() => {
    const onOnline = () => { flushOfflineQueue(); };
    window.addEventListener("online", onOnline);
    flushOfflineQueue(); // attempt on mount too
    return () => window.removeEventListener("online", onOnline);
  }, [flushOfflineQueue]);

  const saveAttendance = useCallback(async session => {
    // Always ensure session is valid before saving — this prevents the
    // "stuck at saving" bug where the JWT isn't ready on first load
    await ensureSession();
    let r = await saveAttendanceSession({ ...session, church_id: churchId });

    // If auth error, refresh token and retry once
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

    // If still failing (e.g. offline), save to local queue for later sync
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
        // Register background sync if supported
        navigator.serviceWorker?.ready.then(reg => {
          reg.sync?.register("attendance-sync").catch(() => {});
        });
        // Still update local state so UI is responsive
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
        memberId: rec.memberId || rec.member_id || null,
        name: rec.name, present: rec.present,
      }));
      const saved = { ...session, id: sessId, records: normalised };
      setAtHistory(h => {
        const i = h.findIndex(s => s.id === sessId || s.id === session.id);
        return i >= 0 ? h.map((s, j) => j === i ? saved : s) : [...h, saved];
      });
    }
    return r;
  }, [churchId]);

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

  // Show push prompt if: not yet granted, not denied, not snoozed recently
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  useEffect(() => {
    if (pushSubscription) return; // already subscribed
    if (pushPermission === "denied") return; // blocked — can't ask
    if (pushPermission === "granted" && !pushSubscription) return; // granted but no sub yet, will handle
    const snoozedUntil = parseInt(localStorage.getItem("push_snooze_until") || "0");
    if (Date.now() < snoozedUntil) return; // snoozed
    // Show prompt after a short delay so it doesn't flash on load
    const t = setTimeout(() => setShowPushPrompt(true), 3000);
    return () => clearTimeout(t);
  }, [pushPermission, pushSubscription]);

  const handleEnableNotifications = async () => {
    setShowPushPrompt(false);
    await subscribePush();
  };

  const handleSnoozeNotifications = () => {
    // Snooze for 3 days before asking again
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
        {/* ── Push notification prompt ── */}
        {showPushPrompt && (
          <div style={{
            background: "linear-gradient(135deg, #0f6e56, #1a3a2a)",
            padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 12,
            flexWrap: "wrap", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>🔔</span>
              <div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 13, color: "#fff" }}>
                  Enable notifications
                </div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "rgba(255,255,255,.65)", marginTop: 1 }}>
                  Get Sunday reminders, birthday alerts & absentee follow-ups
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button onClick={handleSnoozeNotifications} style={{
                background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.2)",
                color: "rgba(255,255,255,.7)", borderRadius: 8, padding: "7px 14px",
                fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 12, cursor: "pointer",
              }}>Later</button>
              <button onClick={handleEnableNotifications} style={{
                background: "#fff", border: "none", color: "#0f6e56",
                borderRadius: 8, padding: "7px 16px",
                fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 12, cursor: "pointer",
              }}>Enable</button>
            </div>
          </div>
        )}

        {/* ── Update available banner ── */}
        {updateAvailable && (
          <div style={{
            background: "#1a3a2a", padding: "10px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          }}>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#fff" }}>
              ✨ A new version of ChurchTrakr is ready
            </span>
            <button onClick={applyUpdate} style={{
              background: "#fff", border: "none", color: "#1a3a2a",
              borderRadius: 8, padding: "6px 14px",
              fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 12, cursor: "pointer",
            }}>Update now</button>
          </div>
        )}

        {/* ── Install banner ── */}
        {showInstallBanner && (
          <div style={{
            background: "linear-gradient(135deg, #1a3a2a, #2d5a42)",
            padding: "12px 16px",
            display: "flex", alignItems: "center", gap: 12,
            flexWrap: "wrap", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 12, color: "#fff", flexShrink: 0 }}>CT</div>
              <div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 13, color: "#fff" }}>
                  Add ChurchTrakr to your home screen
                </div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "rgba(255,255,255,.6)", marginTop: 1 }}>
                  Works offline · Faster access · No app store needed
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button onClick={dismissInstall} style={{
                background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.2)",
                color: "rgba(255,255,255,.7)", borderRadius: 8, padding: "7px 14px",
                fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 12, cursor: "pointer",
              }}>Not now</button>
              <button onClick={promptInstall} style={{
                background: "#fff", border: "none", color: "#1a3a2a",
                borderRadius: 8, padding: "7px 16px",
                fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 12, cursor: "pointer",
              }}>Install</button>
            </div>
          </div>
        )}
        {dataError && (
          <div style={{ background:"#fce8e8", borderBottom:"2px solid #f5c8c8",
            padding:"10px 20px", fontSize:13, color:"#8a2020",
            display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
            <span>⚠️ {dataError}</span>
            <button onClick={loadAll} style={{ background:"#8a2020", color:"#fff",
              border:"none", borderRadius:6, padding:"5px 12px", cursor:"pointer",
              fontSize:12, fontWeight:600 }}>Retry</button>
          </div>
        )}
        {dataLoading && (
          <div style={{ height:3,
            background:"linear-gradient(90deg,var(--brand),var(--brand-light),var(--brand))",
            backgroundSize:"200% 100%", animation:"bar 1.2s infinite linear" }}>
            <style>{`@keyframes bar { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
          </div>
        )}
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

// ── Root ─────────────────────────────────────────────────────────────────────
function Root() {
  const { loading, isAuthenticated, church } = useAuth();

  // SuperAdmin handles its own auth — never wrap in AppLayout
  if (window.location.pathname.startsWith("/superadmin")) return <SuperAdmin />;

  if (loading) return <LoadingScreen />;

  if (isAuthenticated && church) {
    // Authenticated — app shell handles all /app routes
    return <AppShell />;
  }

  // Unauthenticated — show landing + auth pages
  return (
    <Routes>
      <Route path="/"       element={<LandingPage />} />
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