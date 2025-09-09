import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function ClientInfo() {
    const { id } = useParams();
    const [client, setClient] = useState(null);
    const [clients, setClients] = useState([]); // store all clients
    const [currentIndex, setCurrentIndex] = useState(-1);
    const navigate = useNavigate();

    // Fetch all clients (to know the sequence)
    useEffect(() => {
        fetch("http://localhost:5000/api/clients")
            .then((res) => res.json())
            .then((data) => setClients(data))
            .catch((err) => console.error(err));
    }, []);

    // Fetch single client info when id changes
    useEffect(() => {
        if (!id) return;
        fetch(`http://localhost:5000/api/clients/${id}`)
            .then((res) => res.json())
            .then((data) => setClient(data))
            .catch((err) => console.error(err));
    }, [id]);

    // Update index whenever clients list or current id changes
    useEffect(() => {
        if (clients.length > 0) {
            const idx = clients.findIndex((emp) => emp._id === id);
            setCurrentIndex(idx);
        }
    }, [clients, id]);

    if (!client) return <p className="text-center py-6 text-gray-500">Loading...</p>;

    // Handlers for pagination
    const handlePrev = () => {
        if (currentIndex > 0) {
            navigate(`/dashboard/client/${clients[currentIndex - 1]._id}`);
        }
    };

    const handleNext = () => {
        if (currentIndex < clients.length - 1) {
            navigate(`/dashboard/client/${clients[currentIndex + 1]._id}`);
        }
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            {/* Header */}
            <h2 className="text-2xl font-bold text-center text-gray-800">Client Information</h2>
            <div className="flex justify-between items-center mb-6">
                <button
                    // onClick={() => navigate("/dashboard/client")}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-700 transition"
                >
                    View History
                </button>
                <button
                    onClick={() => navigate("/dashboard/client")}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700 transition"
                >
                    Back
                </button>
            </div>

            {/* Client Info Table */}
            <div className="overflow-x-auto shadow rounded-lg border border-gray-200">
                <table className="w-full text-sm text-left text-gray-700">
                    <tbody>
                        <tr className="border-b">
                            <th className="px-6 py-3 font-semibold bg-gray-100">Client Name</th>
                            <td className="px-6 py-3">{client.clientName}</td>
                        </tr>
                        <tr className="border-b">
                            <th className="px-6 py-3 font-semibold bg-gray-100">Location</th>
                            <td className="px-6 py-3">{client.location}</td>
                        </tr>
                        <tr className="border-b">
                            <th className="px-6 py-3 font-semibold bg-gray-100">Branch</th>
                            <td className="px-6 py-3">{client.branch}</td>
                        </tr>
                        <tr>
                            <th className="px-6 py-3 font-semibold bg-gray-100">Date Created</th>
                            <td className="px-6 py-3">{client.createdAt}</td>
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
                    {currentIndex + 1} of {clients.length}
                </p>
                <button
                    onClick={handleNext}
                    disabled={currentIndex >= clients.length - 1}
                    className={`px-4 py-2 rounded-lg shadow ${currentIndex >= clients.length - 1
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

export default ClientInfo;
