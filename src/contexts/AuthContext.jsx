// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabaseClient";

const AuthContext = createContext(null);

async function fetchChurch(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from("churches")
    .select("*")
    .eq("admin_user_id", userId)
    .maybeSingle();
  if (error) console.error("[fetchChurch]", error.message);
  return data ?? null;
}

export function AuthProvider({ children }) {
  // undefined = resolving, null = no session, object = signed in
  const [user,   setUser]   = useState(undefined);
  const [church, setChurch] = useState(null);

  const loading         = user === undefined;
  const isAuthenticated = !!user;

  useEffect(() => {
    // getSession() reads localStorage immediately — no network call needed.
    // This is the only place we resolve the initial auth state.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        const ch = await fetchChurch(session.user.id);
        setChurch(ch);
      } else {
        setUser(null);
      }
    }).catch(() => setUser(null));

    // onAuthStateChange handles SIGN_IN / SIGN_OUT / TOKEN_REFRESHED after initial load.
    // We skip INITIAL_SESSION because getSession() already handled it.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "INITIAL_SESSION") return;
        console.log("[Auth]", event);

        if (session?.user) {
          setUser(session.user);
          const ch = await fetchChurch(session.user.id);
          setChurch(ch);
        } else {
          setUser(null);
          setChurch(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error };
    // Set state eagerly so UI updates before onAuthStateChange fires
    if (data.session?.user) {
      setUser(data.session.user);
      const ch = await fetchChurch(data.session.user.id);
      setChurch(ch);
    }
    return { error: null };
  };

  const signUp = async (email, password, churchName, adminName) => {
    const { data, error: authErr } = await supabase.auth.signUp({
      email, password,
      options: { data: { church_name: churchName, full_name: adminName } },
    });
    if (authErr) return { error: authErr };

    const authUser = data.user;
    if (!authUser) return { error: null, needsEmailConfirm: true };

    const needsEmailConfirm = !data.session || (authUser.identities?.length === 0);

    // Insert church row (plain insert — upsert requires unique constraint)
    const { data: churchRow, error: churchErr } = await supabase
      .from("churches")
      .insert({ admin_user_id: authUser.id, name: churchName, admin_name: adminName, sms_credits: 0 })
      .select()
      .single();

    if (churchErr) console.error("[signUp] church insert:", churchErr.message);

    if (!needsEmailConfirm) {
      setUser(authUser);
      setChurch(churchRow ?? null);
    }
    return { error: null, needsEmailConfirm };
  };

  const signOut = async () => {
    setUser(null);
    setChurch(null);
    await supabase.auth.signOut();
  };

  const updateChurch = useCallback(async (updates) => {
    if (!church?.id) return { error: new Error("No church loaded") };
    const { data, error } = await supabase
      .from("churches").update(updates).eq("id", church.id).select().single();
    if (!error && data) setChurch(data);
    return { data, error };
  }, [church?.id]);

  return (
    <AuthContext.Provider value={{
      user: user ?? null, church, loading, isAuthenticated,
      signIn, signUp, signOut, updateChurch,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};