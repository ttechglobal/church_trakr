// src/pages/Attendees.jsx
// Dedicated page to follow up with members who attended service —
// send them a thank-you, track who has been messaged.
//
// Architecture mirrors Absentees.jsx exactly:
// - Local-first: localStorage → immediate UI, Supabase → background sync
// - Same 30s sync + visibilitychange re-sync for multi-admin support
// - "Messaged" toggle syncs across all devices sharing the account

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { fmtDate, toWhatsAppNumber } from "../lib/helpers";
import { useAuth } from "../hooks/useAuth";
import { fetchAttendeeFollowUp, saveAttendeeFollowUp } from "../services/api";

const LS_KEY       = "ct_attendee_followup";
const SYNC_INTERVAL = 30_000;

// ── Local-first helpers ───────────────────────────────────────────────────────
function readLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
}
function writeLocal(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  forest:  "#1a3a2a",
  mid:     "#2d5a42",
  green:   "#16a34a",
  gold:    "#c9a84c",
  ivory:   "#fafaf8",
  warm:    "#f5f4f0",
  muted:   "#9ca3af",
  border:  "#e8e6e1",
  text:    "#1c1917",
  serif:   "'Playfair Display', Georgia, serif",
  sans:    "'DM Sans', sans-serif",
};

// ── Attendee card ─────────────────────────────────────────────────────────────
function AttendeeCard({ record, member, messaged, onToggleMessaged, sessionId }) {
  const [toggling, setToggling] = useState(false);
  const phone   = member?.phone || "";
  const intlNum = toWhatsAppNumber(phone);
  const waText  = encodeURIComponent(
    `Dear ${record.name}, thank you for joining us today! We were blessed to have you with us. God bless you and we look forward to seeing you again! 🙏⛪`
  );

  const handleToggle = async () => {
    if (toggling) return;
    setToggling(true);
    await onToggleMessaged(!messaged);
    setToggling(false);
  };

  return (
    <div style={{
      background: messaged ? "#f0fdf6" : "var(--surface, #fff)",
      border: `1.5px solid ${messaged ? "#86efac" : T.border}`,
      borderRadius: 16, padding: "13px 14px", marginBottom: 9,
      opacity: messaged ? 0.85 : 1,
      transition: "all .2s cubic-bezier(.4,0,.2,1)",
      boxShadow: messaged ? "none" : "0 1px 4px rgba(0,0,0,.04)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
        {/* Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: 11, flexShrink: 0,
          background: messaged ? "#dcfce7" : "#f3f4f6",
          border: `1.5px solid ${messaged ? "#86efac" : T.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 15,
          color: messaged ? T.green : T.muted,
        }}>
          {record.name.charAt(0).toUpperCase()}
        </div>

        {/* Name + phone */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 700, fontSize: 14.5, lineHeight: 1.3,
            fontFamily: T.sans,
            color: messaged ? T.muted : T.text,
            textDecoration: messaged ? "line-through" : "none",
          }}>
            {record.name}
          </div>
          <div style={{
            fontSize: 12, marginTop: 2, fontFamily: T.sans,
            color: phone ? T.muted : "var(--danger, #dc2626)",
            fontWeight: phone ? 400 : 600,
          }}>
            {phone || "No phone saved"}
          </div>
          {messaged && (
            <div style={{ fontSize: 11, color: T.green, fontWeight: 600,
              marginTop: 3, fontFamily: T.sans }}>✓ Messaged</div>
          )}
        </div>

        {/* Messaged toggle */}
        <button onClick={handleToggle} disabled={toggling}
          aria-label={messaged ? "Mark as not messaged" : "Mark as messaged"}
          style={{
            width: 46, height: 46, flexShrink: 0, borderRadius: 12,
            border: `2px solid ${messaged ? T.green : T.border}`,
            background: messaged ? T.green : "#f9f9f9",
            cursor: toggling ? "wait" : "pointer",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 2, transition: "all .18s cubic-bezier(.4,0,.2,1)",
          }}>
          {toggling
            ? <div style={{ width: 15, height: 15,
                border: "2px solid rgba(0,0,0,.15)",
                borderTop: `2px solid ${messaged ? "#fff" : T.green}`,
                borderRadius: "50%", animation: "spin .6s linear infinite" }} />
            : <span style={{ fontSize: 17, lineHeight: 1, color: messaged ? "#fff" : T.muted }}>
                {messaged ? "✓" : "○"}
              </span>
          }
          <span style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: ".04em", lineHeight: 1,
            color: messaged ? "rgba(255,255,255,.85)" : T.muted }}>
            {messaged ? "Done" : "Mark"}
          </span>
        </button>
      </div>

      {/* Action row — only if they have a phone */}
      {phone && (
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          <a href={`tel:${phone}`} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            gap: 5, padding: "9px 6px", borderRadius: 9, fontSize: 12.5,
            fontWeight: 700, textDecoration: "none",
            background: "#eff6ff", color: "#1d4ed8", border: "1.5px solid #bfdbfe",
            fontFamily: T.sans,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.69a16 16 0 006.29 6.29l1.22-1.22a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
            </svg>
            Call
          </a>
          <a href={`https://wa.me/${intlNum}?text=${waText}`}
            target="_blank" rel="noreferrer"
            style={{
              flex: 2, display: "flex", alignItems: "center", justifyContent: "center",
              gap: 5, padding: "9px 6px", borderRadius: 9, fontSize: 12.5,
              fontWeight: 700, textDecoration: "none",
              background: "#f0fdf4", color: T.green, border: "1.5px solid #86efac",
              fontFamily: T.sans,
            }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill={T.green}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}

// ── Session row (history) ─────────────────────────────────────────────────────
function SessionRow({ group, session, attendees, followUpData, onClick }) {
  const messaged = attendees.filter(a =>
    followUpData[`att_${session.id}_${a.memberId}`]?.messaged
  ).length;
  const pct = attendees.length ? Math.round(messaged / attendees.length * 100) : 0;
  return (
    <div onClick={onClick} style={{
      background: "#fff", border: `1px solid ${T.border}`, borderRadius: 16,
      padding: "14px 16px", marginBottom: 10, cursor: "pointer",
      boxShadow: "0 1px 4px rgba(0,0,0,.04)",
      transition: "box-shadow .15s",
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.08)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,.04)"}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, fontFamily: T.sans, color: T.text }}>
            {group.name}
          </div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 2, fontFamily: T.sans }}>
            {fmtDate(session.date)} · {attendees.length} attended
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: T.sans,
            color: pct === 100 ? T.green : T.muted }}>
            {messaged}/{attendees.length}
          </div>
          <div style={{ fontSize: 10, color: T.muted, fontFamily: T.sans }}>messaged</div>
        </div>
        <svg width="6" height="11" viewBox="0 0 6 11" fill="none" style={{ opacity: .25, flexShrink: 0 }}>
          <path d="M1 1l4 4.5L1 10" stroke={T.text} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {/* Mini progress strip */}
      <div style={{ height: 3, background: "#e5e7eb", borderRadius: 99, marginTop: 10, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: T.green,
          borderRadius: 99, transition: "width .3s ease" }} />
      </div>
    </div>
  );
}

