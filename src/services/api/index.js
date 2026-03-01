// src/services/api/index.js
import { supabase } from "../supabaseClient";

// ── Retry helper ──────────────────────────────────────────────────────────────
const withRetry = async (fn, maxRetries = 2, delayMs = 800) => {
  let last;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    last = await fn();
    const { error } = last;
    if (!error) return last;
    const isNetwork =
      error.message?.includes("fetch") ||
      error.message?.includes("network") ||
      error.message?.includes("timeout") ||
      error.message?.includes("Failed to fetch") ||
      error.code === "PGRST301" ||
      (error.status >= 500 && error.status < 600);
    if (!isNetwork || attempt === maxRetries) return last;
    await new Promise(r => setTimeout(r, delayMs * (attempt + 1)));
  }
  return last;
};

// ── GROUPS ────────────────────────────────────────────────────────────────────
export const fetchGroups = (churchId) =>
  withRetry(() => supabase.from("groups").select("*").eq("church_id", churchId).order("name"));

export const createGroup = (group) =>
  withRetry(() => supabase.from("groups").insert(group).select().single());

export const updateGroup = (id, updates) =>
  withRetry(() => supabase.from("groups").update(updates).eq("id", id).select().single());

export const deleteGroup = (id) =>
  withRetry(() => supabase.from("groups").delete().eq("id", id));

// ── MEMBERS ───────────────────────────────────────────────────────────────────
export const fetchMembers = (churchId) =>
  withRetry(() => supabase.from("members").select("*").eq("church_id", churchId).order("name"));

export const createMember = (member) => {
  const row = { ...member, groupIds: member.groupIds ?? [] };
  if (!row.birthday) delete row.birthday;
  return withRetry(() => supabase.from("members").insert(row).select().single());
};

export const createMembersBulk = (members) => {
  const rows = members.map(m => {
    const r = { ...m, groupIds: m.groupIds ?? [] };
    if (!r.birthday) delete r.birthday;
    return r;
  });
  return withRetry(() => supabase.from("members").insert(rows).select());
};

export const updateMember = (id, updates) => {
  const u = { ...updates };
  if (!u.birthday) delete u.birthday;
  return withRetry(() => supabase.from("members").update(u).eq("id", id).select().single());
};

export const deleteMember = (id) =>
  withRetry(() => supabase.from("members").delete().eq("id", id));

// ── ATTENDANCE ────────────────────────────────────────────────────────────────
export const fetchAttendance = (churchId) =>
  withRetry(() =>
    supabase.from("attendance_sessions")
      .select("*, records:attendance_records(*)")
      .eq("church_id", churchId)
      .order("date", { ascending: false })
      .limit(200)
  );

export const saveAttendanceSession = async (session) => {
  const { id, groupId, date, church_id, records } = session;

  // Upsert the session row
  const { data: sess, error: sessErr } = await withRetry(() =>
    supabase.from("attendance_sessions")
      .upsert({ id: id || undefined, group_id: groupId, date, church_id }, { onConflict: "group_id,date" })
      .select().single()
  );
  if (sessErr) return { data: null, error: sessErr };

  // Delete old records for this session then re-insert
  await supabase.from("attendance_records").delete().eq("session_id", sess.id);

  if (records?.length) {
    const rows = records.map(r => ({
      session_id: sess.id,
      member_id:  r.memberId || null,
      name:       r.name,
      present:    r.present,
    }));
    const { error: recErr } = await supabase.from("attendance_records").insert(rows);
    if (recErr) return { data: null, error: recErr };
  }

  return { data: sess, error: null };
};

// ── FIRST TIMERS ──────────────────────────────────────────────────────────────
export const fetchFirstTimers = (churchId) =>
  withRetry(() =>
    supabase.from("first_timers").select("*").eq("church_id", churchId)
      .order("created_at", { ascending: false }).limit(500)
  );

export const createFirstTimer = (ft) =>
  withRetry(() => supabase.from("first_timers").insert(ft).select().single());

export const updateFirstTimer = (id, updates) =>
  withRetry(() => supabase.from("first_timers").update(updates).eq("id", id).select().single());

export const deleteFirstTimer = (id) =>
  withRetry(() => supabase.from("first_timers").delete().eq("id", id));

// ── FT ATTENDANCE (stored as JSONB blob per church) ───────────────────────────
export const fetchFtAttendance = async (churchId) => {
  const { data, error } = await withRetry(() =>
    supabase.from("ft_attendance").select("attendance").eq("church_id", churchId).maybeSingle()
  );
  if (error) return { data: {}, error };
  return { data: data?.attendance ?? {}, error: null };
};

export const saveFtAttendance = async (churchId, attendance) => {
  return withRetry(() =>
    supabase.from("ft_attendance")
      .upsert({ church_id: churchId, attendance, updated_at: new Date().toISOString() }, { onConflict: "church_id" })
  );
};

// ── SMS LOGS ──────────────────────────────────────────────────────────────────
export const fetchSmsLogs = (churchId) =>
  withRetry(() =>
    supabase.from("sms_logs").select("*").eq("church_id", churchId)
      .order("created_at", { ascending: false }).limit(100)
  );

export const createSmsLog = (log) =>
  withRetry(() => supabase.from("sms_logs").insert(log).select().single());