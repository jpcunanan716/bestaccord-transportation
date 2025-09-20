import React, { useState, useRef } from 'react';
import { Download, FileText, Calendar, MapPin, Package, Truck, User, Building } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const InvoiceGenerator = ({ booking, onClose, onInvoiceGenerated }) => {
  const [generating, setGenerating] = useState(false);
  const invoiceRef = useRef(null);

  // Generate invoice number based on booking data
  const generateInvoiceNumber = () => {
    const date = new Date();
    const timestamp = date.getTime().toString().slice(-6);
    return `INV${booking.reservationId?.slice(-6) || timestamp}`;
  };

  const invoiceNumber = generateInvoiceNumber();

  const downloadAsPDF = async () => {
    if (!invoiceRef.current) return;
    
    setGenerating(true);
    try {
      const element = invoiceRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        ignoreElements: (element) => {
          return element.tagName === 'VIDEO' || element.tagName === 'CANVAS';
        },
        onclone: (clonedDoc) => {
          // Force override all styles to prevent oklch/oklab issues
          const clonedElement = clonedDoc.querySelector('[data-invoice-content]');
          if (clonedElement) {
            // Override root element
            clonedElement.style.setProperty('background-color', '#ffffff', 'important');
            clonedElement.style.setProperty('color', '#000000', 'important');
            clonedElement.style.setProperty('font-family', 'Arial, sans-serif', 'important');
            
            // Override all child elements
            const allElements = clonedElement.querySelectorAll('*');
            allElements.forEach(el => {
              // Force remove any computed styles that might contain oklch/oklab
              const computedStyle = window.getComputedStyle(el);
              
              // Override background colors
              if (computedStyle.backgroundColor.includes('oklch') || computedStyle.backgroundColor.includes('oklab')) {
                el.style.setProperty('background-color', '#ffffff', 'important');
              }
              
              // Override text colors
              if (computedStyle.color.includes('oklch') || computedStyle.color.includes('oklab')) {
                el.style.setProperty('color', '#000000', 'important');
              }
              
              // Override border colors
              if (computedStyle.borderColor.includes('oklch') || computedStyle.borderColor.includes('oklab')) {
                el.style.setProperty('border-color', '#d1d5db', 'important');
              }
              
              // Remove problematic properties
              el.style.removeProperty('backdrop-filter');
              el.style.removeProperty('filter');
              el.style.removeProperty('box-shadow');
              
              // Force simple colors for common elements
              if (el.tagName === 'BUTTON') {
                if (el.textContent.includes('Download')) {
                  el.style.setProperty('background-color', '#2563eb', 'important');
                  el.style.setProperty('color', '#ffffff', 'important');
                } else {
                  el.style.setProperty('background-color', '#d1d5db', 'important');
                  el.style.setProperty('color', '#374151', 'important');
                }
              }
              
              if (el.tagName === 'TH') {
                el.style.setProperty('background-color', '#f3f4f6', 'important');
                el.style.setProperty('color', '#000000', 'important');
              }
              
              if (el.classList.contains('payment-terms') || el.style.backgroundColor === 'rgb(239, 246, 255)') {
                el.style.setProperty('background-color', '#eff6ff', 'important');
                el.style.setProperty('color', '#1e40af', 'important');
              }
            });
            
            // Add a style tag to override any remaining problematic styles
            const styleTag = clonedDoc.createElement('style');
            styleTag.textContent = `
              * {
                background-color: inherit !important;
                color: inherit !important;
              }
              [data-invoice-content] * {
                font-family: Arial, sans-serif !important;
              }
            `;
            clonedDoc.head.appendChild(styleTag);
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
      
      const fileName = `Invoice_${invoiceNumber}_${booking.tripNumber}.pdf`;
      pdf.save(fileName);
      
      if (onInvoiceGenerated) {
        onInvoiceGenerated({
          invoiceNumber,
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

  const getDueDate = () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    return dueDate;
  };

  // Inline styles only - no Tailwind classes
  const styles = {
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(5px)'
    },
    modalContent: {
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      maxWidth: '1000px',
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto'
    },
    header: {
      position: 'sticky',
      top: 0,
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      padding: '16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    title: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#111827'
    },
    buttonGroup: {
      display: 'flex',
      gap: '8px'
    },
    downloadBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      backgroundColor: '#2563eb',
      color: '#ffffff',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px'
    },
    closeBtn: {
      padding: '8px 16px',
      backgroundColor: '#d1d5db',
      color: '#374151',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px'
    },
    content: {
      padding: '32px'
    },
    invoice: {
      backgroundColor: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      color: '#000000'
    },
    companyHeader: {
      textAlign: 'center',
      borderBottom: '2px solid #d1d5db',
      paddingBottom: '24px',
      marginBottom: '24px',
      backgroundColor: '#ffffff'
    },
    companyName: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: '8px'
    },
    companyInfo: {
      color: '#6b7280',
      fontSize: '14px',
      marginBottom: '4px'
    },
    invoiceHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '32px'
    },
    invoiceTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: '8px'
    },
    invoiceDetails: {
      fontSize: '12px',
      color: '#374151'
    },
    dateInfo: {
      textAlign: 'right',
      fontSize: '12px',
      color: '#374151'
    },
    dueDate: {
      color: '#dc2626',
      fontWeight: 'bold'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '24px',
      marginBottom: '32px'
    },
    card: {
      border: '1px solid #d1d5db',
      padding: '16px',
      borderRadius: '4px',
      backgroundColor: '#ffffff'
    },
    cardTitle: {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: '12px'
    },
    cardContent: {
      fontSize: '12px'
    },
    table: {
      width: '100%',
      fontSize: '12px',
      borderCollapse: 'collapse'
    },
    tableContainer: {
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      overflow: 'hidden',
      backgroundColor: '#ffffff',
      marginBottom: '32px'
    },
    tableHeader: {
      backgroundColor: '#f3f4f6',
      padding: '12px 16px',
      textAlign: 'left',
      fontWeight: 'bold',
      borderBottom: '1px solid #d1d5db'
    },
    tableHeaderRight: {
      backgroundColor: '#f3f4f6',
      padding: '12px 16px',
      textAlign: 'right',
      fontWeight: 'bold',
      borderBottom: '1px solid #d1d5db'
    },
    tableCell: {
      padding: '12px 16px',
      borderTop: '1px solid #d1d5db'
    },
    tableCellRight: {
      padding: '12px 16px',
      borderTop: '1px solid #d1d5db',
      textAlign: 'right'
    },
    totalRow: {
      borderTop: '2px solid #9ca3af',
      backgroundColor: '#fef3c7',
      fontWeight: 'bold'
    },
    totalCell: {
      padding: '12px 16px',
      fontWeight: 'bold'
    },
    totalAmount: {
      padding: '12px 16px',
      textAlign: 'right',
      fontWeight: 'bold',
      fontSize: '14px'
    },
    paymentTerms: {
      backgroundColor: '#eff6ff',
      border: '1px solid #bfdbfe',
      padding: '16px',
      borderRadius: '4px',
      marginBottom: '32px'
    },
    paymentTitle: {
      fontWeight: 'bold',
      marginBottom: '8px',
      color: '#1d4ed8'
    },
    paymentContent: {
      fontSize: '12px',
      color: '#1e40af'
    },
    footer: {
      textAlign: 'center',
      marginTop: '32px',
      paddingTop: '16px',
      borderTop: '1px solid #e5e7eb',
      fontSize: '10px',
      color: '#6b7280'
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: '16px'
    }
  };

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        {/* Modal Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Generate Invoice</h2>
          <div style={styles.buttonGroup}>
            <button
              onClick={downloadAsPDF}
              disabled={generating}
              style={{
                ...styles.downloadBtn,
                opacity: generating ? 0.5 : 1,
                cursor: generating ? 'not-allowed' : 'pointer'
              }}
            >
              <Download size={16} />
              <span>{generating ? 'Generating...' : 'Download PDF'}</span>
            </button>
            <button onClick={onClose} style={styles.closeBtn}>
              Close
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div style={styles.content}>
          <div ref={invoiceRef} data-invoice-content style={styles.invoice}>
            {/* Company Header */}
            <div style={styles.companyHeader}>
              <h1 style={styles.companyName}>BESTACCORD LOGISTICS</h1>
              <p style={styles.companyInfo}>Professional Transportation & Logistics Services</p>
              <p style={styles.companyInfo}>Metro Manila, Philippines | +63 XXX XXX XXXX</p>
            </div>

            {/* Invoice Header */}
            <div style={styles.invoiceHeader}>
              <div>
                <h2 style={styles.invoiceTitle}>INVOICE</h2>
                <div style={styles.invoiceDetails}>
                  <p style={{ marginBottom: '4px' }}><span style={{ fontWeight: 'bold' }}>Invoice No:</span> {invoiceNumber}</p>
                  <p style={{ marginBottom: '4px' }}><span style={{ fontWeight: 'bold' }}>Trip No:</span> {booking.tripNumber}</p>
                  <p><span style={{ fontWeight: 'bold' }}>Reservation ID:</span> {booking.reservationId}</p>
                </div>
              </div>
              <div style={styles.dateInfo}>
                <p><span style={{ fontWeight: 'bold' }}>Invoice Date:</span></p>
                <p style={{ marginBottom: '8px' }}>{formatDate(new Date())}</p>
                <p><span style={{ fontWeight: 'bold' }}>Service Date:</span></p>
                <p style={{ marginBottom: '8px' }}>{formatDate(booking.dateNeeded)}</p>
                <p><span style={{ fontWeight: 'bold' }}>Due Date:</span></p>
                <p style={styles.dueDate}>{formatDate(getDueDate())}</p>
              </div>
            </div>

            {/* Bill To & Service Information */}
            <div style={styles.grid}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Bill To</h3>
                <div style={styles.cardContent}>
                  <p style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>{booking.companyName}</p>
                  <p style={{ marginBottom: '8px' }}><span style={{ fontWeight: 'bold' }}>Contact Person:</span> {booking.customerEstablishmentName}</p>
                  <p style={{ marginBottom: '8px' }}><span style={{ fontWeight: 'bold' }}>Consignor:</span> {booking.shipperConsignorName}</p>
                  <p><span style={{ fontWeight: 'bold' }}>Address:</span> {booking.originAddress}</p>
                </div>
              </div>
              
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Service Details</h3>
                <div style={styles.cardContent}>
                  <p style={{ marginBottom: '8px' }}><span style={{ fontWeight: 'bold' }}>Service:</span> Logistics & Transportation</p>
                  <p style={{ marginBottom: '8px' }}><span style={{ fontWeight: 'bold' }}>Route:</span> {booking.originAddress} → {booking.destinationAddress}</p>
                  <p style={{ marginBottom: '8px' }}><span style={{ fontWeight: 'bold' }}>Vehicle:</span> {booking.vehicleType}</p>
                  <p><span style={{ fontWeight: 'bold' }}>Area Code:</span> {booking.areaLocationCode}</p>
                </div>
              </div>
            </div>

            {/* Package Details */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={styles.sectionTitle}>Items Transported</h3>
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.tableHeader}>Product Name</th>
                      <th style={styles.tableHeader}>Quantity</th>
                      <th style={styles.tableHeader}>Weight</th>
                      <th style={styles.tableHeader}>Packages</th>
                      <th style={styles.tableHeader}>Units/Package</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={styles.tableCell}>{booking.productName}</td>
                      <td style={styles.tableCell}>{booking.quantity?.toLocaleString()} pcs</td>
                      <td style={styles.tableCell}>{booking.grossWeight} tons</td>
                      <td style={styles.tableCell}>{booking.numberOfPackages} boxes</td>
                      <td style={styles.tableCell}>{booking.unitPerPackage} pcs/box</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vehicle & Team Information */}
            <div style={styles.grid}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Vehicle Used</h3>
                <div style={styles.cardContent}>
                  <p style={{ marginBottom: '8px' }}><span style={{ fontWeight: 'bold' }}>Vehicle Type:</span> {booking.vehicleType}</p>
                  <p style={{ marginBottom: '8px' }}><span style={{ fontWeight: 'bold' }}>Vehicle ID:</span> {booking.vehicleId}</p>
                  <p><span style={{ fontWeight: 'bold' }}>Plate Number:</span> {booking.vehicle?.plateNumber || 'N/A'}</p>
                </div>
              </div>
              
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Service Team</h3>
                <div style={styles.cardContent}>
                  {booking.employeeDetails && booking.employeeDetails.length > 0 ? (
                    booking.employeeDetails.map((emp, idx) => (
                      <p key={idx} style={{ marginBottom: '8px' }}>
                        <span style={{ fontWeight: 'bold' }}>{emp.role}:</span> {emp.employeeName}
                      </p>
                    ))
                  ) : booking.employeeAssigned && booking.employeeAssigned.length > 0 ? (
                    booking.employeeAssigned.map((empId, idx) => (
                      <p key={idx} style={{ marginBottom: '8px' }}>
                        <span style={{ fontWeight: 'bold' }}>Team Member:</span> {empId}
                      </p>
                    ))
                  ) : (
                    <p style={{ color: '#6b7280' }}>No team assigned</p>
                  )}
                </div>
              </div>
            </div>

            {/* Invoice Summary */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={styles.sectionTitle}>Invoice Summary</h3>
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.tableHeader}>Description</th>
                      <th style={styles.tableHeaderRight}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={styles.tableCell}>Transportation Service Fee</td>
                      <td style={styles.tableCellRight}>{formatCurrency(booking.deliveryFee)}</td>
                    </tr>
                    <tr>
                      <td style={styles.tableCell}>Area Rate Charge</td>
                      <td style={styles.tableCellRight}>{formatCurrency(booking.rateCost)}</td>
                    </tr>
                    <tr>
                      <td style={styles.tableCell}>Fuel Surcharge</td>
                      <td style={styles.tableCellRight}>{formatCurrency(3000)}</td>
                    </tr>
                    <tr>
                      <td style={styles.tableCell}>Service Charge</td>
                      <td style={styles.tableCellRight}>{formatCurrency(300)}</td>
                    </tr>
                    <tr>
                      <td style={styles.tableCell}>Other Charges</td>
                      <td style={styles.tableCellRight}>{formatCurrency(300)}</td>
                    </tr>
                    <tr style={styles.totalRow}>
                      <td style={styles.totalCell}>TOTAL AMOUNT DUE</td>
                      <td style={styles.totalAmount}>
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

            {/* Payment Terms */}
            <div style={styles.paymentTerms}>
              <h4 style={styles.paymentTitle}>Payment Terms & Instructions</h4>
              <div style={styles.paymentContent}>
                <p style={{ marginBottom: '4px' }}><span style={{ fontWeight: 'bold' }}>Payment Due:</span> 30 days from invoice date</p>
                <p style={{ marginBottom: '4px' }}><span style={{ fontWeight: 'bold' }}>Late Fee:</span> 2% per month on overdue amounts</p>
                <p style={{ marginBottom: '4px' }}><span style={{ fontWeight: 'bold' }}>Payment Methods:</span> Bank transfer, Check, Cash</p>
                <p style={{ marginBottom: '8px' }}><span style={{ fontWeight: 'bold' }}>Bank Details:</span> [Bank Name] - Account: XXXX-XXXX-XXXX</p>
                <p style={{ fontStyle: 'italic' }}>Please include invoice number in payment reference.</p>
              </div>
            </div>

            {/* Footer */}
            <div style={styles.footer}>
              <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>Thank you for choosing Bestaccord Logistics!</p>
              <p style={{ marginBottom: '8px' }}>For inquiries about this invoice, please contact us at billing@bestaccord.com</p>
              <p>Generated on: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;