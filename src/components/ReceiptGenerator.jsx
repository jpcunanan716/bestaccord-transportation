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
      
      // Use more conservative html2canvas options to avoid modern CSS issues
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        // Disable modern CSS features that cause issues
        ignoreElements: (element) => {
          // Ignore elements that might use unsupported CSS
          return element.tagName === 'VIDEO' || element.tagName === 'CANVAS';
        },
        onclone: (clonedDoc) => {
          // Force simple colors and remove any problematic styles
          const clonedElement = clonedDoc.querySelector('[data-receipt-content]');
          if (clonedElement) {
            // Override any potentially problematic styles
            clonedElement.style.backgroundColor = '#ffffff';
            clonedElement.style.color = '#000000';
            
            // Remove any gradient or complex background styles
            const allElements = clonedElement.querySelectorAll('*');
            allElements.forEach(el => {
              // Force simple colors
              if (el.style.backgroundColor && el.style.backgroundColor.includes('oklch')) {
                el.style.backgroundColor = '#ffffff';
              }
              if (el.style.color && el.style.color.includes('oklch')) {
                el.style.color = '#000000';
              }
              // Remove problematic CSS properties
              el.style.removeProperty('backdrop-filter');
              el.style.removeProperty('filter');
            });
          }
        }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(5px)' }}>
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
          <div 
            ref={receiptRef} 
            data-receipt-content
            className="bg-white"
            style={{ 
              fontFamily: 'Arial, sans-serif',
              backgroundColor: '#ffffff',
              color: '#000000'
            }}
          >
            {/* Company Header */}
            <div 
              className="text-center pb-6 mb-6"
              style={{ 
                borderBottom: '2px solid #d1d5db',
                backgroundColor: '#ffffff'
              }}
            >
              <h1 
                className="text-3xl font-bold mb-2"
                style={{ 
                  color: '#111827',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}
              >
                BESTACCORD LOGISTICS
              </h1>
              <p 
                className="text-sm mb-1"
                style={{ 
                  color: '#6b7280',
                  fontSize: '14px',
                  marginBottom: '4px'
                }}
              >
                Professional Transportation & Logistics Services
              </p>
              <p 
                className="text-sm"
                style={{ 
                  color: '#6b7280',
                  fontSize: '14px'
                }}
              >
                📍 Metro Manila, Philippines | 📞 +63 XXX XXX XXXX
              </p>
            </div>

            {/* Receipt Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 
                  className="text-2xl font-bold mb-2"
                  style={{ 
                    color: '#111827',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    marginBottom: '8px'
                  }}
                >
                  DELIVERY RECEIPT
                </h2>
                <div className="space-y-1" style={{ fontSize: '12px', color: '#374151' }}>
                  <p><span style={{ fontWeight: 'bold' }}>Receipt No:</span> {receiptNumber}</p>
                  <p><span style={{ fontWeight: 'bold' }}>Trip No:</span> {booking.tripNumber}</p>
                  <p><span style={{ fontWeight: 'bold' }}>Reservation ID:</span> {booking.reservationId}</p>
                </div>
              </div>
              <div className="text-right" style={{ fontSize: '12px', color: '#374151' }}>
                <p><span style={{ fontWeight: 'bold' }}>Date Issued:</span></p>
                <p>{formatDate(new Date())}</p>
                <p className="mt-2"><span style={{ fontWeight: 'bold' }}>Delivery Date:</span></p>
                <p>{formatDate(booking.dateNeeded)}</p>
              </div>
            </div>

            {/* Customer & Route Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div 
                className="p-4 rounded"
                style={{ 
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff'
                }}
              >
                <h3 
                  className="font-bold mb-3 flex items-center"
                  style={{ 
                    color: '#111827',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '12px'
                  }}
                >
                  🏢 Customer Information
                </h3>
                <div className="space-y-2" style={{ fontSize: '12px' }}>
                  <p><span style={{ fontWeight: 'bold' }}>Company:</span> {booking.companyName}</p>
                  <p><span style={{ fontWeight: 'bold' }}>Contact:</span> {booking.customerEstablishmentName}</p>
                  <p><span style={{ fontWeight: 'bold' }}>Consignor:</span> {booking.shipperConsignorName}</p>
                </div>
              </div>
              
              <div 
                className="p-4 rounded"
                style={{ 
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff'
                }}
              >
                <h3 
                  className="font-bold mb-3 flex items-center"
                  style={{ 
                    color: '#111827',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '12px'
                  }}
                >
                  📍 Route Information
                </h3>
                <div className="space-y-2" style={{ fontSize: '12px' }}>
                  <p><span style={{ fontWeight: 'bold' }}>From:</span> {booking.originAddress}</p>
                  <p><span style={{ fontWeight: 'bold' }}>To:</span> {booking.destinationAddress}</p>
                  <p><span style={{ fontWeight: 'bold' }}>Area Code:</span> {booking.areaLocationCode}</p>
                </div>
              </div>
            </div>

            {/* Package Details */}
            <div className="mb-8">
              <h3 
                className="font-bold mb-4 flex items-center"
                style={{ 
                  color: '#111827',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginBottom: '16px'
                }}
              >
                📦 Package Details
              </h3>
              <div 
                className="rounded overflow-hidden"
                style={{ 
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff'
                }}
              >
                <table className="w-full" style={{ fontSize: '12px' }}>
                  <thead style={{ backgroundColor: '#f3f4f6' }}>
                    <tr>
                      <th 
                        className="px-4 py-3 text-left font-bold"
                        style={{ 
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontWeight: 'bold',
                          borderBottom: '1px solid #d1d5db'
                        }}
                      >
                        Product Name
                      </th>
                      <th 
                        className="px-4 py-3 text-left font-bold"
                        style={{ 
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontWeight: 'bold',
                          borderBottom: '1px solid #d1d5db'
                        }}
                      >
                        Quantity
                      </th>
                      <th 
                        className="px-4 py-3 text-left font-bold"
                        style={{ 
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontWeight: 'bold',
                          borderBottom: '1px solid #d1d5db'
                        }}
                      >
                        Weight
                      </th>
                      <th 
                        className="px-4 py-3 text-left font-bold"
                        style={{ 
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontWeight: 'bold',
                          borderBottom: '1px solid #d1d5db'
                        }}
                      >
                        Packages
                      </th>
                      <th 
                        className="px-4 py-3 text-left font-bold"
                        style={{ 
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontWeight: 'bold',
                          borderBottom: '1px solid #d1d5db'
                        }}
                      >
                        Units/Package
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderTop: '1px solid #d1d5db' }}>
                      <td style={{ padding: '12px 16px' }}>{booking.productName}</td>
                      <td style={{ padding: '12px 16px' }}>{booking.quantity?.toLocaleString()} pcs</td>
                      <td style={{ padding: '12px 16px' }}>{booking.grossWeight} tons</td>
                      <td style={{ padding: '12px 16px' }}>{booking.numberOfPackages} boxes</td>
                      <td style={{ padding: '12px 16px' }}>{booking.unitPerPackage} pcs/box</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vehicle & Team Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div 
                className="p-4 rounded"
                style={{ 
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff'
                }}
              >
                <h3 
                  className="font-bold mb-3 flex items-center"
                  style={{ 
                    color: '#111827',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '12px'
                  }}
                >
                  🚛 Vehicle Information
                </h3>
                <div className="space-y-2" style={{ fontSize: '12px' }}>
                  <p><span style={{ fontWeight: 'bold' }}>Vehicle Type:</span> {booking.vehicleType}</p>
                  <p><span style={{ fontWeight: 'bold' }}>Vehicle ID:</span> {booking.vehicleId}</p>
                  <p><span style={{ fontWeight: 'bold' }}>Plate Number:</span> {booking.vehicle?.plateNumber || 'N/A'}</p>
                </div>
              </div>
              
              <div 
                className="p-4 rounded"
                style={{ 
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff'
                }}
              >
                <h3 
                  className="font-bold mb-3 flex items-center"
                  style={{ 
                    color: '#111827',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '12px'
                  }}
                >
                  👥 Delivery Team
                </h3>
                <div className="space-y-2" style={{ fontSize: '12px' }}>
                  {booking.employeeDetails && booking.employeeDetails.length > 0 ? (
                    booking.employeeDetails.map((emp, idx) => (
                      <p key={idx}>
                        <span style={{ fontWeight: 'bold' }}>{emp.role}:</span> {emp.employeeName}
                      </p>
                    ))
                  ) : booking.employeeAssigned && booking.employeeAssigned.length > 0 ? (
                    booking.employeeAssigned.map((empId, idx) => (
                      <p key={idx}>
                        <span style={{ fontWeight: 'bold' }}>Team Member:</span> {empId}
                      </p>
                    ))
                  ) : (
                    <p style={{ color: '#6b7280' }}>No team assigned</p>
                  )}
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="mb-8">
              <h3 
                className="font-bold mb-4 flex items-center"
                style={{ 
                  color: '#111827',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginBottom: '16px'
                }}
              >
                💰 Cost Breakdown
              </h3>
              <div 
                className="rounded overflow-hidden"
                style={{ 
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff'
                }}
              >
                <table className="w-full" style={{ fontSize: '12px' }}>
                  <thead style={{ backgroundColor: '#f3f4f6' }}>
                    <tr>
                      <th 
                        className="px-4 py-3 text-left font-bold"
                        style={{ 
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontWeight: 'bold',
                          borderBottom: '1px solid #d1d5db'
                        }}
                      >
                        Description
                      </th>
                      <th 
                        className="px-4 py-3 text-right font-bold"
                        style={{ 
                          padding: '12px 16px',
                          textAlign: 'right',
                          fontWeight: 'bold',
                          borderBottom: '1px solid #d1d5db'
                        }}
                      >
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderTop: '1px solid #d1d5db' }}>
                      <td style={{ padding: '12px 16px' }}>Delivery Fee</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>{formatCurrency(booking.deliveryFee)}</td>
                    </tr>
                    <tr style={{ borderTop: '1px solid #d1d5db' }}>
                      <td style={{ padding: '12px 16px' }}>Rate Cost (Area)</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>{formatCurrency(booking.rateCost)}</td>
                    </tr>
                    <tr style={{ borderTop: '1px solid #d1d5db' }}>
                      <td style={{ padding: '12px 16px' }}>Fuel Cost</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>{formatCurrency(3000)}</td>
                    </tr>
                    <tr style={{ borderTop: '1px solid #d1d5db' }}>
                      <td style={{ padding: '12px 16px' }}>Service Charge</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>{formatCurrency(300)}</td>
                    </tr>
                    <tr style={{ borderTop: '1px solid #d1d5db' }}>
                      <td style={{ padding: '12px 16px' }}>Other Expenses</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>{formatCurrency(300)}</td>
                    </tr>
                    <tr 
                      className="font-bold"
                      style={{ 
                        borderTop: '2px solid #9ca3af',
                        backgroundColor: '#f9fafb',
                        fontWeight: 'bold'
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>TOTAL AMOUNT</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold' }}>
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
            <div 
              className="pt-6 mt-8"
              style={{ 
                borderTop: '2px solid #d1d5db',
                paddingTop: '24px',
                marginTop: '32px'
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center" style={{ fontSize: '12px' }}>
                <div>
                  <div 
                    className="mb-2 pb-12"
                    style={{ 
                      borderBottom: '1px solid #9ca3af',
                      marginBottom: '8px',
                      paddingBottom: '48px'
                    }}
                  ></div>
                  <p style={{ fontWeight: 'bold' }}>Driver Signature</p>
                  <p style={{ color: '#6b7280' }}>Date: _______________</p>
                </div>
                <div>
                  <div 
                    className="mb-2 pb-12"
                    style={{ 
                      borderBottom: '1px solid #9ca3af',
                      marginBottom: '8px',
                      paddingBottom: '48px'
                    }}
                  ></div>
                  <p style={{ fontWeight: 'bold' }}>Customer Signature</p>
                  <p style={{ color: '#6b7280' }}>Date: _______________</p>
                </div>
                <div>
                  <div 
                    className="mb-2 pb-12"
                    style={{ 
                      borderBottom: '1px solid #9ca3af',
                      marginBottom: '8px',
                      paddingBottom: '48px'
                    }}
                  ></div>
                  <p style={{ fontWeight: 'bold' }}>Company Representative</p>
                  <p style={{ color: '#6b7280' }}>Date: _______________</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div 
              className="text-center mt-8 pt-4"
              style={{ 
                textAlign: 'center',
                marginTop: '32px',
                paddingTop: '16px',
                borderTop: '1px solid #e5e7eb',
                fontSize: '10px',
                color: '#6b7280'
              }}
            >
              <p>This is a computer-generated receipt and is valid without signature.</p>
              <p>Thank you for choosing Bestaccord Logistics for your transportation needs!</p>
              <p style={{ marginTop: '8px' }}>Generated on: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptGenerator;