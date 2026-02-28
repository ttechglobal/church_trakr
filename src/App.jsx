// src/App.jsx
import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { AppLayout } from "./components/layout/AppLayout";
import { Toast } from "./components/ui/Toast";

import {
  fetchGroups, createGroup, updateGroup, deleteGroup,
  fetchMembers, createMember, createMembersBulk, updateMember, deleteMember,
  fetchAttendance, saveAttendanceSession,
  fetchFirstTimers, createFirstTimer, updateFirstTimer, deleteFirstTimer,
  fetchFtAttendance, saveFtAttendance,
} from "./services/api";

import LoginPage    from "./pages/LoginPage";
import SignupPage   from "./pages/SignupPage";
import ForgotPage   from "./pages/ForgotPage";
import Dashboard    from "./pages/Dashboard";
import Groups       from "./pages/Groups";
import Members      from "./pages/Members";
import Attendance   from "./pages/Attendance";
import FirstTimers  from "./pages/FirstTimers";
import Settings     from "./pages/Settings";
import MessagingHome   from "./pages/messaging/MessagingHome";
import MessageComposer from "./pages/messaging/MessageComposer";
import CreditsPage     from "./pages/messaging/CreditsPage";
import MessageHistory  from "./pages/messaging/MessageHistory";

// ── Loading screen ──────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 20, background: "#f5f7fa",
    }}>
      <div style={{ fontSize: 52 }}>⛪</div>
      <div style={{
        width: 40, height: 40,
        border: "4px solid #e0e0e0",
        borderTop: "4px solid #4f46e5",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── AppShell — only rendered when user is authenticated ─────────────────────
// Loads all church data and provides it to every page.
function AppShell() {
  const { church, showToast: _ } = useAuth();
  const churchId = church?.id;

  const [groups,            setGroupsRaw]      = useState([]);
  const [members,           setMembersRaw]     = useState([]);
  const [attendanceHistory, setAtHistory]      = useState([]);
  const [firstTimers,       setFirstTimersRaw] = useState([]);
  const [ftAttendance,      setFtAttendanceRaw]= useState({});
  const [toast,             setToast]          = useState(null);

  const showToast = useCallback((msg) => setToast(msg), []);

  // Load all data whenever churchId is available (set after login)
  useEffect(() => {
    if (!churchId) {
      setGroupsRaw([]); setMembersRaw([]); setAtHistory([]);
      setFirstTimersRaw([]); setFtAttendanceRaw({});
      return;
    }
    Promise.all([
      fetchGroups(churchId),
      fetchMembers(churchId),
      fetchAttendance(churchId),
      fetchFirstTimers(churchId),
      fetchFtAttendance(churchId),
    ]).then(([g, m, a, ft, fta]) => {
      setGroupsRaw(g.data ?? []);
      setMembersRaw(m.data ?? []);
      setAtHistory((a.data ?? []).map(s => ({
        id: s.id, groupId: s.group_id, date: s.date, church_id: s.church_id,
        records: (s.records ?? []).map(r => ({
          memberId: r.member_id, name: r.name, present: r.present,
        })),
      })));
      setFirstTimersRaw(ft.data ?? []);
      setFtAttendanceRaw(fta.data ?? {});
    }).catch(e => console.error("[AppShell] data load error:", e));
  }, [churchId]);

  // ── Helpers ────────────────────────────────────────────────────────────
  const addGroup    = useCallback(async (g) => {
    if (!churchId) return { error: new Error("Not signed in") };
    const r = await createGroup({ ...g, church_id: churchId });
    if (!r.error && r.data) setGroupsRaw(p => [...p, r.data]);
    return r;
  }, [churchId]);

  const editGroup   = useCallback(async (id, u) => {
    const r = await updateGroup(id, u);
    if (!r.error && r.data) setGroupsRaw(p => p.map(x => x.id === id ? r.data : x));
    return r;
  }, []);

  const removeGroup = useCallback(async (id) => {
    const r = await deleteGroup(id);
    if (!r.error) setGroupsRaw(p => p.filter(x => x.id !== id));
    return r;
  }, []);

  const addMember = useCallback(async (m) => {
    if (!churchId) return { error: new Error("Not signed in") };
    const r = await createMember({ ...m, church_id: churchId });
    if (!r.error && r.data) setMembersRaw(p => [...p, r.data]);
    return r;
  }, [churchId]);

  const bulkAddMembers = useCallback(async (ms) => {
    if (!churchId) return { error: new Error("Not signed in") };
    const r = await createMembersBulk(ms.map(m => ({ ...m, church_id: churchId })));
    if (!r.error && r.data) setMembersRaw(p => [...p, ...r.data]);
    return r;
  }, [churchId]);

  const editMember = useCallback(async (id, u) => {
    const r = await updateMember(id, u);
    if (!r.error && r.data) setMembersRaw(p => p.map(x => x.id === id ? r.data : x));
    return r;
  }, []);

  const removeMember = useCallback(async (id) => {
    const r = await deleteMember(id);
    if (!r.error) setMembersRaw(p => p.filter(x => x.id !== id));
    return r;
  }, []);

  const saveAttendance = useCallback(async (session) => {
    if (!churchId) return { error: new Error("Not signed in") };
    const r = await saveAttendanceSession({ ...session, church_id: churchId });
    if (!r.error && r.data) {
      const saved = { ...session, id: r.data.id };
      setAtHistory(h => {
        const idx = h.findIndex(s => s.id === session.id);
        return idx >= 0 ? h.map((s, i) => i === idx ? saved : s) : [...h, saved];
      });
    }
    return r;
  }, [churchId]);

  const addFirstTimer = useCallback(async (ft) => {
    if (!churchId) return { error: new Error("Not signed in") };
    const r = await createFirstTimer({ ...ft, church_id: churchId });
    if (!r.error && r.data) setFirstTimersRaw(p => [r.data, ...p]);
    return r;
  }, [churchId]);

  const editFirstTimer = useCallback(async (id, u) => {
    const r = await updateFirstTimer(id, u);
    if (!r.error && r.data) setFirstTimersRaw(p => p.map(x => x.id === id ? r.data : x));
    return r;
  }, []);

  const removeFirstTimer = useCallback(async (id) => {
    const r = await deleteFirstTimer(id);
    if (!r.error) setFirstTimersRaw(p => p.filter(x => x.id !== id));
    return r;
  }, []);

  const setFtAttendance = useCallback((updaterOrValue) => {
    setFtAttendanceRaw(prev => {
      const next = typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue;
      if (churchId) saveFtAttendance(churchId, next);
      return next;
    });
  }, [churchId]);

  const shared = {
    groups, members, attendanceHistory, firstTimers, ftAttendance,
    addGroup, editGroup, removeGroup,
    addMember, bulkAddMembers, editMember, removeMember,
    setAttendanceHistory: setAtHistory, saveAttendance,
    addFirstTimer, editFirstTimer, removeFirstTimer,
    setFtAttendance,
    showToast,
  };

  return (
    <>
      <AppLayout>
        <Routes>
          <Route path="/"              element={<Dashboard {...shared} />} />
          <Route path="/groups/*"      element={<Groups {...shared} />} />
          <Route path="/members"       element={<Members {...shared} />} />
          <Route path="/attendance"    element={<Attendance {...shared} />} />
          <Route path="/firsttimers"   element={<FirstTimers {...shared} />} />
          <Route path="/settings"      element={<Settings {...shared} />} />
          <Route path="/messaging"         element={<MessagingHome showToast={showToast} />} />
          <Route path="/messaging/send"    element={<MessageComposer {...shared} />} />
          <Route path="/messaging/credits" element={<CreditsPage showToast={showToast} />} />
          <Route path="/messaging/history" element={<MessageHistory showToast={showToast} />} />
          <Route path="*"              element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────
// Auth state drives ALL routing. Pages never call navigate() after sign-in.
function Root() {
  const { isAuthenticated, loading } = useAuth();

  // Still resolving session from localStorage — show spinner
  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      {/* Auth pages: redirect to dashboard if already signed in */}
      <Route path="/login"  element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/" replace /> : <SignupPage />} />
      <Route path="/forgot" element={<ForgotPage />} />

      {/* App: redirect to login if not signed in */}
      <Route path="/*" element={isAuthenticated ? <AppShell /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Root />
      </BrowserRouter>
    </AuthProvider>
  );
}