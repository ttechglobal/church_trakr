// src/contexts/AuthContext.jsx
//
// PLACEHOLDER — currently uses simple local state.
// When integrating Supabase:
//   1. Import { createClient } from '@supabase/supabase-js'
//   2. Replace signIn() with supabase.auth.signInWithPassword()
//   3. Replace signUp() with supabase.auth.signUp()
//   4. Replace signOut() with supabase.auth.signOut()
//   5. Listen to auth changes with supabase.auth.onAuthStateChange()
//   6. Store session in context instead of local state

import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

// Placeholder church data — will come from Supabase `churches` table
const DEMO_CHURCH = {
  id: "church_001",
  name: "Grace Baptist Church",
  location: "Lagos, Nigeria",
  plan: "Pro",
  sms_credits: 247,
};

export function AuthProvider({ children }) {
  // TODO: Replace with supabase.auth.getSession() on mount
  const [user, setUser] = useState(null);
  const [church, setChurch] = useState(null);
  const [loading, setLoading] = useState(false);

  // TODO: supabase.auth.signInWithPassword({ email, password })
  const signIn = async (email, _password) => {
    setLoading(true);
    // Simulate async auth
    await new Promise(r => setTimeout(r, 300));
    const mockUser = {
      id: "user_001",
      email,
      name: "Pastor James",
      role: "admin",       // admin | pastor | leader | viewer
      church_id: "church_001",
    };
    setUser(mockUser);
    setChurch(DEMO_CHURCH);
    setLoading(false);
    return { error: null };
  };

  // TODO: supabase.auth.signUp({ email, password, options: { data: { church_name, ... } } })
  const signUp = async (email, _password, _churchName) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    setLoading(false);
    return { error: null };
  };

  // TODO: supabase.auth.signOut()
  const signOut = () => {
    setUser(null);
    setChurch(null);
  };

  // Quick demo login (no credentials needed)
  const demoLogin = () => {
    setUser({ id: "user_001", email: "pastor@church.org", name: "Pastor James", role: "admin", church_id: "church_001" });
    setChurch(DEMO_CHURCH);
  };

  return (
    <AuthContext.Provider value={{ user, church, loading, signIn, signUp, signOut, demoLogin, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
