import React, { useState, useEffect, useRef } from "react";
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
  XCircle,
  X,
  User,
  Play,
  Building,
  ChevronDown,
  ChevronUp,
  Phone,
  Weight,
  Award
} from "lucide-react";
import { axiosClient } from "../api/axiosClient";


export default function DriverBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    route: true,
    cargo: false,
    customer: false,
    team: false
  });
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  const statusColors = {
    "Pending": { bg: "bg-yellow-100", text: "text-yellow-800", icon: AlertCircle },
    "Ready to go": { bg: "bg-blue-100", text: "text-blue-800", icon: CheckCircle2 },
    "On Trip": { bg: "bg-purple-100", text: "text-purple-800", icon: PlayCircle },
    "In Transit": { bg: "bg-purple-100", text: "text-purple-800", icon: PlayCircle },
    "Delivered": { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle2 },
    "Completed": { bg: "bg-gray-100", text: "text-gray-800", icon: Award }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // [All your existing functions remain the same - initializeMap, createMap, startTrip, markAsDelivered, markAsCompleted, fetchBookings, etc.]

  // Initialize map with CORS proxy
  const initializeMap = async () => {
    if (!selectedBooking || !mapRef.current) return;

    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    try {
      if (window.L) {
        createMap();
      } else {
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
    const map = L.map(mapRef.current).setView([14.5995, 120.9842], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const geocodeAddress = async (address) => {
      try {
        const cleanAddress = address.replace(/,?\s*Philippines\s*,?/gi, '');
        const query = encodeURIComponent(`${cleanAddress}, Philippines`);

        const geocodingServices = [
          `https://api.allorigins.win/get?url=${encodeURIComponent(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`)}`,
        ];

        for (const serviceUrl of geocodingServices) {
          try {
            const response = await fetch(serviceUrl);
            if (response.ok) {
              const data = await response.json();
              let results = data.contents ? JSON.parse(data.contents) : data;

              if (results && results.length > 0 && results[0].lat && results[0].lon) {
                return [parseFloat(results[0].lat), parseFloat(results[0].lon)];
              }
            }
          } catch (err) {
            console.warn('Geocoding service failed, trying next...', err);
            continue;
          }
        }

        const philippinesCities = {
          'manila': [14.5995, 120.9842],
          'cebu': [10.3157, 123.8854],
          'davao': [7.1907, 125.4553],
          'quezon': [14.6760, 121.0437],
          'makati': [14.5547, 121.0244],
          'pasig': [14.5764, 121.0851]
        };

        const cityKey = Object.keys(philippinesCities).find(city =>
          address.toLowerCase().includes(city)
        );

        if (cityKey) {
          return philippinesCities[cityKey];
        }

        return [14.5995, 120.9842];

      } catch (error) {
        console.warn('Geocoding error, using default coordinates:', error);
        return [14.5995, 120.9842];
      }
    };

    try {
      const originCoords = await geocodeAddress(selectedBooking.originAddress);
      const destCoords = await geocodeAddress(selectedBooking.destinationAddress);

      if (originCoords) {
        L.circleMarker(originCoords, {
          radius: 10,
          fillColor: '#10b981',
          color: '#059669',
          weight: 3,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(map).bindPopup(`<b>📍 Origin:</b><br/>${selectedBooking.originAddress}`);
      }

      if (destCoords) {
        L.circleMarker(destCoords, {
          radius: 10,
          fillColor: '#ef4444',
          color: '#dc2626',
          weight: 3,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(map).bindPopup(`<b>🎯 Destination:</b><br/>${selectedBooking.destinationAddress}`);
      }

      if (originCoords && destCoords) {
        L.polyline([originCoords, destCoords], {
          color: '#8b5cf6',
          weight: 4,
          opacity: 0.8,
          dashArray: '10, 5'
        }).addTo(map);

        const bounds = L.latLngBounds([originCoords, destCoords]);
        map.fitBounds(bounds, { padding: [20, 20] });
      } else if (destCoords) {
        map.setView(destCoords, 12);
      } else if (originCoords) {
        map.setView(originCoords, 12);
      }
    } catch (error) {
      console.error('Error creating map markers:', error);
    }

    mapInstance.current = map;
  };

  const startTrip = async () => {
    if (!selectedBooking) return;

    setUpdating(true);
    try {
      const token = localStorage.getItem("driverToken");

      const response = await axiosClient.put(
        `/api/driver/bookings/${selectedBooking._id}/status`,
        { status: "In Transit" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setBookings(prevBookings =>
          prevBookings.map(booking =>
            booking._id === selectedBooking._id
              ? { ...booking, status: "In Transit" }
              : booking
          )
        );

        setSelectedBooking(prev => ({
          ...prev,
          status: "In Transit"
        }));

        console.log("✅ Trip started successfully");
      }
    } catch (err) {
      console.error("❌ Error starting trip:", err);
      setError("Failed to start trip. Please try again.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setUpdating(false);
    }
  };

  const markAsDelivered = async () => {
    if (!selectedBooking) return;

    setUpdating(true);
    try {
      const token = localStorage.getItem("driverToken");

      const response = await axiosClient.put(
        `/api/driver/bookings/${selectedBooking._id}/status`,
        { status: "Delivered" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setBookings(prevBookings =>
          prevBookings.map(booking =>
            booking._id === selectedBooking._id
              ? { ...booking, status: "Delivered" }
              : booking
          )
        );

        setSelectedBooking(prev => ({
          ...prev,
          status: "Delivered"
        }));

        console.log("✅ Package marked as delivered");
      }
    } catch (err) {
      console.error("❌ Error marking as delivered:", err);
      setError("Failed to mark as delivered. Please try again.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setUpdating(false);
    }
  };

  const markAsCompleted = async () => {
    if (!selectedBooking) return;

    setUpdating(true);
    try {
      const token = localStorage.getItem("driverToken");

      const response = await axiosClient.put(
        `/api/driver/bookings/${selectedBooking._id}/status`,
        { status: "Completed" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setBookings(prevBookings =>
          prevBookings.map(booking =>
            booking._id === selectedBooking._id
              ? { ...booking, status: "Completed" }
              : booking
          )
        );

        setSelectedBooking(prev => ({
          ...prev,
          status: "Completed"
        }));

        console.log("✅ Trip marked as completed");

        setTimeout(() => {
          closeModal();
        }, 1500);
      }
    } catch (err) {
      console.error("❌ Error marking as completed:", err);
      setError("Failed to mark as completed. Please try again.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setUpdating(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("driverToken");

      if (!token) {
        setError("No driver token found. Please log in again.");
        setLoading(false);
        return;
      }

      const res = await axiosClient.get("/api/driver/bookings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        setBookings(res.data.bookings);
        setDebugInfo(res.data.debug);
        setError("");
      } else {
        setError("Failed to fetch bookings");
      }
    } catch (err) {
      console.error("❌ Frontend DEBUG: Error fetching bookings:", err);

      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
        localStorage.removeItem("driverToken");
      } else {
        setError(err.response?.data?.msg || "Failed to load bookings.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshBookings = async () => {
    setRefreshing(true);
    await fetchBookings();
  };

  const openBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
    setExpandedSections({
      route: true,
      cargo: false,
      customer: false,
      team: false
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedBooking(null);
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }
  };

  useEffect(() => {
    if (showModal && selectedBooking && mapRef.current) {
      setTimeout(() => initializeMap(), 100);
    }
  }, [showModal, selectedBooking]);

  useEffect(() => {
    fetchBookings();
  }, []);

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
          <p className="text-center mt-4 text-purple-200">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-2xl max-w-md w-full text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Bookings</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={fetchBookings}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">My Bookings</h1>
              {debugInfo && (
                <p className="text-xs text-purple-200">
                  Found {debugInfo.queriedBookings} assignments
                </p>
              )}
            </div>
            <button
              onClick={refreshBookings}
              disabled={refreshing}
              className="p-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 transition"
            >
              <RefreshCw className={`w-5 h-5 text-white ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Error notification */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-white rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Bookings List */}
          {bookings.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-2xl text-center">
              <Package className="w-12 h-12 text-purple-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">No Bookings Found</h2>
              <p className="text-purple-200 mb-2">You don't have any assigned bookings yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const StatusIcon = statusColors[booking.status]?.icon || AlertCircle;
                return (
                  <div
                    key={booking._id}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-4 cursor-pointer hover:bg-white/15 transition-all active:scale-95"
                    onClick={() => openBookingDetails(booking)}
                  >
                    {/* Booking Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-white">{booking.reservationId}</h3>
                        <p className="text-sm text-purple-200 font-mono">{booking.tripNumber}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusColors[booking.status]?.bg} ${statusColors[booking.status]?.text}`}>
                        <StatusIcon className="w-3 h-3" />
                        {booking.status === "In Transit" ? "On Trip" : booking.status || "Pending"}
                      </div>
                    </div>

                    {/* Company & Product */}
                    <div className="mb-3">
                      <p className="font-semibold text-white">{booking.companyName}</p>
                      <p className="text-sm text-purple-200 flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        {booking.productName} ({booking.quantity} units)
                      </p>
                    </div>

                    {/* Route */}
                    <div className="mb-3 text-sm bg-white/5 backdrop-blur-sm p-2 rounded-lg border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-3 h-3 text-green-400 flex-shrink-0" />
                        <span className="text-xs text-purple-300">From:</span>
                        <span className="font-medium text-xs text-white">{booking.originAddress.length > 30 ? booking.originAddress.substring(0, 30) + '...' : booking.originAddress}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-red-400 flex-shrink-0" />
                        <span className="text-xs text-purple-300">To:</span>
                        <span className="font-medium text-xs text-white">{booking.destinationAddress.length > 30 ? booking.destinationAddress.substring(0, 30) + '...' : booking.destinationAddress}</span>
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="flex items-center gap-4 text-sm text-purple-200">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(booking.dateNeeded).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {booking.timeNeeded}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal */}
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
              <div className="min-h-screen flex items-end sm:items-center justify-center p-4">
                <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl">

                  {/* Modal Header - Sticky */}
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{selectedBooking.reservationId}</h3>
                      <p className="text-sm text-gray-600">{selectedBooking.tripNumber}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusColors[selectedBooking.status]?.bg} ${statusColors[selectedBooking.status]?.text}`}>
                      {React.createElement(statusColors[selectedBooking.status]?.icon || AlertCircle, { className: "w-3 h-3" })}
                      {selectedBooking.status === "In Transit" ? "On Trip" : selectedBooking.status || "Pending"}
                    </div>
                    <button
                      onClick={closeModal}
                      className="ml-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Body - Scrollable */}
                  <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>

                    {/* Map Section */}
                    <div className="p-4 border-b border-gray-100">
                      <div className="bg-gray-100 rounded-lg overflow-hidden">
                        <div
                          ref={mapRef}
                          className="w-full h-48"
                        >
                          <div className="flex items-center justify-center h-full bg-gray-100">
                            <div className="text-center">
                              <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-500 text-sm">Loading route...</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Collapsible Sections */}

                    {/* Route Section */}
                    <div className="border-b border-gray-100">
                      <button
                        onClick={() => toggleSection('route')}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">Route Details</span>
                        </div>
                        {expandedSections.route ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {expandedSections.route && (
                        <div className="px-4 pb-4 space-y-3">
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
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-4 bg-gray-50 p-2 rounded">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(selectedBooking.dateNeeded).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {selectedBooking.timeNeeded}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Cargo Section */}
                    <div className="border-b border-gray-100">
                      <button
                        onClick={() => toggleSection('cargo')}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-purple-600" />
                          <span className="font-medium">Cargo Details</span>
                        </div>
                        {expandedSections.cargo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {expandedSections.cargo && (
                        <div className="px-4 pb-4">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-gray-50 p-2 rounded">
                              <p className="text-gray-600 text-xs">Product</p>
                              <p className="font-medium">{selectedBooking.productName}</p>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                              <p className="text-gray-600 text-xs">Quantity</p>
                              <p className="font-medium">{selectedBooking.quantity?.toLocaleString()} pcs</p>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                              <p className="text-gray-600 text-xs">Weight</p>
                              <p className="font-medium flex items-center gap-1">
                                <Weight className="w-3 h-3" />
                                {selectedBooking.grossWeight} tons
                              </p>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                              <p className="text-gray-600 text-xs">Packages</p>
                              <p className="font-medium">{selectedBooking.numberOfPackages} boxes</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Customer Section */}
                    <div className="border-b border-gray-100">
                      <button
                        onClick={() => toggleSection('customer')}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-green-600" />
                          <span className="font-medium">Customer Info</span>
                        </div>
                        {expandedSections.customer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {expandedSections.customer && (
                        <div className="px-4 pb-4 space-y-3">
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-gray-600 text-xs mb-1">Company</p>
                            <p className="font-medium">{selectedBooking.companyName}</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-gray-600 text-xs mb-1">Customer</p>
                            <p className="font-medium">{selectedBooking.customerEstablishmentName || selectedBooking.shipperConsignorName || 'N/A'}</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-gray-600 text-xs mb-1">Delivery Fee</p>
                            <p className="font-medium text-green-600">₱{selectedBooking.deliveryFee?.toLocaleString()}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Team Section */}
                    <div className="border-b border-gray-100">
                      <button
                        onClick={() => toggleSection('team')}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-orange-600" />
                          <span className="font-medium">Team Assignment</span>
                        </div>
                        {expandedSections.team ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {expandedSections.team && (
                        <div className="px-4 pb-4">
                          <div className="space-y-2">
                            {selectedBooking.employeeDetails && selectedBooking.employeeDetails.length > 0 ? (
                              selectedBooking.employeeDetails.map((emp, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm font-medium flex-1">{emp.fullName}</span>
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    {emp.role}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded text-center">No team assigned yet</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Modal Footer - Sticky */}
                  <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 z-10">
                    {selectedBooking.status === "Ready to go" && (
                      <button
                        onClick={startTrip}
                        disabled={updating}
                        className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                      >
                        <Play className="w-4 h-4" />
                        {updating ? "Starting Trip..." : "Start Trip"}
                      </button>
                    )}

                    {(selectedBooking.status === "In Transit" || selectedBooking.status === "On Trip") && (
                      <button
                        onClick={markAsDelivered}
                        disabled={updating}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {updating ? "Marking as Delivered..." : "Mark as Delivered"}
                      </button>
                    )}

                    {selectedBooking.status === "Delivered" && (
                      <button
                        onClick={markAsCompleted}
                        disabled={updating}
                        className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                      >
                        <Award className="w-4 h-4" />
                        {updating ? "Marking as Completed..." : "Mark as Completed"}
                      </button>
                    )}

                    {selectedBooking.status === "Pending" && (
                      <div className="w-full py-3 bg-yellow-100 text-yellow-800 rounded-lg text-sm text-center font-medium">
                        ⏳ Waiting for Admin approval
                      </div>
                    )}

                    {selectedBooking.status === "Completed" && (
                      <div className="w-full py-3 bg-green-100 text-green-800 rounded-lg text-sm text-center font-medium flex items-center justify-center gap-2">
                        <Award className="w-4 h-4" />
                        ✅ Trip completed successfully!
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}