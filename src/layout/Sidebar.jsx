import { NavLink } from "react-router-dom";

const links = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Booking", path: "/booking" },
  { name: "Monitoring", path: "/monitoring" },
  { name: "Trip Report", path: "/trip-report" },
  { name: "Vehicle", path: "/vehicle" },
  { name: "Employee", path: "/employee" },
  { name: "Client", path: "/client" },
  { name: "Archive", path: "/archive" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r h-screen fixed top-0 left-0 flex flex-col">
      <div className="h-16 flex items-center justify-center border-b">
        <h1 className="text-xl font-bold text-blue-600">Bestaccord Admin</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) =>
              `block px-4 py-2 rounded-lg transition ${
                isActive
                  ? "bg-blue-600 text-white font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            {link.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
