import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Eye, 
  RefreshCw, 
  MapPin, 
  Clock, 
  Package, 
  Truck, 
  Users, 
  Calendar,
  Building,
  X,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  Clock4,
  User,
  FileText  // Added this import for receipt icon
} from "lucide-react";
import ReceiptGenerator from "../components/InvoiceGenerator"; // Add this import

export default function Monitoring() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showReceiptGenerator, setShowReceiptGenerator] = useState(false); // Add this state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3 }
    },
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 }
    }
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 500
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const progressVariants = {
    hidden: { width: 0 },
    visible: (progress) => ({
      width: `${progress}%`,
      transition: {
        duration: 1,
        ease: "easeOut",
        delay: 0.5
      }
    })
  };

  const tableRowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4 }
    },
    hover: {
      backgroundColor: "#f9fafb",
      transition: { duration: 0.2 }
    }
  };

  // Status configuration
  const statusConfig = {
    "Pending": { 
      color: "bg-yellow-100 text-yellow-800", 
      icon: AlertCircle, 
      progress: 20,
      bgColor: "bg-yellow-500",
      step: 0
    },
    "Ready to go": { 
      color: "bg-blue-100 text-blue-800", 
      icon: CheckCircle, 
      progress: 40,
      bgColor: "bg-blue-500",
      step: 1
    },
    "On Trip": { 
      color: "bg-purple-100 text-purple-800", 
      icon: PlayCircle, 
      progress: 60,
      bgColor: "bg-purple-500",
      step: 2
    },
    "In Transit": { 
      color: "bg-purple-100 text-purple-800", 
      icon: PlayCircle, 
      progress: 60,
      bgColor: "bg-purple-500",
      step: 2
    },
    "Delivered": { 
      color: "bg-green-100 text-green-800", 
      icon: CheckCircle, 
      progress: 80,
      bgColor: "bg-green-500",
      step: 3
    },
    "Completed": { 
      color: "bg-gray-100 text-gray-800", 
      icon: CheckCircle, 
      progress: 100,
      bgColor: "bg-gray-500",
      step: 4
    }
  };

  // Timeline steps
  const timelineSteps = [
    { name: "Preparing", status: "Pending" },
    { name: "Ready to go", status: "Ready to go" },
    { name: "On Trip", status: "On Trip" },
    { name: "Delivered", status: "Delivered" },
    { name: "Completed", status: "Completed" }
  ];

  // Add these new functions for receipt generation
  const handleGenerateReceipt = () => {
    if (selectedBooking && selectedBooking.status === "Completed") {
      setShowReceiptGenerator(true);
    }
  };

  const handleReceiptGenerated = (receiptData) => {
    console.log("Receipt generated:", receiptData);
    setShowReceiptGenerator(false);
    alert(`Receipt generated successfully! Receipt Number: ${receiptData.receiptNumber}`);
  };

  // Update booking status
  const updateBookingStatus = async (bookingId, newStatus) => {
    setUpdating(true);
    try {
      const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedBooking = await response.json();
      
      // Update local state
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking._id === bookingId 
            ? { ...booking, status: newStatus }
            : booking
        )
      );

      setSelectedBooking(prev => ({
        ...prev,
        status: newStatus
      }));

      console.log("✅ Booking status updated successfully:", updatedBooking);
      
    } catch (err) {
      console.error("❌ Error updating booking status:", err);
      setError(`Failed to update status: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  // Fetch bookings data from MongoDB
  const fetchBookings = async () => {
    setLoading(true);
    setError("");
    try {
      console.log("🔄 Fetching bookings from API...");
      
      const response = await fetch("http://localhost:5000/api/bookings", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Fetched bookings data:", data);
      
      // Handle both array response and object with bookings array
      const bookingsArray = Array.isArray(data) ? data : (data.bookings || []);
      
      setBookings(bookingsArray);
      setFilteredBookings(bookingsArray);
      
      console.log("📊 Total bookings loaded:", bookingsArray.length);
      
    } catch (err) {
      console.error("❌ Error fetching bookings:", err);
      setError(`Failed to load bookings: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Initialize map
  const initializeMap = async () => {
    if (!selectedBooking || !mapRef.current) return;

    // Clean up existing map
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    try {
      // Check if Leaflet is already loaded
      if (window.L) {
        createMap();
      } else {
        // Load Leaflet dynamically
        const leafletScript = document.createElement('script');
        leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        leafletScript.onload = createMap;
        document.head.appendChild(leafletScript);
      }
    } catch (error) {
      console.error('Error loading map:', error);
    }
  };

  const createMap = async () => {
    if (!mapRef.current) return;
    
    const L = window.L;
    
    // Initialize map
    const map = L.map(mapRef.current).setView([14.5995, 120.9842], 6);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Geocoding function
    const geocodeAddress = async (address) => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ", Philippines")}`);
        const data = await response.json();
        return data[0] ? [parseFloat(data[0].lat), parseFloat(data[0].lon)] : null;
      } catch (error) {
        console.error('Geocoding error:', error);
        return null;
      }
    };

    // Add markers and route
    const originCoords = await geocodeAddress(selectedBooking.originAddress);
    const destCoords = await geocodeAddress(selectedBooking.destinationAddress);

    if (originCoords) {
      L.circleMarker(originCoords, {
        radius: 8,
        fillColor: '#10b981',
        color: '#059669',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(map).bindPopup(`<b>Origin:</b><br/>${selectedBooking.originAddress}`);
    }

    if (destCoords) {
      L.circleMarker(destCoords, {
        radius: 8,
        fillColor: '#ef4444',
        color: '#dc2626',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(map).bindPopup(`<b>Destination:</b><br/>${selectedBooking.destinationAddress}`);
    }

    // Draw route line
    if (originCoords && destCoords) {
      L.polyline([originCoords, destCoords], {
        color: '#8b5cf6',
        weight: 4,
        opacity: 0.8
      }).addTo(map);

      const bounds = L.latLngBounds([originCoords, destCoords]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (destCoords) {
      map.setView(destCoords, 12);
    } else if (originCoords) {
      map.setView(originCoords, 12);
    }

    mapInstance.current = map;
  };

  // Filter bookings
  useEffect(() => {
    let filtered = bookings;
    
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.tripNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.reservationId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.destinationAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== "All") {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }
    
    setFilteredBookings(filtered);
  }, [searchTerm, statusFilter, bookings]);

  // Open booking details
  const openBookingDetails = (booking) => {
    console.log("Opening booking details for:", booking);
    setSelectedBooking(booking);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedBooking(null);
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }
  };

  // Initialize map when modal opens
  useEffect(() => {
    if (showModal && selectedBooking && mapRef.current) {
      setTimeout(() => initializeMap(), 100);
    }
  }, [showModal, selectedBooking]);

  // Initial load and auto-refresh
  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 30000);
    return () => clearInterval(interval);
  }, []);

  // Get unique statuses
  const uniqueStatuses = ["All", ...new Set(bookings.map(b => b.status || "Pending"))];

  // Get current step for timeline
  const getCurrentStep = (status) => {
    return statusConfig[status]?.step || 0;
  };

  // Helper function to get employee display name
  const getEmployeeDisplayName = (employeeId, employeeDetails) => {
    if (employeeDetails && employeeDetails.length > 0) {
      const emp = employeeDetails.find(e => e.employeeId === employeeId);
      return emp ? (emp.employeeName || emp.fullName || emp.name) : employeeId;
    }
    return employeeId || 'Unknown';
  };

  // Handle confirm ready to go
  const handleConfirmReadyToGo = () => {
    if (selectedBooking) {
      updateBookingStatus(selectedBooking._id, "Ready to go");
    }
  };

  return (
    <>
      {/* Add Leaflet CSS */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      
      <motion.div 
        className={`${showModal ? "" : ""}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div 
          className="flex justify-between items-center mb-6"
          variants={itemVariants}
        >
          <div>
            <motion.h1 
              className="text-2xl font-bold text-gray-800"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              Trip Monitoring
            </motion.h1>
            <motion.p 
              className="text-gray-600 text-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Track and manage ongoing trips and delivery status
            </motion.p>
          </div>
          
          <motion.button
            onClick={fetchBookings}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div 
              className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg"
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="font-medium">Error loading data:</p>
              <p className="text-sm">{error}</p>
              <button 
                onClick={fetchBookings}
                className="mt-2 text-sm underline hover:no-underline"
              >
                Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
          variants={itemVariants}
        >
          <motion.div
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <input
              type="text"
              placeholder="Search by Trip Number, Reservation ID, or Destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
            />
          </motion.div>
          
          <motion.div
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
            >
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </motion.div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
          variants={containerVariants}
        >
          {Object.entries(
            bookings.reduce((acc, booking) => {
              const status = booking.status || "Pending";
              acc[status] = (acc[status] || 0) + 1;
              return acc;
            }, {})
          ).map(([status, count], index) => {
            const config = statusConfig[status] || statusConfig["Pending"];
            const StatusIcon = config.icon;
            
            return (
              <motion.div 
                key={status} 
                className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500"
                variants={cardVariants}
                whileHover="hover"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{status}</p>
                    <motion.p 
                      className="text-2xl font-bold text-gray-800"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                    >
                      {count}
                    </motion.p>
                  </div>
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                  >
                    <StatusIcon className="w-8 h-8 text-gray-400" />
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Monitoring Table */}
        <motion.div 
          className="bg-white rounded-xl shadow-lg overflow-hidden"
          variants={itemVariants}
        >
          {loading ? (
            <motion.div 
              className="flex items-center justify-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw className="w-8 h-8 text-blue-600" />
              </motion.div>
              <span className="ml-2 text-gray-600">Loading trips...</span>
            </motion.div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trip Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status & Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <AnimatePresence>
                    {filteredBookings.map((booking, index) => {
                      const config = statusConfig[booking.status || "Pending"];
                      const StatusIcon = config.icon;
                      
                      return (
                        <motion.tr 
                          key={booking._id} 
                          className="hover:bg-gray-50 transition-colors"
                          variants={tableRowVariants}
                          initial="hidden"
                          animate="visible"
                          exit={{ opacity: 0, x: -20 }}
                          whileHover="hover"
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <motion.div 
                                className="text-sm font-medium text-gray-900"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.1 + 0.2 }}
                              >
                                {booking.tripNumber}
                              </motion.div>
                              <motion.div 
                                className="text-xs text-gray-500"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.1 + 0.3 }}
                              >
                                {booking.reservationId}
                              </motion.div>
                              <motion.div 
                                className="text-xs text-blue-600 font-medium"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.1 + 0.4 }}
                              >
                                {booking.companyName}
                              </motion.div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <motion.div 
                                className="flex items-center text-green-600 mb-1"
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: index * 0.1 + 0.2 }}
                              >
                                <MapPin className="w-3 h-3 mr-1" />
                                <span className="truncate max-w-[150px]" title={booking.originAddress}>
                                  {booking.originAddress}
                                </span>
                              </motion.div>
                              <motion.div 
                                className="flex items-center text-red-600"
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: index * 0.1 + 0.3 }}
                              >
                                <MapPin className="w-3 h-3 mr-1" />
                                <span className="truncate max-w-[150px]" title={booking.destinationAddress}>
                                  {booking.destinationAddress}
                                </span>
                              </motion.div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4">
                            <div>
                              <motion.span 
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} mb-2`}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.1 + 0.2 }}
                              >
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {booking.status || "Pending"}
                              </motion.span>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <motion.div 
                                  className={`h-2 rounded-full transition-all duration-300 ${config.bgColor}`}
                                  variants={progressVariants}
                                  initial="hidden"
                                  animate="visible"
                                  custom={config.progress}
                                ></motion.div>
                              </div>
                              <motion.div 
                                className="text-xs text-gray-500 mt-1"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.1 + 0.8 }}
                              >
                                {config.progress}% Complete
                              </motion.div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <motion.div 
                              className="flex items-center mb-1"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.1 + 0.3 }}
                            >
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(booking.dateNeeded).toLocaleDateString()}
                            </motion.div>
                            <motion.div 
                              className="flex items-center"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.1 + 0.4 }}
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              {booking.timeNeeded}
                            </motion.div>
                          </td>
                          
                          <td className="px-6 py-4">
                            <motion.div 
                              className="flex flex-wrap gap-1"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.1 + 0.4 }}
                            >
                              {booking.employeeAssigned && booking.employeeAssigned.length > 0 ? (
                                booking.employeeAssigned.slice(0, 2).map((empId, idx) => (
                                  <motion.span 
                                    key={idx}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: index * 0.1 + 0.5 + idx * 0.1 }}
                                  >
                                    {getEmployeeDisplayName(empId, booking.employeeDetails)}
                                  </motion.span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-500">Not assigned</span>
                              )}
                              {booking.employeeAssigned && booking.employeeAssigned.length > 2 && (
                                <span className="text-xs text-gray-500">+{booking.employeeAssigned.length - 2}</span>
                              )}
                            </motion.div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <motion.button
                              onClick={() => openBookingDetails(booking)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.1 + 0.5 }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </motion.button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
              
              {filteredBookings.length === 0 && !loading && !error && (
                <motion.div 
                  className="text-center py-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No trips found</h3>
                  <p className="text-gray-500">
                    {bookings.length === 0 
                      ? "No bookings available. Create a booking first." 
                      : "No trips match your current filters."}
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Trip Details Modal - Fixed Overlay */}
      <AnimatePresence>
        {showModal && selectedBooking && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(5px)' }}
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div 
              className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Trip Monitoring</h3>
                  <p className="text-sm text-gray-600">Track and manage ongoing trips and delivery status</p>
                </div>
                <motion.button
                  onClick={closeModal}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Left Column */}
                    <motion.div 
                      className="space-y-6"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6 }}
                    >
                      
                      {/* Trip Header with Timeline */}
                      <motion.div 
                        className="bg-white rounded-lg border border-gray-200 p-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                      >
                        <motion.h2 
                          className="text-2xl font-bold text-gray-900 mb-6"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          Trip #{selectedBooking.tripNumber}
                        </motion.h2>
                        
                        {/* Progress Timeline */}
                        <div className="relative mb-8">
                          <div className="flex items-center justify-between">
                            {timelineSteps.map((step, index) => {
                              const currentStep = getCurrentStep(selectedBooking.status || "Pending");
                              const isActive = index === currentStep;
                              const isCompleted = index < currentStep;
                              
                              return (
                                <motion.div 
                                  key={index} 
                                  className="flex flex-col items-center relative flex-1"
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.4 + index * 0.1 }}
                                >
                                  <motion.div 
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 bg-white ${
                                      isActive ? 'bg-blue-600 border-blue-600 text-white' :
                                      isCompleted ? 'bg-blue-600 border-blue-600 text-white' :
                                      'border-gray-300 text-gray-400'
                                    }`}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.5 + index * 0.1 }}
                                    whileHover={{ scale: 1.1 }}
                                  >
                                    {isCompleted || isActive ? <CheckCircle className="w-5 h-5" /> : <div className="w-3 h-3 rounded-full bg-current" />}
                                  </motion.div>
                                  <motion.span 
                                    className={`text-xs mt-2 font-medium text-center ${
                                      isActive || isCompleted ? 'text-blue-600' : 'text-gray-500'
                                    }`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 + index * 0.1 }}
                                  >
                                    {step.name}
                                  </motion.span>
                                  
                                  {/* Progress Line */}
                                  {index < timelineSteps.length - 1 && (
                                    <motion.div 
                                      className={`absolute top-5 h-0.5 ${
                                        isCompleted ? 'bg-blue-600' : 'bg-gray-300'
                                      }`} 
                                      style={{
                                        left: '50%',
                                        right: '-50%',
                                        width: '100%'
                                      }}
                                      initial={{ scaleX: 0 }}
                                      animate={{ scaleX: 1 }}
                                      transition={{ delay: 0.7 + index * 0.1, duration: 0.3 }}
                                    />
                                  )}
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>

                      {/* Map Container */}
                      <motion.div 
                        className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      >
                        <div 
                          ref={mapRef} 
                          className="w-full h-96"
                          style={{ minHeight: '400px' }}
                        >
                          <div className="flex items-center justify-center h-full bg-gray-100">
                            <div className="text-center">
                              <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              </motion.div>
                              <p className="text-gray-500 text-sm">Loading route map...</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Route Timeline */}
                      <motion.div 
                        className="bg-white rounded-lg border border-gray-200 p-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                      >
                        <h3 className="font-semibold text-gray-900 mb-4">Route Timeline</h3>
                        <div className="space-y-4">
                          <motion.div 
                            className="flex items-start space-x-3"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                          >
                            <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">Origin Location</p>
                              <p className="text-sm text-gray-600">{selectedBooking.originAddress}</p>
                            </div>
                          </motion.div>
                          <div className="border-l-2 border-gray-200 ml-1.5 h-6"></div>
                          <motion.div 
                            className="flex items-start space-x-3"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                          >
                            <div className="w-3 h-3 bg-red-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">Destination</p>
                              <p className="text-sm text-gray-600">{selectedBooking.destinationAddress}</p>
                            </div>
                          </motion.div>
                        </div>

                        {/* Trip Started Info */}
                        <motion.div 
                          className="mt-6 pt-4 border-t border-gray-200"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 }}
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Trip Started</p>
                              <p className="text-sm text-gray-600">
                                {new Date(selectedBooking.dateNeeded).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric', 
                                  year: 'numeric'
                                })} at {selectedBooking.timeNeeded}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Bestaccord is preparing to ship the packages.
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    </motion.div>

                    {/* Right Column - All the details */}
                    <motion.div 
                      className="space-y-6"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      
                      {/* Customer & Company */}
                      <motion.div 
                        className="bg-white rounded-lg border border-gray-200 p-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      >
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-2">Customer Name</h4>
                            <p className="text-gray-900">{selectedBooking.customerEstablishmentName || selectedBooking.shipperConsignorName || 'N/A'}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-2">Company</h4>
                            <p className="text-gray-900">{selectedBooking.companyName}</p>
                          </div>
                        </div>
                      </motion.div>

                      {/* Product Details */}
                      <motion.div 
                        className="bg-white rounded-lg border border-gray-200 p-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                      >
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-2">Item</h4>
                            <p className="text-gray-900">{selectedBooking.productName}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-2">Quantity</h4>
                            <p className="text-gray-900">{selectedBooking.quantity?.toLocaleString()} pcs</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-2">Gross Weight</h4>
                            <p className="text-gray-900">{selectedBooking.grossWeight} tons</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-2">Units per package</h4>
                            <p className="text-gray-900">{selectedBooking.unitPerPackage}pcs/box</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-2">Number of Package</h4>
                            <p className="text-gray-900">{selectedBooking.numberOfPackages} box</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-2">Delivery Fee</h4>
                            <p className="text-gray-900">₱{selectedBooking.deliveryFee?.toLocaleString()} PHP</p>
                          </div>
                        </div>
                      </motion.div>

                      {/* Vehicle Information */}
                      <motion.div 
                        className="bg-white rounded-lg border border-gray-200 p-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                      >
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-2">Vehicle Type</h4>
                            <p className="text-gray-900">{selectedBooking.vehicleType}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-2">Vehicle Plate</h4>
                            <p className="text-gray-900">{selectedBooking.plateNumber}</p>
                          </div>
                        </div>
                      </motion.div>

                      {/* Location & Rate */}
                      <motion.div 
                        className="bg-white rounded-lg border border-gray-200 p-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.7 }}
                      >
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-2">Origin Location</h4>
                            <p className="text-gray-900">{selectedBooking.originAddress}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-2">Destination</h4>
                            <p className="text-gray-900">{selectedBooking.destinationAddress}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-2">Area Code</h4>
                            <p className="text-gray-900">{selectedBooking.areaLocationCode || '1'}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-2">Area Rate</h4>
                            <p className="text-gray-900">₱{selectedBooking.rateCost?.toLocaleString() || '200'}</p>
                          </div>
                        </div>
                      </motion.div>

                      {/* Team Information */}
                      <motion.div 
                        className="bg-white rounded-lg border border-gray-200 p-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                      >
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-3">Drivers</h4>
                            <div className="space-y-2">
                              {selectedBooking.employeeDetails?.filter(emp => 
                                emp.role === 'Driver'
                              ).map((driver, idx) => (
                                <motion.div 
                                  key={idx} 
                                  className="flex items-center space-x-2"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.9 + idx * 0.1 }}
                                >
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-900">
                                    {driver.employeeName || driver.fullName || 'Unknown Driver'}
                                  </span>
                                </motion.div>
                              ))}
                              
                              {/* If no drivers found, check employeeAssigned array */}
                              {(!selectedBooking.employeeDetails || 
                                selectedBooking.employeeDetails.filter(emp => emp.role === 'Driver').length === 0) &&
                                selectedBooking.employeeAssigned && selectedBooking.employeeAssigned.length > 0 && (
                                selectedBooking.employeeAssigned.map((empId, idx) => (
                                  <motion.div 
                                    key={idx} 
                                    className="flex items-center space-x-2"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.9 + idx * 0.1 }}
                                  >
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-900">
                                      {getEmployeeDisplayName(empId, selectedBooking.employeeDetails)}
                                    </span>
                                  </motion.div>
                                ))
                              )}

                              {(!selectedBooking.employeeDetails || selectedBooking.employeeDetails.length === 0) &&
                               (!selectedBooking.employeeAssigned || selectedBooking.employeeAssigned.length === 0) && (
                                <div className="flex items-center space-x-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-500">Not assigned</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-3">Helpers</h4>
                            <div className="space-y-2">
                              {selectedBooking.employeeDetails?.filter(emp => 
                                emp.role === 'Helper'
                              ).map((helper, idx) => (
                                <motion.div 
                                  key={idx} 
                                  className="flex items-center space-x-2"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 1.0 + idx * 0.1 }}
                                >
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-900">
                                    {helper.employeeName || helper.fullName || 'Unknown Helper'}
                                  </span>
                                </motion.div>
                              ))}
                              
                              {(!selectedBooking.employeeDetails || 
                                selectedBooking.employeeDetails.filter(emp => emp.role === 'Helper').length === 0) && (
                                <div className="flex items-center space-x-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-500">Not assigned</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* UPDATED Action Buttons - This is the main change */}
                      <motion.div 
                        className="flex space-x-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.9 }}
                      >
                        <motion.button 
                          onClick={closeModal}
                          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Back to the List
                        </motion.button>
                        
                        {/* Show different buttons based on status */}
                        {selectedBooking.status === "Pending" && (
                          <motion.button 
                            onClick={handleConfirmReadyToGo}
                            disabled={updating}
                            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            whileHover={!updating ? { scale: 1.02 } : {}}
                            whileTap={!updating ? { scale: 0.98 } : {}}
                          >
                            {updating ? "Updating..." : "Confirm Ready to go"}
                          </motion.button>
                        )}
                        
                        {selectedBooking.status === "Ready to go" && (
                          <div className="flex-1 px-4 py-2 bg-green-100 text-green-800 rounded-lg text-center">
                            ✓ Ready for Driver to Start Trip
                          </div>
                        )}
                        
                        {(selectedBooking.status === "On Trip" || selectedBooking.status === "In Transit") && (
                          <div className="flex-1 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-center">
                            🚛 Trip in Progress
                          </div>
                        )}
                        
                        {selectedBooking.status === "Delivered" && (
                          <div className="flex-1 px-4 py-2 bg-green-100 text-green-800 rounded-lg text-center">
                            ✓ Package Delivered
                          </div>
                        )}
                        
                        {/* NEW: Generate Invoice Button for Completed Status */}
                        {selectedBooking.status === "Completed" && (
                          <motion.button 
                            onClick={handleGenerateReceipt}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <FileText className="w-4 h-4" />
                            <span>Generate Invoice</span>
                          </motion.button>
                        )}
                      </motion.div>

                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NEW: Receipt Generator Modal */}
      {showReceiptGenerator && selectedBooking && (
        <ReceiptGenerator
          booking={selectedBooking}
          onClose={() => setShowReceiptGenerator(false)}
          onReceiptGenerated={handleReceiptGenerated}
        />
      )}
      
    </>
  );
}