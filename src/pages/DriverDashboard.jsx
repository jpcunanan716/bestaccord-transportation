// src/pages/DriverDashboard.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, LogOut, ArrowLeft, Calendar, ClipboardList, } from "lucide-react";
import DriverProfile from "./DriverProfile";
import DriverBookings from "./DriverBookings";
import { useDriverBookingCount } from "../hooks/useDriverBookingCount";

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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-lg">
        {activePage !== "home" ? (
          <button
            onClick={goBack}
            className="flex items-center text-white font-medium hover:text-purple-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-1" /> Back
          </button>
        ) : (
          <div className="flex-1 flex justify-center">
            {/* Company Logo */}
            <img
              src="/src/assets/bestaccord_logo.png"
              alt="Company Logo"
              className="h-12 w-auto object-contain mx-auto"
            />
          </div>
        )}

        <button
          onClick={() => setMenuOpen(true)}
          className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors backdrop-blur-sm"
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
                  className="relative w-full py-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl text-xl font-semibold flex items-center justify-center space-x-2 text-white hover:bg-white/20 transition-all"
                >
                  <ClipboardList className="w-6 h-6" />
                  <span>Bookings</span>

                  {/* Notification Badge */}
                  {!countLoading && bookingCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white text-sm font-bold rounded-full h-7 w-7 flex items-center justify-center shadow-lg border-2 border-purple-800"
                    >
                      {bookingCount > 99 ? '99+' : bookingCount}
                    </motion.div>
                  )}

                  {/* Loading indicator for badge */}
                  {countLoading && (
                    <div className="absolute -top-2 -right-2 bg-white/20 rounded-full h-7 w-7 flex items-center justify-center border-2 border-purple-800">
                      <div className="animate-pulse bg-white/40 rounded-full h-4 w-4"></div>
                    </div>
                  )}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActivePage("schedule")}
                  className="w-full py-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl text-xl font-semibold flex items-center justify-center space-x-2 text-white hover:bg-white/20 transition-all"
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
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-purple-300" />
                <h2 className="text-2xl font-bold mb-2">Your Schedule</h2>
                <p className="text-sm text-purple-200">Schedule details will show here.</p>
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
              <DriverProfile />
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
              className="fixed top-0 right-0 w-64 h-full bg-white/95 backdrop-blur-xl shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-purple-100">
                <h2 className="text-lg font-bold text-purple-900">Menu</h2>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <X className="w-5 h-5 text-purple-900" />
                </button>
              </div>

              {/* Menu Items */}
              <div className="flex-1 p-4 space-y-4">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setActivePage("profile");
                  }}
                  className="flex items-center w-full p-3 rounded-lg text-purple-900 hover:bg-purple-100 transition-colors"
                >
                  <User className="w-5 h-5 mr-3" />
                  <span className="font-medium">Profile</span>
                </button>
              </div>

              {/* Logout */}
              <div className="p-4 border-t border-purple-100">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}