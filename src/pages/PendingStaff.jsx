import { useEffect, useState } from "react";
import axios from "axios";

export default function PendingStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/staff/pending");
      setStaff(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const approveStaff = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/staff/approve/${id}`);
      setStaff(staff.filter((s) => s._id !== id));
      alert("Staff approved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to approve staff.");
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  if (loading) return <p>Loading pending staff...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Pending Staff Approvals</h1>
      {staff.length === 0 ? (
        <p className="text-gray-600">No pending staff at the moment.</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s._id} className="border-t">
                  <td className="px-6 py-3">{s.name}</td>
                  <td className="px-6 py-3">{s.email}</td>
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => approveStaff(s._id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md transition"
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
