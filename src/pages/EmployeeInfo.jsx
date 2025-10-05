import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X } from "lucide-react";

function EmployeeInfo() {
    const { id } = useParams();
    const [employee, setEmployee] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [bookings, setBookings] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isLoadingBookings, setIsLoadingBookings] = useState(false);
    const navigate = useNavigate();

    const baseURL = import.meta.env.VITE_API_BASE_URL;

    // Fetch all employees
    useEffect(() => {
        fetch(`${baseURL}/api/employees`)
            .then((res) => res.json())
            .then((data) => setEmployees(data))
            .catch((err) => console.error(err));
    }, []);

    // Fetch single employee info
    useEffect(() => {
        if (!id) return;
        fetch(`${baseURL}/api/employees/${id}`)
            .then((res) => res.json())
            .then((data) => setEmployee(data))
            .catch((err) => console.error(err));
    }, [id]);

    // Update index
    useEffect(() => {
        if (employees.length > 0) {
            const idx = employees.findIndex((emp) => emp._id === id);
            setCurrentIndex(idx);
        }
    }, [employees, id]);

    // Fetch bookings for this employee
    const fetchBookingHistory = async () => {
        if (!employee) return;

        setIsLoadingBookings(true);
        try {
            const res = await fetch(`${baseURL}/api/employees/${id}/bookings`);
            const data = await res.json();
            setBookings(data);
            setShowModal(true);
        } catch (err) {
            console.error("Error fetching bookings:", err);
        } finally {
            setIsLoadingBookings(false);
        }
    };

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
        <>
            <div className="p-6 max-w-3xl mx-auto">
                <h2 className="text-2xl font-bold text-center text-gray-800">Employee Information</h2>
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={fetchBookingHistory}
                        disabled={isLoadingBookings}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition disabled:bg-red-300"
                    >
                        {isLoadingBookings ? "Loading..." : "View History"}
                    </button>
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

                {/* Pagination controls */}
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

            {/* Employee History Modal*/}
            {showModal && (
                <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-6 border-b">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800">Booking History</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Employee: {employee.fullName} • Total Bookings: {bookings.length}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition"
                            >
                                <X className="w-6 h-6 text-gray-600" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-auto p-6">
                            {bookings.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 text-lg">No booking history found for this employee.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-100 text-gray-700 uppercase text-xs sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3">Reservation ID</th>
                                                <th className="px-4 py-3">Trip Number</th>
                                                <th className="px-4 py-3">Company Name</th>
                                                <th className="px-4 py-3">Vehicle Used</th>
                                                <th className="px-4 py-3">Plate Number</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {bookings.map((booking) => (
                                                <tr key={booking._id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 font-medium text-blue-600">
                                                        {booking.reservationId || "N/A"}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {booking.tripNumber || "N/A"}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {booking.companyName}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {booking.vehicleId?.vehicleType || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {booking.vehicleId?.plateNumber || 'N/A'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t bg-gray-50">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-6 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default EmployeeInfo;