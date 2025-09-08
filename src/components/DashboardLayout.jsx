import { Outlet, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Monitor,
  FileText,
  Truck,
  History,
  Users,
  User,
  Archive,
  LogOut,
} from "lucide-react";
import logo from "../assets/bestaccord_logo.png"; // put your company logo here

export default function DashboardLayout() {
  const role = localStorage.getItem("role"); // admin or staff

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Booking", path: "/dashboard/booking", icon: <ClipboardList size={20} /> },
    { name: "Monitoring", path: "/dashboard/monitoring", icon: <Monitor size={20} /> },
    { name: "Trip Report", path: "/dashboard/trip-report", icon: <FileText size={20} /> },
  ];

  // admin-only pages
  if (role === "admin") {
    menuItems.push(
      { name: "Vehicle", path: "/dashboard/vehicle", icon: <Truck size={20} /> },
      { name: "History Record", path: "/dashboard/history-record", icon: <History size={20} /> },
      { name: "Employee", path: "/dashboard/employee", icon: <Users size={20} /> },
      { name: "Client", path: "/dashboard/client", icon: <User size={20} /> },
      { name: "Archive", path: "/dashboard/archive", icon: <Archive size={20} /> }
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white flex flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="flex items-center justify-center p-6">
            <img src={logo} alt="Company Logo" className="w-32 h-auto" />
          </div>

          {/* Menu */}
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                "flex items-center p-4 hover:bg-gray-700 " +
                (isActive ? "bg-gray-700" : "")
              }
            >
              {item.icon}
              <span className="ml-2">{item.name}</span>
            </NavLink>
          ))}
        </div>

        {/* Logout */}
        <div className="p-4">
          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("role");
              window.location.href = "/login";
            }}
            className="flex items-center p-2 w-full hover:bg-gray-700 rounded"
          >
            <LogOut size={20} />
            <span className="ml-2">Logout</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 bg-gray-100">
        <Outlet />
      </div>
    </div>
  );
}
