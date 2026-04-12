// src/services/api/index.js
import { supabase } from "../supabaseClient";

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
export const fetchAttendance = async (churchId) => {
  const PAGE = 500;
  let allSessions = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("attendance_sessions")
      .select("*, records:attendance_records(*)")
      .eq("church_id", churchId)
      .order("date", { ascending: false })
      .range(from, from + PAGE - 1);

    if (error) return { data: null, error };
    allSessions = allSessions.concat(data ?? []);
    hasMore = (data?.length ?? 0) === PAGE;
    from += PAGE;
  }

  return { data: allSessions, error: null };
};

export const saveAttendanceSession = async (session) => {
  const { id, groupId, date, church_id, records } = session;

  try {
    let sessId = id || null;

    if (!sessId) {
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

    const { error: delErr } = await supabase
      .from("attendance_records")
      .delete()
      .eq("session_id", sessId);

    if (delErr) {
      console.error("[save] delete records:", delErr);
      return { data: null, error: delErr };
    }

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

    supabase.from("usage_logs").insert({
      church_id,
      event_type: "attendance_saved",
      recipient_count: validRecs.length,
      metadata: { group_id: groupId, date, present: validRecs.filter(r => r.present).length },
    }).then(() => {}).catch(() => {});

    return { data: { id: sessId, group_id: groupId, date, church_id }, error: null };

  } catch (e) {
    console.error("[save] unexpected:", e);
    return { data: null, error: { message: e?.message || "Unexpected error" } };
  }
};

// ── ABSENTEE FOLLOW-UP ────────────────────────────────────────────────────────
// Stored in churches.follow_up_data (JSONB)
// Schema: { [sessionId_memberId]: { reached: bool, note: string, updatedAt: string } }

export const fetchFollowUpData = async (churchId) => {
  try {
    const { data, error } = await supabase
      .from("churches")
      .select("follow_up_data")
      .eq("id", churchId)
      .single();

    if (error) {
      try { return JSON.parse(localStorage.getItem("ct_followup") || "{}"); } catch { return {}; }
    }

    return data?.follow_up_data ?? {};
  } catch {
    try { return JSON.parse(localStorage.getItem("ct_followup") || "{}"); } catch { return {}; }
  }
};

export const saveFollowUpData = async (churchId, data) => {
  try { localStorage.setItem("ct_followup", JSON.stringify(data)); } catch {}
  try {
    const { error } = await supabase
      .from("churches")
      .update({ follow_up_data: data })
      .eq("id", churchId);
    if (error) console.warn("[followup] save failed:", error.message);
  } catch (e) {
    console.warn("[followup] save unexpected:", e);
  }
};

// ── ATTENDEE FOLLOW-UP ────────────────────────────────────────────────────────
// Stored in churches.attendee_followup_data (JSONB) — separate from absentee data.
// Schema: { [att_sessionId_memberId]: { messaged: bool, updatedAt: string } }
//
// Run once in Supabase SQL editor:
//   ALTER TABLE churches ADD COLUMN IF NOT EXISTS attendee_followup_data jsonb DEFAULT '{}';

export const fetchAttendeeFollowUp = async (churchId) => {
  try {
    const { data, error } = await supabase
      .from("churches")
      .select("attendee_followup_data")
      .eq("id", churchId)
      .single();

    if (error) {
      // Column may not exist yet — fall back to localStorage silently
      try { return JSON.parse(localStorage.getItem("ct_att_followup") || "{}"); } catch { return {}; }
    }

    return data?.attendee_followup_data ?? {};
  } catch {
    try { return JSON.parse(localStorage.getItem("ct_att_followup") || "{}"); } catch { return {}; }
  }
};

export const saveAttendeeFollowUp = async (churchId, data) => {
  try { localStorage.setItem("ct_att_followup", JSON.stringify(data)); } catch {}
  try {
    const { error } = await supabase
      .from("churches")
      .update({ attendee_followup_data: data })
      .eq("id", churchId);
    if (error) console.warn("[att-followup] save failed:", error.message);
  } catch (e) {
    console.warn("[att-followup] save unexpected:", e);
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