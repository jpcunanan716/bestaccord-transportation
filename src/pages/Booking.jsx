import { useState, useEffect, useRef } from "react";
import { Eye, Pencil, Trash2, Plus, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { axiosClient } from "../api/axiosClient";

import { motion, AnimatePresence } from "framer-motion";
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
    plateNumber: "",
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
      const res = await axiosClient.get("/api/bookings");
      const activeBookings = res.data.filter(booking => !booking.isArchived);
      setBookings(activeBookings);
      setFilteredBookings(activeBookings);

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
      const res = await axiosClient.get("/api/clients");
      const activeClients = res.data.filter(client => !client.isArchived);
      setClients(activeClients);
    } catch (err) {
      console.error("Error fetching clients:", err);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await axiosClient.get("/api/vehicles");
      setVehicles(res.data);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axiosClient.get("/api/employees");
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
    setCurrentPage(1);
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
        plateNumber: booking.plateNumber,
        areaLocationCode: booking.areaLocationCode,
        rateCost: booking.rateCost,
        dateNeeded: new Date(booking.dateNeeded).toISOString().split('T')[0],
        timeNeeded: booking.timeNeeded,
        employeeAssigned: Array.isArray(booking.employeeAssigned) ? booking.employeeAssigned : [booking.employeeAssigned],
        roleOfEmployee: Array.isArray(booking.roleOfEmployee) ? booking.roleOfEmployee : [booking.roleOfEmployee],
      });

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
        plateNumber: "",
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

    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [name]: value
      };

      if (name === 'numberOfPackages' || name === 'unitPerPackage') {
        const packages = name === 'numberOfPackages' ? parseInt(value) || 0 : parseInt(prev.numberOfPackages) || 0;
        const unitsPerPackage = name === 'unitPerPackage' ? parseInt(value) || 0 : parseInt(prev.unitPerPackage) || 0;
        newFormData.quantity = packages * unitsPerPackage;
      }

      return newFormData;
    });
    validateField(name, value);
  };

  const handleCompanyChange = (e) => {
    const selectedCompanyName = e.target.value;
    setFormData(prev => ({
      ...prev,
      companyName: selectedCompanyName,
      shipperConsignorName: "",
      originAddress: ""
    }));
    setSelectedClient(null);
  };

  const handleBranchChange = (e) => {
    const selectedBranch = e.target.value;
    const client = clients.find(c => c.clientBranch === selectedBranch && c.clientName === formData.companyName);

    if (client) {
      setSelectedClient(client);

      const fullAddress = [
        client.address?.houseNumber,
        client.address?.street,
        client.address?.barangay,
        client.address?.city,
        client.address?.province,
        client.address?.region
      ].filter(Boolean).join(', ');

      setFormData(prev => ({
        ...prev,
        customerEstablishmentName: selectedBranch,
        destinationAddress: fullAddress || cleanCityName(client.address?.city || "")
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

    if (currentIndex === 0) {
      return employees.filter(emp =>
        emp.status === "Available" &&
        emp.role === "Driver" &&
        !selectedEmployeeIds.includes(emp.employeeId)
      );
    } else {
      return employees.filter(emp =>
        emp.status === "Available" &&
        emp.role === "Helper" &&
        !selectedEmployeeIds.includes(emp.employeeId)
      );
    }
  };

  const getEmployeeDisplayName = (employeeId) => {
    const employee = employees.find(emp => emp.employeeId === employeeId);
    if (employee) {
      return `${employee.employeeId} - ${employee.fullName || employee.name || ''}`.trim();
    }
    return employeeId;
  };

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

  const handleVehicleChange = (e) => {
    const selectedVehicle = vehicles.find(v => v.vehicleId === e.target.value);
    if (selectedVehicle) {
      setFormData(prev => ({
        ...prev,
        vehicleId: selectedVehicle.vehicleId,
        vehicleType: selectedVehicle.vehicleType,
        plateNumber: selectedVehicle.plateNumber
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        vehicleId: "",
        vehicleType: "",
        plateNumber: ""
      }));
    }
  };

  const formatEmployeeNames = (employeeAssigned) => {
    if (Array.isArray(employeeAssigned)) {
      return employeeAssigned
        .map(empId => getEmployeeDisplayName(empId))
        .join(", ");
    }
    return getEmployeeDisplayName(employeeAssigned);
  };

  const nextStep = () => {
    if (currentStep === 1) {
      const form = document.querySelector('form');
      if (!form.checkValidity()) {
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

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (currentStep !== 2) {
      return;
    }

    if (!formData.vehicleId || formData.vehicleId.trim() === '') {
      alert('Please select a vehicle.');
      return;
    }

    // Extra check for plateNumber //
    if (!formData.plateNumber || formData.plateNumber.trim() === '') {
      alert('⚠️ Plate number is missing! Please go back to Step 1 and reselect the vehicle.');
      console.error("Missing plateNumber in formData:", formData);
      return;
    }

    if (!formData.plateNumber || formData.plateNumber.trim() === '') {
      alert('Plate number is missing. Please go back to Step 1 and reselect the vehicle.');
      return;
    }


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
      vehicleType: 'Vehicle Type',
      areaLocationCode: 'Area Code',
      rateCost: 'Rate Cost',
      dateNeeded: 'Date Needed',
      timeNeeded: 'Time Needed'
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!formData[field] || formData[field].toString().trim() === '') {
        alert(`Please fill in the ${label} field.`);
        return;
      }
    }

    const validEmployees = formData.employeeAssigned.filter(emp => emp && emp.trim() !== "");
    if (validEmployees.length === 0) {
      alert('Please assign at least one employee.');
      return;
    }

    const validRoles = formData.roleOfEmployee.filter(role => role && role.trim() !== "");
    if (validRoles.length !== validEmployees.length) {
      alert('All assigned employees must have roles.');
      return;
    }

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

    const selectedDate = new Date(formData.dateNeeded);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
        originAddressDetails: originAddressDetails,
      };

      if (editBooking) {
        await axiosClient.put(
          `/api/bookings/${editBooking._id}`,
          submitData
        );
        alert('Booking updated successfully!');
      } else {
        await axiosClient.post("/api/bookings", submitData);
        alert('Booking created successfully!');
      }
      closeModal();
      fetchBookings();
    } catch (err) {
      console.error("Full error object:", err);
      console.error("Error response:", err.response?.data);

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
    if (!window.confirm("Are you sure you want to archive this booking?")) return;

    try {
      await axiosClient.patch(`/api/bookings/${id}/archive`, {
        isArchived: true
      });
      alert('Booking archived successfully');
      fetchBookings();
    } catch (err) {
      console.error('Error archiving booking:', err);
      alert('Error archiving booking. Please try again.');
    }
  };

  const viewBooking = (booking) => {
    navigate(`/dashboard/booking/${booking._id}`);
  };

  useEffect(() => {
    const key = `${formData.originAddress?.toLowerCase()} - ${formData.destinationAddress?.toLowerCase()}`;
    const defaultsArr = addressDefaults[key];
    if (Array.isArray(defaultsArr) && defaultsArr.length > 0) {
      const selected = defaultsArr.find(def => def.vehicleType === formData.vehicleType);
      if (selected) {
        setFormData(prev => ({
          ...prev,
          areaLocationCode: selected.areaLocationCode,
          rateCost: selected.rateCost
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          vehicleType: defaultsArr[0].vehicleType,
          areaLocationCode: defaultsArr[0].areaLocationCode,
          rateCost: defaultsArr[0].rateCost
        }));
      }
    }
  }, [formData.originAddress, formData.destinationAddress, formData.vehicleType]);

  // Address Modal States
  const [showOriginAddressModal, setShowOriginAddressModal] = useState(false);
  const [originAddressDetails, setOriginAddressDetails] = useState({
    street: '',
    barangay: '',
    city: '',
    province: '',
    region: '',
    fullAddress: ''
  });

  const [addressFormData, setAddressFormData] = useState({
    street: '',
    region: '',
    province: '',
    city: '',
    barangay: ''
  });

  // Helper function to format address preview
  const formatAddressPreview = () => {
    const { street, barangay, city, province, region } = addressFormData;

    if (!street && !barangay && !city && !province && !region) {
      return "No address selected";
    }

    const barangayName = barangays.find(b => b.code === barangay)?.name || '';
    const cityName = cities.find(c => c.code === city)?.name || '';
    const provinceName = provinces.find(p => p.code === province)?.name || '';
    const regionName = regions.find(r => r.code === region)?.name || '';

    const parts = [
      street,
      barangayName,
      cityName,
      provinceName,
      regionName
    ].filter(Boolean);

    return parts.join(', ') || "Please complete all address fields";
  };

  // Check if address form is valid
  const isAddressFormValid = () => {
    const { street, region, province, city, barangay } = addressFormData;
    return street && region && province && city && barangay;
  };

  // Clear address form
  const clearAddressForm = () => {
    setAddressFormData({
      street: '',
      region: '',
      province: '',
      city: '',
      barangay: ''
    });
  };

  // Save origin address
  const saveOriginAddress = () => {
    if (!isAddressFormValid()) {
      alert('Please complete all address fields');
      return;
    }

    const barangayName = barangays.find(b => b.code === addressFormData.barangay)?.name || '';
    const cityName = cities.find(c => c.code === addressFormData.city)?.name || '';
    const provinceName = provinces.find(p => p.code === addressFormData.province)?.name || '';
    const regionName = regions.find(r => r.code === addressFormData.region)?.name || '';

    const fullAddress = [
      addressFormData.street,
      barangayName,
      cityName,
      provinceName,
      regionName
    ].filter(Boolean).join(', ');

    // Update the origin address details
    setOriginAddressDetails({
      street: addressFormData.street,
      barangay: barangayName,
      city: cityName,
      province: provinceName,
      region: regionName,
      fullAddress: fullAddress
    });

    // Update the main form data
    setFormData(prev => ({
      ...prev,
      originAddress: fullAddress
    }));

    // Close the modal
    setShowOriginAddressModal(false);
  };

  // Initialize address form when opening modal
  const openAddressModal = () => {
    // If we already have origin address details, pre-fill the form
    if (originAddressDetails.fullAddress) {
      // This is a simplified version - you might want to implement reverse geocoding
      // or store the codes along with the address details for better pre-filling
      setAddressFormData({
        street: originAddressDetails.street || '',
        region: '',
        province: '',
        city: '',
        barangay: ''
      });
    } else {
      clearAddressForm();
    }
    setShowOriginAddressModal(true);
  };

  useEffect(() => {
    if (formData.region === "130000000") {
      setFormData((prev) => ({ ...prev, province: "Metro Manila" }));
    }
  }, [formData.region]);

  // Address dropdown states
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  // Fetch regions on mount
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const res = await axios.get("https://psgc.gitlab.io/api/regions/");
        setRegions(res.data);
      } catch (err) {
        console.error("Failed to fetch regions", err);
      }
    };
    fetchRegions();
  }, []);

  // Fetch provinces when region changes
  useEffect(() => {
    if (!formData.region) {
      setProvinces([]);
      return;
    }
    const fetchProvinces = async () => {
      try {
        if (formData.region === "130000000") {
          const districtsRes = await axios.get("https://psgc.gitlab.io/api/regions/130000000/districts/");
          const districts = districtsRes.data;
          let allProvinces = [];
          for (const district of districts) {
            try {
              const provRes = await axios.get(`https://psgc.gitlab.io/api/districts/${district.code}/provinces/`);
              allProvinces = allProvinces.concat(provRes.data);
            } catch (err) {
              if (err.response && err.response.status === 404) {
                continue;
              } else {
                console.error(`Error fetching provinces for district ${district.code}`, err);
              }
            }
          }
          setProvinces(allProvinces);
        } else {
          const res = await axios.get(`https://psgc.gitlab.io/api/regions/${formData.region}/provinces/`);
          setProvinces(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch provinces", err);
      }
    };
    fetchProvinces();
  }, [formData.region]);

  // Fetch cities/municipalities when province changes
  useEffect(() => {
    if (formData.region === "130000000") {
      const fetchNcrCities = async () => {
        try {
          const districtsRes = await axios.get("https://psgc.gitlab.io/api/regions/130000000/districts/");
          const districts = districtsRes.data;
          let allCities = [];
          for (const district of districts) {
            let districtHasProvinces = true;
            let provinces = [];
            try {
              const provRes = await axios.get(`https://psgc.gitlab.io/api/districts/${district.code}/provinces/`);
              provinces = provRes.data;
            } catch (err) {
              if (err.response && err.response.status === 404) {
                districtHasProvinces = false;
              } else {
                console.error(`Error fetching provinces for district ${district.code}`, err);
              }
            }
            if (districtHasProvinces && provinces.length > 0) {
              for (const province of provinces) {
                try {
                  const cityRes = await axios.get(`https://psgc.gitlab.io/api/provinces/${province.code}/cities-municipalities/`);
                  allCities = allCities.concat(cityRes.data);
                } catch (err) {
                  if (err.response && err.response.status === 404) {
                    continue;
                  } else {
                    console.error(`Error fetching cities for province ${province.code}`, err);
                  }
                }
              }
            } else {
              try {
                const cityRes = await axios.get(`https://psgc.gitlab.io/api/districts/${district.code}/cities-municipalities/`);
                allCities = allCities.concat(cityRes.data);
              } catch (err) {
                if (err.response && err.response.status === 404) {
                  continue;
                } else {
                  console.error(`Error fetching cities for district ${district.code}`, err);
                }
              }
            }
          }
          setCities(allCities);
        } catch (err) {
          console.error("Failed to fetch NCR cities/municipalities", err);
        }
      };
      fetchNcrCities();
      return;
    }
    if (!formData.province) {
      setCities([]);
      return;
    }
    const fetchCities = async () => {
      try {
        const res = await axios.get(`https://psgc.gitlab.io/api/provinces/${formData.province}/cities-municipalities/`);
        setCities(res.data);
      } catch (err) {
        console.error("Failed to fetch cities/municipalities", err);
      }
    };
    fetchCities();
  }, [formData.province, formData.region]);

  // Fetch barangays when city/municipality changes
  useEffect(() => {
    if (!formData.city) {
      setBarangays([]);
      return;
    }
    const fetchBarangays = async () => {
      try {
        const res = await axios.get(`https://psgc.gitlab.io/api/cities-municipalities/${formData.city}/barangays/`);
        setBarangays(res.data);
      } catch (err) {
        console.error("Failed to fetch barangays", err);
      }
    };
    fetchBarangays();
  }, [formData.city]);


  return (
    <div className="space-y-8">
      {/* Header with Purple Theme */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-indigo-600/5 to-purple-600/5 rounded-2xl -z-10"></div>
        <div className="flex justify-between items-center py-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-900 via-indigo-800 to-purple-900 bg-clip-text text-transparent mb-2">
              Bookings
            </h1>
            <p className="text-sm text-gray-600">Manage and track all your bookings</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openModal()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl inline-flex items-center gap-2 transform transition-all duration-300 font-medium"
          >
            <Plus size={20} />
            Book a Trip
          </motion.button>
        </div>
      </motion.div>

      {/* Filters Section - Always Visible */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-purple-100 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <select
            value={searchReservationId}
            onChange={(e) => setSearchReservationId(e.target.value)}
            className="px-4 py-2.5 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white/50 text-sm"
          >
            <option value="">All Reservations</option>
            {uniqueReservationIds.map((id, i) => (
              <option key={i} value={id}>{id}</option>
            ))}
          </select>

          <select
            value={searchCompanyName}
            onChange={(e) => setSearchCompanyName(e.target.value)}
            className="px-4 py-2.5 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white/50 text-sm"
          >
            <option value="">All Companies</option>
            {uniqueCompanyNames.map((company, i) => (
              <option key={i} value={company}>{company}</option>
            ))}
          </select>

          <select
            value={searchProductName}
            onChange={(e) => setSearchProductName(e.target.value)}
            className="px-4 py-2.5 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white/50 text-sm"
          >
            <option value="">All Products</option>
            {uniqueProductNames.map((product, i) => (
              <option key={i} value={product}>{product}</option>
            ))}
          </select>

          <select
            value={searchVehicleType}
            onChange={(e) => setSearchVehicleType(e.target.value)}
            className="px-4 py-2.5 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white/50 text-sm"
          >
            <option value="">All Vehicle Types</option>
            {uniqueVehicleTypes.map((vehicle, i) => (
              <option key={i} value={vehicle}>{vehicle}</option>
            ))}
          </select>

          <select
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="px-4 py-2.5 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white/50 text-sm"
          >
            <option value="">All Dates</option>
            {uniqueDates.map((date, i) => (
              <option key={i} value={date}>{date}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Search anything..."
            value={generalSearch}
            onChange={(e) => setGeneralSearch(e.target.value)}
            className="px-4 py-2.5 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white/50 text-sm"
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-purple-100 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">No</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Reservation ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Trip Number</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Company</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Product</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Vehicle</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Employee</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50">
              {paginatedBookings.map((booking, index) => (
                <motion.tr
                  key={booking._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-purple-50/50 transition-colors duration-200"
                >
                  <td className="px-6 py-4 text-sm text-gray-900">{startIndex + index + 1}</td>
                  <td className="px-6 py-4 text-sm font-mono text-purple-700 font-semibold">{booking.reservationId}</td>
                  <td className="px-6 py-4 text-sm font-mono text-indigo-700 font-semibold">{booking.tripNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{booking.companyName}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{booking.productName}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{getVehicleDisplayName(booking.vehicleType)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(booking.dateNeeded).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${(booking.status || "Pending") === "Pending" ? "bg-yellow-100 text-yellow-800" :
                      (booking.status || "Pending") === "In Transit" ? "bg-blue-100 text-blue-800" :
                        (booking.status || "Pending") === "Delivered" ? "bg-green-100 text-green-800" :
                          (booking.status || "Pending") === "Completed" ? "bg-gray-200 text-gray-800" :
                            "bg-gray-100 text-gray-800"
                      }`}>
                      {booking.status || "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatEmployeeNames(booking.employeeAssigned)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => viewBooking(booking)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="View booking"
                      >
                        <Eye size={18} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
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
                        className={`p-2 rounded-lg transition-colors ${booking.status === "In Transit" || booking.status === "Delivered" || booking.status === "Completed"
                          ? "text-gray-400 cursor-not-allowed bg-gray-100"
                          : "text-indigo-600 hover:bg-indigo-50"
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
                        <Pencil size={18} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(booking._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Archive booking"
                      >
                        <Trash2 size={18} />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 border-t border-purple-100">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ${currentPage === 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg"
              }`}
          >
            Previous
          </motion.button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Page <span className="font-bold text-purple-700">{currentPage}</span> of <span className="font-bold text-purple-700">{totalPages}</span>
            </span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ${currentPage === totalPages
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg"
              }`}
          >
            Next
          </motion.button>
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-center items-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-purple-100"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6 rounded-t-3xl z-10">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {editBooking ? "Edit Booking" : "Create New Booking"}
                    </h2>
                    <p className="text-purple-100 text-sm mt-1">
                      {currentStep === 1 ? "Step 1: Booking Details" : "Step 2: Schedule & Assign"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${currentStep >= 1 ? 'bg-white text-purple-600 shadow-lg' : 'bg-purple-400/30 text-white'
                        }`}>
                        1
                      </div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${currentStep >= 2 ? 'bg-white text-purple-600 shadow-lg' : 'bg-purple-400/30 text-white'
                        }`}>
                        2
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={closeModal}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                      <X size={24} className="text-white" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <form onSubmit={(e) => {
                e.preventDefault();
                if (currentStep === 2) {
                  handleSubmit();
                }
              }} className="p-8 space-y-6">
                {currentStep === 1 && (
                  <div className="space-y-6">
                    {/* Show Reservation ID and Trip Number only when editing */}
                    {editBooking && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Reservation ID</label>
                          <input
                            type="text"
                            value={editBooking.reservationId}
                            disabled
                            className="w-full px-4 py-2.5 border border-purple-200 rounded-xl bg-purple-50 font-mono text-purple-600 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Trip Number</label>
                          <input
                            type="text"
                            value={editBooking.tripNumber}
                            disabled
                            className="w-full px-4 py-2.5 border border-indigo-200 rounded-xl bg-indigo-50 font-mono text-indigo-600 font-semibold"
                          />
                        </div>
                      </div>
                    )}

                    {/* Customer Details & Shipment Route */}
                    <div className="bg-gradient-to-r from-indigo-50 to-violet-50 p-6 rounded-2xl border border-indigo-100">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Details & Shipment Route</h3>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Company *</label>
                        <select
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleCompanyChange}
                          required
                          className="w-full px-4 py-2.5 border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
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
                          <label className="block text-sm font-medium text-gray-700 mb-2">Shipper/Consignor *</label>
                          <input
                            type="text"
                            name="shipperConsignorName"
                            value={formData.shipperConsignorName}
                            onChange={handleChange}
                            required
                            placeholder="Enter customer name"
                            className="w-full px-4 py-2.5 border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Origin/From *</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              name="originAddress"
                              value={formData.originAddress}
                              readOnly
                              required
                              placeholder="Select origin address"
                              className="w-full px-4 py-2.5 border border-indigo-200 rounded-xl bg-indigo-50/50"
                            />
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={openAddressModal}
                              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium whitespace-nowrap"
                            >
                              Select Address
                            </motion.button>
                          </div>
                          {formData.originAddress && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ Address selected: {formData.originAddress}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Customer/Establishment (Auto-populated) *</label>
                          <select
                            name="customerEstablishmentName"
                            value={formData.customerEstablishmentName}
                            onChange={handleBranchChange}
                            required
                            disabled={!formData.companyName}
                            className="w-full px-4 py-2.5 border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent disabled:bg-gray-100"
                          >
                            <option value="">Select branch</option>
                            {formData.companyName && getClientBranches(formData.companyName).map((client, index) => (
                              <option key={index} value={client.clientBranch}>
                                {client.clientBranch}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Destination/To *</label>
                          <input
                            type="text"
                            name="destinationAddress"
                            value={formData.destinationAddress}
                            readOnly
                            placeholder="Select branch first"
                            className="w-full px-4 py-2.5 border border-indigo-200 rounded-xl bg-indigo-50/50"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Type of Order */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-2xl border border-purple-100">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Type of Order</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                          <input
                            type="text"
                            name="productName"
                            value={formData.productName}
                            onChange={handleChange}
                            placeholder="Tasty Boy"
                            required
                            className="w-full px-4 py-2.5 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Number of Packages *</label>
                          <input
                            type="number"
                            name="numberOfPackages"
                            value={formData.numberOfPackages}
                            onChange={handleChange}
                            required
                            min="1"
                            placeholder="10 box"
                            className="w-full px-4 py-2.5 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Units per Package *</label>
                          <input
                            type="number"
                            name="unitPerPackage"
                            value={formData.unitPerPackage}
                            onChange={handleChange}
                            required
                            min="1"
                            placeholder="200pcs/box"
                            className="w-full px-4 py-2.5 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Quantity (Auto-calculated) *</label>
                          <input
                            type="number"
                            name="quantity"
                            value={formData.quantity}
                            readOnly
                            placeholder="2000pcs"
                            className="w-full px-4 py-2.5 border border-purple-200 rounded-xl bg-purple-50/50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Gross Weight *</label>
                          <input
                            type="number"
                            name="grossWeight"
                            value={formData.grossWeight}
                            onChange={handleChange}
                            placeholder="5 tons"
                            required
                            min="0.1"
                            step="0.1"
                            className="w-full px-4 py-2.5 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Fee *</label>
                          <input
                            type="number"
                            name="deliveryFee"
                            value={formData.deliveryFee}
                            onChange={handleChange}
                            required
                            placeholder="10000 PHP"
                            className="w-full px-4 py-2.5 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>


                    {/* Area Rate & Vehicle Info */}
                    <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 p-6 rounded-2xl border border-violet-100">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Area Rate & Vehicle Info</h3>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Vehicle *</label>
                        <select
                          name="vehicleId"
                          value={formData.vehicleId}
                          onChange={handleVehicleChange}
                          required
                          className="w-full px-4 py-2.5 border border-violet-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
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
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Area Code</label>
                          <input
                            type="text"
                            name="areaLocationCode"
                            value={formData.areaLocationCode}
                            readOnly
                            placeholder="1"
                            className="w-full px-4 py-2.5 border border-violet-200 rounded-xl bg-violet-50/50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Rate</label>
                          <input
                            type="text"
                            name="rateCost"
                            value={formData.rateCost}
                            readOnly
                            placeholder="200 PHP"
                            className="w-full px-4 py-2.5 border border-violet-200 rounded-xl bg-violet-50/50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    {/* Scheduling */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-2xl border border-purple-100">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduling</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                          <input
                            type="date"
                            name="dateNeeded"
                            value={formData.dateNeeded}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                          <input
                            type="time"
                            name="timeNeeded"
                            value={formData.timeNeeded}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Assign Employees & Roles */}
                    <div className="bg-gradient-to-r from-indigo-50 to-violet-50 p-6 rounded-2xl border border-indigo-100">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Employees & Roles</h3>

                      {formData.employeeAssigned.map((employeeId, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 border border-indigo-200 rounded-xl bg-white/50">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {index === 0 ? "Select Driver *" : "Select Helper"}
                            </label>
                            <select
                              value={employeeId}
                              onChange={(e) => handleEmployeeChange(index, e.target.value)}
                              required
                              className="w-full px-4 py-2.5 border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                            <input
                              type="text"
                              value={formData.roleOfEmployee[index] || ""}
                              readOnly
                              placeholder="Role"
                              className="w-full px-4 py-2.5 border border-indigo-200 rounded-xl bg-indigo-50/50"
                            />
                          </div>

                          <div className="flex items-end">
                            {formData.employeeAssigned.length > 1 && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                type="button"
                                onClick={() => removeEmployee(index)}
                                className="px-4 py-2.5 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors font-medium"
                              >
                                Remove
                              </motion.button>
                            )}
                          </div>
                        </div>
                      ))}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={addEmployee}
                        className="w-full px-4 py-3 bg-gradient-to-r from-indigo-100 to-violet-100 text-indigo-700 rounded-xl hover:from-indigo-200 hover:to-violet-200 transition-all duration-300 font-medium"
                      >
                        + Add Helper
                      </motion.button>
                    </div>
                  </div>
                )}
              </form>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 rounded-b-3xl border-t border-gray-200">
                <div className="flex justify-between items-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-300 shadow-sm"
                  >
                    Cancel
                  </motion.button>

                  <div className="flex gap-3">
                    {currentStep === 2 && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={prevStep}
                        className="px-6 py-3 bg-gray-500 text-white rounded-xl font-medium hover:bg-gray-600 transition-all duration-300 shadow-md inline-flex items-center gap-2"
                      >
                        <ChevronLeft size={18} />
                        Back
                      </motion.button>
                    )}

                    {currentStep < 2 ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={nextStep}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 inline-flex items-center gap-2"
                      >
                        Next
                        <ChevronRight size={18} />
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={handleSubmit}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300"
                      >
                        {editBooking ? "Update Booking" : "Create Booking"}
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Origin Address Selection Modal */}
      <AnimatePresence>
        {showOriginAddressModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 flex justify-center items-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowOriginAddressModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-indigo-100"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 rounded-t-3xl z-10">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Select Origin Address
                    </h2>
                    <p className="text-indigo-100 text-sm mt-1">
                      Fill in the complete address details
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowOriginAddressModal(false)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X size={24} className="text-white" />
                  </motion.button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-8 space-y-6">
                {/* Street Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={addressFormData.street}
                    onChange={(e) => setAddressFormData(prev => ({
                      ...prev,
                      street: e.target.value
                    }))}
                    placeholder="House number, street name, building"
                    required
                    className="w-full px-4 py-2.5 border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  />
                </div>

                {/* Region */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region *
                  </label>
                  <select
                    value={addressFormData.region}
                    onChange={(e) => {
                      const newRegion = e.target.value;
                      setAddressFormData(prev => ({
                        ...prev,
                        region: newRegion,
                        province: '',
                        city: '',
                        barangay: ''
                      }));
                    }}
                    required
                    className="w-full px-4 py-2.5 border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  >
                    <option value="">Select Region</option>
                    {regions.map((region) => (
                      <option key={region.code} value={region.code}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Province */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Province *
                  </label>
                  <select
                    value={addressFormData.province}
                    onChange={(e) => {
                      const newProvince = e.target.value;
                      setAddressFormData(prev => ({
                        ...prev,
                        province: newProvince,
                        city: '',
                        barangay: ''
                      }));
                    }}
                    required
                    disabled={!addressFormData.region}
                    className="w-full px-4 py-2.5 border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Select Province</option>
                    {provinces.map((province) => (
                      <option key={province.code} value={province.code}>
                        {province.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City/Municipality */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City/Municipality *
                  </label>
                  <select
                    value={addressFormData.city}
                    onChange={(e) => {
                      const newCity = e.target.value;
                      setAddressFormData(prev => ({
                        ...prev,
                        city: newCity,
                        barangay: ''
                      }));
                    }}
                    required
                    disabled={!addressFormData.province}
                    className="w-full px-4 py-2.5 border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Select City/Municipality</option>
                    {cities.map((city) => (
                      <option key={city.code} value={city.code}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Barangay */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barangay *
                  </label>
                  <select
                    value={addressFormData.barangay}
                    onChange={(e) => setAddressFormData(prev => ({
                      ...prev,
                      barangay: e.target.value
                    }))}
                    required
                    disabled={!addressFormData.city}
                    className="w-full px-4 py-2.5 border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Select Barangay</option>
                    {barangays.map((barangay) => (
                      <option key={barangay.code} value={barangay.code}>
                        {barangay.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Address Preview */}
                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                  <h3 className="text-sm font-semibold text-indigo-800 mb-2">Address Preview:</h3>
                  <p className="text-sm text-indigo-600">
                    {formatAddressPreview()}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 rounded-b-3xl border-t border-gray-200">
                <div className="flex justify-between items-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setShowOriginAddressModal(false)}
                    className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-300 shadow-sm"
                  >
                    Cancel
                  </motion.button>

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={clearAddressForm}
                      className="px-6 py-3 bg-gray-500 text-white rounded-xl font-medium hover:bg-gray-600 transition-all duration-300"
                    >
                      Clear
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={saveOriginAddress}
                      disabled={!isAddressFormValid()}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Use This Address
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Booking;