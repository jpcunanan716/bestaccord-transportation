import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function EmployeeInfo() {
    const { id } = useParams();
    const [employee, setEmployee] = useState(null);
    const [employees, setEmployees] = useState([]); // store all employees
    const [currentIndex, setCurrentIndex] = useState(-1);
    const navigate = useNavigate();

    // Fetch all employees (to know the sequence)
    useEffect(() => {
        fetch("/api/employees")
            .then((res) => res.json())
            .then((data) => setEmployees(data))
            .catch((err) => console.error(err));
    }, []);

    // Fetch single employee info when id changes
    useEffect(() => {
        if (!id) return;
        fetch(`/api/employees/${id}`)
            .then((res) => res.json())
            .then((data) => setEmployee(data))
            .catch((err) => console.error(err));
    }, [id]);

    // Update index whenever employees list or current id changes
    useEffect(() => {
        if (employees.length > 0) {
            const idx = employees.findIndex((emp) => emp._id === id);
            setCurrentIndex(idx);
        }
    }, [employees, id]);

    if (!employee) return <p className="text-center py-6 text-gray-500">Loading...</p>;

    // Handlers for pagination
    const handlePrev = () => {
        if (currentIndex > 0) {
            navigate(`/dashboard/employee/${employees[currentIndex - 1]._id}`);
        }
    };

    const handleNext = () => {
        if (currentIndex < employees.length - 1) {
            navigate(`/dashboard/employee/${employees[currentIndex + 1]._id}`);
        }
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            {/* Header */}
            <h2 className="text-2xl font-bold text-center text-gray-800">Employee Information</h2>
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={() => navigate("/dashboard/employee")}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700 transition"
                >
                    Back
                </button>
            </div>

            {/* Employee Info Table */}
            <div className="overflow-x-auto shadow rounded-lg border border-gray-200">
                <table className="w-full text-sm text-left text-gray-700">
                    <tbody>
                        <tr className="border-b">
                            <th className="px-6 py-3 font-semibold bg-gray-100 w-1/3">Employee ID</th>
                            <td className="px-6 py-3">{employee.employeeId}</td>
                        </tr>
                        <tr className="border-b">
                            <th className="px-6 py-3 font-semibold bg-gray-100">Full Name</th>
                            <td className="px-6 py-3">{employee.fullName}</td>
                        </tr>
                        <tr className="border-b">
                            <th className="px-6 py-3 font-semibold bg-gray-100">Role</th>
                            <td className="px-6 py-3">{employee.role}</td>
                        </tr>
                        <tr className="border-b">
                            <th className="px-6 py-3 font-semibold bg-gray-100">Employment Type</th>
                            <td className="px-6 py-3">{employee.employmentType}</td>
                        </tr>
                        <tr className="border-b">
                            <th className="px-6 py-3 font-semibold bg-gray-100">Mobile Number</th>
                            <td className="px-6 py-3">{employee.mobileNumber}</td>
                        </tr>
                        <tr className="border-b">
                            <th className="px-6 py-3 font-semibold bg-gray-100">Email</th>
                            <td className="px-6 py-3">{employee.email}</td>
                        </tr>
                        <tr className="border-b">
                            <th className="px-6 py-3 font-semibold bg-gray-100">Current Address</th>
                            <td className="px-6 py-3">{employee.currentAddress}</td>
                        </tr>
                        <tr className="border-b">
                            <th className="px-6 py-3 font-semibold bg-gray-100">Permanent Address</th>
                            <td className="px-6 py-3">{employee.permanentAddress}</td>
                        </tr>
                        <tr className="border-b">
                            <th className="px-6 py-3 font-semibold bg-gray-100">Emergency Contact</th>
                            <td className="px-6 py-3">
                                {employee.emergencyContactName} ({employee.emergencyContactNumber})
                            </td>
                        </tr>
                        <tr className="border-b">
                            <th className="px-6 py-3 font-semibold bg-gray-100">Date Hired</th>
                            <td className="px-6 py-3">
                                {employee.dateHired ? new Date(employee.dateHired).toLocaleDateString() : "-"}
                            </td>
                        </tr>
                        <tr>
                            <th className="px-6 py-3 font-semibold bg-gray-100">Shift</th>
                            <td className="px-6 py-3">{employee.shift}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-6">
                <button
                    onClick={handlePrev}
                    disabled={currentIndex <= 0}
                    className={`px-4 py-2 rounded-lg shadow ${currentIndex <= 0
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                >
                    Previous
                </button>
                <p className="text-gray-600 text-sm">
                    {currentIndex + 1} of {employees.length}
                </p>
                <button
                    onClick={handleNext}
                    disabled={currentIndex >= employees.length - 1}
                    className={`px-4 py-2 rounded-lg shadow ${currentIndex >= employees.length - 1
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                >
                    Next
                </button>
            </div>
        </div>
    );
}

export default EmployeeInfo;
