import { useState, useEffect } from 'react';
import axios from 'axios';
import { Archive as ArchiveIcon, Package, Car, Users, Building, FileText, Trash, History } from 'lucide-react';

export default function Archive() {
  const [activeTab, setActiveTab] = useState('bookings');
  const [archivedData, setArchivedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Fetch archived data based on active tab
  useEffect(() => {
    const fetchArchivedData = async () => {
      setLoading(true);
      try {
        // Update the API endpoint to use /api/archive/:type/archived
        const response = await axios.get(`http://localhost:5000/api/archive/${activeTab}/archived`);
        setArchivedData(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch archived data');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArchivedData();
  }, [activeTab]);

  // Add handleRestore function
  const handleRestore = async (id) => {
    try {
      await axios.patch(`http://localhost:5000/api/archive/${activeTab}/${id}/restore`);
      // Refresh the data after restoration
      const response = await axios.get(`http://localhost:5000/api/archive/${activeTab}/archived`);
      setArchivedData(response.data);
      alert('Item restored successfully');
    } catch (err) {
      console.error('Error restoring item:', err);
      alert('Failed to restore item');
    }
  };

  // Add permanent delete functions
  const openDeleteModal = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setItemToDelete(null);
    setShowDeleteModal(false);
  };

  const handlePermanentDelete = async () => {
    if (!itemToDelete) return;

    try {
      await axios.delete(`http://localhost:5000/api/${activeTab}/${itemToDelete._id}`);
      // Refresh the data after deletion
      const response = await axios.get(`http://localhost:5000/api/archive/${activeTab}/archived`);
      setArchivedData(response.data);
      closeDeleteModal();
      alert('Item permanently deleted');
    } catch (err) {
      console.error('Error permanently deleting item:', err);
      alert('Failed to delete item permanently');
    }
  };

  // Tab configuration
  const tabs = [
    { id: 'bookings', label: 'Bookings', icon: Package },
    { id: 'tripReports', label: 'Trip Reports', icon: FileText },
    { id: 'clients', label: 'Clients', icon: Building },
    { id: 'vehicles', label: 'Vehicles', icon: Car },
    { id: 'employees', label: 'Employees', icon: Users },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <ArchiveIcon className="w-6 h-6 text-gray-700" />
        <h1 className="text-2xl font-bold text-gray-800">Archive</h1>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-2 rounded-lg flex items-center gap-2
              ${activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
              transition duration-150
            `}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  {getTableHeaders(activeTab).map(header => (
                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {archivedData.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    {getTableCells(activeTab, item)}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRestore(item._id)}
                        className="text-yellow-600 hover:text-yellow-800 px-3 py-1 rounded hover:bg-yellow-50"
                      >
                        <History></History>
                      </button>
                      <button
                        onClick={() => openDeleteModal(item)}
                        className="text-red-600 hover:text-red-800 px-3 py-1 rounded hover:bg-red-50"
                      >
                        <Trash></Trash>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Warning Modal for Permanent Delete */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-center">
          <div
            className="absolute inset-0 bg-black opacity-50"
            onClick={closeDeleteModal}
          ></div>

          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 z-10 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Permanently Delete Item</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Are you absolutely sure you want to permanently delete this {activeTab.slice(0, -1)}?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800 font-medium">
                  Warning: This will permanently remove all data associated with this item from the database. This action is irreversible.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handlePermanentDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-150 font-medium"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to get table cells based on active tab
function getTableHeaders(tab) {
  switch (tab) {
    case 'bookings':
      return ['Reservation ID', 'Reservation Date', 'Vehicle Type', 'Destination'];
    case 'tripReports':
      return ['Receipt Number', 'Document Type', 'File Name', 'Uploaded By', 'Notes'];
    case 'clients':
      return ['Client Name', 'Location', 'Branch', 'Date Added'];
    case 'vehicles':
      return ['Vehicle ID', 'Type', 'Plate Number', 'Status'];
    case 'employees':
      return ['Employee ID', 'Name', 'Role', 'Status'];
    default:
      return [];
  }
}

// Helper function to get table cells based on active tab
function getTableCells(tab, item) {
  switch (tab) {
    case 'bookings':
      return (
        <>
          <td className="px-6 py-4">{item.reservationId}</td>
          <td className="px-6 py-4">{new Date(item.createdAt).toLocaleDateString()}</td>
          <td className="px-6 py-4">{item.vehicleType === "Truck" ? 6 : 4}-Wheeler</td>
          <td className="px-6 py-4">{item.destinationAddress}</td>
        </>
      );
    case 'clients':
      return (
        <>
          <td className="px-6 py-4">{item.clientName}</td>
          <td className="px-6 py-4">
            {item.address?.city || item.city || 'N/A'}
          </td>
          <td className="px-6 py-4">
            {item.address?.barangay || item.barangay || 'N/A'}
          </td>
          <td className="px-6 py-4">
            {new Date(item.createdAt).toLocaleDateString()}
          </td>
        </>
      );
    case 'tripReports':
      return (
        <>
          <td className="px-6 py-4">{item.receiptNumber || 'N/A'}</td>
          <td className="px-6 py-4">{item.documentType || 'N/A'}</td>
          <td className="px-6 py-4">{item.fileName || 'N/A'}</td>
          <td className="px-6 py-4">{item.uploadedBy || 'N/A'}</td>
          <td className="px-6 py-4">{item.notes || 'N/A'}</td>
        </>
      );
    case 'vehicles':
      return (
        <>
          <td className="px-6 py-4">{item.vehicleId || 'N/A'}</td>
          <td className="px-6 py-4">{item.vehicleType || item.type || 'N/A'}</td>
          <td className="px-6 py-4">{item.plateNumber || 'N/A'}</td>
          <td className="px-6 py-4">{item.status || 'N/A'}</td>
        </>
      );
    case 'employees':
      return (
        <>
          <td className="px-6 py-4">{item.employeeId || 'N/A'}</td>
          <td className="px-6 py-4">{item.fullName || item.name || 'N/A'}</td>
          <td className="px-6 py-4">{item.role || 'N/A'}</td>
          <td className="px-6 py-4">{item.status || 'N/A'}</td>
        </>
      );
    default:
      return <td colSpan="100%" className="px-6 py-4 text-center">No data available</td>;
  }
}
