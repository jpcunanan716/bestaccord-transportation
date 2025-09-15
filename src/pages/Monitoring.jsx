import React, { useState, useEffect, useRef } from "react";
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
  User
} from "lucide-react";

export default function Monitoring() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [error, setError] = useState("");
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  // Status configuration
  const statusConfig = {
    "Pending": { 
      color: "bg-yellow-100 text-yellow-800", 
      icon: AlertCircle, 
      progress: 25,
      bgColor: "bg-yellow-500",
      step: 0
    },
    "In Transit": { 
      color: "bg-blue-100 text-blue-800", 
      icon: PlayCircle, 
      progress: 50,
      bgColor: "bg-blue-500",
      step: 2
    },
    "Delivered": { 
      color: "bg-green-100 text-green-800", 
      icon: CheckCircle, 
      progress: 75,
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
    { name: "Preparing", status: "Preparing" },
    { name: "Ready to go", status: "Ready to go" },
    { name: "On Trip", status: "In Transit" },
    { name: "Delivered", status: "Delivered" },
    { name: "Completed", status: "Completed" }
  ];

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

  return (
    <>
      {/* Add Leaflet CSS */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      
      <div className={`${showModal ? "" : ""}`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Trip Monitoring</h1>
            <p className="text-gray-600 text-sm">Track and manage ongoing trips and delivery status</p>
          </div>
          
          <button
            onClick={fetchBookings}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            <p className="font-medium">Error loading data:</p>
            <p className="text-sm">{error}</p>
            <button 
              onClick={fetchBookings}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <input
              type="text"
              placeholder="Search by Trip Number, Reservation ID, or Destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>
          
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            >
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(
            bookings.reduce((acc, booking) => {
              const status = booking.status || "Pending";
              acc[status] = (acc[status] || 0) + 1;
              return acc;
            }, {})
          ).map(([status, count]) => {
            const config = statusConfig[status] || statusConfig["Pending"];
            const StatusIcon = config.icon;
            
            return (
              <div key={status} className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{status}</p>
                    <p className="text-2xl font-bold text-gray-800">{count}</p>
                  </div>
                  <StatusIcon className="w-8 h-8 text-gray-400" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Monitoring Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading trips...</span>
            </div>
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
                  {filteredBookings.map((booking) => {
                    const config = statusConfig[booking.status || "Pending"];
                    const StatusIcon = config.icon;
                    
                    return (
                      <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{booking.tripNumber}</div>
                            <div className="text-xs text-gray-500">{booking.reservationId}</div>
                            <div className="text-xs text-blue-600 font-medium">{booking.companyName}</div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="flex items-center text-green-600 mb-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              <span className="truncate max-w-[150px]" title={booking.originAddress}>
                                {booking.originAddress}
                              </span>
                            </div>
                            <div className="flex items-center text-red-600">
                              <MapPin className="w-3 h-3 mr-1" />
                              <span className="truncate max-w-[150px]" title={booking.destinationAddress}>
                                {booking.destinationAddress}
                              </span>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} mb-2`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {booking.status || "Pending"}
                            </span>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${config.bgColor}`}
                                style={{ width: `${config.progress}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{config.progress}% Complete</div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center mb-1">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(booking.dateNeeded).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {booking.timeNeeded}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {booking.employeeAssigned && booking.employeeAssigned.length > 0 ? (
                              booking.employeeAssigned.slice(0, 2).map((empId, idx) => (
                                <span 
                                  key={idx}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                                >
                                  {getEmployeeDisplayName(empId, booking.employeeDetails)}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-500">Not assigned</span>
                            )}
                            {booking.employeeAssigned && booking.employeeAssigned.length > 2 && (
                              <span className="text-xs text-gray-500">+{booking.employeeAssigned.length - 2}</span>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => openBookingDetails(booking)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 transition-colors"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {filteredBookings.length === 0 && !loading && !error && (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No trips found</h3>
                  <p className="text-gray-500">
                    {bookings.length === 0 
                      ? "No bookings available. Create a booking first." 
                      : "No trips match your current filters."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Trip Details Modal - Fixed Overlay */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Trip Monitoring</h3>
                <p className="text-sm text-gray-600">Track and manage ongoing trips and delivery status</p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Left Column */}
                  <div className="space-y-6">
                    
                    {/* Trip Header with Timeline */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Trip #{selectedBooking.tripNumber}
                      </h2>
                      
                      {/* Progress Timeline */}
                      <div className="relative mb-8">
                        <div className="flex items-center justify-between">
                          {timelineSteps.map((step, index) => {
                            const currentStep = getCurrentStep(selectedBooking.status || "Pending");
                            const isActive = index === currentStep;
                            const isCompleted = index < currentStep;
                            
                            return (
                              <div key={index} className="flex flex-col items-center relative flex-1">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 bg-white ${
                                  isActive ? 'bg-blue-600 border-blue-600 text-white' :
                                  isCompleted ? 'bg-blue-600 border-blue-600 text-white' :
                                  'border-gray-300 text-gray-400'
                                }`}>
                                  {isCompleted || isActive ? <CheckCircle className="w-5 h-5" /> : <div className="w-3 h-3 rounded-full bg-current" />}
                                </div>
                                <span className={`text-xs mt-2 font-medium text-center ${
                                  isActive || isCompleted ? 'text-blue-600' : 'text-gray-500'
                                }`}>
                                  {step.name}
                                </span>
                                
                                {/* Progress Line */}
                                {index < timelineSteps.length - 1 && (
                                  <div 
                                    className={`absolute top-5 h-0.5 ${
                                      isCompleted ? 'bg-blue-600' : 'bg-gray-300'
                                    }`} 
                                    style={{
                                      left: '50%',
                                      right: '-50%',
                                      width: '100%'
                                    }}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Map Container */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div 
                        ref={mapRef} 
                        className="w-full h-96"
                        style={{ minHeight: '400px' }}
                      >
                        <div className="flex items-center justify-center h-full bg-gray-100">
                          <div className="text-center">
                            <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">Loading route map...</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Route Timeline */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Route Timeline</h3>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Origin Location</p>
                            <p className="text-sm text-gray-600">{selectedBooking.originAddress}</p>
                          </div>
                        </div>
                        <div className="border-l-2 border-gray-200 ml-1.5 h-6"></div>
                        <div className="flex items-start space-x-3">
                          <div className="w-3 h-3 bg-red-500 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Destination</p>
                            <p className="text-sm text-gray-600">{selectedBooking.destinationAddress}</p>
                          </div>
                        </div>
                      </div>

                      {/* Trip Started Info */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
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
                      </div>
                    </div>
                  </div>

                  {/* Right Column - All the details */}
                  <div className="space-y-6">
                    
                    {/* Customer & Company */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
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
                    </div>

                    {/* Product Details */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
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
                    </div>

                    {/* Additional Costs */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-600 mb-2">Toll Fee</h4>
                          <p className="text-gray-900">₱{selectedBooking.rateCost?.toLocaleString() || '500'} PHP</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-600 mb-2">Fuel Cost</h4>
                          <p className="text-gray-900">₱3,000 PHP</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-600 mb-2">Service Charge</h4>
                          <p className="text-gray-900">₱300 PHP</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-600 mb-2">Other Expenses</h4>
                          <p className="text-gray-900">₱300 PHP</p>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Information */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-600 mb-2">Vehicle Model</h4>
                          <p className="text-gray-900">{selectedBooking.vehicleType}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-600 mb-2">Vehicle Wheels</h4>
                          <p className="text-gray-900">6W</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-600 mb-2">Vehicle Plate</h4>
                          <p className="text-gray-900">
                            {selectedBooking.vehicle?.plateNumber || 'ABC-1234'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Location & Rate */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
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
                    </div>

                    {/* Team Information */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-600 mb-3">Drivers</h4>
                          <div className="space-y-2">
                            {selectedBooking.employeeDetails?.filter(emp => 
                              emp.role === 'Driver'
                            ).map((driver, idx) => (
                              <div key={idx} className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-900">
                                  {driver.employeeName || driver.fullName || 'Unknown Driver'}
                                </span>
                              </div>
                            ))}
                            
                            {/* If no drivers found, check employeeAssigned array */}
                            {(!selectedBooking.employeeDetails || 
                              selectedBooking.employeeDetails.filter(emp => emp.role === 'Driver').length === 0) &&
                              selectedBooking.employeeAssigned && selectedBooking.employeeAssigned.length > 0 && (
                              selectedBooking.employeeAssigned.map((empId, idx) => (
                                <div key={idx} className="flex items-center space-x-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-900">
                                    {getEmployeeDisplayName(empId, selectedBooking.employeeDetails)}
                                  </span>
                                </div>
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
                              <div key={idx} className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-900">
                                  {helper.employeeName || helper.fullName || 'Unknown Helper'}
                                </span>
                              </div>
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
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-4">
                      <button 
                        onClick={closeModal}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Back to the List
                      </button>
                      <button 
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        onClick={() => {
                          // Handle status update functionality here
                          console.log("Confirm Ready to go clicked for booking:", selectedBooking._id);
                        }}
                      >
                        Confirm Ready to go
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}