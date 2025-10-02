import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function VehicleInfo() {
    const { id } = useParams();
    const [vehicle, setVehicle] = useState(null);
    const [vehicles, setVehicles] = useState([]); // store all vehicles
    const [currentIndex, setCurrentIndex] = useState(-1);
    const navigate = useNavigate();

    //VITE API BASE URL
    const baseURL = import.meta.env.VITE_API_BASE_URL;

    // Fetch all vehicles (to know the sequence)
    useEffect(() => {
        fetch(`${baseURL}/api/vehicles`)
            .then((res) => res.json())
            .then((data) => setVehicles(data))
            .catch((err) => console.error(err));
    }, []);

    // Fetch single vehicle info when id changes
    useEffect(() => {
        if (!id) return;
        fetch(`${baseURL}/api/vehicles/${id}`)
            .then((res) => res.json())
            .then((data) => setVehicle(data))
            .catch((err) => console.error(err));
    }, [id]);

    // Update index whenever vehicles list or current id changes
    useEffect(() => {
        if (vehicles.length > 0) {
            const idx = vehicles.findIndex((emp) => emp._id === id);
            setCurrentIndex(idx);
        }
    }, [vehicles, id]);

    if (!vehicle) return <p className="text-center py-6 text-gray-500">Loading...</p>;

    // Handlers for pagination
    const handlePrev = () => {
        if (currentIndex > 0) {
            navigate(`/dashboard/vehicle/${vehicles[currentIndex - 1]._id}`);
        }
    };

    const handleNext = () => {
        if (currentIndex < vehicles.length - 1) {
            navigate(`/dashboard/vehicle/${vehicles[currentIndex + 1]._id}`);
        }
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            {/* Header */}
            <h2 className="text-2xl font-bold text-center text-gray-800">Vehicle Information</h2>
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={() => navigate("/dashboard/vehicle")}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700 transition"
                >
                    Back
                </button>
            </div>

            {/* Vehicle Info Table */}
            <div className="overflow-x-auto shadow rounded-lg border border-gray-200">
                <table className="w-full text-sm text-left text-gray-700">
                    <tbody>
                        <tr className="border-b">
                            <th className="px-6 py-3 font-semibold bg-gray-100">Registration Number</th>
                            <td className="px-6 py-3">{vehicle.registrationNumber}</td>
                        </tr>
                        <tr className="border-b">
                            <th className="px-6 py-3 font-semibold bg-gray-100">Brand</th>
                            <td className="px-6 py-3">{vehicle.manufacturedBy}</td>
                        </tr>
                        <tr className="border-b">
                            <th className="px-6 py-3 font-semibold bg-gray-100">Model</th>
                            <td className="px-6 py-3">{vehicle.model}</td>
                        </tr>
                        <tr className="border-b">
                            <th className="px-6 py-3 font-semibold bg-gray-100">Vehicle Type</th>
                            <td className="px-6 py-3">{vehicle.vehicleType}</td>
                        </tr>
                        <tr className="border-b">
                            <th className="px-6 py-3 font-semibold bg-gray-100">Vehicle Color</th>
                            <td className="px-6 py-3">{vehicle.color}</td>
                        </tr>
                        <tr className="border-b">
                            <th className="px-6 py-3 font-semibold bg-gray-100">Plate No.</th>
                            <td className="px-6 py-3">{vehicle.plateNumber}</td>
                        </tr>
                        <tr className="border-b">
                            <th className="px-6 py-3 font-semibold bg-gray-100">Chassis No.</th>
                            <td className="px-6 py-3">{vehicle.chassisNumber}</td>
                        </tr>
                        <tr className="border-b">
                            <th className="px-6 py-3 font-semibold bg-gray-100">Engine No.</th>
                            <td className="px-6 py-3">{vehicle.engineNumber}</td>
                        </tr>
                        <tr className="border-b">
                            <th className="px-6 py-3 font-semibold bg-gray-100">Registration Expiry Date</th>
                            <td className="px-6 py-3">{vehicle.registrationExpiryDate}</td>
                        </tr>
                        <tr>
                            <th className="px-6 py-3 font-semibold bg-gray-100">Date Added</th>
                            <td className="px-6 py-3">{vehicle.createdAt}</td>
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
                    {currentIndex + 1} of {vehicles.length}
                </p>
                <button
                    onClick={handleNext}
                    disabled={currentIndex >= vehicles.length - 1}
                    className={`px-4 py-2 rounded-lg shadow ${currentIndex >= vehicles.length - 1
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

export default VehicleInfo;
