import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, User, Building, Package, Truck, MapPin } from "lucide-react";
import { axiosClient } from "../api/axiosClient";


function BookingInfo() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchBooking = async () => {
        try {
            const res = await axiosClient.get(`/api/bookings/${id}`);
            setBooking(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching booking:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooking();
    }, [id]);

    const goBack = () => {
        navigate("/dashboard/booking");
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Booking Not Found</h2>
                <button
                    onClick={goBack}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
                >
                    <ArrowLeft size={16} /> Back to Bookings
                </button>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center mb-6">
                <button
                    onClick={goBack}
                    className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Booking Details</h1>
                    <p className="text-gray-600">View complete booking information</p>
                </div>
            </div>

            {/* Booking Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                    <h3 className="text-sm font-medium opacity-90">Reservation ID</h3>
                    <p className="text-2xl font-bold font-mono">{booking.reservationId}</p>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-purple-600 text-white p-4 rounded-lg">
                    <h3 className="text-sm font-medium opacity-90">Trip Number</h3>
                    <p className="text-2xl font-bold font-mono">{booking.tripNumber}</p>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-purple-950 text-white p-4 rounded-lg">
                    <h3 className="text-sm font-medium opacity-90">Status</h3>
                    <p className="text-2xl font-bold">{booking.status}</p>
                </div>
            </div>

            {/* Detailed Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Product Information */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Package className="text-blue-600" size={20} />
                        Product Information
                    </h2>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Product Name:</span>
                            <span className="font-semibold">{booking.productName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Quantity:</span>
                            <span className="font-semibold">{booking.quantity}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Gross Weight:</span>
                            <span className="font-semibold">{booking.grossWeight}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Units per Package:</span>
                            <span className="font-semibold">{booking.unitPerPackage}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Number of Packages:</span>
                            <span className="font-semibold">{booking.numberOfPackages}</span>
                        </div>
                        <div className="flex justify-between border-t pt-3">
                            <span className="text-gray-600">Delivery Fee:</span>
                            <span className="font-semibold text-green-600">{booking.deliveryFee}</span>
                        </div>
                    </div>
                </div>

                {/* Company Information */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Building className="text-blue-600" size={20} />
                        Company Information
                    </h2>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Company Name:</span>
                            <span className="font-semibold">{booking.companyName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Shipper/Consignor:</span>
                            <span className="font-semibold">{booking.shipperConsignorName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Customer/Establishment:</span>
                            <span className="font-semibold">{booking.customerEstablishmentName}</span>
                        </div>
                    </div>
                </div>

                {/* Route Information */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <MapPin className="text-blue-600" size={20} />
                        Route Information
                    </h2>
                    <div className="space-y-3">
                        <div>
                            <span className="text-gray-600 block">Origin Address:</span>
                            <span className="font-semibold">{booking.originAddress}</span>
                        </div>
                        <div>
                            <span className="text-gray-600 block">Destination Address:</span>
                            <span className="font-semibold">{booking.destinationAddress}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Area Location Code:</span>
                            <span className="font-semibold">{booking.areaLocationCode}</span>
                        </div>
                    </div>
                </div>

                {/* Vehicle & Cost Information */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Truck className="text-blue-600" size={20} />
                        Vehicle & Cost
                    </h2>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Vehicle Type:</span>
                            <span className="font-semibold">{booking.vehicleType}</span>
                        </div>
                        <div className="flex justify-between border-t pt-3">
                            <span className="text-gray-600">Rate Cost:</span>
                            <span className="font-semibold text-green-600">{booking.rateCost}</span>
                        </div>
                    </div>
                </div>

                {/* Schedule Information */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Calendar className="text-blue-600" size={20} />
                        Schedule Information
                    </h2>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Date Needed:</span>
                            <span className="font-semibold flex items-center gap-2">
                                <Calendar size={16} />
                                {new Date(booking.dateNeeded).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Time Needed:</span>
                            <span className="font-semibold flex items-center gap-2">
                                <Clock size={16} />
                                {booking.timeNeeded}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Employee Information */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <User className="text-blue-600" size={20} />
                        Employee Information
                    </h2>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Employee Assigned:</span>
                            <span className="font-semibold">{booking.employeeAssigned}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Role:</span>
                            <span className="font-semibold">{booking.roleOfEmployee}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timestamps */}
            <div className="mt-6 bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                        <span className="font-medium">Created:</span> {new Date(booking.createdAt).toLocaleString()}
                    </div>
                    <div>
                        <span className="font-medium">Last Updated:</span> {new Date(booking.updatedAt).toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BookingInfo;