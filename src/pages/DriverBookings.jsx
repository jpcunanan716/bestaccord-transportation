// src/pages/DriverBookings.jsx (Enhanced with debugging)
import React, { useState, useEffect } from "react";
import { 
  Package, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Truck, 
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  PlayCircle,
  XCircle
} from "lucide-react";
import axios from "axios";

export default function DriverBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  const statusColors = {
    "Pending": { bg: "bg-yellow-100", text: "text-yellow-800", icon: AlertCircle },
    "In Transit": { bg: "bg-blue-100", text: "text-blue-800", icon: PlayCircle },
    "Delivered": { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle2 },
    "Completed": { bg: "bg-gray-100", text: "text-gray-800", icon: CheckCircle2 }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("driverToken");
      console.log("🔍 Frontend DEBUG: Token exists:", !!token);

      if (!token) {
        setError("No driver token found. Please log in again.");
        setLoading(false);
        return;
      }

      console.log("📡 Frontend DEBUG: Making API call to /api/driver/bookings");

      const res = await axios.get("http://localhost:5000/api/driver/bookings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("📡 Frontend DEBUG: API Response:", res.data);

      if (res.data.success) {
        setBookings(res.data.bookings);
        setDebugInfo(res.data.debug);
        setError("");
        console.log("✅ Frontend DEBUG: Bookings set in state:", res.data.bookings.length);
      } else {
        setError("Failed to fetch bookings");
        console.log("❌ Frontend DEBUG: API returned success: false");
      }
    } catch (err) {
      console.error("❌ Frontend DEBUG: Error fetching bookings:", err);
      console.error("❌ Frontend DEBUG: Error response:", err.response?.data);
      
      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
        localStorage.removeItem("driverToken");
      } else if (err.response?.status === 404) {
        setError("API endpoint not found. Check server routes.");
      } else {
        setError(err.response?.data?.msg || "Failed to load bookings.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshBookings = async () => {
    console.log("🔄 Frontend DEBUG: Refreshing bookings...");
    setRefreshing(true);
    await fetchBookings();
  };

  useEffect(() => {
    console.log("🚀 Frontend DEBUG: Component mounted, fetching bookings...");
    fetchBookings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-300 h-12 w-12"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
          <p className="text-center mt-4 text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Bookings</h2>
          <p className="text-red-500 mb-4">{error}</p>
          
          {/* Debug Information */}
          {debugInfo && (
            <div className="bg-gray-100 p-3 rounded-lg mb-4 text-left text-xs">
              <p><strong>Debug Info:</strong></p>
              <p>Driver ID: {debugInfo.driverEmployeeId}</p>
              <p>Total Bookings in DB: {debugInfo.totalBookingsInDB}</p>
              <p>Matched Bookings: {debugInfo.queriedBookings}</p>
            </div>
          )}
          
          <button
            onClick={fetchBookings}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">My Bookings</h1>
            {debugInfo && (
              <p className="text-xs text-white opacity-75">
                Found {debugInfo.queriedBookings} of {debugInfo.totalBookingsInDB} total
              </p>
            )}
          </div>
          <button
            onClick={refreshBookings}
            disabled={refreshing}
            className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition"
          >
            <RefreshCw className={`w-5 h-5 text-white ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Debug Panel (remove this in production) */}
        {debugInfo && (
          <div className="bg-white bg-opacity-90 p-3 rounded-lg mb-4 text-xs">
            <h3 className="font-bold mb-2">🐛 Overview:</h3>
            <p><strong>Your Employee ID:</strong> {debugInfo.driverEmployeeId}</p>
            <p><strong>Total Bookings in Database:</strong> {debugInfo.totalBookingsInDB}</p>
            <p><strong>Bookings Found for You:</strong> {debugInfo.queriedBookings}</p>
          </div>
        )}

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">No Bookings Found</h2>
            <p className="text-gray-600 mb-2">You don't have any assigned bookings yet.</p>
            
            {debugInfo && debugInfo.totalBookingsInDB > 0 && (
              <div className="bg-yellow-50 p-3 rounded-lg mt-4 text-sm">
                <p className="text-yellow-800">
                  <strong>Note:</strong> There are {debugInfo.totalBookingsInDB} bookings in the system, 
                  but none are assigned to your employee ID: <code className="bg-yellow-200 px-1 rounded">{debugInfo.driverEmployeeId}</code>
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const StatusIcon = statusColors[booking.status]?.icon || AlertCircle;
              return (
                <div 
                  key={booking._id} 
                  className="bg-white rounded-xl shadow-lg p-4"
                >
                  {/* Booking Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{booking.reservationId}</h3>
                      <p className="text-sm text-gray-600 font-mono">{booking.tripNumber}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusColors[booking.status]?.bg} ${statusColors[booking.status]?.text}`}>
                      <StatusIcon className="w-3 h-3" />
                      {booking.status || "Pending"}
                    </div>
                  </div>

                  {/* Company & Product */}
                  <div className="mb-3">
                    <p className="font-semibold text-gray-800">{booking.companyName}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      {booking.productName} ({booking.quantity} units)
                    </p>
                  </div>

                  {/* Route */}
                  <div className="mb-3 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-gray-600">From:</p>
                        <p className="font-medium">{booking.originAddress}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 mt-2">
                      <MapPin className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-gray-600">To:</p>
                        <p className="font-medium">{booking.destinationAddress}</p>
                      </div>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(booking.dateNeeded).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {booking.timeNeeded}
                    </div>
                  </div>

                  {/* Team */}
                  {booking.employeeDetails && booking.employeeDetails.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center gap-1 mb-1">
                        <Users className="w-4 h-4" />
                        <span>Team:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {booking.employeeDetails.map((emp, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                          >
                            {emp.fullName} ({emp.role})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Debug info for each booking */}
                  <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    <p><strong>Assigned to:</strong> {JSON.stringify(booking.employeeAssigned)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}