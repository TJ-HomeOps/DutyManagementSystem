import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AppLayout from "./layout/AppLayout";

import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Schedule from "./pages/Schedule";

function Placeholder({ title }: { title: string }) {
  return (
    <>
      <h2>{title}</h2>
      <p>{title} page is under construction.</p>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
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
            path="/holidays"
            element={<Placeholder title="Holidays" />}
          />

          <Route
            path="/teams"
            element={<Placeholder title="Teams" />}
          />

          <Route
            path="/rules"
            element={<Placeholder title="Duty Rules" />}
          />

          <Route
            path="/reports"
            element={<Placeholder title="Reports" />}
          />

          <Route
            path="/settings"
            element={<Placeholder title="Settings" />}
          />

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
