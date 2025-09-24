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
  const [selectedClient, setSelectedClient] = useState(null);

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
    vehicleId: "",
    vehicleType: "",
    areaLocationCode: "",
    rateCost: "",
    dateNeeded: "",
    timeNeeded: "",
    employeeAssigned: [],
    roleOfEmployee: [],
  });

  const [errors, setErrors] = useState({});

  const containerRef = useRef(null);

  // Helper function to clean city names
  const cleanCityName = (cityName) => {
    if (!cityName) return "";
    // Remove "City of " prefix and convert to lowercase for consistent handling
    return cityName.replace(/^City of /i, "").toLowerCase();
  };

  // Get unique client names (no duplicates)
  const getUniqueClientNames = () => {
    const uniqueNames = [...new Set(clients.map(client => client.clientName))];
    return uniqueNames;
  };

  // Get branches for selected client
  const getClientBranches = (clientName) => {
    return clients.filter(client => client.clientName === clientName);
  };

  // Fetch all required data
  const fetchBookings = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/bookings");
      // Filter out archived bookings
      const activeBookings = res.data.filter(booking => !booking.isArchived);
      setBookings(activeBookings);
      setFilteredBookings(activeBookings);

      // Extract unique values from active bookings only
      setUniqueReservationIds([...new Set(activeBookings.map((b) => b.reservationId))]);
      setUniqueCompanyNames([...new Set(activeBookings.map((b) => b.companyName))]);
      setUniqueProductNames([...new Set(activeBookings.map((b) => b.productName))]);
      setUniqueVehicleTypes([...new Set(activeBookings.map((b) => b.vehicleType))]);
      setUniqueDates([
        ...new Set(
          activeBookings.map((b) =>
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
      const res = await axios.get("http://localhost:5000/api/clients");
      // Filter out archived clients
      const activeClients = res.data.filter(client => !client.isArchived);
      setClients(activeClients);
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
        vehicleId: booking.vehicleId || "",
        vehicleType: booking.vehicleType,
        areaLocationCode: booking.areaLocationCode,
        rateCost: booking.rateCost,
        dateNeeded: new Date(booking.dateNeeded).toISOString().split('T')[0],
        timeNeeded: booking.timeNeeded,
        employeeAssigned: Array.isArray(booking.employeeAssigned) ? booking.employeeAssigned : [booking.employeeAssigned],
        roleOfEmployee: Array.isArray(booking.roleOfEmployee) ? booking.roleOfEmployee : [booking.roleOfEmployee],
      });
      
      // Find the selected client for editing
      const client = clients.find(c => c.clientName === booking.companyName);
      if (client) {
        setSelectedClient(client);
      }
    } else {
      setEditBooking(null);
      setSelectedClient(null);
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
        vehicleId: "",
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
    setSelectedClient(null);
  };

  const validateField = (name, value) => {
    if (!value || value.toString().trim() === '') {
      setErrors(prev => ({
        ...prev,
        [name]: 'This field is required'
      }));
      return false;
    }

    // Clear error if field is valid
    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));
    return true;
  };

  // Update handleChange to include validation and auto-calculation
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [name]: value
      };

      // Auto-calculate quantity when numberOfPackages or unitPerPackage changes
      if (name === 'numberOfPackages' || name === 'unitPerPackage') {
        const packages = name === 'numberOfPackages' ? parseInt(value) || 0 : parseInt(prev.numberOfPackages) || 0;
        const unitsPerPackage = name === 'unitPerPackage' ? parseInt(value) || 0 : parseInt(prev.unitPerPackage) || 0;
        newFormData.quantity = packages * unitsPerPackage;
      }

      return newFormData;
    });
    validateField(name, value);
  };

  // Handle company selection
  const handleCompanyChange = (e) => {
    const selectedCompanyName = e.target.value;
    setFormData(prev => ({
      ...prev,
      companyName: selectedCompanyName,
      shipperConsignorName: "", // Reset branch selection
      originAddress: "" // Reset origin address
    }));
    setSelectedClient(null); // Reset selected client until branch is chosen
  };

  // Handle branch (shipper/consignor) selection
  const handleBranchChange = (e) => {
    const selectedBranch = e.target.value;
    const client = clients.find(c => c.clientBranch === selectedBranch && c.clientName === formData.companyName);
    
    if (client) {
      setSelectedClient(client);
      setFormData(prev => ({
        ...prev,
        shipperConsignorName: selectedBranch,
        originAddress: cleanCityName(client.address?.city || "")
      }));
    }
  };

  const handleEmployeeChange = (index, employeeId) => {
    const newEmployeeAssigned = [...formData.employeeAssigned];
    const newRoleOfEmployee = [...formData.roleOfEmployee];

    newEmployeeAssigned[index] = employeeId;
    const selectedEmployee = employees.find(emp => emp.employeeId === employeeId);
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
    
    // First employee (index 0) should only show drivers
    if (currentIndex === 0) {
      return employees.filter(emp => 
        emp.status === "Available" && 
        emp.role === "Driver" && 
        !selectedEmployeeIds.includes(emp.employeeId)
      );
    } else {
      // Subsequent employees should only show helpers
      return employees.filter(emp => 
        emp.status === "Available" && 
        emp.role === "Helper" && 
        !selectedEmployeeIds.includes(emp.employeeId)
      );
    }
  };

  // Helper function to get employee display name
  const getEmployeeDisplayName = (employeeId) => {
    const employee = employees.find(emp => emp.employeeId === employeeId);
    if (employee) {
      return `${employee.employeeId} - ${employee.fullName || employee.name || ''}`.trim();
    }
    return employeeId;
  };

  // Helper function to get vehicle display name
  const getVehicleDisplayName = (vehicleType) => {
    const vehicle = vehicles.find(v => v.vehicleType === vehicleType);
    if (vehicle) {
      return `${vehicle.color || ''} ${vehicle.manufacturedBy || ''} ${vehicle.model || ''} - ${vehicle.vehicleType}`.replace(/ +/g, ' ').trim();
    }
    return vehicleType;
  };

  const getAvailableVehicles = () => {
    return vehicles.filter(vehicle => vehicle.status === "Available");
  };

  // Updated vehicle change handler to auto-fill vehicleType
  const handleVehicleChange = (e) => {
  const selectedVehicle = vehicles.find(v => v.vehicleId === e.target.value); // Changed from v._id to v.vehicleId
  if (selectedVehicle) {
    setFormData(prev => ({
      ...prev,
      vehicleId: selectedVehicle.vehicleId,
      vehicleType: selectedVehicle.vehicleType
    }));
  } else {
    setFormData(prev => ({
      ...prev,
      vehicleId: "",
      vehicleType: ""
    }));
  }
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

  // Add this validation function after your existing state declarations
  const validateStep1 = () => {
    const requiredFields = {
      productName: 'Product Name',
      numberOfPackages: 'Number of Packages',
      unitPerPackage: 'Units per Package',
      grossWeight: 'Gross Weight',
      deliveryFee: 'Delivery Fee',
      companyName: 'Company Name',
      shipperConsignorName: 'Shipper/Consignor',
      customerEstablishmentName: 'Customer/Establishment',
      originAddress: 'Origin Address',
      destinationAddress: 'Destination Address',
      vehicleId: 'Vehicle',
      areaLocationCode: 'Area Code',
      rateCost: 'Rate Cost'
    };

    // Check for empty required fields
    for (const [field, label] of Object.entries(requiredFields)) {
      if (!formData[field] || formData[field].toString().trim() === '') {
        alert(`Please fill in the ${label} field.`);
        return false;
      }
    }

    // Validate numeric fields
    if (isNaN(formData.numberOfPackages) || parseInt(formData.numberOfPackages) <= 0) {
      alert('Please enter a valid number of packages.');
      return false;
    }
    if (isNaN(formData.unitPerPackage) || parseInt(formData.unitPerPackage) <= 0) {
      alert('Please enter valid units per package.');
      return false;
    }
    if (isNaN(formData.grossWeight) || parseFloat(formData.grossWeight) <= 0) {
      alert('Please enter a valid gross weight.');
      return false;
    }
    if (isNaN(formData.deliveryFee) || parseFloat(formData.deliveryFee) <= 0) {
      alert('Please enter a valid delivery fee.');
      return false;
    }
    if (isNaN(formData.rateCost) || parseFloat(formData.rateCost) <= 0) {
      alert('Please enter a valid rate cost.');
      return false;
    }

    return true;
  };

  // Update the nextStep function to include validation
  const nextStep = () => {
    if (currentStep === 1) {
      // Get the form element
      const form = document.querySelector('form');
      if (!form.checkValidity()) {
        // Trigger the browser's default validation UI
        form.reportValidity();
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Form submission handler with validation
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (currentStep !== 2) {
      return;
    }

    if (!formData.vehicleId || formData.vehicleId.trim() === '') {
      alert('Please select a vehicle.');
      return;
    }

    // Form validation - check required fields
    const requiredFields = {
      // Step 1 fields
      productName: 'Product Name',
      numberOfPackages: 'Number of Packages',
      unitPerPackage: 'Units per Package',
      grossWeight: 'Gross Weight',
      deliveryFee: 'Delivery Fee',
      companyName: 'Company Name',
      shipperConsignorName: 'Shipper/Consignor',
      customerEstablishmentName: 'Customer/Establishment',
      originAddress: 'Origin Address',
      destinationAddress: 'Destination Address',
      vehicleId: 'Vehicle',
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
    if (isNaN(formData.numberOfPackages) || parseInt(formData.numberOfPackages) <= 0) {
      alert('Please enter a valid number of packages.');
      return;
    }
    if (isNaN(formData.unitPerPackage) || parseInt(formData.unitPerPackage) <= 0) {
      alert('Please enter valid units per package.');
      return;
    }
    if (isNaN(formData.grossWeight) || parseFloat(formData.grossWeight) <= 0) {
      alert('Please enter a valid gross weight.');
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

      //Error handling
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

  //Archive handler
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to archive this booking?")) return;

    try {
      await axios.patch(`http://localhost:5000/api/bookings/${id}/archive`, {
        isArchived: true
      });
      alert('Booking archived successfully');
      fetchBookings();
    } catch (err) {
      console.error('Error archiving booking:', err);
      alert('Error archiving booking. Please try again.');
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
                    <td className="px-6 py-3 text-right space-x-2 inline-flex">
                      <button
                        onClick={() => viewBooking(booking)}
                        className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50 inline-flex items-center gap-1 transition transform hover:scale-105"
                      >
                        <Eye />
                      </button>
                      
                      {/* Conditional Edit Button - Disabled when "In Transit", "Delivered", or "Completed" */}
                      <button
                        onClick={() => {
                          if (booking.status === "In Transit") {
                            alert("Cannot edit booking while in transit");
                            return;
                          }
                          if (booking.status === "Delivered") {
                            alert("Cannot edit delivered booking");
                            return;
                          }
                          if (booking.status === "Completed") {
                            alert("Cannot edit completed booking");
                            return;
                          }
                          openModal(booking);
                        }}
                        disabled={booking.status === "In Transit" || booking.status === "Delivered" || booking.status === "Completed"}
                        className={`px-3 py-1 rounded inline-flex items-center gap-1 transition ${
                          booking.status === "In Transit" || booking.status === "Delivered" || booking.status === "Completed"
                            ? "text-gray-400 cursor-not-allowed bg-gray-100"
                            : "text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 transform hover:scale-105"
                        }`}
                        title={
                          booking.status === "In Transit" 
                            ? "Cannot edit booking while in transit" 
                            : booking.status === "Delivered"
                            ? "Cannot edit delivered booking"
                            : booking.status === "Completed"
                            ? "Cannot edit completed booking"
                            : "Edit booking"
                        }
                      >
                        <Pencil />
                      </button>
                      
                      {/* Archive Button - Always Enabled */}
                      <button
                        onClick={() => handleDelete(booking._id)}
                        className="text-red-600 hover:text-red-800 px-3 py-1 rounded hover:bg-red-50 inline-flex items-center gap-1 transition transform hover:scale-105"
                        title="Archive booking"
                      >
                        <Trash2 />
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
            <form onSubmit={(e) => {
              e.preventDefault();
              if (currentStep === 2) {
                handleSubmit();
              }
            }}>
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

                  {/* Type of Order - Updated field order and auto-calculation */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Type of Order</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Enter Product Name *
                        </label>
                        <input
                          type="text"
                          name="productName"
                          value={formData.productName}
                          onChange={handleChange}
                          placeholder="Tasty Boy"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                        />
                        {errors.productName && <p className="text-red-500 text-xs mt-1">{errors.productName}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Number of Packages *
                        </label>
                        <input
                          type="number"
                          name="numberOfPackages"
                          value={formData.numberOfPackages}
                          onChange={handleChange}
                          required
                          min="1"
                          placeholder="10 box"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                        />
                        {errors.numberOfPackages && <p className="text-red-500 text-xs mt-1">{errors.numberOfPackages}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Units per package *
                        </label>
                        <input
                          type="number"
                          name="unitPerPackage"
                          value={formData.unitPerPackage}
                          onChange={handleChange}
                          required
                          min="1"
                          placeholder="200pcs/box"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                        />
                        {errors.unitPerPackage && <p className="text-red-500 text-xs mt-1">{errors.unitPerPackage}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity (Auto-calculated) *
                        </label>
                        <input
                          type="number"
                          name="quantity"
                          value={formData.quantity}
                          readOnly
                          placeholder="2000pcs"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 focus:ring-2 focus:ring-blue-400"
                        />
                        {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Gross Weight *
                        </label>
                        <input
                          type="number"
                          name="grossWeight"
                          value={formData.grossWeight}
                          onChange={handleChange}
                          placeholder="5 tons"
                          required
                          min="0.1"
                          step="0.1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                        />
                        {errors.grossWeight && <p className="text-red-500 text-xs mt-1">{errors.grossWeight}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Fee Amount *</label>
                        <input
                          type="number"
                          name="deliveryFee"
                          value={formData.deliveryFee}
                          onChange={handleChange}
                          required
                          placeholder="10000 PHP"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                        />
                        {errors.deliveryFee && <p className="text-red-500 text-xs mt-1">{errors.deliveryFee}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Customer Details & Shipment Route - Updated with client integration */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">
                      Customer Details & Shipment Route
                    </h3>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select company *
                      </label>
                      <select
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleCompanyChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                      >
                        <option value="">Select from existing records</option>
                        {getUniqueClientNames().map((clientName, index) => (
                          <option key={index} value={clientName}>
                            {clientName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Shipper/Consignor (Branch) *</label>
                        <select
                          name="shipperConsignorName"
                          value={formData.shipperConsignorName}
                          onChange={handleBranchChange}
                          required
                          disabled={!formData.companyName}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
                        >
                          <option value="">Select branch</option>
                          {formData.companyName && getClientBranches(formData.companyName).map((client, index) => (
                            <option key={index} value={client.clientBranch}>
                              {client.clientBranch}
                            </option>
                          ))}
                        </select>
                        {errors.shipperConsignorName && <p className="text-red-500 text-xs mt-1">{errors.shipperConsignorName}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Customer/Establishment *</label>
                        <input
                          type="text"
                          name="customerEstablishmentName"
                          value={formData.customerEstablishmentName}
                          onChange={handleChange}
                          required
                          placeholder="Enter customer name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                        />
                        {errors.customerEstablishmentName && <p className="text-red-500 text-xs mt-1">{errors.customerEstablishmentName}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Origin/From (Auto-populated) *</label>
                        <input
                          type="text"
                          name="originAddress"
                          value={formData.originAddress}
                          readOnly
                          placeholder="Select branch first to auto-populate"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Destination/To *</label>
                        <select
                          name="destinationAddress"
                          value={formData.destinationAddress}
                          onChange={handleChange}
                          required
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
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">
                      Area Rate & Vehicle Info
                    </h3>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Vehicle *
                      </label>
                      <select
                        name="vehicleId"
                        value={formData.vehicleId}
                        onChange={handleVehicleChange}
                        required
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
                              <option key={vehicle._id} value={vehicle.vehicleId}>
                                {`${vehicle.vehicleId} - ${vehicle.manufacturedBy} ${vehicle.model} (${vehicle.vehicleType}) - ${vehicle.plateNumber}`}
                              </option>
                            ));
                        })()}
                      </select>
                      {errors.vehicleId && <p className="text-red-500 text-xs mt-1">{errors.vehicleId}</p>}
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
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                        />
                        {errors.dateNeeded && <p className="text-red-500 text-xs mt-1">{errors.dateNeeded}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                        <input
                          type="time"
                          name="timeNeeded"
                          value={formData.timeNeeded}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                        />
                        {errors.timeNeeded && <p className="text-red-500 text-xs mt-1">{errors.timeNeeded}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Assign Employees & Roles */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Assign Employees & Roles</h3>

                    {formData.employeeAssigned.map((employeeId, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {index === 0 ? "Select Driver" : "Select Helper"}
                          </label>
                          <select
                            value={employeeId}
                            onChange={(e) => handleEmployeeChange(index, e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                          >
                            <option value="">{index === 0 ? "Select Driver" : "Select Helper"}</option>
                            {getAvailableEmployees(index).map((employee) => (
                              <option key={employee._id} value={employee.employeeId}>
                                {`${employee.employeeId} - ${employee.fullName || employee.name || ''}`.trim()}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
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
                      Add Helper
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
              {currentStep === 2 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg shadow hover:bg-gray-600 inline-flex items-center gap-2 transition"
                >
                  <ChevronLeft size={16} /> Back
                </button>
              )}
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
                  onClick={handleSubmit}
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