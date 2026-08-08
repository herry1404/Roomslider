import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../../api/axios";

import "../../styles/owner/dashboard.css";

function TenantDashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTenancy = async () => {
    try {
      const res = await api.get("/auth/my-tenancy");

      if (!res.data.isTenant) {
        toast.error("You are not currently renting any room on RoomSlider");
        navigate("/");
        return;
      }

      setData(res.data);
    } catch (error) {
      console.error("TENANT DASHBOARD ERROR:", error);
      toast.error(
        error.response?.data?.message || "Failed to load your place"
      );
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenancy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="owner-dashboard">
        <p>Loading your place...</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { room, owner, tenancy } = data;
  const payments = [...(tenancy.payments || [])].reverse();

  return (
    <div className="owner-dashboard">
      <div className="owner-detail-top">
        <div className="owner-detail-heading">
          <h2>Your Place</h2>
          <p>
            {room.title}
            {room.roomNumber && ` · Room #${room.roomNumber}`}
          </p>
        </div>
      </div>

      <div className="owner-detail-grid">
        <div>
          <div className="owner-detail-card">
            <h3>Room Info</h3>
            <div className="owner-detail-row">
              <span>Rent</span>
              <span>Rs. {room.price?.toLocaleString("en-IN")} /month</span>
            </div>
            <div className="owner-detail-row">
              <span>Location</span>
              <span>{room.location}</span>
            </div>
            <div className="owner-detail-row">
              <span>Category</span>
              <span>{room.category}</span>
            </div>
            <div className="owner-detail-row">
              <span>Payment Status (This Cycle)</span>
              <span>{tenancy.paymentStatus}</span>
            </div>
          </div>

          <div className="owner-detail-card">
            <h3>Your Tenancy</h3>
            <div className="owner-detail-row">
              <span>Move-in Date</span>
              <span>
                {tenancy.moveInDate
                  ? new Date(tenancy.moveInDate).toLocaleDateString("en-IN")
                  : "-"}
              </span>
            </div>
            <div className="owner-detail-row">
              <span>Advance Paid</span>
              <span>Rs. {tenancy.advanceAmount?.toLocaleString("en-IN") || 0}</span>
            </div>
            <div className="owner-detail-row">
              <span>Total Paid (This Tenancy)</span>
              <span>Rs. {tenancy.totalPaid?.toLocaleString("en-IN") || 0}</span>
            </div>
          </div>

          {owner && (
            <div className="owner-detail-card">
              <h3>Owner Contact</h3>
              <div className="owner-detail-row">
                <span>Name</span>
                <span>{owner.name}</span>
              </div>
              <div className="owner-detail-row">
                <span>Email</span>
                <span>{owner.email}</span>
              </div>
              {owner.propertyName && (
                <div className="owner-detail-row">
                  <span>Property</span>
                  <span>{owner.propertyName}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="owner-detail-card">
            <h3>Payment History</h3>
            {payments.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "14px" }}>
                No payments recorded yet.
              </p>
            ) : (
              <div className="owner-payment-list">
                {payments.map((p, idx) => (
                  <div key={idx} className="owner-payment-item">
                    <span>
                      {new Date(p.date).toLocaleDateString("en-IN")} - {p.method}
                    </span>
                    <span>Rs. {p.amount?.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TenantDashboard;
