// src/services/api/index.js
//
// API service layer — currently returns dummy data.
// When Supabase is ready, replace each function body with a supabase query.
// All functions are async so call sites don't need to change.

// import { supabase } from '../supabaseClient';

// ── GROUPS ────────────────────────────────────────────────────────────────────

export const fetchGroups = async (churchId) => {
  // TODO: return supabase.from('groups').select('*').eq('church_id', churchId)
  return { data: [], error: null };
};

export const createGroup = async (group) => {
  // TODO: return supabase.from('groups').insert(group).select().single()
  return { data: group, error: null };
};

export const updateGroup = async (id, updates) => {
  // TODO: return supabase.from('groups').update(updates).eq('id', id).select().single()
  return { data: { id, ...updates }, error: null };
};

export const deleteGroup = async (id) => {
  // TODO: return supabase.from('groups').delete().eq('id', id)
  return { error: null };
};

// ── MEMBERS ───────────────────────────────────────────────────────────────────

export const fetchMembers = async (churchId) => {
  // TODO: return supabase.from('members').select('*').eq('church_id', churchId)
  return { data: [], error: null };
};

export const createMember = async (member) => {
  // TODO: return supabase.from('members').insert(member).select().single()
  return { data: member, error: null };
};

export const updateMember = async (id, updates) => {
  // TODO: return supabase.from('members').update(updates).eq('id', id).select().single()
  return { data: { id, ...updates }, error: null };
};

// ── ATTENDANCE ────────────────────────────────────────────────────────────────

export const fetchAttendance = async (churchId) => {
  // TODO: return supabase.from('attendance_sessions').select('*, records:attendance_records(*)').eq('church_id', churchId)
  return { data: [], error: null };
};

export const saveAttendanceSession = async (session) => {
  // TODO: insert session then bulk-insert records
  return { data: session, error: null };
};

// ── MESSAGING ─────────────────────────────────────────────────────────────────

export const fetchMessageHistory = async (churchId) => {
  // TODO: return supabase.from('sms_logs').select('*').eq('church_id', churchId).order('created_at', { ascending: false })
  return { data: [], error: null };
};

export const sendSms = async (payload) => {
  // TODO: call your SMS provider (Termii, Twilio, etc.) via a Supabase Edge Function
  // payload: { recipients: [{name, phone}], message: string, church_id: string }
  return { data: { sent: payload.recipients.length }, error: null };
};

export const fetchCredits = async (churchId) => {
  // TODO: return supabase.from('churches').select('sms_credits').eq('id', churchId).single()
  return { data: { credits: 247 }, error: null };
};
