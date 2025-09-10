import React, { useEffect, useState } from "react";
import axios from "axios";
import Employee from "../../server/models/Employee";

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

        const res = await axios.get("http://localhost:5000/api/employees", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setProfile(res.data);
      } catch (err) {
        console.error("Error fetching driver profile:", err);
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-600 animate-pulse">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-600">No profile data found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow px-4 py-3">
        <h1 className="text-lg font-bold text-gray-800">Driver Profile</h1>
      </header>

      {/* Profile Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md">
          <h2 className="text-xl font-bold mb-4 text-center text-blue-600">
            Your Profile
          </h2>

          <div className="space-y-3 text-gray-700">
            <p>
              <span className="font-semibold">Full Name: </span>
              {profile.fullName}
            </p>
            <p>
              <span className="font-semibold">Employee ID: </span>
              {profile.employeeId}
            </p>
            <p>
              <span className="font-semibold">Role: </span>
              {profile.role}
            </p>
            <p>
              <span className="font-semibold">Employment Type: </span>
              {profile.employmentType}
            </p>
            <p>
              <span className="font-semibold">Current Address: </span>
              {profile.currentAddress}
            </p>
            <p>
              <span className="font-semibold">Permanent Address: </span>
              {profile.permanentAddress}
            </p>
            <p>
              <span className="font-semibold">Date Hired: </span>
              {new Date(profile.dateHired).toLocaleDateString()}
            </p>
            <p>
              <span className="font-semibold">Shift: </span>
              {profile.shift}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
