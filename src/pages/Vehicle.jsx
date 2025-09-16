import { useState, useEffect, useRef } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Vehicle() {
  const [errors, setErrors] = useState({});
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const navigate = useNavigate();

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  //search states
  const [searchDateRange, setSearchDateRange] = useState("");
  const [searchVehicleType, setSearchVehicleType] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [searchManufacturedBy, setSearchManufacturedBy] = useState("");
  const [generalSearch, setGeneralSearch] = useState("");

  // Unique filter values
  const [uniqueDates, setUniqueDates] = useState([]);
  const [uniqueVehicleTypes, setuniqueVehicleTypes] = useState([]);
  const [uniqueStatus, setUniqueStatus] = useState([]);
  const [uniqueManufacturedBy, setuniqueManufacturedBy] = useState([]);

  //Form state
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
    try {
      const res = await axios.get("http://localhost:5000/api/vehicles");
      setVehicles(res.data);
      setFilteredVehicles(res.data);

      // Extract unique values
      setuniqueManufacturedBy([...new Set(res.data.map((c) => c.manufacturedBy))]);
      setuniqueVehicleTypes([...new Set(res.data.map((c) => c.vehicleType))]);
      setUniqueStatus([...new Set(res.data.map((c) => c.status))]);
      setUniqueDates([
        ...new Set(
          res.data.map((c) =>
            new Date(c.registrationExpiryDate).toLocaleDateString()
          )
        ),
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  //Filter function
  useEffect(() => {
    let results = vehicles;

    if (searchDateRange) {
      results = results.filter((vhcl) => vhcl.registrationExpiryDate === searchDateRange);
    }
    if (searchVehicleType) {
      results = results.filter((vhcl) => vhcl.vehicleType === searchVehicleType);
    }
    if (searchStatus) {
      results = results.filter((vhcl) => vhcl.status === searchStatus);
    }
    if (searchManufacturedBy) {
      results = results.filter((vhcl) => vhcl.manufacturedBy === searchManufacturedBy);
    }
    if (generalSearch) {
      results = results.filter(
        (vhcl) =>
          vhcl.registrationExpiryDate?.toLowerCase().includes(generalSearch.toLowerCase()) ||
          vhcl.vehicleType?.toLowerCase().includes(generalSearch.toLowerCase()) ||
          vhcl.status?.includes(generalSearch) ||
          vhcl.manufacturedBy?.toLowerCase().includes(generalSearch.toLowerCase())
      );
    }
    setFilteredVehicles(results);
    setCurrentPage(1);
  }, [searchDateRange, searchVehicleType, searchStatus, searchManufacturedBy, generalSearch, vehicles]);

  // Pagination logic
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVehicles = filteredVehicles.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Modal handlers
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

  // Frontend validation for vehicle form
  const validateForm = () => {
    let newErrors = {};
    if (!(formData.registrationNumber || "").trim()) newErrors.registrationNumber = "Registration number is required.";
    if (!formData.manufacturedBy) newErrors.manufacturedBy = "Manufacturer is required.";
    if (!(formData.model || "").trim()) newErrors.model = "Model is required.";
    if (!(formData.plateNumber || "").trim()) newErrors.plateNumber = "Plate number is required.";
    if (!formData.vehicleType) newErrors.vehicleType = "Vehicle type is required.";
    if (!formData.status) newErrors.status = "Status is required.";
    if (formData.registrationExpiryDate && isNaN(Date.parse(formData.registrationExpiryDate))) newErrors.registrationExpiryDate = "Invalid expiry date.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editVehicle) {
        await axios.put(
          `http://localhost:5000/api/vehicles/${editVehicle._id}`,
          { ...formData, vehicleId: editVehicle.vehicleId }
        );
      } else {
        const { vehicleId, ...dataToSend } = formData;
        await axios.post("http://localhost:5000/api/vehicles", dataToSend);
      }
      closeModal();
      fetchVehicles();
      setErrors({});
    } catch (err) {
      let backendErrors = {};
      if (err.response?.data?.errors) {
        backendErrors = err.response.data.errors;
      } else if (err.response?.data?.message) {
        backendErrors.general = err.response.data.message;
      } else {
        backendErrors.general = "Error adding/updating vehicle.";
      }
      setErrors(backendErrors);
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

  //Navigate to Vehicle Info Page
  const viewVehicle = (vehicle) => {
    navigate(`/dashboard/vehicle/${vehicle._id}`);
  };

  // Add this helper function at the top of your component
  const getDisplayID = (index, vehicle) => {
    return vehicle.vehicleId ? vehicle.vehicleId : `V${String(index + 1).padStart(3, "0")}`;
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

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <select
            value={searchDateRange}
            onChange={(e) => setSearchDateRange(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All Dates</option>
            {uniqueDates.map((registrationExpiryDate, i) => (
              <option key={i} value={registrationExpiryDate}>
                {registrationExpiryDate}
              </option>
            ))}
          </select>

          <select
            value={searchVehicleType}
            onChange={(e) => setSearchVehicleType(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All Vehicle Types</option>
            {uniqueVehicleTypes.map((vehicleType, i) => (
              <option key={i} value={vehicleType}>
                {vehicleType}
              </option>
            ))}
          </select>

          <select
            value={searchStatus}
            onChange={(e) => setSearchStatus(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">Status</option>
            {uniqueStatus.map((status, i) => (
              <option key={i} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            value={searchManufacturedBy}
            onChange={(e) => setSearchManufacturedBy(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All Vehicle Brand</option>
            {uniqueManufacturedBy.map((manufacturedBy, i) => (
              <option key={i} value={manufacturedBy}>
                {manufacturedBy}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="General Search"
            value={generalSearch}
            onChange={(e) => setGeneralSearch(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>

        {/* Tables */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto">
              <thead className="bg-gray-100 rounded-t-lg">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">#</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Vehicle ID</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Vehicle</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Wheels</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Plate Number</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedVehicles.map((v, index) => (
                  <tr
                    key={v._id}
                    className="border-b last:border-none hover:bg-gray-50 transition duration-150"
                  >
                    <td className="px-6 py-3">{index + 1}</td>
                    <td className="px-6 py-3 font-mono text-blue-600">{getDisplayID(index, v)}</td>
                    <td className="px-6 py-3">{v.manufacturedBy} {v.model}</td>
                    <td className="px-6 py-3">{v.vehicleType === "Truck" ? 6 : 4}</td>
                    <td className="px-6 py-3">{v.plateNumber}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${v.status === "Available"
                          ? "bg-green-100 text-green-800"
                          : v.status === "On Trip"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                          }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center space-x-2">
                      <button
                        onClick={() => viewVehicle(v)}
                        className="px-3 py-1 bg-blue-500 text-white rounded shadow hover:bg-blue-600 inline-flex items-center gap-1 transition transform hover:scale-105"
                      >
                        <Eye size={16} /> View
                      </button>
                      <button
                        onClick={() => openModal(v)}
                        className="px-3 py-1 bg-yellow-400 text-white rounded shadow hover:bg-yellow-500 inline-flex items-center gap-1 transition transform hover:scale-105"
                      >
                        <Pencil size={16} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(v._id)}
                        className="px-3 py-1 bg-red-500 text-white rounded shadow hover:bg-red-600 inline-flex items-center gap-1 transition transform hover:scale-105"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg shadow ${currentPage === 1
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
            >
              Previous
            </button>
            <p className="text-gray-600 text-sm">
              Page {currentPage} of {totalPages}
            </p>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg shadow ${currentPage === totalPages
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
            >
              Next
            </button>
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
                className={`border p-2 rounded focus:ring-2 focus:ring-indigo-400 ${errors.registrationNumber ? "border-red-500" : ""}`}
              />
              {errors.registrationNumber && <p className="text-red-500 text-xs col-span-2">{errors.registrationNumber}</p>}

              <select
                name="manufacturedBy"
                value={formData.manufacturedBy}
                onChange={handleChange}
                required
                className={`border p-2 rounded focus:ring-2 focus:ring-indigo-400 ${errors.manufacturedBy ? "border-red-500" : ""}`}
              >
                <option value="">Select Manufacturer</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              {errors.manufacturedBy && <p className="text-red-500 text-xs col-span-2">{errors.manufacturedBy}</p>}

              <input
                type="text"
                name="model"
                placeholder="Model"
                value={formData.model}
                onChange={handleChange}
                required
                className={`border p-2 rounded focus:ring-2 focus:ring-indigo-400 ${errors.model ? "border-red-500" : ""}`}
              />
              {errors.model && <p className="text-red-500 text-xs col-span-2">{errors.model}</p>}

              <input
                type="text"
                name="plateNumber"
                placeholder="Plate Number"
                value={formData.plateNumber}
                onChange={handleChange}
                required
                className={`border p-2 rounded focus:ring-2 focus:ring-indigo-400 ${errors.plateNumber ? "border-red-500" : ""}`}
              />
              {errors.plateNumber && <p className="text-red-500 text-xs col-span-2">{errors.plateNumber}</p>}

              <select
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
                required
                className={`border p-2 rounded focus:ring-2 focus:ring-indigo-400 ${errors.vehicleType ? "border-red-500" : ""}`}
              >
                {vehicleTypes.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              {errors.vehicleType && <p className="text-red-500 text-xs col-span-2">{errors.vehicleType}</p>}

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
                className={`border p-2 rounded focus:ring-2 focus:ring-indigo-400 ${errors.registrationExpiryDate ? "border-red-500" : ""}`}
              />
              {errors.registrationExpiryDate && <p className="text-red-500 text-xs col-span-2">{errors.registrationExpiryDate}</p>}

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className={`border p-2 rounded focus:ring-2 focus:ring-indigo-400 ${errors.status ? "border-red-500" : ""}`}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {errors.status && <p className="text-red-500 text-xs col-span-2">{errors.status}</p>}

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
              {errors.general && <p className="text-red-500 text-sm col-span-2 text-center mt-2">{errors.general}</p>}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
