import React, { useState, useRef } from 'react';
import { Download, FileText, Calendar, MapPin, Package, Truck, User, Building } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ReceiptGenerator = ({ booking, onClose, onReceiptGenerated }) => {
  const [generating, setGenerating] = useState(false);
  const receiptRef = useRef(null);

  // Generate receipt number based on booking data
  const generateReceiptNumber = () => {
    const date = new Date();
    const timestamp = date.getTime().toString().slice(-6);
    return `RCP${booking.reservationId?.slice(-6) || timestamp}`;
  };

  const receiptNumber = generateReceiptNumber();

  const downloadAsPDF = async () => {
    if (!receiptRef.current) return;
    
    setGenerating(true);
    try {
      // Create a temporary container with better styling for PDF
      const element = receiptRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const fileName = `Receipt_${receiptNumber}_${booking.tripNumber}.pdf`;
      pdf.save(fileName);
      
      // Callback to parent component
      if (onReceiptGenerated) {
        onReceiptGenerated({
          receiptNumber,
          fileName,
          bookingId: booking._id,
          tripNumber: booking.tripNumber
        });
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Generate Receipt</h2>
          <div className="flex space-x-2">
            <button
              onClick={downloadAsPDF}
              disabled={generating}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{generating ? 'Generating...' : 'Download PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="p-8">
          <div ref={receiptRef} className="bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
            {/* Company Header */}
            <div className="text-center border-b-2 border-gray-300 pb-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">BESTACCORD LOGISTICS</h1>
              <p className="text-gray-600 text-sm">Professional Transportation & Logistics Services</p>
              <p className="text-gray-600 text-sm">📍 Metro Manila, Philippines | 📞 +63 XXX XXX XXXX</p>
            </div>

            {/* Receipt Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">DELIVERY RECEIPT</h2>
                <div className="space-y-1 text-sm">
                  <p><span className="font-semibold">Receipt No:</span> {receiptNumber}</p>
                  <p><span className="font-semibold">Trip No:</span> {booking.tripNumber}</p>
                  <p><span className="font-semibold">Reservation ID:</span> {booking.reservationId}</p>
                </div>
              </div>
              <div className="text-right text-sm">
                <p><span className="font-semibold">Date Issued:</span></p>
                <p>{formatDate(new Date())}</p>
                <p className="mt-2"><span className="font-semibold">Delivery Date:</span></p>
                <p>{formatDate(booking.dateNeeded)}</p>
              </div>
            </div>

            {/* Customer & Route Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="border border-gray-300 p-4 rounded">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                  <Building className="w-4 h-4 mr-2" />
                  Customer Information
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Company:</span> {booking.companyName}</p>
                  <p><span className="font-semibold">Contact:</span> {booking.customerEstablishmentName}</p>
                  <p><span className="font-semibold">Consignor:</span> {booking.shipperConsignorName}</p>
                </div>
              </div>
              
              <div className="border border-gray-300 p-4 rounded">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  Route Information
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">From:</span> {booking.originAddress}</p>
                  <p><span className="font-semibold">To:</span> {booking.destinationAddress}</p>
                  <p><span className="font-semibold">Area Code:</span> {booking.areaLocationCode}</p>
                </div>
              </div>
            </div>

            {/* Package Details */}
            <div className="mb-8">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center text-lg">
                <Package className="w-5 h-5 mr-2" />
                Package Details
              </h3>
              <div className="border border-gray-300 rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Product Name</th>
                      <th className="px-4 py-3 text-left font-semibold">Quantity</th>
                      <th className="px-4 py-3 text-left font-semibold">Weight</th>
                      <th className="px-4 py-3 text-left font-semibold">Packages</th>
                      <th className="px-4 py-3 text-left font-semibold">Units/Package</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="px-4 py-3">{booking.productName}</td>
                      <td className="px-4 py-3">{booking.quantity?.toLocaleString()} pcs</td>
                      <td className="px-4 py-3">{booking.grossWeight} tons</td>
                      <td className="px-4 py-3">{booking.numberOfPackages} boxes</td>
                      <td className="px-4 py-3">{booking.unitPerPackage} pcs/box</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vehicle & Team Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="border border-gray-300 p-4 rounded">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                  <Truck className="w-4 h-4 mr-2" />
                  Vehicle Information
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Vehicle Type:</span> {booking.vehicleType}</p>
                  <p><span className="font-semibold">Vehicle ID:</span> {booking.vehicleId}</p>
                  <p><span className="font-semibold">Plate Number:</span> {booking.vehicle?.plateNumber || 'N/A'}</p>
                </div>
              </div>
              
              <div className="border border-gray-300 p-4 rounded">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Delivery Team
                </h3>
                <div className="space-y-2 text-sm">
                  {booking.employeeDetails && booking.employeeDetails.length > 0 ? (
                    booking.employeeDetails.map((emp, idx) => (
                      <p key={idx}>
                        <span className="font-semibold">{emp.role}:</span> {emp.employeeName}
                      </p>
                    ))
                  ) : booking.employeeAssigned && booking.employeeAssigned.length > 0 ? (
                    booking.employeeAssigned.map((empId, idx) => (
                      <p key={idx}>
                        <span className="font-semibold">Team Member:</span> {empId}
                      </p>
                    ))
                  ) : (
                    <p className="text-gray-500">No team assigned</p>
                  )}
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="mb-8">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center text-lg">
                💰 Cost Breakdown
              </h3>
              <div className="border border-gray-300 rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Description</th>
                      <th className="px-4 py-3 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="px-4 py-3">Delivery Fee</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(booking.deliveryFee)}</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-3">Rate Cost (Area)</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(booking.rateCost)}</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-3">Fuel Cost</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(3000)}</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-3">Service Charge</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(300)}</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-3">Other Expenses</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(300)}</td>
                    </tr>
                    <tr className="border-t-2 border-gray-400 bg-gray-50 font-bold">
                      <td className="px-4 py-3">TOTAL AMOUNT</td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(
                          (booking.deliveryFee || 0) + 
                          (booking.rateCost || 0) + 
                          3000 + 300 + 300
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signature Section */}
            <div className="border-t-2 border-gray-300 pt-6 mt-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-sm">
                <div>
                  <div className="border-b border-gray-400 mb-2 pb-12"></div>
                  <p className="font-semibold">Driver Signature</p>
                  <p className="text-gray-600">Date: _______________</p>
                </div>
                <div>
                  <div className="border-b border-gray-400 mb-2 pb-12"></div>
                  <p className="font-semibold">Customer Signature</p>
                  <p className="text-gray-600">Date: _______________</p>
                </div>
                <div>
                  <div className="border-b border-gray-400 mb-2 pb-12"></div>
                  <p className="font-semibold">Company Representative</p>
                  <p className="text-gray-600">Date: _______________</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 mt-8 pt-4 border-t">
              <p>This is a computer-generated receipt and is valid without signature.</p>
              <p>Thank you for choosing Bestaccord Logistics for your transportation needs!</p>
              <p className="mt-2">Generated on: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptGenerator;