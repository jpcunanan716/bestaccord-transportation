import Sidebar from "./Sidebar.jsx";
import { Outlet, useLocation } from "react-router-dom";

export default function Layout() {
  const location = useLocation();
  const pageTitle = location.pathname
    .replace("/", "")
    .replace("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase()) || "Dashboard";

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen bg-gray-50">
        <header className="h-16 flex items-center justify-between px-6 border-b bg-white shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800">{pageTitle}</h2>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Admin</span>
            <img
              src="https://ui-avatars.com/api/?name=Admin"
              alt="avatar"
              className="w-8 h-8 rounded-full"
            />
          </div>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
