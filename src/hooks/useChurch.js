// src/hooks/useChurch.js
//
// Returns church-scoped data for the currently logged-in user.
// When Supabase is integrated:
//   - All queries will add `.eq('church_id', church.id)` automatically
//   - Supabase RLS will enforce this server-side as a second layer

import { useAuth } from "./useAuth";

export function useChurch() {
  const { church, user } = useAuth();

  /**
   * Filter any array of records to only those belonging to the current church.
   * TODO: Remove this client-side filter once Supabase RLS is active —
   *       the DB will enforce isolation at the query level.
   */
  const filterByChurch = (records = []) => {
    if (!church?.id) return [];
    return records.filter(r => !r.church_id || r.church_id === church.id);
  };

  return {
    church,
    churchId: church?.id ?? null,
    userRole: user?.role ?? "viewer",
    filterByChurch,
    isAdmin: user?.role === "admin",
    isPastor: user?.role === "pastor" || user?.role === "admin",
  };
}
