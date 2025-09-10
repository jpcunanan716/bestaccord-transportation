import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";

export default function LoginPage() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        // Staff registration
        await axios.post("http://localhost:5000/api/auth/register", {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: "staff",
        });
        alert("Registration successful! You can now login.");
        setIsRegister(false);
        setFormData({ name: "", email: "", password: "" });
      } else {
        // Login
        const res = await axios.post("http://localhost:5000/api/auth/login", {
          email: formData.email,
          password: formData.password,
        });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.role);
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Something went wrong");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500 px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"
      >
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          {isRegister ? "Staff Registration" : "Admin / Staff Login"}
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          {isRegister
            ? "Fill out the details to create a staff account."
            : "Enter your credentials to access the dashboard."}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@example.com"
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition duration-200 shadow-md"
          >
            {isRegister ? "Register" : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          {isRegister ? (
            <>
              Already have an account?{" "}
              <button
                className="text-indigo-600 hover:underline"
                onClick={() => setIsRegister(false)}
              >
                Login
              </button>
            </>
          ) : (
            <>
              No account?{" "}
              <button
                className="text-indigo-600 hover:underline"
                onClick={() => setIsRegister(true)}
              >
                Register
              </button>
            </>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          © {new Date().getFullYear()} Bestaccord Transportation
        </p>
      </motion.div>
    </div>
  );
}
