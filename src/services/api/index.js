// src/services/api/index.js
import { supabase } from "../supabaseClient";

// ── Retry helper ──────────────────────────────────────────────────────────────
const withRetry = async (fn, maxRetries = 2, delayMs = 800) => {
  let last;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    last = await fn();
    if (!last.error) return last;
    const msg = last.error?.message || "";
    const isNetwork =
      msg.includes("fetch") || msg.includes("network") ||
      msg.includes("timeout") || msg.includes("Failed to fetch") ||
      last.error?.code === "PGRST301" ||
      (last.error?.status >= 500 && last.error?.status < 600);
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

  let sessId = id;

  if (id) {
    // Editing an existing session — just update the date if needed
    const { data: updated, error: updErr } = await withRetry(() =>
      supabase.from("attendance_sessions")
        .update({ date })
        .eq("id", id)
        .select()
        .single()
    );
    if (updErr) return { data: null, error: updErr };
    sessId = updated.id;
  } else {
    // New session — check if one already exists for this group+date
    const { data: existing } = await supabase
      .from("attendance_sessions")
      .select("id")
      .eq("group_id", groupId)
      .eq("date", date)
      .maybeSingle();

    if (existing?.id) {
      sessId = existing.id;
    } else {
      const { data: created, error: createErr } = await withRetry(() =>
        supabase.from("attendance_sessions")
          .insert({ group_id: groupId, date, church_id })
          .select()
          .single()
      );
      if (createErr) return { data: null, error: createErr };
      sessId = created.id;
    }
  }

  // Delete old records then re-insert
  await supabase.from("attendance_records").delete().eq("session_id", sessId);

  if (records?.length) {
    const rows = records.map(r => ({
      session_id: sessId,
      member_id:  r.memberId || null,
      name:       r.name,
      present:    r.present,
    }));
    const { error: recErr } = await supabase.from("attendance_records").insert(rows);
    if (recErr) return { data: null, error: recErr };
  }

  return { data: { id: sessId, group_id: groupId, date, church_id }, error: null };
};

// ── FIRST TIMERS ──────────────────────────────────────────────────────────────
export const fetchFirstTimers = (churchId) =>
  withRetry(() =>
    supabase.from("first_timers").select("*").eq("church_id", churchId)
      .order("created_at", { ascending: false }).limit(500)
  );

export const createFirstTimer = (ft) => {
  // Ensure visits is an array and date is a plain date string
  const row = {
    ...ft,
    visits: ft.visits ?? [],
    date:   ft.date ? ft.date.split("T")[0] : new Date().toISOString().split("T")[0],
  };
  return withRetry(() => supabase.from("first_timers").insert(row).select().single());
};

export const updateFirstTimer = (id, updates) => {
  const u = { ...updates };
  if (u.date) u.date = u.date.split("T")[0];
  return withRetry(() => supabase.from("first_timers").update(u).eq("id", id).select().single());
};

export const deleteFirstTimer = (id) =>
  withRetry(() => supabase.from("first_timers").delete().eq("id", id));

// ── FT ATTENDANCE ─────────────────────────────────────────────────────────────
export const fetchFtAttendance = async (churchId) => {
  const { data, error } = await withRetry(() =>
    supabase.from("ft_attendance").select("attendance").eq("church_id", churchId).maybeSingle()
  );
  if (error) return { data: {}, error };
  return { data: data?.attendance ?? {}, error: null };
};

export const saveFtAttendance = async (churchId, attendance) =>
  withRetry(() =>
    supabase.from("ft_attendance")
      .upsert({ church_id: churchId, attendance, updated_at: new Date().toISOString() },
               { onConflict: "church_id" })
  );

// ── SMS LOGS ──────────────────────────────────────────────────────────────────
export const fetchSmsLogs = (churchId) =>
  withRetry(() =>
    supabase.from("sms_logs").select("*").eq("church_id", churchId)
      .order("created_at", { ascending: false }).limit(100)
  );

export const createSmsLog = (log) =>
  withRetry(() => supabase.from("sms_logs").insert(log).select().single());