// src/services/api/index.js
// All Supabase data operations. Returns { data, error } matching Supabase conventions.
// Includes automatic retry logic for network errors (useful on poor connections).

import { supabase } from "../supabaseClient";

// ── Retry helper ──────────────────────────────────────────────────────────────
// Retries a Supabase operation up to `maxRetries` times on network-level failures.
// Supabase returns { data, error } — we only retry when error looks network-related.
const withRetry = async (fn, maxRetries = 2, delayMs = 800) => {
  let lastResult;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    lastResult = await fn();
    const { error } = lastResult;
    if (!error) return lastResult;
    // Only retry on network/fetch errors, not on auth or constraint errors
    const isNetworkError =
      error.message?.includes("fetch") ||
      error.message?.includes("network") ||
      error.message?.includes("timeout") ||
      error.message?.includes("Failed to fetch") ||
      error.code === "PGRST301" || // Connection issues
      (error.status >= 500 && error.status < 600); // Server errors
    if (!isNetworkError || attempt === maxRetries) return lastResult;
    await new Promise(r => setTimeout(r, delayMs * (attempt + 1)));
  }
  return lastResult;
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
  const row = { ...updates };
  if (row.birthday === "") delete row.birthday;
  delete row.id;
  delete row.church_id;
  delete row.created_at;
  return withRetry(() => supabase.from("members").update(row).eq("id", id).select().single());
};

export const deleteMember = (id) =>
  withRetry(() => supabase.from("members").delete().eq("id", id));

// ── ATTENDANCE ────────────────────────────────────────────────────────────────

export const fetchAttendance = async (churchId) => {
  const result = await withRetry(() =>
    supabase
      .from("attendance_sessions")
      .select("*, records:attendance_records(*)")
      .eq("church_id", churchId)
      .order("date", { ascending: false })
      .limit(200) // Lazy-load cap — avoids fetching thousands of old records on login
  );
  return result;
};

export const saveAttendanceSession = async (session) => {
  const upsertRow = {
    church_id: session.church_id,
    group_id:  session.groupId,
    date:      session.date,
  };
  if (session.id) upsertRow.id = session.id;

  const { data: sess, error: sessErr } = await withRetry(() =>
    supabase
      .from("attendance_sessions")
      .upsert(upsertRow, { onConflict: session.id ? "id" : "group_id,date" })
      .select()
      .single()
  );
  if (sessErr) return { data: null, error: sessErr };

  await withRetry(() =>
    supabase.from("attendance_records").delete().eq("session_id", sess.id)
  );

  const records = session.records.map(r => ({
    session_id: sess.id,
    member_id:  r.memberId,
    name:       r.name,
    present:    r.present,
  }));

  if (records.length > 0) {
    const { error: recErr } = await withRetry(() =>
      supabase.from("attendance_records").insert(records)
    );
    if (recErr) return { data: null, error: recErr };
  }

  return { data: sess, error: null };
};

// ── FIRST TIMERS ──────────────────────────────────────────────────────────────

export const fetchFirstTimers = (churchId) =>
  withRetry(() =>
    supabase.from("first_timers")
      .select("*")
      .eq("church_id", churchId)
      .order("date", { ascending: false })
      .limit(500)
  );

export const createFirstTimer = (ft) => {
  const row = { ...ft };
  if (!row.date) row.date = new Date().toISOString().split("T")[0];
  if (!row.visits) row.visits = [row.date];
  return withRetry(() => supabase.from("first_timers").insert(row).select().single());
};

export const updateFirstTimer = (id, updates) => {
  const row = { ...updates };
  delete row.id;
  delete row.church_id;
  delete row.created_at;
  return withRetry(() => supabase.from("first_timers").update(row).eq("id", id).select().single());
};

export const deleteFirstTimer = (id) =>
  withRetry(() => supabase.from("first_timers").delete().eq("id", id));

// First-timer attendance stored as JSONB: { "YYYY-MM-DD": { "person_id": true|false } }
export const fetchFtAttendance = async (churchId) => {
  const { data, error } = await withRetry(() =>
    supabase
      .from("ft_attendance")
      .select("attendance")
      .eq("church_id", churchId)
      .maybeSingle()
  );
  return { data: data?.attendance ?? {}, error };
};

export const saveFtAttendance = (churchId, attendance) =>
  withRetry(() =>
    supabase.from("ft_attendance")
      .upsert({ church_id: churchId, attendance }, { onConflict: "church_id" })
  );

// ── MESSAGING ─────────────────────────────────────────────────────────────────

export const fetchMessageHistory = (churchId) =>
  withRetry(() =>
    supabase.from("sms_logs")
      .select("*")
      .eq("church_id", churchId)
      .order("created_at", { ascending: false })
  );

export const logSmsMessage = (log) =>
  withRetry(() => supabase.from("sms_logs").insert(log).select().single());

export const fetchCredits = async (churchId) => {
  const { data, error } = await withRetry(() =>
    supabase
      .from("churches")
      .select("sms_credits")
      .eq("id", churchId)
      .single()
  );
  return { data: { credits: data?.sms_credits ?? 0 }, error };
};