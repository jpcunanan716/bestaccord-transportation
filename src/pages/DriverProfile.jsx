// src/pages/DriverProfile.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { User, Phone, MapPin, Calendar, Briefcase, Clock, Mail } from "lucide-react";

export default function DriverProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("driverToken");

        if (!token) {
          setError("No driver token found. Please log in again.");
          setLoading(false);
          return;
        }

        // Call the correct API endpoint with proper authorization header
        const res = await axios.get("http://localhost:5000/api/driver/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setProfile(res.data);
        setError(""); // Clear any previous errors
      } catch (err) {
        console.error("Error fetching driver profile:", err);
        
        if (err.response?.status === 401) {
          setError("Session expired. Please log in again.");
          localStorage.removeItem("driverToken"); // Remove invalid token
        } else if (err.response?.status === 403) {
          setError("Access denied. Not authorized as driver/helper.");
        } else {
          setError(err.response?.data?.msg || "Failed to load profile.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-300 h-12 w-12"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Profile Error</h2>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full text-center">
          <p className="text-gray-600">No profile data found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="max-w-md mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{profile.fullName}</h1>
            <p className="text-blue-600 font-semibold">{profile.role}</p>
            <p className="text-gray-500 text-sm font-mono">{profile.employeeId}</p>
          </div>

          {/* Profile Details */}
          <div className="space-y-4">
            {/* Contact Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <Phone className="w-5 h-5 mr-2 text-blue-600" />
                Contact Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mobile:</span>
                  <span className="font-medium">{profile.mobileNumber || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-xs break-all">{profile.email || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Work Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
                Work Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Employment Type:</span>
                  <span className="font-medium">{profile.employmentType || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shift:</span>
                  <span className="font-medium">{profile.shift || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date Hired:</span>
                  <span className="font-medium">
                    {profile.dateHired 
                      ? new Date(profile.dateHired).toLocaleDateString()
                      : "N/A"
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                Address Information
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600 block mb-1">Current Address:</span>
                  <span className="font-medium">{profile.currentAddress || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-600 block mb-1">Permanent Address:</span>
                  <span className="font-medium">{profile.permanentAddress || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            {(profile.emergencyContactName || profile.emergencyContactNumber) && (
              <div className="bg-red-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <Phone className="w-5 h-5 mr-2 text-red-600" />
                  Emergency Contact
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{profile.emergencyContactName || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{profile.emergencyContactNumber || "N/A"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-center text-white text-xs opacity-75">
          Last updated: {profile.updatedAt 
            ? new Date(profile.updatedAt).toLocaleString()
            : "Unknown"
          }
        </div>
      </div>
    </div>
  );
}