// src/hooks/useDriverBookingCount.js
import { useState, useEffect } from "react";
import { axiosClient } from "../api/axiosClient";

export const useDriverBookingCount = () => {
  const [bookingCount, setBookingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookingCount = async () => {
    try {
      const token = localStorage.getItem("driverToken");

      if (!token) {
        setLoading(false);
        return;
      }

      console.log("🔢 Frontend: Fetching booking count...");

      const res = await axiosClient.get("/api/driver/bookings/count", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("📊 Frontend: Booking count response:", res.data);

      if (res.data.success) {
        setBookingCount(res.data.count);
        setError(null);
      }
    } catch (err) {
      console.error("❌ Frontend: Error fetching booking count:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("🚀 Frontend: useDriverBookingCount hook initialized");
    fetchBookingCount();

    // Refresh count every 30 seconds
    const interval = setInterval(() => {
      console.log("🔄 Frontend: Auto-refreshing booking count...");
      fetchBookingCount();
    }, 30000);

    return () => {
      console.log("🛑 Frontend: Cleaning up booking count interval");
      clearInterval(interval);
    };
  }, []);

  return { bookingCount, loading, error, refetch: fetchBookingCount };
};