// ── Detail view for a session ─────────────────────────────────────────────────
function SessionDetailView({ group, session, attendees, members, followUpData, updateKey, onBack }) {
  const messaged = attendees.filter(a => followUpData[`att_${session.id}_${a.memberId}`]?.messaged).length;
  const pending  = attendees.length - messaged;

  return (
    <div className="page" style={{ background: T.ivory, minHeight: "100vh" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{
        background: `linear-gradient(150deg, ${T.forest} 0%, ${T.mid} 60%)`,
        padding: "max(env(safe-area-inset-top,32px),32px) 22px 22px",
      }}>
        <button onClick={onBack} style={{
          background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.2)",
          color: "rgba(255,255,255,.8)", borderRadius: 10, padding: "7px 14px",
          fontFamily: T.sans, fontWeight: 500, fontSize: 13,
          cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
          marginBottom: 16,
        }}>
          <svg width="6" height="11" viewBox="0 0 6 11" fill="none">
            <path d="M5 1L1 5.5L5 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 700,
              color: "#fff", letterSpacing: "-.01em" }}>
              {group.name}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.55)", marginTop: 4, fontFamily: T.sans }}>
              {fmtDate(session.date)} · {attendees.length} attended
            </div>
          </div>
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontFamily: T.serif, fontSize: 36, fontWeight: 700,
              lineHeight: 1, color: messaged === attendees.length ? "#6ee7b7" : "#fcd34d" }}>
              {messaged}/{attendees.length}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", marginTop: 3,
              letterSpacing: ".08em", textTransform: "uppercase", fontFamily: T.sans }}>
              messaged
            </div>
          </div>
        </div>

        {/* Stats pills */}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          {[
            ["Messaged", messaged, "#6ee7b7", "rgba(110,231,183,.1)"],
            ["Pending",  pending,  "#fcd34d", "rgba(252,211,77,.1)"],
            ["Total",    attendees.length, "rgba(255,255,255,.45)", "rgba(255,255,255,.06)"],
          ].map(([l, v, col, bg]) => (
            <div key={l} style={{ flex: 1, background: bg, borderRadius: 12, padding: "10px 8px",
              textAlign: "center", border: "1px solid rgba(255,255,255,.07)" }}>
              <div style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 20,
                color: col, lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 10, color: col, fontWeight: 600, marginTop: 3,
                opacity: 0.75, letterSpacing: ".04em", textTransform: "uppercase",
                fontFamily: T.sans }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mark all button */}
      {pending > 0 && (
        <div style={{ padding: "14px 18px 0" }}>
          <button
            onClick={() => {
              attendees.forEach(a => {
                const key = `att_${session.id}_${a.memberId}`;
                updateKey(key, () => ({ messaged: true }));
              });
            }}
            style={{
              width: "100%", padding: "13px", borderRadius: 12,
              background: T.forest, border: "none", color: "#fff",
              fontFamily: T.sans, fontWeight: 700, fontSize: 13,
              cursor: "pointer",
            }}>
            ✓ Mark all {pending} as messaged
          </button>
        </div>
      )}

      {/* Attendee cards */}
      <div style={{ padding: "14px 18px 32px" }}>
        {attendees.map(a => {
          const key     = `att_${session.id}_${a.memberId}`;
          const member  = members.find(m => m.id === a.memberId);
          const messaged = !!followUpData[key]?.messaged;
          return (
            <AttendeeCard
              key={a.memberId || a.name}
              record={a} member={member}
              messaged={messaged}
              sessionId={session.id}
              onToggleMessaged={val => updateKey(key, () => ({ messaged: val }))}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Attendees({ groups, members, attendanceHistory, showToast }) {
  const { church } = useAuth();

  // ── Local-first follow-up data ────────────────────────────────────────────
  const [followUpData, setFollowUpData] = useState(readLocal);
  const [syncing,      setSyncing]      = useState(false);
  const saveTimer  = useRef(null);
  const latestData = useRef(followUpData);

  useEffect(() => { latestData.current = followUpData; }, [followUpData]);

  const syncFromDB = useCallback(async (quiet = true) => {
    if (!church?.id) return;
    if (!quiet) setSyncing(true);
    try {
      const remote = await fetchAttendeeFollowUp(church.id);
      if (remote && typeof remote === "object") {
        setFollowUpData(local => {
          const merged = { ...remote };
          for (const [k, v] of Object.entries(local)) {
            if (!remote[k]) { merged[k] = v; continue; }
            const remoteTs = new Date(remote[k]?.updatedAt || 0).getTime();
            const localTs  = new Date(v?.updatedAt || 0).getTime();
            if (localTs > remoteTs) merged[k] = v;
          }
          writeLocal(merged);
          return merged;
        });
      }
    } catch {}
    finally { if (!quiet) setSyncing(false); }
  }, [church?.id]);

  const pushToDB = useCallback((data) => {
    if (!church?.id) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveAttendeeFollowUp(church.id, data);
    }, 800);
  }, [church?.id]);

  useEffect(() => { syncFromDB(true); }, [syncFromDB]);
  useEffect(() => {
    const id = setInterval(() => syncFromDB(true), SYNC_INTERVAL);
    return () => clearInterval(id);
  }, [syncFromDB]);
  useEffect(() => {
    const onFocus = () => { if (document.visibilityState === "visible") syncFromDB(true); };
    document.addEventListener("visibilitychange", onFocus);
    return () => document.removeEventListener("visibilitychange", onFocus);
  }, [syncFromDB]);

  const updateKey = useCallback((key, updater) => {
    setFollowUpData(prev => {
      const cur  = prev[key] || {};
      const next = { ...prev, [key]: { ...cur, ...updater(cur), updatedAt: new Date().toISOString() } };
      writeLocal(next);
      pushToDB(next);
      return next;
    });
  }, [pushToDB]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [tab,          setTab]         = useState("now");
  const [selGroupId,   setSelGroupId]  = useState("all");
  const [filterStatus, setFilterStatus] = useState("all"); // "all" | "pending" | "done"
  const [detailView,   setDetailView]  = useState(null);   // { group, session, attendees }

  // ── Most recent session per group ─────────────────────────────────────────
  const latestRows = useMemo(() => {
    const filtered = selGroupId === "all" ? groups : groups.filter(g => String(g.id) === String(selGroupId));
    return filtered.flatMap(group => {
      const sessions = [...attendanceHistory]
        .filter(s => s.groupId === group.id)
        .sort((a, b) => b.date.localeCompare(a.date));
      if (!sessions.length) return [];
      const session  = sessions[0];
      const attended = session.records.filter(r => r.present === true);
      if (!attended.length) return [];
      return [{ group, session, attendees: attended }];
    });
  }, [groups, attendanceHistory, selGroupId]);

  // ── History: all sessions except most recent ──────────────────────────────
  const historyRows = useMemo(() => {
    const filtered = selGroupId === "all" ? groups : groups.filter(g => String(g.id) === String(selGroupId));
    const rows = [];
    for (const group of filtered) {
      const sessions = [...attendanceHistory]
        .filter(s => s.groupId === group.id)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(1); // skip most recent
      for (const session of sessions) {
        const attended = session.records.filter(r => r.present === true);
        if (attended.length) rows.push({ group, session, attendees: attended });
      }
    }
    return rows.sort((a, b) => b.session.date.localeCompare(a.session.date));
  }, [groups, attendanceHistory, selGroupId]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalAttended = latestRows.reduce((s, r) => s + r.attendees.length, 0);
  const totalMessaged = latestRows.reduce((s, r) =>
    s + r.attendees.filter(a => followUpData[`att_${r.session.id}_${a.memberId}`]?.messaged).length, 0);
  const totalPending  = totalAttended - totalMessaged;

  // ── Detail view ───────────────────────────────────────────────────────────
  if (detailView) {
    return (
      <SessionDetailView
        group={detailView.group}
        session={detailView.session}
        attendees={detailView.attendees}
        members={members}
        followUpData={followUpData}
        updateKey={updateKey}
        onBack={() => setDetailView(null)}
      />
    );
  }

  const activeRows = tab === "now" ? latestRows : historyRows;

  return (
    <div className="page" style={{ background: T.ivory, minHeight: "100vh" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ── */}
      <div style={{
        background: `linear-gradient(150deg, ${T.forest} 0%, ${T.mid} 60%, #1e4a34 100%)`,
        padding: "max(env(safe-area-inset-top,32px),32px) 22px 22px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -60, right: -40, width: 200, height: 200,
          borderRadius: "50%", background: "rgba(255,255,255,.03)", pointerEvents: "none" }} />

        <div style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 800,
          color: "#fff", letterSpacing: "-.02em" }}>Attendees</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginTop: 4,
          fontFamily: T.sans }}>Follow up with those who came</div>

        {/* Stats */}
        {totalAttended > 0 && (
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            {[
              [totalAttended, "Attended",   "#6ee7b7", "rgba(110,231,183,.1)"],
              [totalMessaged, "Messaged",   "#93c5fd", "rgba(147,197,253,.1)"],
              [totalPending,  "Pending",    "#fcd34d", "rgba(252,211,77,.1)"],
            ].map(([v, l, col, bg]) => (
              <div key={l} style={{ flex: 1, background: bg, borderRadius: 12,
                padding: "10px 8px", textAlign: "center",
                border: "1px solid rgba(255,255,255,.07)" }}>
                <div style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 22,
                  color: col, lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 10, color: col, fontWeight: 600, marginTop: 3,
                  opacity: 0.75, letterSpacing: ".04em", textTransform: "uppercase",
                  fontFamily: T.sans }}>{l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Filters ── */}
      <div style={{ padding: "14px 18px 0" }}>
        {/* Group filter */}
        {groups.length > 1 && (
          <div style={{ marginBottom: 10, display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
            {[{ id: "all", name: "All Groups" }, ...groups].map(g => (
              <button key={g.id} onClick={() => setSelGroupId(String(g.id))} style={{
                padding: "6px 14px", borderRadius: 20, border: "1.5px solid",
                borderColor: String(selGroupId) === String(g.id) ? T.forest : T.border,
                background: String(selGroupId) === String(g.id) ? T.forest : "#fff",
                color: String(selGroupId) === String(g.id) ? "#fff" : T.muted,
                fontFamily: T.sans, fontWeight: 600, fontSize: 12,
                cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
              }}>{g.name}</button>
            ))}
          </div>
        )}

        {/* Tab switcher */}
        <div style={{ display: "flex", background: "#fff", borderRadius: 14, padding: 4,
          border: `1px solid ${T.border}`, marginBottom: 14 }}>
          {[["now", "This Week"], ["history", "History"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: "9px 8px", borderRadius: 11,
              background: tab === key ? T.forest : "transparent",
              color: tab === key ? "#fff" : T.muted,
              border: "none", fontFamily: T.sans, fontWeight: 700,
              fontSize: 13, cursor: "pointer", transition: "all .18s",
            }}>{label}</button>
          ))}
        </div>

        {/* Status filter (now tab only) */}
        {tab === "now" && totalAttended > 0 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {[["all", "All"], ["pending", "Pending"], ["done", "Messaged"]].map(([key, label]) => (
              <button key={key} onClick={() => setFilterStatus(key)} style={{
                padding: "5px 12px", borderRadius: 20, border: "1.5px solid",
                borderColor: filterStatus === key ? T.forest : T.border,
                background: filterStatus === key ? T.forest : "#fff",
                color: filterStatus === key ? "#fff" : T.muted,
                fontFamily: T.sans, fontWeight: 600, fontSize: 12, cursor: "pointer",
              }}>{label}</button>
            ))}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "0 18px 32px" }}>
        {activeRows.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 20, padding: "48px 24px",
            textAlign: "center", border: `1px solid ${T.border}`,
            boxShadow: "0 1px 6px rgba(0,0,0,.04)" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🙏</div>
            <div style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 18,
              marginBottom: 8, color: T.text }}>
              {tab === "now" ? "No attendance marked yet" : "No history yet"}
            </div>
            <p style={{ fontSize: 13.5, color: T.muted, lineHeight: 1.7 }}>
              {tab === "now"
                ? "Mark attendance for a group first, then come back here to message those who attended."
                : "Past attendance sessions will appear here."}
            </p>
          </div>
        ) : tab === "now" ? (
          // ── Now tab: show attendee cards inline ──
          activeRows.map(({ group, session, attendees }) => {
            // Apply status filter
            const filtered = attendees.filter(a => {
              const key = `att_${session.id}_${a.memberId}`;
              const done = !!followUpData[key]?.messaged;
              if (filterStatus === "pending") return !done;
              if (filterStatus === "done")    return done;
              return true;
            });
            if (!filtered.length) return null;
            const messaged = attendees.filter(a => followUpData[`att_${session.id}_${a.memberId}`]?.messaged).length;
            return (
              <div key={session.id} style={{ marginBottom: 24 }}>
                {/* Group header */}
                <div style={{ display: "flex", alignItems: "center",
                  justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, fontFamily: T.sans, color: T.text }}>
                      {group.name}
                    </div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 1, fontFamily: T.sans }}>
                      {fmtDate(session.date)} · {messaged}/{attendees.length} messaged
                    </div>
                  </div>
                  {/* Progress ring (simple text) */}
                  <div style={{
                    fontSize: 11, fontWeight: 700, fontFamily: T.sans,
                    color: messaged === attendees.length ? T.green : T.muted,
                    background: messaged === attendees.length ? "#dcfce7" : "#f3f4f6",
                    padding: "4px 10px", borderRadius: 20,
                  }}>
                    {messaged === attendees.length ? "✓ All done" : `${attendees.length - messaged} left`}
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: 3, background: "#e5e7eb", borderRadius: 99,
                  overflow: "hidden", marginBottom: 12 }}>
                  <div style={{
                    width: `${attendees.length ? Math.round(messaged/attendees.length*100) : 0}%`,
                    height: "100%", background: T.green,
                    borderRadius: 99, transition: "width .3s ease",
                  }} />
                </div>

                {filtered.map(a => {
                  const key     = `att_${session.id}_${a.memberId}`;
                  const member  = members.find(m => m.id === a.memberId);
                  const done    = !!followUpData[key]?.messaged;
                  return (
                    <AttendeeCard
                      key={a.memberId || a.name}
                      record={a} member={member}
                      messaged={done}
                      sessionId={session.id}
                      onToggleMessaged={val => updateKey(key, () => ({ messaged: val }))}
                    />
                  );
                })}
              </div>
            );
          })
        ) : (
          // ── History tab: show session rows ──
          historyRows.map(({ group, session, attendees }) => (
            <SessionRow
              key={session.id}
              group={group} session={session}
              attendees={attendees} followUpData={followUpData}
              onClick={() => setDetailView({ group, session, attendees })}
            />
          ))
        )}
      </div>
    </div>
  );
}