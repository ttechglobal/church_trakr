// src/App.jsx
import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { AppLayout } from "./components/layout/AppLayout";
import { Toast } from "./components/ui/Toast";

import { supabase } from "./services/supabaseClient";
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
import Absentees    from "./pages/Absentees";
import FirstTimers  from "./pages/FirstTimers";
import Settings     from "./pages/Settings";
import MessagingHome   from "./pages/messaging/MessagingHome";
import MessageComposer from "./pages/messaging/MessageComposer";
import CreditsPage     from "./pages/messaging/CreditsPage";
import MessageHistory  from "./pages/messaging/MessageHistory";

// ── Loading spinner ──────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 16, background: "#f4f6f3",
    }}>
      <div style={{ fontSize: 48 }}>⛪</div>
      <div style={{
        width: 36, height: 36,
        border: "4px solid #e0e0e0",
        borderTop: "4px solid #1a3a2a",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── First Timers group — permanent synthetic group per church ────────────────
const FT_GROUP_NAME = "First Timers";

// ── Main app — only renders when user + church are confirmed ─────────────────
function AppShell() {
  const { church, signOut, updateChurch } = useAuth();
  const churchId = church.id;

  const [groups,            setGroupsRaw]      = useState([]);
  const [members,           setMembersRaw]     = useState([]);
  const [attendanceHistory, setAtHistory]      = useState([]);
  const [firstTimers,       setFirstTimersRaw] = useState([]);
  const [ftAttendance,      setFtAttRaw]       = useState({});
  const [ftGroupId,         setFtGroupId]      = useState(null); // ID of the permanent "First Timers" group
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
      setGroupsRaw(allGroups);
      // Ensure the permanent "First Timers" group exists
      let ftGroup = allGroups.find(x => x.name === FT_GROUP_NAME);
      if (!ftGroup) {
        const { data: newFtG } = await supabase.from("groups")
          .insert({ church_id: churchId, name: FT_GROUP_NAME, leader: "" })
          .select().single();
        if (newFtG) { ftGroup = newFtG; setGroupsRaw(p => [...p, newFtG]); }
      }
      if (ftGroup) setFtGroupId(ftGroup.id);
      setMembersRaw(m.data ?? []);
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

  const addGroup    = useCallback(async g    => { const r = await createGroup({ ...g, church_id: churchId }); if (!r.error && r.data) setGroupsRaw(p => [...p, r.data]); return r; }, [churchId]);
  const editGroup   = useCallback(async (id, u) => { const r = await updateGroup(id, u); if (!r.error && r.data) setGroupsRaw(p => p.map(x => x.id === id ? r.data : x)); return r; }, []);
  const removeGroup = useCallback(async id  => { const r = await deleteGroup(id); if (!r.error) setGroupsRaw(p => p.filter(x => x.id !== id)); return r; }, []);

  const addMember      = useCallback(async m    => { const r = await createMember({ ...m, church_id: churchId }); if (!r.error && r.data) setMembersRaw(p => [...p, r.data]); return r; }, [churchId]);
  const bulkAddMembers = useCallback(async ms   => { const r = await createMembersBulk(ms.map(m => ({ ...m, church_id: churchId }))); if (!r.error && r.data) setMembersRaw(p => [...p, ...r.data]); return r; }, [churchId]);
  const editMember     = useCallback(async (id, u) => { const r = await updateMember(id, u); if (!r.error && r.data) setMembersRaw(p => p.map(x => x.id === id ? r.data : x)); return r; }, []);
  const removeMember   = useCallback(async id  => { const r = await deleteMember(id); if (!r.error) setMembersRaw(p => p.filter(x => x.id !== id)); return r; }, []);

  const saveAttendance = useCallback(async session => {
    const r = await saveAttendanceSession({ ...session, church_id: churchId });
    if (!r.error && r.data) {
      const sessId = r.data.id;
      // Normalise records to the shape the UI expects (memberId camelCase)
      const normalised = (session.records || []).map(rec => ({
        memberId: rec.memberId || rec.member_id || null,
        name:     rec.name,
        present:  rec.present,
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
    const r = await createFirstTimer({ ...ft, church_id: churchId });
    if (!r.error && r.data) {
      setFirstTimersRaw(p => [r.data, ...p]);
      // Also add as a member in the First Timers group for attendance tracking
      if (ftGroupId) {
        const { data: newM } = await createMember({
          church_id: churchId, name: ft.name, phone: ft.phone || "",
          address: ft.address || "", groupIds: [ftGroupId], status: "active",
          _ft_id: r.data.id,
        });
        if (newM) setMembersRaw(p => [...p, newM]);
      }
    }
    return r;
  }, [churchId, ftGroupId]);
  const editFirstTimer   = useCallback(async (id, u) => { const r = await updateFirstTimer(id, u); if (!r.error && r.data) setFirstTimersRaw(p => p.map(x => x.id === id ? r.data : x)); return r; }, []);
  const removeFirstTimer = useCallback(async id => {
    const r = await deleteFirstTimer(id);
    if (!r.error) {
      setFirstTimersRaw(p => p.filter(x => x.id !== id));
      // Also remove the matching member from the First Timers group
      if (ftGroupId) {
        setMembersRaw(prev => {
          const ftMember = prev.find(m => (m.groupIds || []).includes(ftGroupId) && m._ft_id === id);
          if (ftMember) { deleteMember(ftMember.id); return prev.filter(x => x.id !== ftMember.id); }
          // fallback: match by name if _ft_id not set
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
        {dataError && (
          <div style={{ background: "#fce8e8", borderBottom: "2px solid #f5c8c8", padding: "10px 20px", fontSize: 13, color: "#8a2020", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span>⚠️ {dataError}</span>
            <button onClick={loadAll} style={{ background: "#8a2020", color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Retry</button>
          </div>
        )}
        {dataLoading && (
          <div style={{ height: 3, background: "linear-gradient(90deg,var(--brand),var(--brand-light),var(--brand))", backgroundSize: "200% 100%", animation: "bar 1.2s infinite linear" }}>
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

// ── Root — decides what to render ────────────────────────────────────────────
function Root() {
  const { loading, isAuthenticated, church } = useAuth();

  if (loading) return <LoadingScreen />;

  if (isAuthenticated && church) return <AppShell />;

  // Not logged in
  return (
    <Routes>
      <Route path="/login"  element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot" element={<ForgotPage />} />
      <Route path="*"       element={<Navigate to="/login" replace />} />
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