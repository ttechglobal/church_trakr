// src/services/api/index.js
import { supabase } from "../supabaseClient";

// Simple one-shot wrapper — no retry loops that hide errors or cause hangs
const run = (fn) => fn();

// ── GROUPS ────────────────────────────────────────────────────────────────────
export const fetchGroups = (churchId) =>
  supabase.from("groups").select("*").eq("church_id", churchId).order("name");

export const createGroup = (group) =>
  supabase.from("groups").insert(group).select().single();

export const updateGroup = (id, updates) =>
  supabase.from("groups").update(updates).eq("id", id).select().single();

export const deleteGroup = (id) =>
  supabase.from("groups").delete().eq("id", id);

// ── MEMBERS ───────────────────────────────────────────────────────────────────
export const fetchMembers = (churchId) =>
  supabase.from("members").select("*").eq("church_id", churchId).order("name");

export const createMember = (member) => {
  const row = { ...member, groupIds: member.groupIds ?? [] };
  if (!row.birthday) delete row.birthday;
  return supabase.from("members").insert(row).select().single();
};

export const createMembersBulk = (members) => {
  const rows = members.map(m => {
    const r = { ...m, groupIds: m.groupIds ?? [] };
    if (!r.birthday) delete r.birthday;
    return r;
  });
  return supabase.from("members").insert(rows).select();
};

export const updateMember = (id, updates) => {
  const u = { ...updates };
  if (!u.birthday) delete u.birthday;
  return supabase.from("members").update(u).eq("id", id).select().single();
};

export const deleteMember = (id) =>
  supabase.from("members").delete().eq("id", id);

// ── ATTENDANCE ────────────────────────────────────────────────────────────────
export const fetchAttendance = (churchId) =>
  supabase.from("attendance_sessions")
    .select("*, records:attendance_records(*)")
    .eq("church_id", churchId)
    .order("date", { ascending: false })
    .limit(200);

export const saveAttendanceSession = async (session) => {
  const { id, groupId, date, church_id, records } = session;

  try {
    let sessId = id || null;

    if (!sessId) {
      // Look for an existing session for this group+date
      const { data: existing, error: e1 } = await supabase
        .from("attendance_sessions")
        .select("id")
        .eq("group_id", groupId)
        .eq("date", date)
        .maybeSingle();

      if (e1) {
        console.error("[save] check existing:", e1);
        return { data: null, error: e1 };
      }

      if (existing?.id) {
        sessId = existing.id;
      } else {
        const { data: created, error: e2 } = await supabase
          .from("attendance_sessions")
          .insert({ group_id: groupId, date, church_id })
          .select()
          .single();

        if (e2) {
          console.error("[save] insert session:", e2);
          return { data: null, error: e2 };
        }
        sessId = created.id;
      }
    }

    // Delete old records for this session
    const { error: delErr } = await supabase
      .from("attendance_records")
      .delete()
      .eq("session_id", sessId);

    if (delErr) {
      console.error("[save] delete records:", delErr);
      return { data: null, error: delErr };
    }

    // Only save records with a definitive present value (true or false)
    const validRecs = (records || []).filter(r => r.present === true || r.present === false);

    if (validRecs.length > 0) {
      const rows = validRecs.map(r => ({
        session_id: sessId,
        member_id:  r.memberId || r.member_id || null,
        name:       r.name,
        present:    r.present,
      }));

      const { error: insErr } = await supabase
        .from("attendance_records")
        .insert(rows);

      if (insErr) {
        console.error("[save] insert records:", insErr);
        return { data: null, error: insErr };
      }
    }

    return { data: { id: sessId, group_id: groupId, date, church_id }, error: null };

  } catch (e) {
    console.error("[save] unexpected:", e);
    return { data: null, error: { message: e?.message || "Unexpected error" } };
  }
};

// ── FIRST TIMERS ──────────────────────────────────────────────────────────────
export const fetchFirstTimers = (churchId) =>
  supabase.from("first_timers").select("*").eq("church_id", churchId)
    .order("created_at", { ascending: false }).limit(500);

export const createFirstTimer = (ft) => {
  const row = {
    ...ft,
    visits: ft.visits ?? [],
    date:   ft.date ? ft.date.split("T")[0] : new Date().toISOString().split("T")[0],
  };
  return supabase.from("first_timers").insert(row).select().single();
};

export const updateFirstTimer = (id, updates) => {
  const u = { ...updates };
  if (u.date) u.date = u.date.split("T")[0];
  return supabase.from("first_timers").update(u).eq("id", id).select().single();
};

export const deleteFirstTimer = (id) =>
  supabase.from("first_timers").delete().eq("id", id);

// ── FT ATTENDANCE ─────────────────────────────────────────────────────────────
export const fetchFtAttendance = async (churchId) => {
  const { data, error } = await supabase
    .from("ft_attendance").select("attendance").eq("church_id", churchId).maybeSingle();
  if (error) return { data: {}, error };
  return { data: data?.attendance ?? {}, error: null };
};

export const saveFtAttendance = async (churchId, attendance) =>
  supabase.from("ft_attendance")
    .upsert({ church_id: churchId, attendance, updated_at: new Date().toISOString() },
             { onConflict: "church_id" });

// ── SMS LOGS ──────────────────────────────────────────────────────────────────
export const fetchSmsLogs = (churchId) =>
  supabase.from("sms_logs").select("*").eq("church_id", churchId)
    .order("created_at", { ascending: false }).limit(100);

export const createSmsLog = (log) =>
  supabase.from("sms_logs").insert(log).select().single();