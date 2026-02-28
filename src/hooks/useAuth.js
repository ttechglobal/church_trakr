// src/hooks/useAuth.js
import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

let _user   = null;
let _church = null;
const _listeners = new Set();

function notify() {
  _listeners.forEach(fn => fn({ user: _user, church: _church }));
}

async function loadChurch(userId) {
  const { data, error } = await supabase
    .from("churches")
    .select("*")
    .eq("admin_user_id", userId)
    .maybeSingle();
  if (error) console.error("[useAuth] loadChurch:", error.message);
  return data ?? null;
}

// Boot: restore session once on app start
let _booted = false;
let _booting = true;
const _bootListeners = new Set();

function onBootDone() {
  _booting = false;
  _bootListeners.forEach(fn => fn());
}

supabase.auth.getSession().then(async ({ data: { session } }) => {
  if (session?.user) {
    _user   = session.user;
    _church = await loadChurch(session.user.id);
  }
  _booted = true;
  onBootDone();
  notify();
});

supabase.auth.onAuthStateChange(async (event, session) => {
  if (!_booted) return; // let getSession handle initial load
  if (session?.user) {
    _user   = session.user;
    _church = await loadChurch(session.user.id);
  } else {
    _user   = null;
    _church = null;
  }
  notify();
});

export function useAuth() {
  const [state, setState] = useState({ user: _user, church: _church });
  const [loading, setLoading] = useState(_booting);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsub = () => _listeners.delete(setState);
    _listeners.add(setState);

    // Subscribe to boot completion
    if (_booting) {
      const onBoot = () => setLoading(false);
      _bootListeners.add(onBoot);
      return () => {
        unsub();
        _bootListeners.delete(onBoot);
      };
    }

    return unsub;
  }, []);

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ?? null };
  };

  const signUp = async (email, password, churchName, adminName) => {
    // 1. Create the auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { church_name: churchName, full_name: adminName } },
    });
    if (error) return { error };

    const needsEmailConfirm = !data.session;

    // 2. If session is live, create the church row immediately
    if (data.session && data.user) {
      const { error: churchErr } = await supabase.from("churches").insert({
        admin_user_id: data.user.id,
        name:          churchName,
        admin_name:    adminName,
        phone:         "",
        location:      "",
        sms_credits:   0,
        plan:          "free",
      });
      if (churchErr) console.error("[useAuth] create church:", churchErr.message);
    }

    return { error: null, needsEmailConfirm };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshChurch = async () => {
    if (!_user) return;
    const ch = await loadChurch(_user.id);
    _church = ch;
    notify();
  };

  const updateChurch = async (updates) => {
    if (!_church?.id) return { error: new Error("No church loaded") };
    const { data, error } = await supabase
      .from("churches")
      .update(updates)
      .eq("id", _church.id)
      .select()
      .single();
    if (!error && data) {
      _church = data;
      notify();
    }
    return { data, error };
  };

  return {
    user:            state.user,
    church:          state.church,
    loading,
    isAuthenticated: !!state.user,
    signIn,
    signUp,
    signOut,
    refreshChurch,
    updateChurch,
  };
}