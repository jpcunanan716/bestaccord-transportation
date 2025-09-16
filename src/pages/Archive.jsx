import { useState, useEffect } from 'react';
import axios from 'axios';
import { Archive as ArchiveIcon, Package, Car, Users, Building, FileText } from 'lucide-react';

export default function Archive() {
  const [activeTab, setActiveTab] = useState('bookings');
  const [archivedData, setArchivedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch archived data based on active tab
  useEffect(() => {
    const fetchArchivedData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:5000/api/${activeTab}/archived`);
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
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to get table headers based on active tab
function getTableHeaders(tab) {
  switch (tab) {
    case 'bookings':
      return ['Reservation ID', 'Trip Number', 'Company', 'Status', 'Date'];
    case 'tripReports':
      return ['Trip Number', 'Driver', 'Date', 'Status'];
    case 'clients':
      return ['Client Name', 'Contact Person', 'Contact Number', 'Address'];
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
          <td className="px-6 py-4">{item.tripNumber}</td>
          <td className="px-6 py-4">{item.companyName}</td>
          <td className="px-6 py-4">{item.status}</td>
          <td className="px-6 py-4">{new Date(item.dateNeeded).toLocaleDateString()}</td>
        </>
      );
    // Add cases for other tabs...
    default:
      return null;
  }
}
