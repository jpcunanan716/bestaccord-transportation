import { useState, useEffect, useRef } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import axios from "axios";

function Employee() {
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [step, setStep] = useState(1);

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
    username: "",
    password: "",
  });

  const containerRef = useRef(null);

  const roles = ["Driver", "Helper"];
  const employmentTypes = ["Full-time", "Part-time", "Contractual"];
  const shifts = ["Morning", "Afternoon", "Night"];

  const fetchEmployees = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/employees");
      setEmployees(res.data);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const openModal = (employee = null) => {
    if (employee) {
      setEditEmployee(employee);
      // Exclude employeeId from formData
      const { employeeId, ...data } = employee;
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
        username: "",
        password: "",
      });
    }
    setStep(1);
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "sameAsCurrent") {
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
        // Keep the existing employeeId for editing
        await axios.put(
          `http://localhost:5000/api/employees/${editEmployee._id}`,
          { ...formData, employeeId: editEmployee.employeeId }
        );
      } else {
        // Remove employeeId and sameAsCurrent when creating a new employee - let backend generate it
        const { employeed, sameAsCurrent, ...dataToSend } = formData;
        console.log("Sending data to backend:", dataToSend);
        await axios.post(
          "http://localhost:5000/api/employees",
          dataToSend
        );
      }
      closeModal();
      fetchEmployees();
    } catch (err) {
      console.error("Error adding/updating employee:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);

      // Display the specific error message from server
      const errorMessage = err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Error adding/updating employee";

      alert(errorMessage);
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
    // Add your view logic here
    console.log("Viewing employee:", employee);
    // You could open a read-only modal or navigate to a detail page
  };

  return (
    <>
      {/* Page Content */}
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

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto">
              <thead className="bg-gray-100 rounded-t-lg">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">#</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Employee ID</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Full Name</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Role</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Mobile Number</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, index) => (
                  <tr
                    key={emp._id}
                    className="border-b last:border-none hover:bg-gray-50 transition duration-150"
                  >
                    <td className="px-6 py-3">{index + 1}</td>
                    <td className="px-6 py-3">{getDisplayID(index, emp)}</td>
                    <td className="px-6 py-3">{emp.fullName}</td>
                    <td className="px-6 py-3">{emp.role}</td>
                    <td className="px-6 py-3">{emp.mobileNumber}</td>
                    <td className="px-6 py-3 space-x-2">
                      <button
                        onClick={() => viewEmployee(emp)}
                        className="px-3 py-1 bg-blue-500 text-white rounded shadow hover:bg-blue-600 transition transform hover:scale-105 inline-flex items-center gap-1"
                      >
                        <Eye size={16} />
                        View
                      </button>
                      <button
                        onClick={() => openModal(emp)}
                        className="px-3 py-1 bg-yellow-400 text-white rounded shadow hover:bg-yellow-500 transition transform hover:scale-105 inline-flex items-center gap-1"
                      >
                        <Pencil size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(emp._id)}
                        className="px-3 py-1 bg-red-500 text-white rounded shadow hover:bg-red-600 transition transform hover:scale-105 inline-flex items-center gap-1"
                      >
                        <Trash2 size={16} />
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
                    className="border p-2 rounded focus:ring-2 focus:ring-indigo-400"
                  />
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    className="border p-2 rounded focus:ring-2 focus:ring-indigo-400"
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <select
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleChange}
                    required
                    className="border p-2 rounded focus:ring-2 focus:ring-indigo-400"
                  >
                    {employmentTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="mobileNumber"
                    placeholder="Mobile Number"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    required
                    className="border p-2 rounded focus:ring-2 focus:ring-indigo-400"
                  />
                  <input
                    type="text"
                    name="currentAddress"
                    placeholder="Current Address"
                    value={formData.currentAddress}
                    onChange={handleChange}
                    className="border p-2 rounded focus:ring-2 focus:ring-indigo-400"
                  />
                  <input
                    type="text"
                    name="permanentAddress"
                    placeholder="Permanent Address"
                    value={formData.permanentAddress}
                    onChange={handleChange}
                    className="border p-2 rounded focus:ring-2 focus:ring-indigo-400"
                  />
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
                    className="border p-2 rounded focus:ring-2 focus:ring-indigo-400"
                  />
                  <input
                    type="text"
                    name="emergencyContactNumber"
                    placeholder="Emergency Contact Number"
                    value={formData.emergencyContactNumber}
                    onChange={handleChange}
                    className="border p-2 rounded focus:ring-2 focus:ring-indigo-400"
                  />
                  <input
                    type="date"
                    name="dateHired"
                    value={formData.dateHired}
                    onChange={handleChange}
                    className="border p-2 rounded focus:ring-2 focus:ring-indigo-400"
                  />

                  <div className="col-span-2 flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
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
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="border p-2 rounded focus:ring-2 focus:ring-indigo-400"
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="border p-2 rounded focus:ring-2 focus:ring-indigo-400"
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