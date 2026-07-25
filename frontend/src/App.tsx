import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AppLayout from "./layout/AppLayout";
import AuthGate from "./auth/AuthGate";

import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Schedule from "./pages/Schedule";
import Roster from "./pages/Roster";
import Holidays from "./pages/Holidays";
import Teams from "./pages/Teams";
import DutyRules from "./pages/DutyRules";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <AuthGate>
        <AppLayout>
          <Routes>
            <Route
              path="/"
              element={<Dashboard />}
            />

            <Route
              path="/employees"
              element={<Employees />}
            />

            <Route
              path="/schedule"
              element={<Schedule />}
            />

            <Route
              path="/roster"
              element={<Roster />}
            />

            <Route
              path="/holidays"
              element={<Holidays />}
            />

            <Route
              path="/teams"
              element={<Teams />}
            />

            <Route
              path="/rules"
              element={<DutyRules />}
            />

            <Route
              path="/reports"
              element={<Reports />}
            />

            <Route
              path="/settings"
              element={<Settings />}
            />

            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />
          </Routes>
        </AppLayout>
      </AuthGate>
    </BrowserRouter>
  );
}
