// src/pages/DriverDashboard.jsx (Complete version with notification badge)
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, LogOut, ArrowLeft, Calendar, ClipboardList, } from "lucide-react";
import DriverProfile from "./DriverProfile";
import DriverBookings from "./DriverBookings";
import { useDriverBookingCount } from "../hooks/useDriverBookingCount";
import logo from "../assets/bestaccord_logo_black.png";

export default function DriverDashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState("home");
  const navigate = useNavigate();

  // Get booking count for notification badge
  const { bookingCount, loading: countLoading } = useDriverBookingCount();

  const handleLogout = () => {
    localStorage.removeItem("driverToken");
    navigate("/driver-login");
  };

  const goBack = () => setActivePage("home");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white shadow-md">
        {activePage !== "home" ? (
          <button
            onClick={goBack}
            className="flex items-center text-blue-600 font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-1" /> Back
          </button>
        ) : (
          <div className="flex-1 flex justify-center">
            {/* 🔹 Company Logo instead of text */}
            <img
              src="/src/assets/bestaccord_logo_black.png"
              alt="Company Logo"
              className="h-16 w-auto object-contain mx-auto"
            />
          </div>
        )}

        <button
          onClick={() => setMenuOpen(true)}
          className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          {activePage === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="flex items-center justify-center p-6 h-full"
            >
              <div className="grid gap-6 w-full max-w-sm">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActivePage("bookings")}
                  className="relative w-full py-6 bg-white rounded-xl shadow-lg text-xl font-semibold flex items-center justify-center space-x-2 text-blue-600 hover:shadow-xl transition-shadow"
                >
                  <ClipboardList className="w-6 h-6" />
                  <span>Bookings</span>

                  {/* 🔴 Notification Badge */}
                  {!countLoading && bookingCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white text-sm font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg border-2 border-white"
                    >
                      {bookingCount > 99 ? '99+' : bookingCount}
                    </motion.div>
                  )}

                  {/* Loading indicator for badge */}
                  {countLoading && (
                    <div className="absolute -top-2 -right-2 bg-gray-300 rounded-full h-6 w-6 flex items-center justify-center border-2 border-white">
                      <div className="animate-pulse bg-gray-400 rounded-full h-3 w-3"></div>
                    </div>
                  )}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActivePage("schedule")}
                  className="w-full py-6 bg-white rounded-xl shadow-lg text-xl font-semibold flex items-center justify-center space-x-2 text-purple-600 hover:shadow-xl transition-shadow"
                >
                  <Calendar className="w-6 h-6" />
                  <span>Schedule</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {activePage === "bookings" && (
            <motion.div
              key="bookings"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="h-full"
            >
              {/* Use the actual DriverBookings component */}
              <DriverBookings />
            </motion.div>
          )}

          {activePage === "schedule" && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="flex items-center justify-center text-white text-center p-6"
            >
              <div>
                <h2 className="text-2xl font-bold mb-2">Your Schedule</h2>
                <p className="text-sm opacity-90">Schedule details will show here.</p>
              </div>
            </motion.div>
          )}

          {activePage === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="h-full"
            >
              <DriverProfile /> {/* 🔹 Show profile inside dashboard */}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sidebar Menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 right-0 w-64 h-full bg-white shadow-lg z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-bold text-gray-800">Menu</h2>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 rounded-md hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Menu Items */}
              <div className="flex-1 p-4 space-y-4">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setActivePage("profile"); // 🔹 Open profile in dashboard
                  }}
                  className="flex items-center w-full p-2 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  <User className="w-5 h-5 mr-2" />
                  Profile
                </button>
              </div>

              {/* Logout */}
              <div className="p-4 border-t">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full p-2 rounded-md text-red-600 hover:bg-red-100"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}