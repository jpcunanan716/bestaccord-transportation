import { useState, useEffect, useRef } from "react";
import { Eye, Pencil, Trash2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import addressDefaults from "../constants/addressDefaults";

function Booking() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editBooking, setEditBooking] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  // Data for dropdowns
  const [clients, setClients] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Search states
  const [searchReservationId, setSearchReservationId] = useState("");
  const [searchCompanyName, setSearchCompanyName] = useState("");
  const [searchProductName, setSearchProductName] = useState("");
  const [searchVehicleType, setSearchVehicleType] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [generalSearch, setGeneralSearch] = useState("");

  // Unique filter values
  const [uniqueReservationIds, setUniqueReservationIds] = useState([]);
  const [uniqueCompanyNames, setUniqueCompanyNames] = useState([]);
  const [uniqueProductNames, setUniqueProductNames] = useState([]);
  const [uniqueVehicleTypes, setUniqueVehicleTypes] = useState([]);
  const [uniqueDates, setUniqueDates] = useState([]);

  const [formData, setFormData] = useState({
    productName: "",
    quantity: "",
    grossWeight: "",
    unitPerPackage: "",
    numberOfPackages: "",
    deliveryFee: "",
    companyName: "",
    shipperConsignorName: "",
    customerEstablishmentName: "",
    originAddress: "",
    destinationAddress: "",
    vehicleType: "",
    areaLocationCode: "",
    rateCost: "",
    dateNeeded: "",
    timeNeeded: "",
    employeeAssigned: [],
    roleOfEmployee: [],
  });

  const containerRef = useRef(null);

  // Fetch all required data
  const fetchBookings = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/bookings");
      setBookings(res.data);
      setFilteredBookings(res.data);

      // Extract unique values
      setUniqueReservationIds([...new Set(res.data.map((b) => b.reservationId))]);
      setUniqueCompanyNames([...new Set(res.data.map((b) => b.companyName))]);
      setUniqueProductNames([...new Set(res.data.map((b) => b.productName))]);
      setUniqueVehicleTypes([...new Set(res.data.map((b) => b.vehicleType))]);
      setUniqueDates([
        ...new Set(
          res.data.map((b) =>
            new Date(b.dateNeeded).toLocaleDateString()
          )
        ),
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/clients/names");
      setClients(res.data);
    } catch (err) {
      console.error("Error fetching clients:", err);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/vehicles");
      setVehicles(res.data);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/employees");
      setEmployees(res.data);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchClients();
    fetchVehicles();
    fetchEmployees();
  }, []);

  // Filter function
  useEffect(() => {
    let results = bookings;

    if (searchReservationId) {
      results = results.filter((booking) => booking.reservationId === searchReservationId);
    }
    if (searchCompanyName) {
      results = results.filter((booking) => booking.companyName === searchCompanyName);
    }
    if (searchProductName) {
      results = results.filter((booking) => booking.productName === searchProductName);
    }
    if (searchVehicleType) {
      results = results.filter((booking) => booking.vehicleType === searchVehicleType);
    }
    if (searchDate) {
      results = results.filter(
        (booking) =>
          new Date(booking.dateNeeded).toLocaleDateString() === searchDate
      );
    }
    if (generalSearch) {
      results = results.filter(
        (booking) =>
          booking.reservationId
            ?.toLowerCase()
            .includes(generalSearch.toLowerCase()) ||
          booking.tripNumber
            ?.toLowerCase()
            .includes(generalSearch.toLowerCase()) ||
          booking.companyName
            ?.toLowerCase()
            .includes(generalSearch.toLowerCase()) ||
          booking.productName
            ?.toLowerCase()
            .includes(generalSearch.toLowerCase()) ||
          booking.vehicleType
            ?.toLowerCase()
            .includes(generalSearch.toLowerCase()) ||
          booking.employeeAssigned
            ?.toLowerCase()
            .includes(generalSearch.toLowerCase())
      );
    }

    setFilteredBookings(results);
    setCurrentPage(1); // reset to page 1 when filters change
  }, [searchReservationId, searchCompanyName, searchProductName, searchVehicleType, searchDate, generalSearch, bookings]);

  // Pagination logic
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = filteredBookings.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Modal handlers
  const openModal = (booking = null) => {
    setCurrentStep(1);
    if (booking) {
      setEditBooking(booking);
      setFormData({
        productName: booking.productName,
        quantity: booking.quantity,
        grossWeight: booking.grossWeight,
        unitPerPackage: booking.unitPerPackage,
        numberOfPackages: booking.numberOfPackages,
        deliveryFee: booking.deliveryFee,
        companyName: booking.companyName,
        shipperConsignorName: booking.shipperConsignorName,
        customerEstablishmentName: booking.customerEstablishmentName,
        originAddress: booking.originAddress,
        destinationAddress: booking.destinationAddress,
        vehicleType: booking.vehicleType,
        areaLocationCode: booking.areaLocationCode,
        rateCost: booking.rateCost,
        dateNeeded: new Date(booking.dateNeeded).toISOString().split('T')[0],
        timeNeeded: booking.timeNeeded,
        employeeAssigned: Array.isArray(booking.employeeAssigned) ? booking.employeeAssigned : [booking.employeeAssigned],
        roleOfEmployee: Array.isArray(booking.roleOfEmployee) ? booking.roleOfEmployee : [booking.roleOfEmployee],
      });
    } else {
      setEditBooking(null);
      setFormData({
        productName: "",
        quantity: "",
        grossWeight: "",
        unitPerPackage: "",
        numberOfPackages: "",
        deliveryFee: "",
        companyName: "",
        shipperConsignorName: "",
        customerEstablishmentName: "",
        originAddress: "",
        destinationAddress: "",
        vehicleType: "",
        areaLocationCode: "",
        rateCost: "",
        dateNeeded: "",
        timeNeeded: "",
        employeeAssigned: [""],
        roleOfEmployee: [""],
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentStep(1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEmployeeChange = (index, employeeId) => {
    const newEmployeeAssigned = [...formData.employeeAssigned];
    const newRoleOfEmployee = [...formData.roleOfEmployee];

    newEmployeeAssigned[index] = employeeId; // This should now be employeeId

    // Find the employee by employeeId and auto-fill the role
    const selectedEmployee = employees.find(emp => emp.employeeId === employeeId); // Change from _id to employeeId
    if (selectedEmployee) {
      newRoleOfEmployee[index] = selectedEmployee.role;
    } else {
      newRoleOfEmployee[index] = "";
    }

    setFormData({
      ...formData,
      employeeAssigned: newEmployeeAssigned,
      roleOfEmployee: newRoleOfEmployee
    });
  };

  const addEmployee = () => {
    setFormData({
      ...formData,
      employeeAssigned: [...formData.employeeAssigned, ""],
      roleOfEmployee: [...formData.roleOfEmployee, ""]
    });
  };

  const removeEmployee = (index) => {
    const newEmployeeAssigned = formData.employeeAssigned.filter((_, i) => i !== index);
    const newRoleOfEmployee = formData.roleOfEmployee.filter((_, i) => i !== index);

    setFormData({
      ...formData,
      employeeAssigned: newEmployeeAssigned,
      roleOfEmployee: newRoleOfEmployee
    });
  };

  const getAvailableEmployees = (currentIndex) => {
    const selectedEmployeeIds = formData.employeeAssigned.filter((empId, index) => index !== currentIndex && empId !== "");
    // Only show employees with status 'Available'
    return employees.filter(emp => emp.status === "Available" && !selectedEmployeeIds.includes(emp.employeeId));
  };

  // Helper function to get employee display name
  const getEmployeeDisplayName = (employeeId) => {
    const employee = employees.find(emp => emp.employeeId === employeeId);
    if (employee) {
      return `${employee.employeeId} - ${employee.fullName || employee.name || ''}`.trim();
    }
    return employeeId; // fallback to just the ID if employee not found
  };

  // Helper function to get vehicle display name
  const getVehicleDisplayName = (vehicleType) => {
    const vehicle = vehicles.find(v => v.vehicleType === vehicleType);
    if (vehicle) {
      return `${vehicle.color || ''} ${vehicle.manufacturedBy || ''} ${vehicle.model || ''} - ${vehicle.vehicleType}`.replace(/ +/g, ' ').trim();
    }
    return vehicleType;
  };

  // Only show vehicles with status 'Available' in dropdown
  const getAvailableVehicles = () => {
    return vehicles.filter(vehicle => vehicle.status === "Available");
  };

  // Helper function to format employee names for display
  const formatEmployeeNames = (employeeAssigned) => {
    if (Array.isArray(employeeAssigned)) {
      return employeeAssigned
        .map(empId => getEmployeeDisplayName(empId))
        .join(", ");
    }
    return getEmployeeDisplayName(employeeAssigned);
  };

  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Updated Submit handler for Option 2
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Only submit when on the final step (Step 2)
    if (currentStep !== 2) {
      return;
    }

    // Form validation - check required fields
    const requiredFields = {
      // Step 1 fields
      productName: 'Product Name',
      quantity: 'Quantity',
      grossWeight: 'Gross Weight',
      unitPerPackage: 'Units per Package',
      numberOfPackages: 'Number of Packages',
      deliveryFee: 'Delivery Fee',
      companyName: 'Company Name',
      shipperConsignorName: 'Shipper/Consignor',
      customerEstablishmentName: 'Customer/Establishment',
      originAddress: 'Origin Address',
      destinationAddress: 'Destination Address',
      vehicleType: 'Vehicle Type',
      areaLocationCode: 'Area Code',
      rateCost: 'Rate Cost',
      // Step 2 fields
      dateNeeded: 'Date Needed',
      timeNeeded: 'Time Needed'
    };

    // Check for empty required fields
    for (const [field, label] of Object.entries(requiredFields)) {
      if (!formData[field] || formData[field].toString().trim() === '') {
        alert(`Please fill in the ${label} field.`);
        return;
      }
    }

    // Validate that at least one employee is assigned
    const validEmployees = formData.employeeAssigned.filter(emp => emp && emp.trim() !== "");
    if (validEmployees.length === 0) {
      alert('Please assign at least one employee.');
      return;
    }

    // Validate that assigned employees have roles
    const validRoles = formData.roleOfEmployee.filter(role => role && role.trim() !== "");
    if (validRoles.length !== validEmployees.length) {
      alert('All assigned employees must have roles.');
      return;
    }

    // Validate numeric fields
    if (isNaN(formData.quantity) || parseInt(formData.quantity) <= 0) {
      alert('Please enter a valid quantity.');
      return;
    }
    if (isNaN(formData.grossWeight) || parseFloat(formData.grossWeight) <= 0) {
      alert('Please enter a valid gross weight.');
      return;
    }
    if (isNaN(formData.unitPerPackage) || parseInt(formData.unitPerPackage) <= 0) {
      alert('Please enter valid units per package.');
      return;
    }
    if (isNaN(formData.numberOfPackages) || parseInt(formData.numberOfPackages) <= 0) {
      alert('Please enter a valid number of packages.');
      return;
    }
    if (isNaN(formData.deliveryFee) || parseFloat(formData.deliveryFee) <= 0) {
      alert('Please enter a valid delivery fee.');
      return;
    }
    if (isNaN(formData.rateCost) || parseFloat(formData.rateCost) <= 0) {
      alert('Please enter a valid rate cost.');
      return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(formData.dateNeeded);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

    if (selectedDate < today) {
      alert('Please select a date that is today or in the future.');
      return;
    }

    try {
      const submitData = {
        ...formData,
        quantity: parseInt(formData.quantity) || 0,
        grossWeight: parseFloat(formData.grossWeight) || 0,
        unitPerPackage: parseInt(formData.unitPerPackage) || 0,
        numberOfPackages: parseInt(formData.numberOfPackages) || 0,
        deliveryFee: parseFloat(formData.deliveryFee) || 0,
        rateCost: parseFloat(formData.rateCost) || 0,
        employeeAssigned: Array.isArray(formData.employeeAssigned)
          ? formData.employeeAssigned.filter(emp => emp !== "")
          : [formData.employeeAssigned].filter(emp => emp !== ""),
        roleOfEmployee: Array.isArray(formData.roleOfEmployee)
          ? formData.roleOfEmployee.filter(role => role !== "")
          : [formData.roleOfEmployee].filter(role => role !== ""),
      };

      console.log("Submitting data:", submitData);
      console.log("employeeAssigned type:", typeof submitData.employeeAssigned, submitData.employeeAssigned);
      console.log("roleOfEmployee type:", typeof submitData.roleOfEmployee, submitData.roleOfEmployee);

      if (editBooking) {
        await axios.put(
          `http://localhost:5000/api/bookings/${editBooking._id}`,
          submitData
        );
        alert('Booking updated successfully!');
      } else {
        await axios.post("http://localhost:5000/api/bookings", submitData);
        alert('Booking created successfully!');
      }
      closeModal();
      fetchBookings();
    } catch (err) {
      console.error("Full error object:", err);
      console.error("Error response:", err.response?.data);

      // More detailed error handling
      if (err.response?.data?.message) {
        alert(`Error: ${err.response.data.message}`);
      } else if (err.response?.status === 400) {
        alert("Bad request. Please check your input data.");
      } else if (err.response?.status === 500) {
        alert("Server error. Please try again later.");
      } else {
        alert("Error adding/updating booking. Please try again.");
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this booking?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/bookings/${id}`);
      fetchBookings();
    } catch (err) {
      console.error(err);
    }
  };

  // Navigate to booking Info Page
  const viewBooking = (booking) => {
    navigate(`/dashboard/booking/${booking._id}`);
  };

  // Auto-fill defaults when origin or destination changes
  useEffect(() => {
    const key = `${formData.originAddress?.toLowerCase()} - ${formData.destinationAddress?.toLowerCase()}`;
    const defaultsArr = addressDefaults[key];
    if (Array.isArray(defaultsArr) && defaultsArr.length > 0) {
      // If vehicleType is already selected, use its defaults
      const selected = defaultsArr.find(def => def.vehicleType === formData.vehicleType);
      if (selected) {
        setFormData(prev => ({
          ...prev,
          areaLocationCode: selected.areaLocationCode,
          rateCost: selected.rateCost
        }));
      } else {
        // If not, use the first available
        setFormData(prev => ({
          ...prev,
          vehicleType: defaultsArr[0].vehicleType,
          areaLocationCode: defaultsArr[0].areaLocationCode,
          rateCost: defaultsArr[0].rateCost
        }));
      }
    }
  }, [formData.originAddress, formData.destinationAddress, formData.vehicleType]);

  return (
    <>
      {/* Page Content */}
      <div
        ref={containerRef}
        className={`transition duration-200 ${showModal ? "filter blur-sm" : ""}`}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Bookings</h1>
          <button
            onClick={() => openModal()}
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg hover:scale-105 inline-flex items-center gap-1 transform transition"
          >
            <Plus size={16} />Book a Trip
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <select
            value={searchReservationId}
            onChange={(e) => setSearchReservationId(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All Reservations</option>
            {uniqueReservationIds.map((id, i) => (
              <option key={i} value={id}>
                {id}
              </option>
            ))}
          </select>

          <select
            value={searchCompanyName}
            onChange={(e) => setSearchCompanyName(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All Companies</option>
            {uniqueCompanyNames.map((company, i) => (
              <option key={i} value={company}>
                {company}
              </option>
            ))}
          </select>

          <select
            value={searchProductName}
            onChange={(e) => setSearchProductName(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All Products</option>
            {uniqueProductNames.map((product, i) => (
              <option key={i} value={product}>
                {product}
              </option>
            ))}
          </select>

          <select
            value={searchVehicleType}
            onChange={(e) => setSearchVehicleType(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All Vehicle Types</option>
            {uniqueVehicleTypes.map((vehicle, i) => (
              <option key={i} value={vehicle}>
                {vehicle}
              </option>
            ))}
          </select>

          <select
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All Dates</option>
            {uniqueDates.map((date, i) => (
              <option key={i} value={date}>
                {date}
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

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="overflow-x-auto" style={{ zoom: 0.85 }}>
            <table className="min-w-[1200px] text-xs table-auto">
              <thead className="bg-gray-100 rounded-t-lg">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">
                    No
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">
                    Reservation ID
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">
                    Trip Number
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">
                    Company Name
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">
                    Vehicle Type
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">
                    Date Needed
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedBookings.map((booking, index) => (
                  <tr
                    key={booking._id}
                    className="border-b last:border-none hover:bg-gray-50 transition duration-150"
                  >
                    <td className="px-6 py-3">{startIndex + index + 1}</td>
                    <td className="px-6 py-3 font-mono text-blue-600">{booking.reservationId}</td>
                    <td className="px-6 py-3 font-mono text-green-600">{booking.tripNumber}</td>
                    <td className="px-6 py-3">{booking.companyName}</td>
                    <td className="px-6 py-3">{booking.productName}</td>
                    <td className="px-6 py-3">{getVehicleDisplayName(booking.vehicleType)}</td>
                    <td className="px-6 py-3">
                      {new Date(booking.dateNeeded).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${(booking.status || "Pending") === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : (booking.status || "Pending") === "In Transit"
                            ? "bg-blue-100 text-blue-800"
                            : (booking.status || "Pending") === "Delivered"
                              ? "bg-green-100 text-green-800"
                              : (booking.status || "Pending") === "Completed"
                                ? "bg-gray-200 text-gray-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {booking.status || "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {formatEmployeeNames(booking.employeeAssigned)}
                    </td>
                    <td className="px-6 py-3 text-center space-x-2">
                      <button
                        onClick={() => viewBooking(booking)}
                        className="px-3 py-1 bg-blue-500 text-white rounded shadow hover:bg-blue-600 inline-flex items-center gap-1 transition transform hover:scale-105"
                      >
                        <Eye size={16} /> View
                      </button>
                      <button
                        onClick={() => openModal(booking)}
                        className="px-3 py-1 bg-yellow-400 text-white rounded shadow hover:bg-yellow-500 inline-flex items-center gap-1 transition transform hover:scale-105"
                      >
                        <Pencil size={16} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(booking._id)}
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

      {/* Multi-step Modal with Option 2 Navigation */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-center">
          <div
            className="absolute inset-0 bg-black opacity-20"
            onClick={closeModal}
          ></div>

          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl ml-32 p-6 z-10 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {editBooking ? "Edit Booking" : "Book a Trip"}
              </h2>
              <div className="flex space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  1
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  2
                </div>
              </div>
            </div>

            {/* Form (Navigation buttons moved outside) */}
            <form>
              {/* Step 1: Booking Details */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  {/* Show Reservation ID and Trip Number only when editing */}
                  {editBooking && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reservation ID</label>
                        <input
                          type="text"
                          value={editBooking.reservationId}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 font-mono text-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Trip Number</label>
                        <input
                          type="text"
                          value={editBooking.tripNumber}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 font-mono text-green-600"
                        />
                      </div>
                    </div>
                  )}

                  {/* Type of Order */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Type of Order</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Enter Product Name</label>
                        <input
                          type="text"
                          name="productName"
                          value={formData.productName}
                          onChange={handleChange}
                          placeholder="Tasty Boy"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          name="quantity"
                          value={formData.quantity}
                          onChange={handleChange}
                          placeholder="2000pcs"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gross Weight</label>
                        <input
                          type="number"
                          name="grossWeight"
                          value={formData.grossWeight}
                          onChange={handleChange}
                          placeholder="5 tons"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Units per package</label>
                        <input
                          type="number"
                          name="unitPerPackage"
                          value={formData.unitPerPackage}
                          onChange={handleChange}
                          placeholder="200pcs/box"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Number of Packages</label>
                        <input
                          type="number"
                          name="numberOfPackages"
                          value={formData.numberOfPackages}
                          onChange={handleChange}
                          placeholder="10 box"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Fee Amount</label>
                        <input
                          type="number"
                          name="deliveryFee"
                          value={formData.deliveryFee}
                          onChange={handleChange}
                          placeholder="10000 PHP"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Customer Details & Shipment Route */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Customer Details & Shipment Route</h3>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select company
                      </label>
                      <select
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                      >
                        <option value="">Select from existing records</option>
                        {clients.map((client) => (
                          <option key={client._id} value={client.clientName}>
                            {client.clientName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Shipper/Consignor</label>
                        <input
                          type="text"
                          name="shipperConsignorName"
                          value={formData.shipperConsignorName}
                          onChange={handleChange}
                          placeholder="Ajinomoto Philippines Corp"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Customer/Establishment</label>
                        <input
                          type="text"
                          name="customerEstablishmentName"
                          value={formData.customerEstablishmentName}
                          onChange={handleChange}
                          placeholder="Enter customer name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Origin/From</label>
                        <select
                          name="originAddress"
                          value={formData.originAddress}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                        >
                          <option value="">Select Origin</option>
                          {(() => {
                            const allOrigins = Object.keys(addressDefaults)
                              .map(pair => pair.split(' - ')[0]);
                            const uniqueOrigins = [...new Set(allOrigins)];
                            return uniqueOrigins.map(origin => (
                              <option key={origin} value={origin}>{origin.charAt(0).toUpperCase() + origin.slice(1)}</option>
                            ));
                          })()}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Destination/To</label>
                        <select
                          name="destinationAddress"
                          value={formData.destinationAddress}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                        >
                          <option value="">Select Destination</option>
                          {(() => {
                            const possibleDestinations = Object.keys(addressDefaults)
                              .filter(pair => {
                                const [origin, destination] = pair.toLowerCase().split(' - ');
                                return !formData.originAddress || origin === formData.originAddress.toLowerCase();
                              })
                              .map(pair => pair.split(' - ')[1]);
                            const uniqueDestinations = [...new Set(possibleDestinations)];
                            return uniqueDestinations.map(destination => (
                              <option key={destination} value={destination}>{destination.charAt(0).toUpperCase() + destination.slice(1)}</option>
                            ));
                          })()}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Area Rate & Vehicle Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Area Rate & Vehicle Info</h3>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                      <select
                        name="vehicleType"
                        value={formData.vehicleType}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                      >
                        <option value="">Select Vehicle</option>
                        {(() => {
                          const key = `${formData.originAddress?.toLowerCase()} - ${formData.destinationAddress?.toLowerCase()}`;
                          const allowedVehiclesArr = addressDefaults[key];
                          const allowedVehicleTypes = Array.isArray(allowedVehiclesArr)
                            ? allowedVehiclesArr.map(def => def.vehicleType)
                            : [];
                          return getAvailableVehicles()
                            .filter(vehicle => allowedVehicleTypes.length === 0 || allowedVehicleTypes.includes(vehicle.vehicleType))
                            .map(vehicle => (
                              <option key={vehicle._id} value={vehicle.vehicleType}>
                                {`${vehicle.color || ''} ${vehicle.manufacturedBy || ''} ${vehicle.model || ''} (${vehicle.vehicleType === 'Car' ? '4-Wheels' : vehicle.vehicleType === 'Truck' ? '6-Wheels' : ''}) - ${vehicle.plateNumber}`.replace(/ +/g, ' ').trim()}
                              </option>
                            ));
                        })()}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Area Code</label>
                        <input
                          type="text"
                          name="areaLocationCode"
                          value={formData.areaLocationCode}
                          readOnly
                          placeholder="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rate</label>
                        <input
                          type="text"
                          name="rateCost"
                          value={formData.rateCost}
                          readOnly
                          placeholder="200 PHP"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Scheduling & Employee Assignment */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  {/* Scheduling */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Scheduling</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                          type="date"
                          name="dateNeeded"
                          value={formData.dateNeeded}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                        <input
                          type="time"
                          name="timeNeeded"
                          value={formData.timeNeeded}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Assign Employees & Roles */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Assign Employees & Roles</h3>

                    {formData.employeeAssigned.map((employeeId, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee</label>
                          <select
                            value={employeeId}
                            onChange={(e) => handleEmployeeChange(index, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                          >
                            <option value="">Employee</option>
                            {getAvailableEmployees(index).map((employee) => (
                              <option key={employee._id} value={employee.employeeId}>
                                {`${employee.employeeId} - ${employee.fullName || employee.name || ''}`.trim()}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Select Role</label>
                          <input
                            type="text"
                            value={formData.roleOfEmployee[index] || ""}
                            readOnly
                            placeholder="Role"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                          />
                        </div>

                        <div className="flex items-end">
                          {formData.employeeAssigned.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeEmployee(index)}
                              className="px-3 py-2 bg-red-100 text-red-600 rounded shadow hover:bg-red-200"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addEmployee}
                      className="px-4 py-2 bg-blue-100 text-blue-600 rounded shadow hover:bg-blue-200"
                    >
                      Add Employee
                    </button>
                  </div>
                </div>
              )}
            </form>
            {/* Navigation and Submit Buttons */}
            <div className="flex space-x-2 mt-8 justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg shadow hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              {currentStep < 2 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 inline-flex items-center gap-2 transition"
                >
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    // Move status update logic here for submit
                    await handleSubmit();
                    // After booking is created, update vehicle and employees status
                    try {
                      const submitData = {
                        ...formData,
                        employeeAssigned: Array.isArray(formData.employeeAssigned)
                          ? formData.employeeAssigned.filter(emp => emp !== "")
                          : [formData.employeeAssigned].filter(emp => emp !== ""),
                      };
                      // Update vehicle status
                      const selectedVehicle = vehicles.find(v => v.vehicleType === submitData.vehicleType);
                      if (selectedVehicle && selectedVehicle.status === "Available") {
                        await axios.put(`http://localhost:5000/api/vehicles/${selectedVehicle._id}`, { ...selectedVehicle, status: "On Trip" });
                      }
                      // Update employees status
                      for (const empId of submitData.employeeAssigned) {
                        const emp = employees.find(e => e.employeeId === empId);
                        if (emp && emp.status === "Available") {
                          await axios.put(`http://localhost:5000/api/employees/${emp._id}`, { ...emp, status: "On Trip" });
                        }
                      }
                    } catch (err) {
                      console.error("Error updating vehicle/employee status:", err);
                    }
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
                >
                  {editBooking ? "Update Booking" : "Create Booking"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Booking;