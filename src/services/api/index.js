// src/services/api/index.js
// All Supabase data operations. Returns { data, error } matching Supabase conventions.

import { supabase } from "../supabaseClient";

// ── GROUPS ────────────────────────────────────────────────────────────────────

export const fetchGroups = async (churchId) =>
  supabase.from("groups").select("*").eq("church_id", churchId).order("name");

export const createGroup = async (group) =>
  supabase.from("groups").insert(group).select().single();

export const updateGroup = async (id, updates) =>
  supabase.from("groups").update(updates).eq("id", id).select().single();

export const deleteGroup = async (id) =>
  supabase.from("groups").delete().eq("id", id);

// ── MEMBERS ───────────────────────────────────────────────────────────────────

export const fetchMembers = async (churchId) =>
  supabase.from("members").select("*").eq("church_id", churchId).order("name");

export const createMember = async (member) => {
  // Ensure groupIds is a proper array (Postgres uuid[])
  const row = { ...member, groupIds: member.groupIds ?? [] };
  // Remove any undefined/empty birthday so we don't store empty strings
  if (!row.birthday) delete row.birthday;
  return supabase.from("members").insert(row).select().single();
};

export const createMembersBulk = async (members) => {
  const rows = members.map(m => {
    const r = { ...m, groupIds: m.groupIds ?? [] };
    if (!r.birthday) delete r.birthday;
    return r;
  });
  return supabase.from("members").insert(rows).select();
};

export const updateMember = async (id, updates) => {
  const row = { ...updates };
  if (row.birthday === "") delete row.birthday;
  // Don't re-send id / church_id in the update body
  delete row.id;
  delete row.church_id;
  delete row.created_at;
  return supabase.from("members").update(row).eq("id", id).select().single();
};

export const deleteMember = async (id) =>
  supabase.from("members").delete().eq("id", id);

// ── ATTENDANCE ────────────────────────────────────────────────────────────────

export const fetchAttendance = async (churchId) => {
  const { data, error } = await supabase
    .from("attendance_sessions")
    .select("*, records:attendance_records(*)")
    .eq("church_id", churchId)
    .order("date", { ascending: false });
  return { data, error };
};

export const saveAttendanceSession = async (session) => {
  // Upsert the session row
  const upsertRow = {
    church_id: session.church_id,
    group_id:  session.groupId,
    date:      session.date,
  };
  // Only include id if we're editing an existing session
  if (session.id) upsertRow.id = session.id;

  const { data: sess, error: sessErr } = await supabase
    .from("attendance_sessions")
    .upsert(upsertRow, { onConflict: session.id ? "id" : "group_id,date" })
    .select()
    .single();
  if (sessErr) return { data: null, error: sessErr };

  // Replace all records for this session
  await supabase.from("attendance_records").delete().eq("session_id", sess.id);
  const records = session.records.map(r => ({
    session_id: sess.id,
    member_id:  r.memberId,
    name:       r.name,
    present:    r.present,
  }));
  if (records.length > 0) {
    const { error: recErr } = await supabase.from("attendance_records").insert(records);
    if (recErr) return { data: null, error: recErr };
  }

  return { data: sess, error: null };
};

// ── FIRST TIMERS ──────────────────────────────────────────────────────────────

export const fetchFirstTimers = async (churchId) =>
  supabase.from("first_timers")
    .select("*")
    .eq("church_id", churchId)
    .order("date", { ascending: false });

export const createFirstTimer = async (ft) => {
  const row = { ...ft };
  if (!row.date) row.date = new Date().toISOString().split("T")[0];
  // visits is stored as a jsonb array — keep it or default to [date]
  if (!row.visits) row.visits = [row.date];
  return supabase.from("first_timers").insert(row).select().single();
};

export const updateFirstTimer = async (id, updates) => {
  const row = { ...updates };
  delete row.id;
  delete row.church_id;
  delete row.created_at;
  return supabase.from("first_timers").update(row).eq("id", id).select().single();
};

export const deleteFirstTimer = async (id) =>
  supabase.from("first_timers").delete().eq("id", id);

// First-timer attendance stored as JSONB: { "YYYY-MM-DD": { "person_id": true|false } }
export const fetchFtAttendance = async (churchId) => {
  const { data, error } = await supabase
    .from("ft_attendance")
    .select("attendance")
    .eq("church_id", churchId)
    .maybeSingle();
  return { data: data?.attendance ?? {}, error };
};

export const saveFtAttendance = async (churchId, attendance) =>
  supabase.from("ft_attendance")
    .upsert({ church_id: churchId, attendance }, { onConflict: "church_id" });

// ── MESSAGING ─────────────────────────────────────────────────────────────────

export const fetchMessageHistory = async (churchId) =>
  supabase.from("sms_logs")
    .select("*")
    .eq("church_id", churchId)
    .order("created_at", { ascending: false });

export const logSmsMessage = async (log) =>
  supabase.from("sms_logs").insert(log).select().single();

export const fetchCredits = async (churchId) => {
  const { data, error } = await supabase
    .from("churches")
    .select("sms_credits")
    .eq("id", churchId)
    .single();
  return { data: { credits: data?.sms_credits ?? 0 }, error };
};