import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Wrench } from "lucide-react";

import api from "../../api/axios";

import "../../styles/owner/dashboard.css";

const STATUS_OPTIONS = ["pending", "in_progress", "resolved"];

function OwnerMaintenance() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchRequests = async () => {
    try {
      const res = await api.get("/maintenance/owner-requests");
      setRequests(res.data.requests || []);
    } catch (error) {
      console.error("OWNER MAINTENANCE FETCH ERROR:", error);
      toast.error(error.response?.data?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusChange = async (id, status) => {
    setUpdatingId(id);
    try {
      await api.put(`/maintenance/${id}/status`, { status });
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status } : r))
      );
      toast.success("Status updated");
    } catch (error) {
      console.error("UPDATE MAINTENANCE STATUS ERROR:", error);
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="owner-dashboard">
        <p>Loading maintenance requests...</p>
      </div>
    );
  }

  return (
    <div className="owner-dashboard">
      <button className="owner-detail-back" onClick={() => navigate("/owner/dashboard")}>
        ← Back to Dashboard
      </button>

      <div className="owner-dashboard-top">
        <div>
          <h2>Maintenance Requests</h2>
          <p>{requests.length} request(s) across your rooms.</p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="owner-empty-state">
          <p>No maintenance requests right now.</p>
        </div>
      ) : (
        requests.map((r) => (
          <div key={r._id} className="owner-reminder-item">
            <div className="owner-reminder-info">
              <strong>{r.title}</strong>
              <div>
                {r.room?.roomNumber ? `Room ${r.room.roomNumber}` : ""} · {r.tenant?.name || "Tenant"}
              </div>
              <div className="owner-reminder-due" style={{ textTransform: "capitalize" }}>
                {r.category} · {new Date(r.createdAt).toLocaleDateString("en-IN")}
              </div>
              <p style={{ margin: "6px 0", fontSize: 13, color: "#4b5563" }}>
                {r.description}
              </p>
              {r.photoUrl && (
                <a href={r.photoUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={r.photoUrl}
                    alt="issue"
                    loading="lazy"
                    style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, marginTop: 6 }}
                  />
                </a>
              )}
            </div>

            <select
              value={r.status}
              disabled={updatingId === r._id}
              onChange={(e) => handleStatusChange(r._id, e.target.value)}
              style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db", height: "fit-content" }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        ))
      )}
    </div>
  );
}

export default OwnerMaintenance;
