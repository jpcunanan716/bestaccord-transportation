import { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function Vehicle() {
  const [vehicles, setVehicles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [formData, setFormData] = useState({
    registrationNumber: "",
    manufacturedBy: "",
    model: "",
    plateNumber: "",
    vehicleType: "Truck",
    color: "",
    chassisNumber: "",
    engineNumber: "",
    registrationExpiryDate: "",
    status: "Available",
  });

  const containerRef = useRef(null);

  const brands = ["Toyota", "Ford", "Mitsubishi", "Honda", "Isuzu", "Nissan"];
  const vehicleTypes = ["Truck", "Car"];
  const statuses = ["Available", "Not Available", "On Trip"];

  const fetchVehicles = async () => {
    const res = await axios.get("http://localhost:5000/api/vehicles");
    setVehicles(res.data);
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const openModal = (vehicle = null) => {
    if (vehicle) {
      setEditVehicle(vehicle);
      setFormData({
        registrationNumber: vehicle.registrationNumber,
        manufacturedBy: vehicle.manufacturedBy,
        model: vehicle.model,
        plateNumber: vehicle.plateNumber,
        vehicleType: vehicle.vehicleType,
        color: vehicle.color,
        chassisNumber: vehicle.chassisNumber,
        engineNumber: vehicle.engineNumber,
        registrationExpiryDate: vehicle.registrationExpiryDate
          ? vehicle.registrationExpiryDate.slice(0, 10)
          : "",
        status: vehicle.status,
      });
    } else {
      setEditVehicle(null);
      setFormData({
        registrationNumber: "",
        manufacturedBy: "",
        model: "",
        plateNumber: "",
        vehicleType: "Truck",
        color: "",
        chassisNumber: "",
        engineNumber: "",
        registrationExpiryDate: "",
        status: "Available",
      });
    }
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editVehicle) {
        await axios.put(`http://localhost:5000/api/vehicles/${editVehicle._id}`, formData);
      } else {
        await axios.post("http://localhost:5000/api/vehicles", formData);
      }
      closeModal();
      fetchVehicles();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vehicle?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/vehicles/${id}`);
      fetchVehicles();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* Page Content */}
      <div
        ref={containerRef}
        className={`transition duration-200 ${showModal ? "filter blur-sm" : ""}`}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Vehicles</h1>
          <button
            onClick={() => openModal()}
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg hover:scale-105 transform transition"
          >
            Add Vehicle
          </button>
        </div>

        {/* Rounded Container */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto">
              <thead className="bg-gray-100 rounded-t-lg">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">#</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Vehicle</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Wheels</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Plate Number</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v, index) => (
                  <tr
                    key={v._id}
                    className="border-b last:border-none hover:bg-gray-50 transition duration-150"
                  >
                    <td className="px-6 py-3">{index + 1}</td>
                    <td className="px-6 py-3">{v.manufacturedBy} {v.model}</td>
                    <td className="px-6 py-3">{v.vehicleType === "Truck" ? 6 : 4}</td>
                    <td className="px-6 py-3">{v.plateNumber}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          v.status === "Available"
                            ? "bg-green-100 text-green-800"
                            : v.status === "On Trip"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 space-x-2">
                      <button
                        onClick={() => openModal(v)}
                        className="px-3 py-1 bg-yellow-400 text-white rounded shadow hover:bg-yellow-500 transition transform hover:scale-105"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(v._id)}
                        className="px-3 py-1 bg-red-500 text-white rounded shadow hover:bg-red-600 transition transform hover:scale-105"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Floating Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex justify-start items-start pt-24">
          {/* Background Overlay */}
          <div
            className="absolute inset-0 bg-black opacity-20"
            onClick={closeModal}
          ></div>

          {/* Modal Container */}
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl ml-135 p-6 z-10 animate-fade-in">
            <h2 className="text-xl font-bold mb-4">
              {editVehicle ? "Edit Vehicle" : "Add Vehicle"}
            </h2>

            <form onSubmit={handleSubmit} className="grid gap-3 grid-cols-2">
              <input
                type="text"
                name="registrationNumber"
                placeholder="Registration Number"
                value={formData.registrationNumber}
                onChange={handleChange}
                required
                className="border p-2 rounded focus:ring-2 focus:ring-indigo-400"
              />
              <select
                name="manufacturedBy"
                value={formData.manufacturedBy}
                onChange={handleChange}
                required
                className="border p-2 rounded focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">Select Manufacturer</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <input
                type="text"
                name="model"
                placeholder="Model"
                value={formData.model}
                onChange={handleChange}
                required
                className="border p-2 rounded focus:ring-2 focus:ring-indigo-400"
              />
              <input
                type="text"
                name="plateNumber"
                placeholder="Plate Number"
                value={formData.plateNumber}
                onChange={handleChange}
                required
                className="border p-2 rounded focus:ring-2 focus:ring-indigo-400"
              />
              <select
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
                required
                className="border p-2 rounded focus:ring-2 focus:ring-indigo-400"
              >
                {vehicleTypes.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <input
                type="text"
                name="color"
                placeholder="Color"
                value={formData.color}
                onChange={handleChange}
                className="border p-2 rounded focus:ring-2 focus:ring-indigo-400"
              />
              <input
                type="text"
                name="chassisNumber"
                placeholder="Chassis Number"
                value={formData.chassisNumber}
                onChange={handleChange}
                className="border p-2 rounded focus:ring-2 focus:ring-indigo-400"
              />
              <input
                type="text"
                name="engineNumber"
                placeholder="Engine Number"
                value={formData.engineNumber}
                onChange={handleChange}
                className="border p-2 rounded focus:ring-2 focus:ring-indigo-400"
              />
              <input
                type="date"
                name="registrationExpiryDate"
                value={formData.registrationExpiryDate}
                onChange={handleChange}
                className="border p-2 rounded focus:ring-2 focus:ring-indigo-400"
              />
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="border p-2 rounded focus:ring-2 focus:ring-indigo-400"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <div className="col-span-2 flex justify-end mt-2 space-x-2">
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow hover:scale-105 transform transition"
                >
                  {editVehicle ? "Update" : "Add"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2 bg-gray-300 rounded-lg shadow hover:scale-105 transform transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
