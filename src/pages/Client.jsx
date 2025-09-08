import { useState, useEffect, useRef } from "react";
import axios from "axios";

function Client() {
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState(null);

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
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

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

        {/* Rounded Table Container */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto">
              <thead className="bg-gray-100 rounded-t-lg">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">#</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Client Name</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Location</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Branch</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Date Added</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client, index) => (
                  <tr
                    key={client._id}
                    className="border-b last:border-none hover:bg-gray-50 transition duration-150"
                  >
                    <td className="px-6 py-3">{index + 1}</td>
                    <td className="px-6 py-3">{client.clientName}</td>
                    <td className="px-6 py-3">{client.location}</td>
                    <td className="px-6 py-3">{client.branch}</td>
                    <td className="px-6 py-3">{new Date(client.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-3 space-x-2">
                      <button
                        onClick={() => openModal(client)}
                        className="px-3 py-1 bg-yellow-400 text-white rounded shadow hover:bg-yellow-500 transition transform hover:scale-105"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(client._id)}
                        className="px-3 py-1 bg-red-500 text-white rounded shadow hover:bg-red-600 transition transform hover:scale-105"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Floating Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-center">
          <div
            className="absolute inset-0 bg-black opacity-20"
            onClick={closeModal}
          ></div>

          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md ml-32 p-6 z-10 animate-fade-in">
            <h2 className="text-xl font-bold mb-4">{editClient ? "Edit Client" : "Add Client"}</h2>

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
