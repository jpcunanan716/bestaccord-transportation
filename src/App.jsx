import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Booking from "./pages/Booking";
import Monitoring from "./pages/Monitoring";
import TripReport from "./pages/TripReport";
import Vehicle from "./pages/Vehicle";
import HistoryRecord from "./pages/HistoryRecord";
import Employee from "./pages/Employee";
import EmployeeInfo from "./pages/EmployeeInfo";
import Client from "./pages/Client";
import Archive from "./pages/Archive";
import ClientInfo from "./pages/ClientInfo";
import VehicleInfo from "./pages/VehicleInfo";

function PrivateRoute({ children, roles }) {
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  // redirect only if token is missing
  if (!token) return <Navigate to="/login" />;

  // if roles are defined, redirect if user's role is not included
  if (roles && !roles.includes(role)) return <Navigate to="/dashboard" />;

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="driver-login" element={<DriverLogin/>} />

        <Route path="/driver/driver-login" element={<DriverLogin />} />
        <Route path="/driver/dashboard" element={<DriverDashboard />} />
        <Route path="/driver/profile" element={<DriverProfile />} />
        <Route path="/driver/bookings" element={<DriverBookings />} />
        <Route path="/driver/schedule" element={<DriverSchedule />} />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute roles={["admin", "staff"]}>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="booking" element={<Booking />} />
        <Route path="booking/:id" element={<BookingInfo />} />
        <Route path="monitoring" element={<Monitoring />} />
        <Route path="trip-report" element={<TripReport />} />


        {/* Admin-only */}
        <Route
          path="vehicle"
          element={
            <PrivateRoute roles={["admin"]}>
              <Vehicle />
            </PrivateRoute>
          }
        />
        <Route
          path="vehicle/:id"
          element={
            <PrivateRoute roles={["admin"]}>
              <VehicleInfo />
            </PrivateRoute>
          }
        />
        <Route
          path="history-record"
          element={
            <PrivateRoute roles={["admin"]}>
              <HistoryRecord />
            </PrivateRoute>
          }
        />
        <Route
          path="employee"
          element={
            <PrivateRoute roles={["admin"]}>
              <Employee />
            </PrivateRoute>
          }
        />
        <Route
          path="employee/:id"
          element={
            <PrivateRoute roles={["admin"]}>
              <EmployeeInfo />
            </PrivateRoute>
          }
        />
        <Route
          path="client"
          element={
            <PrivateRoute roles={["admin"]}>
              <Client />
            </PrivateRoute>
          }
        />
        <Route
          path="client/:id"
          element={
            <PrivateRoute roles={["admin"]}>
              <ClientInfo />
            </PrivateRoute>
          }
        />
        <Route
          path="archive"
          element={
            <PrivateRoute roles={["admin"]}>
              <Archive />
            </PrivateRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
