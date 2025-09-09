import { useState, useEffect, useRef } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Employee() {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  //form states
  const [formData, setFormData] = useState({
    fullName: "",
    role: "Driver",
    employmentType: "Full-time",
    mobileNumber: "",
    currentAddress: "",
    permanentAddress: "",
    sameAsCurrent: false,
    emergencyContactName: "",
    emergencyContactNumber: "",
    dateHired: "",
    shift: "Morning",
    email: "",
    password: "",
  });

  //search states
  const [searchId, setSearchId] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchRole, setSearchRole] = useState("");
  const [searchMobile, setSearchMobile] = useState("");
  const [generalSearch, setGeneralSearch] = useState("");
  const containerRef = useRef(null);

  const roles = ["Driver", "Helper"];
  const employmentTypes = ["Full-time", "Part-time", "Contractual"];
  const shifts = ["Morning", "Afternoon", "Night"];

  const fetchEmployees = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/employees");
      setEmployees(res.data);
      setFilteredEmployees(res.data);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  //Filter function
  useEffect(() => {
    let results = employees;

    if (searchId) {
      results = results.filter((emp) =>
        emp.employeeId?.toLowerCase().includes(searchId.toLowerCase())
      );
    }
    if (searchName) {
      results = results.filter((emp) =>
        emp.fullName?.toLowerCase().includes(searchName.toLowerCase())
      );
    }
    if (searchRole) {
      results = results.filter((emp) => emp.role === searchRole);
    }
    if (searchMobile) {
      results = results.filter((emp) =>
        emp.mobileNumber?.includes(searchMobile)
      );
    }
    if (generalSearch) {
      results = results.filter(
        (emp) =>
          emp.employeeId?.toLowerCase().includes(generalSearch.toLowerCase()) ||
          emp.fullName?.toLowerCase().includes(generalSearch.toLowerCase()) ||
          emp.role?.toLowerCase().includes(generalSearch.toLowerCase()) ||
          emp.mobileNumber?.includes(generalSearch) ||
          emp.email?.toLowerCase().includes(generalSearch.toLowerCase())
      );
    }

    setFilteredEmployees(results);
  }, [searchId, searchName, searchRole, searchMobile, generalSearch, employees]);

  const openModal = (employee = null) => {
    if (employee) {
      setEditEmployee(employee);
      const { employeeId, ...data } = employee; // exclude ID
      setFormData(data);
    } else {
      setEditEmployee(null);
      setFormData({
        fullName: "",
        role: "Driver",
        employmentType: "Full-time",
        mobileNumber: "",
        currentAddress: "",
        permanentAddress: "",
        sameAsCurrent: false,
        emergencyContactName: "",
        emergencyContactNumber: "",
        dateHired: "",
        shift: "Morning",
        email: "",
        password: "",
      });
    }
    setStep(1);
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "mobileNumber" || name === "emergencyContactNumber") {
      // Allow only digits and max 11 characters
      if (/^\d{0,11}$/.test(value)) {
        setFormData({ ...formData, [name]: value });
      }
    } else if (name === "sameAsCurrent") {
      setFormData((prev) => ({
        ...prev,
        sameAsCurrent: checked,
        permanentAddress: checked ? prev.currentAddress : prev.permanentAddress,
      }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editEmployee) {
        await axios.put(
          `http://localhost:5000/api/employees/${editEmployee._id}`,
          { ...formData, employeeId: editEmployee.employeeId }
        );
      } else {
        const { employeed, sameAsCurrent, ...dataToSend } = formData;
        await axios.post("http://localhost:5000/api/employees", dataToSend);
      }
      closeModal();
      fetchEmployees();
    } catch (err) {
      console.error("Error adding/updating employee:", err);
      alert(err.response?.data?.message || "Error adding/updating employee");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/employees/${id}`);
      fetchEmployees();
    } catch (err) {
      console.error(err);
    }
  };

  const getDisplayID = (index, emp) => {
    return emp.employeeId ? emp.employeeId : `EMP${String(index + 1).padStart(3, "0")}`;
  };

  const viewEmployee = (employee) => {
    navigate(`/dashboard/employee/${employee._id}`);
  };

  // Validate fields before moving to next step or submitting
  const validateStep = () => {
    let newErrors = {};

    if (step === 1) {
      if (!(formData.fullName || "").trim()) newErrors.fullName = "Full name is required.";
      if (!formData.role) newErrors.role = "Role is required.";
      if (!formData.employmentType) newErrors.employmentType = "Employment type is required.";
      if (!(formData.mobileNumber || "").trim()) {
        newErrors.mobileNumber = "Mobile number is required.";
      } else if (!/^\d{11}$/.test(formData.mobileNumber || "")) {
        newErrors.mobileNumber = "Mobile number must be exactly 11 digits.";
      }
      if (!(formData.currentAddress || "").trim()) newErrors.currentAddress = "Current address is required.";
      if (!(formData.permanentAddress || "").trim()) newErrors.permanentAddress = "Permanent address is required.";

      if (!(formData.emergencyContactName || "").trim()) newErrors.emergencyContactName = "Emergency contact name is required.";
      if (!(formData.emergencyContactNumber || "").trim()) {
        newErrors.emergencyContactNumber = "Emergency contact number is required.";
      } else if (!/^\d{11}$/.test(formData.emergencyContactNumber || "")) {
        newErrors.emergencyContactNumber = "Emergency contact number must be exactly 11 digits.";
      }
      if (!formData.dateHired) newErrors.dateHired = "Date hired is required.";
      if (!formData.shift) newErrors.shift = "Shift selection is required.";
    }

    if (step === 2) {
      if (!formData.email.trim()) newErrors.email = "Email is required.";
      if (!formData.password.trim()) {
        newErrors.password = "Password is required.";
      } else if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  return (
    <>
      <div
        ref={containerRef}
        className={`transition duration-200 ${showModal ? "filter blur-sm" : ""}`}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Employees</h1>
          <button
            onClick={() => openModal()}
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg hover:scale-105 transform transition"
          >
            Add Employee
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <input
            type="text"
            placeholder="Search Employee ID"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            placeholder="Search Name"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <select
            value={searchRole}
            onChange={(e) => setSearchRole(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All Roles</option>
            <option value="Driver">Driver</option>
            <option value="Helper">Helper</option>
          </select>
          <input
            type="text"
            placeholder="Search Mobile"
            value={searchMobile}
            onChange={(e) => setSearchMobile(e.target.value)}
            className="border rounded px-3 py-2"
          />
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700"></th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Employee ID</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Full Name</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Role</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Mobile Number</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp, index) => (
                  <tr
                    key={emp._id}
                    className="border-b last:border-none hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-3">{index + 1}</td>
                    <td className="px-6 py-3">{getDisplayID(index, emp)}</td>
                    <td className="px-6 py-3">{emp.fullName}</td>
                    <td className="px-6 py-3">{emp.role}</td>
                    <td className="px-6 py-3">{emp.mobileNumber}</td>
                    <td className="px-6 py-3 text-center space-x-2">
                      <button
                        onClick={() => viewEmployee(emp)}
                        className="px-3 py-1 bg-blue-500 text-white rounded shadow hover:bg-blue-600 inline-flex items-center gap-1 transition transform hover:scale-105"
                      >
                        <Eye size={16} /> View
                      </button>
                      <button
                        onClick={() => openModal(emp)}
                        className="px-3 py-1 bg-yellow-400 text-white rounded shadow hover:bg-yellow-500 inline-flex items-center gap-1 transition transform hover:scale-105"
                      >
                        <Pencil size={16} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(emp._id)}
                        className="px-3 py-1 bg-red-500 text-white rounded shadow hover:bg-red-600 inline-flex items-center gap-1 transition transform hover:scale-105"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-gray-500">
                      No employees found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
          <div
            className="absolute inset-0 bg-black opacity-20"
            onClick={closeModal}
          ></div>

          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 z-10 animate-fade-in">
            <h2 className="text-xl font-bold mb-4">
              {editEmployee ? "Edit Employee" : "Add Employee"}
            </h2>

            <div className="mb-4 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full bg-blue-600 transition-all duration-300`}
                style={{ width: step === 1 ? "50%" : "100%" }}
              ></div>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-3 grid-cols-2">
              {step === 1 ? (
                <>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Full Name"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className={`border p-2 rounded focus:ring-2 focus:ring-indigo-400 ${errors.fullName ? "border-red-500" : ""}`}
                  />
                  {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName}</p>}

                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    className={`border p-2 rounded focus:ring-2 focus:ring-indigo-400 ${errors.role ? "border-red-500" : ""}`}
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  {errors.role && <p className="text-red-500 text-sm">{errors.role}</p>}


                  <select
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleChange}
                    required
                    className={`border p-2 rounded focus:ring-2 focus:ring-indigo-400 ${errors.employmentType ? "border-red-500" : ""}`}
                  >
                    {employmentTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {errors.employmentType && <p className="text-red-500 text-sm">{errors.employmentType}</p>}

                  <input
                    type="text"
                    name="mobileNumber"
                    placeholder="Mobile Number"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    maxLength={11}
                    required
                    className={`border p-2 rounded focus:ring-2 focus:ring-indigo-400 ${errors.mobileNumber ? "border-red-500" : ""}`}
                  />
                  {errors.mobileNumber && <p className="text-red-500 text-sm">{errors.mobileNumber}</p>}

                  <input
                    type="text"
                    name="currentAddress"
                    placeholder="Current Address"
                    value={formData.currentAddress}
                    onChange={handleChange}
                    className={`border p-2 rounded focus:ring-2 focus:ring-indigo-400 ${errors.currentAddress ? "border-red-500" : ""}`}
                  />
                  {errors.currentAddress && <p className="text-red-500 text-sm">{errors.currentAddress}</p>}

                  <input
                    type="text"
                    name="permanentAddress"
                    placeholder="Permanent Address"
                    value={formData.permanentAddress}
                    onChange={handleChange}
                    className={`border p-2 rounded focus:ring-2 focus:ring-indigo-400 ${errors.permanentAddress ? "border-red-500" : ""}`}
                  />
                  {errors.permanentAddress && <p className="text-red-500 text-sm">{errors.permanentAddress}</p>}

                  <div className="col-span-2 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="sameAsCurrent"
                      checked={formData.sameAsCurrent}
                      onChange={handleChange}
                      id="sameAsCurrent"
                      className="w-4 h-4"
                    />
                    <label htmlFor="sameAsCurrent">Same as Current Address</label>
                  </div>
                  <input
                    type="text"
                    name="emergencyContactName"
                    placeholder="Emergency Contact Name"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                    className={`border p-2 rounded focus:ring-2 focus:ring-indigo-400 ${errors.emergencyContactName ? "border-red-500" : ""}`}
                  />
                  {errors.emergencyContactName && <p className="text-red-500 text-sm">{errors.emergencyContactName}</p>}

                  <input
                    type="text"
                    name="emergencyContactNumber"
                    placeholder="Emergency Contact Number"
                    value={formData.emergencyContactNumber}
                    onChange={handleChange}
                    maxLength={11}
                    className={`border p-2 rounded focus:ring-2 focus:ring-indigo-400 ${errors.emergencyContactNumber ? "border-red-500" : ""}`}
                  />
                  {errors.emergencyContactNumber && <p className="text-red-500 text-sm">{errors.emergencyContactNumber}</p>}

                  <input
                    type="date"
                    name="dateHired"
                    value={formData.dateHired}
                    onChange={handleChange}
                    className={`border p-2 rounded focus:ring-2 focus:ring-indigo-400 ${errors.dateHired ? "border-red-500" : ""}`}
                  />
                  {errors.dateHired && <p className="text-red-500 text-sm">{errors.dateHired}</p>}

                  <div className="col-span-2 flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (validateStep()) setStep(2);
                      }}
                      className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:scale-105 transform transition"
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-2 flex space-x-3 mb-3">
                    {shifts.map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setFormData({ ...formData, shift: s })}
                        className={`px-4 py-2 rounded-full ${formData.shift === s ? "bg-blue-600 text-white" : "bg-gray-200"
                          }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    name="email"
                    placeholder="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={`border p-2 rounded focus:ring-2 focus:ring-indigo-400 ${errors.role ? "border-red-500" : ""}`}
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className={`border p-2 rounded focus:ring-2 focus:ring-indigo-400 ${errors.role ? "border-red-500" : ""}`}
                  />

                  <div className="col-span-2 flex justify-between mt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-5 py-2 bg-gray-300 rounded-lg shadow hover:scale-105 transform transition"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      onClick={(e) => {
                        e.preventDefault();
                        if (validateStep()) handleSubmit(e);
                      }}
                      className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:scale-105 transform transition"
                    >
                      {editEmployee ? "Update" : "Add"}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Employee;