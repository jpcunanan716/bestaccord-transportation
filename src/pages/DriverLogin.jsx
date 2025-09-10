import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function DriverLogin() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!employeeId || !password) {
      setError("Employee ID and Password are required");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/driver/driver-login", {
        employeeId,
        password,
      });

      setSuccess(`Welcome ${res.data.fullName} (${res.data.role})`);
      localStorage.setItem("driverToken", res.data.token);

      // Redirect after showing success briefly
      setTimeout(() => {
        navigate("/driver/dashboard");
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-white rounded-xl shadow-xl p-6"
      >
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-2xl font-bold text-center text-gray-800 mb-6"
        >
          Driver / Helper Login
        </motion.h2>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-500 text-sm text-center mb-3"
          >
            {error}
          </motion.p>
        )}

        {success && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-green-600 text-sm text-center mb-3"
          >
            {success}
          </motion.p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Employee ID
            </label>
            <input
              type="text"
              placeholder="Enter your Employee ID"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
            />
          </motion.div>

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
