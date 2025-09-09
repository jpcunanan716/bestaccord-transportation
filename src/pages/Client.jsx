import { useState, useEffect, useRef } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Client() {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const navigate = useNavigate();

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Search states
  const [searchName, setSearchName] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [searchBranch, setSearchBranch] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [generalSearch, setGeneralSearch] = useState("");

  // Unique filter values
  const [uniqueNames, setUniqueNames] = useState([]);
  const [uniqueBranches, setUniqueBranches] = useState([]);
  const [uniqueLocations, setUniqueLocations] = useState([]);
  const [uniqueDates, setUniqueDates] = useState([]);

  const [formData, setFormData] = useState({
    clientName: "",
    location: "",
    branch: "",
  });

  const containerRef = useRef(null);

  const fetchClients = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/clients");
      setClients(res.data);
      setFilteredClients(res.data);

      // Extract unique values
      setUniqueNames([...new Set(res.data.map((c) => c.clientName))]);
      setUniqueBranches([...new Set(res.data.map((c) => c.branch))]);
      setUniqueLocations([...new Set(res.data.map((c) => c.location))]);
      setUniqueDates([
        ...new Set(
          res.data.map((c) =>
            new Date(c.createdAt).toLocaleDateString()
          )
        ),
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Filter function
  useEffect(() => {
    let results = clients;

    if (searchName) {
      results = results.filter((client) => client.clientName === searchName);
    }
    if (searchLocation) {
      results = results.filter((client) => client.location === searchLocation);
    }
    if (searchBranch) {
      results = results.filter((client) => client.branch === searchBranch);
    }
    if (searchDate) {
      results = results.filter(
        (client) =>
          new Date(client.createdAt).toLocaleDateString() === searchDate
      );
    }
    if (generalSearch) {
      results = results.filter(
        (client) =>
          client.clientName
            ?.toLowerCase()
            .includes(generalSearch.toLowerCase()) ||
          client.location
            ?.toLowerCase()
            .includes(generalSearch.toLowerCase()) ||
          client.branch?.toLowerCase().includes(generalSearch.toLowerCase()) ||
          new Date(client.createdAt)
            .toLocaleDateString()
            .includes(generalSearch)
      );
    }

    setFilteredClients(results);
    setCurrentPage(1); // reset to page 1 when filters change
  }, [searchName, searchBranch, searchLocation, searchDate, generalSearch, clients]);

  // Pagination logic
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filteredClients.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const openModal = (client = null) => {
    if (client) {
      setEditClient(client);
      setFormData({
        clientName: client.clientName,
        location: client.location,
        branch: client.branch,
      });
    } else {
      setEditClient(null);
      setFormData({
        clientName: "",
        location: "",
        branch: "",
      });
    }
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editClient) {
        await axios.put(
          `http://localhost:5000/api/clients/${editClient._id}`,
          formData
        );
      } else {
        await axios.post("http://localhost:5000/api/clients", formData);
      }
      closeModal();
      fetchClients();
    } catch (err) {
      console.error(err);
      alert("Error adding/updating client");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this client?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/clients/${id}`);
      fetchClients();
    } catch (err) {
      console.error(err);
    }
  };

  const viewCLient = (client) => {
    navigate(`/dashboard/client/${client._id}`);
  };

  return (
    <>
      {/* Page Content */}
      <div
        ref={containerRef}
        className={`transition duration-200 ${showModal ? "filter blur-sm" : ""}`}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Clients</h1>
          <button
            onClick={() => openModal()}
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg hover:scale-105 transform transition"
          >
            Add Client
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <select
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All Clients</option>
            {uniqueNames.map((name, i) => (
              <option key={i} value={name}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={searchBranch}
            onChange={(e) => setSearchBranch(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All Branches</option>
            {uniqueBranches.map((branch, i) => (
              <option key={i} value={branch}>
                {branch}
              </option>
            ))}
          </select>

          <select
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All Locations</option>
            {uniqueLocations.map((location, i) => (
              <option key={i} value={location}>
                {location}
              </option>
            ))}
          </select>

          <select
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All Dates</option>
            {uniqueDates.map((date, i) => (
              <option key={i} value={date}>
                {date}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="General Search"
            value={generalSearch}
            onChange={(e) => setGeneralSearch(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto">
              <thead className="bg-gray-100 rounded-t-lg">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">
                    No
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">
                    Client Name
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">
                    Date Added
                  </th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedClients.map((client, index) => (
                  <tr
                    key={client._id}
                    className="border-b last:border-none hover:bg-gray-50 transition duration-150"
                  >
                    <td className="px-6 py-3">{startIndex + index + 1}</td>
                    <td className="px-6 py-3">{client.clientName}</td>
                    <td className="px-6 py-3">{client.location}</td>
                    <td className="px-6 py-3">{client.branch}</td>
                    <td className="px-6 py-3">
                      {new Date(client.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-right space-x-2">
                      <button
                        onClick={() => viewCLient(client)}
                        className="px-3 py-1 bg-blue-500 text-white rounded shadow hover:bg-blue-600 inline-flex items-center gap-1 transition transform hover:scale-105"
                      >
                        <Eye size={16} /> View
                      </button>
                      <button
                        onClick={() => openModal(client)}
                        className="px-3 py-1 bg-yellow-400 text-white rounded shadow hover:bg-yellow-500 inline-flex items-center gap-1 transition transform hover:scale-105"
                      >
                        <Pencil size={16} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(client._id)}
                        className="px-3 py-1 bg-red-500 text-white rounded shadow hover:bg-red-600 inline-flex items-center gap-1 transition transform hover:scale-105"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg shadow ${currentPage === 1
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
            >
              Previous
            </button>
            <p className="text-gray-600 text-sm">
              Page {currentPage} of {totalPages}
            </p>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg shadow ${currentPage === totalPages
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Floating Modal (unchanged) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-center">
          <div
            className="absolute inset-0 bg-black opacity-20"
            onClick={closeModal}
          ></div>

          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md ml-32 p-6 z-10 animate-fade-in">
            <h2 className="text-xl font-bold mb-4">
              {editClient ? "Edit Client" : "Add Client"}
            </h2>

            <form onSubmit={handleSubmit} className="grid gap-3 grid-cols-1">
              <input
                type="text"
                name="clientName"
                placeholder="Client Name"
                value={formData.clientName}
                onChange={handleChange}
                required
                className="border p-2 rounded focus:ring-2 focus:ring-indigo-400"
              />
              <input
                type="text"
                name="location"
                placeholder="Location"
                value={formData.location}
                onChange={handleChange}
                required
                className="border p-2 rounded focus:ring-2 focus:ring-indigo-400"
              />
              <input
                type="text"
                name="branch"
                placeholder="Branch"
                value={formData.branch}
                onChange={handleChange}
                required
                className="border p-2 rounded focus:ring-2 focus:ring-indigo-400"
              />

              <div className="flex justify-end space-x-2 mt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2 bg-gray-300 rounded-lg shadow hover:scale-105 transform transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:scale-105 transform transition"
                >
                  {editClient ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Client;
