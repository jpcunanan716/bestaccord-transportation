import React, { useState, useEffect } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Package, X, Truck } from "lucide-react";

export default function DriverSchedule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch driver's bookings
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("driverToken");

      if (!token) {
        console.error("No driver token found");
        return;
      }

      const res = await axios.get("http://localhost:5000/api/driver/bookings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        setBookings(res.data.bookings);
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getBookingsForDate = (date) => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.dateNeeded);
      return (
        bookingDate.getDate() === date.getDate() &&
        bookingDate.getMonth() === date.getMonth() &&
        bookingDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const openBookingModal = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedBooking(null);
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const statusColors = {
    "Pending": "bg-yellow-500",
    "Ready to go": "bg-blue-500",
    "In Transit": "bg-purple-500",
    "Delivered": "bg-green-500",
    "Completed": "bg-gray-500"
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-2xl">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-purple-400/50 h-12 w-12"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-purple-400/50 rounded w-3/4"></div>
              <div className="h-4 bg-purple-400/50 rounded w-1/2"></div>
            </div>
          </div>
          <p className="text-center mt-4 text-purple-200">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-7 h-7" />
              My Schedule
            </h1>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
            >
              Today
            </button>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={previousMonth}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <h2 className="text-xl font-semibold text-white">{monthName}</h2>
            <button
              onClick={nextMonth}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-purple-200 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="bg-white/5 rounded-lg p-2 min-h-[100px]"></div>
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const dayBookings = getBookingsForDate(date);
              const isToday =
                date.getDate() === new Date().getDate() &&
                date.getMonth() === new Date().getMonth() &&
                date.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={day}
                  className={`bg-white/5 backdrop-blur-sm border rounded-lg p-2 min-h-[100px] hover:bg-white/10 transition ${
                    isToday ? 'border-purple-400 border-2' : 'border-white/10'
                  }`}
                >
                  <div className={`text-sm font-semibold mb-2 ${isToday ? 'text-purple-300' : 'text-white'}`}>
                    {day}
                  </div>
                  
                  {/* Bookings for this day */}
                  <div className="space-y-1">
                    {dayBookings.slice(0, 2).map((booking) => (
                      <div
                        key={booking._id}
                        onClick={() => openBookingModal(booking)}
                        className={`${statusColors[booking.status] || 'bg-gray-500'} text-white text-xs p-2 rounded cursor-pointer hover:opacity-80 transition`}
                      >
                        <div className="font-semibold truncate">{booking.companyName}</div>
                        <div className="flex items-center gap-1 text-[10px]">
                          <Clock className="w-3 h-3" />
                          {booking.timeNeeded}
                        </div>
                      </div>
                    ))}
                    
                    {dayBookings.length > 2 && (
                      <div className="text-xs text-purple-200 text-center py-1">
                        +{dayBookings.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-white/20">
            <h3 className="text-sm font-semibold text-white mb-3">Status Legend:</h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(statusColors).map(([status, color]) => (
                <div key={status} className="flex items-center gap-2">
                  <div className={`w-4 h-4 ${color} rounded`}></div>
                  <span className="text-xs text-purple-200">{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Booking Details Modal */}
        {showModal && selectedBooking && (
          <div
            className="fixed inset-0 z-50"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
          >
            <div className="absolute inset-0 overflow-y-auto">
              <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
                  {/* Modal Header */}
                  <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">{selectedBooking.reservationId}</h3>
                      <p className="text-sm text-gray-600">{selectedBooking.tripNumber}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedBooking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedBooking.status === 'Ready to go' ? 'bg-blue-100 text-blue-800' :
                      selectedBooking.status === 'In Transit' ? 'bg-purple-100 text-purple-800' :
                      selectedBooking.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedBooking.status}
                    </div>
                    <button
                      onClick={closeModal}
                      className="ml-4 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                    <div className="space-y-4">
                      {/* Schedule Info */}
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Schedule
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Date:</span>
                            <p className="font-medium text-gray-900">
                              {new Date(selectedBooking.dateNeeded).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Time:</span>
                            <p className="font-medium text-gray-900">{selectedBooking.timeNeeded}</p>
                          </div>
                        </div>
                      </div>

                      {/* Route */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Route
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">Origin</p>
                              <p className="text-sm text-gray-600">{selectedBooking.originAddress}</p>
                            </div>
                          </div>
                          <div className="border-l-2 border-gray-200 ml-1.5 h-4"></div>
                          <div className="flex items-start gap-3">
                            <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">Destination</p>
                              <p className="text-sm text-gray-600">{selectedBooking.destinationAddress}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cargo Details */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Cargo Details
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Company:</span>
                            <p className="font-medium text-gray-900">{selectedBooking.companyName}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Product:</span>
                            <p className="font-medium text-gray-900">{selectedBooking.productName}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Quantity:</span>
                            <p className="font-medium text-gray-900">{selectedBooking.quantity?.toLocaleString()} units</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Weight:</span>
                            <p className="font-medium text-gray-900">{selectedBooking.grossWeight} tons</p>
                          </div>
                        </div>
                      </div>

                      {/* Vehicle & Team */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Truck className="w-4 h-4" />
                          Vehicle & Team
                        </h4>
                        <div className="space-y-3 text-sm">
                          <div>
                            <span className="text-gray-600">Vehicle:</span>
                            <p className="font-medium text-gray-900">{selectedBooking.vehicleType}</p>
                          </div>
                          {selectedBooking.employeeDetails && selectedBooking.employeeDetails.length > 0 && (
                            <div>
                              <span className="text-gray-600">Team:</span>
                              <div className="mt-2 space-y-1">
                                {selectedBooking.employeeDetails.map((emp, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                      {emp.role}
                                    </span>
                                    <span className="font-medium text-gray-900">{emp.fullName}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="border-t border-gray-200 px-6 py-4">
                    <button
                      onClick={closeModal}
                      className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}