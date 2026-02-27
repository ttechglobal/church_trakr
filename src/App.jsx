// src/App.jsx
// Central app — manages global state and routes.
// All data lives here until Supabase replaces it with API calls.

import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { Toast } from "./components/ui/Toast";
import { uid } from "./lib/helpers";
import {
  INIT_GROUPS, INIT_MEMBERS, INIT_ATTENDANCE, INIT_FIRST_TIMERS,
} from "./data/seed";

// ── Auth pages
import LoginPage    from "./pages/LoginPage";
import SignupPage   from "./pages/SignupPage";
import ForgotPage   from "./pages/ForgotPage";

// ── App pages
import Dashboard    from "./pages/Dashboard";
import Groups       from "./pages/Groups";
import Members      from "./pages/Members";
import Attendance   from "./pages/Attendance";
import FirstTimers  from "./pages/FirstTimers";
import Settings     from "./pages/Settings";

// ── Messaging pages
import MessagingHome    from "./pages/messaging/MessagingHome";
import MessageComposer  from "./pages/messaging/MessageComposer";
import CreditsPage      from "./pages/messaging/CreditsPage";
import MessageHistory   from "./pages/messaging/MessageHistory";

export default function App() {
  // ── Global shared state (will move to Supabase queries) ──────────────────
  const [groups, setGroups]                   = useState(INIT_GROUPS);
  const [members, setMembers]                 = useState(INIT_MEMBERS);
  const [attendanceHistory, setAtHistory]     = useState(INIT_ATTENDANCE);
  const [firstTimers, setFirstTimers]         = useState(INIT_FIRST_TIMERS);
  const [toast, setToast]                     = useState(null);

  const showToast = (msg) => setToast(msg);

  // Common props passed to pages that need data
  const sharedProps = { groups, setGroups, members, setMembers, attendanceHistory, setAttendanceHistory: setAtHistory, firstTimers, setFirstTimers, showToast };

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public routes ── */}
          <Route path="/login"  element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot" element={<ForgotPage />} />

          {/* ── Protected app routes ── */}
          <Route path="/*" element={
            <ProtectedRoute>
              <AppLayout>
                <Routes>
                  <Route path="/"              element={<Dashboard {...sharedProps} />} />
                  <Route path="/groups/*"      element={<Groups {...sharedProps} />} />
                  <Route path="/members"       element={<Members {...sharedProps} />} />
                  <Route path="/attendance"    element={<Attendance {...sharedProps} />} />
                  <Route path="/firsttimers"   element={<FirstTimers {...sharedProps} />} />
                  <Route path="/settings"      element={<Settings {...sharedProps} />} />

                  {/* Messaging sub-routes */}
                  <Route path="/messaging"         element={<MessagingHome />} />
                  <Route path="/messaging/send"    element={<MessageComposer {...sharedProps} />} />
                  <Route path="/messaging/credits" element={<CreditsPage showToast={showToast} />} />
                  <Route path="/messaging/history" element={<MessageHistory />} />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </AuthProvider>
  );
}
