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
    region: "",
    province: "",
    city: "",
    barangay: "",
  });

  useEffect(() => {
    if (formData.region === "130000000") {
      setFormData((prev) => ({ ...prev, province: "Metro Manila" }));
    }
  }, [formData.region]);

  // Address dropdown states
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  // Fetch regions on mount
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const res = await axios.get("https://psgc.gitlab.io/api/regions/");
        setRegions(res.data);
      } catch (err) {
        console.error("Failed to fetch regions", err);
      }
    };
    fetchRegions();
  }, []);

  // Fetch provinces when region changes
  useEffect(() => {
    if (!formData.region) {
      setProvinces([]);
      return;
    }
    const fetchProvinces = async () => {
      try {
        // NCR region code is 130000000
        if (formData.region === "130000000") {
          // NCR: fetch all districts, then all provinces from each district
          const districtsRes = await axios.get("https://psgc.gitlab.io/api/regions/130000000/districts/");
          const districts = districtsRes.data;
          let allProvinces = [];
          for (const district of districts) {
            try {
              const provRes = await axios.get(`https://psgc.gitlab.io/api/districts/${district.code}/provinces/`);
              allProvinces = allProvinces.concat(provRes.data);
            } catch (err) {
              if (err.response && err.response.status === 404) {
                // Skip districts with no provinces
                continue;
              } else {
                console.error(`Error fetching provinces for district ${district.code}`, err);
              }
            }
          }
          setProvinces(allProvinces);
        } else {
          const res = await axios.get(`https://psgc.gitlab.io/api/regions/${formData.region}/provinces/`);
          setProvinces(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch provinces", err);
      }
    };
    fetchProvinces();
  }, [formData.region]);

  // Fetch cities/municipalities when province changes
  useEffect(() => {
    // NCR region code is 130000000
    if (formData.region === "130000000") {
      const fetchNcrCities = async () => {
        try {
          // Get all districts in NCR
          const districtsRes = await axios.get("https://psgc.gitlab.io/api/regions/130000000/districts/");
          const districts = districtsRes.data;
          let allCities = [];
          for (const district of districts) {
            let districtHasProvinces = true;
            let provinces = [];
            try {
              // Get all provinces in the district
              const provRes = await axios.get(`https://psgc.gitlab.io/api/districts/${district.code}/provinces/`);
              provinces = provRes.data;
            } catch (err) {
              if (err.response && err.response.status === 404) {
                districtHasProvinces = false;
              } else {
                console.error(`Error fetching provinces for district ${district.code}`, err);
              }
            }
            if (districtHasProvinces && provinces.length > 0) {
              for (const province of provinces) {
                try {
                  // Get all cities/municipalities in the province
                  const cityRes = await axios.get(`https://psgc.gitlab.io/api/provinces/${province.code}/cities-municipalities/`);
                  allCities = allCities.concat(cityRes.data);
                } catch (err) {
                  if (err.response && err.response.status === 404) {
                    // Suppress expected 404 errors
                    continue;
                  } else {
                    console.error(`Error fetching cities for province ${province.code}`, err);
                  }
                }
              }
            } else {
              // Try to fetch cities/municipalities directly under the district
              try {
                const cityRes = await axios.get(`https://psgc.gitlab.io/api/districts/${district.code}/cities-municipalities/`);
                allCities = allCities.concat(cityRes.data);
              } catch (err) {
                if (err.response && err.response.status === 404) {
                  // Suppress expected 404 errors
                  continue;
                } else {
                  console.error(`Error fetching cities for district ${district.code}`, err);
                }
              }
            }
          }
          setCities(allCities);
        } catch (err) {
          console.error("Failed to fetch NCR cities/municipalities", err);
        }
      };
      fetchNcrCities();
      return;
    }
    // Non-NCR: fetch cities/municipalities for selected province
    if (!formData.province) {
      setCities([]);
      return;
    }
    const fetchCities = async () => {
      try {
        const res = await axios.get(`https://psgc.gitlab.io/api/provinces/${formData.province}/cities-municipalities/`);
        setCities(res.data);
      } catch (err) {
        console.error("Failed to fetch cities/municipalities", err);
      }
    };
    fetchCities();
  }, [formData.province, formData.region]);

  // Fetch barangays when city/municipality changes
  useEffect(() => {
    if (!formData.city) {
      setBarangays([]);
      return;
    }
    const fetchBarangays = async () => {
      try {
        const res = await axios.get(`https://psgc.gitlab.io/api/cities-municipalities/${formData.city}/barangays/`);
        setBarangays(res.data);
      } catch (err) {
        console.error("Failed to fetch barangays", err);
      }
    };
    fetchBarangays();
  }, [formData.city]);

  const containerRef = useRef(null);

  const fetchClients = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/clients");
      // Filter out archived clients
      const activeClients = res.data.filter(client => !client.isArchived);
      setClients(activeClients);
      setFilteredClients(activeClients);

      // Extract unique values from active clients only
      setUniqueNames([...new Set(activeClients.map((c) => c.clientName))]);
      setUniqueBranches([...new Set(activeClients.map((c) => c.branch))]);
      setUniqueLocations([...new Set(activeClients.map((c) => c.location))]);
      setUniqueDates([
        ...new Set(
          activeClients.map((c) =>
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

  // Modal handlers
  const openModal = (client = null) => {
    if (client) {
      setEditClient(client);
      setFormData({
        clientName: client.clientName || "",
        location: client.location || "",
        branch: client.branch || "",
        region: client.region || "",
        province: client.province || "",
        city: client.city || "",
        barangay: client.barangay || "",
      });
    } else {
      setEditClient(null);
      setFormData({
        clientName: "",
        location: "",
        branch: "",
        region: "",
        province: "",
        city: "",
        barangay: "",
      });
    }
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Reset dependent fields when parent changes
    if (name === "region") {
      setFormData({ ...formData, region: value, province: "", city: "", barangay: "" });
    } else if (name === "province") {
      setFormData({ ...formData, province: value, city: "", barangay: "" });
    } else if (name === "city") {
      setFormData({ ...formData, city: value, barangay: "" });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Helper to get name from code
      const getName = (list, code) => {
        const found = list.find((item) => item.code === code);
        return found ? found.name : code;
      };
      const address = {
        region: getName(regions, formData.region),
        province: formData.region === "130000000" ? "Metro Manila" : getName(provinces, formData.province),
        city: getName(cities, formData.city),
        barangay: getName(barangays, formData.barangay),
      };
      const payload = {
        ...formData,
        address,
      };
      if (editClient) {
        await axios.put(
          `http://localhost:5000/api/clients/${editClient._id}`,
          payload
        );
        alert('Client updated successfully!');
      } else {
        await axios.post("http://localhost:5000/api/clients", payload);
        alert('Client created successfully!');
      }
      closeModal();
      fetchClients();
    } catch (err) {
      console.error(err);
      alert("Error adding/updating client");
    }
  };

  //Archive Handler
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to archive this client?")) return;

    try {
      await axios.patch(`http://localhost:5000/api/clients/${id}/archive`, {
        isArchived: true
      });
      alert('Client archived successfully');
      fetchClients();
    } catch (err) {
      console.error('Error archiving client:', err);
      alert('Error archiving client. Please try again.');
    }
  };

  // Navigate to client Info Page
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
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">No</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Client Name</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Location</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Branch</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Date Added</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedClients.map((client, index) => {
                  // Location and branch display logic
                  let city = "";
                  let barangay = "";
                  if (client.city || client.barangay) {
                    city = client.city;
                    barangay = client.barangay;
                  } else if (client.address) {
                    city = client.address.city || "";
                    barangay = client.address.barangay || "";
                  }
                  return (
                    <tr
                      key={client._id}
                      className="border-b last:border-none hover:bg-gray-50 transition duration-150"
                    >
                      <td className="px-6 py-3">{startIndex + index + 1}</td>
                      <td className="px-6 py-3">{client.clientName}</td>
                      <td className="px-6 py-3">{city}</td>
                      <td className="px-6 py-3">{barangay}</td>
                      <td className="px-6 py-3">{new Date(client.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-3 text-center space-x-2 inline-flex">
                        <button
                          onClick={() => viewCLient(client)}
                          className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50 inline-flex items-center gap-1 transition transform hover:scale-105"
                        >
                          <Eye />
                        </button>
                        <button
                          onClick={() => openModal(client)}
                          className="text-yellow-600 hover:text-yellow-800 px-3 py-1 rounded hover:bg-yellow-50 inline-flex items-center gap-1 transition transform hover:scale-105"
                        >
                          <Pencil />
                        </button>
                        <button
                          onClick={() => handleDelete(client._id)}
                          className="text-red-600 hover:text-red-800 px-3 py-1 rounded hover:bg-red-50 inline-flex items-center gap-1 transition transform hover:scale-105"
                        >
                          <Trash2 />
                        </button>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Floating Modal */}
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

              {/* Address Fields */}
              <select
                name="region"
                value={formData.region}
                onChange={handleChange}
                required
                className="border p-2 rounded focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">Select Region</option>
                {regions.map((r) => (
                  <option key={r.code} value={r.code}>{r.name}</option>
                ))}
              </select>
              {formData.region !== "130000000" ? (
                <select
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  required={!!formData.region}
                  className="border p-2 rounded focus:ring-2 focus:ring-indigo-400"
                  disabled={!formData.region}
                >
                  <option value="">Select Province</option>
                  {provinces.map((p) => (
                    <option key={p.code} value={p.code}>{p.name}</option>
                  ))}
                </select>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Province</label>
                  <div className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm bg-gray-50 text-gray-700">
                    Metro Manila (National Capital Region)
                  </div>
                </div>
              )}
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                required={formData.region === "130000000" || !!formData.province}
                className="border p-2 rounded focus:ring-2 focus:ring-indigo-400"
                disabled={formData.region !== "130000000" && !formData.province}
              >
                <option value="">Select City/Municipality</option>
                {cities.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
              <select
                name="barangay"
                value={formData.barangay}
                onChange={handleChange}
                required={!!formData.city}
                className="border p-2 rounded focus:ring-2 focus:ring-indigo-400"
                disabled={!formData.city}
              >
                <option value="">Select Barangay</option>
                {barangays.map((b) => (
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))}
              </select>

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