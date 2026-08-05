import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../../api/axios";

import "../../styles/owner/dashboard.css";

function OwnerRoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  const [tenantForm, setTenantForm] = useState({
    name: "",
    phone: "",
    moveInDate: "",
    advanceAmount: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "cash",
  });

  const fetchRoom = async () => {
    try {
      const res = await api.get(`/rooms/${id}`);
      setRoom(res.data.room);
    } catch (error) {
      console.error("ROOM DETAIL ERROR:", error);
      toast.error(
        error.response?.data?.message || "Failed to load room details"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAssignTenant = async (e) => {
    e.preventDefault();

    if (!tenantForm.name) {
      toast.error("Tenant name is required");
      return;
    }

    try {
      await api.put(`/rooms/${id}/assign-tenant`, tenantForm);
      toast.success("Tenant assigned successfully");
      setTenantForm({ name: "", phone: "", moveInDate: "", advanceAmount: "" });
      fetchRoom();
    } catch (error) {
      console.error("ASSIGN TENANT ERROR:", error);
      toast.error(error.response?.data?.message || "Failed to assign tenant");
    }
  };

  const handleVacate = async () => {
    if (!window.confirm("Mark this room as vacant? This will close the current tenancy.")) {
      return;
    }

    try {
      await api.put(`/rooms/${id}/vacate`);
      toast.success("Room marked as vacant");
      fetchRoom();
    } catch (error) {
      console.error("VACATE ERROR:", error);
      toast.error(error.response?.data?.message || "Failed to vacate room");
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();

    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }

    try {
      await api.post(`/rooms/${id}/payment`, paymentForm);
      toast.success("Payment recorded");
      setPaymentForm({ amount: "", method: "cash" });
      fetchRoom();
    } catch (error) {
      console.error("RECORD PAYMENT ERROR:", error);
      toast.error(error.response?.data?.message || "Failed to record payment");
    }
  };

  if (loading) {
    return (
      <div className="owner-dashboard">
        <p>Loading room details...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="owner-dashboard">
        <p>Room not found.</p>
      </div>
    );
  }

  const currentHistory = [...room.occupancyHistory].reverse();

  return (
    <div className="owner-dashboard">
      <button className="owner-detail-back" onClick={() => navigate("/owner/dashboard")}>
        ← Back to Dashboard
      </button>

      <div className="owner-detail-top">
        <div className="owner-detail-heading">
          <h2>{room.title || "Untitled Room"}</h2>
          <p>
            {room.roomNumber && `Room #${room.roomNumber} · `}
            <span className={`owner-status-badge ${room.status}`}>
              {room.status}
            </span>
          </p>
        </div>

        {room.status === "occupied" && (
          <button className="owner-btn owner-btn-secondary" onClick={handleVacate}>
            Mark as Vacant
          </button>
        )}
      </div>

      <div className="owner-detail-grid">
        {/* LEFT COLUMN */}
        <div>
          <div className="owner-detail-card">
            <h3>Room Info</h3>
            <div className="owner-detail-row">
              <span>Rent</span>
              <span>₹{room.price?.toLocaleString("en-IN")} /month</span>
            </div>
            <div className="owner-detail-row">
              <span>Deposit</span>
              <span>₹{room.deposit?.toLocaleString("en-IN") || 0}</span>
            </div>
            <div className="owner-detail-row">
              <span>Category</span>
              <span>{room.category}</span>
            </div>
            <div className="owner-detail-row">
              <span>Payment Status (This Cycle)</span>
              <span>{room.paymentStatus}</span>
            </div>
          </div>

          {room.status === "occupied" ? (
            <div className="owner-detail-card">
              <h3>Current Tenant</h3>
              <div className="owner-detail-row">
                <span>Name</span>
                <span>{room.currentTenant?.name}</span>
              </div>
              <div className="owner-detail-row">
                <span>Phone</span>
                <span>{room.currentTenant?.phone || "—"}</span>
              </div>
              <div className="owner-detail-row">
                <span>Move-in Date</span>
                <span>
                  {room.currentTenant?.moveInDate
                    ? new Date(room.currentTenant.moveInDate).toLocaleDateString("en-IN")
                    : "—"}
                </span>
              </div>
              <div className="owner-detail-row">
                <span>Advance Paid</span>
                <span>₹{room.currentTenant?.advanceAmount?.toLocaleString("en-IN") || 0}</span>
              </div>
            </div>
          ) : (
            <div className="owner-detail-card">
              <h3>Assign a Tenant</h3>
              <form onSubmit={handleAssignTenant}>
                <div className="owner-form-group">
                  <label>Tenant Name</label>
                  <input
                    type="text"
                    value={tenantForm.name}
                    onChange={(e) =>
                      setTenantForm({ ...tenantForm, name: e.target.value })
                    }
                    placeholder="Full name"
                  />
                </div>
                <div className="owner-form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    value={tenantForm.phone}
                    onChange={(e) =>
                      setTenantForm({ ...tenantForm, phone: e.target.value })
                    }
                    placeholder="10-digit number"
                  />
                </div>
                <div className="owner-form-group">
                  <label>Move-in Date</label>
                  <input
                    type="date"
                    value={tenantForm.moveInDate}
                    onChange={(e) =>
                      setTenantForm({ ...tenantForm, moveInDate: e.target.value })
                    }
                  />
                </div>
                <div className="owner-form-group">
                  <label>Advance / Security Amount (₹)</label>
                  <input
                    type="number"
                    value={tenantForm.advanceAmount}
                    onChange={(e) =>
                      setTenantForm({ ...tenantForm, advanceAmount: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>
                <button type="submit" className="owner-btn owner-btn-primary">
                  Assign Tenant
                </button>
              </form>
            </div>
          )}

          {room.status === "occupied" && (
            <div className="owner-detail-card">
              <h3>Record a Payment</h3>
              <form onSubmit={handleRecordPayment}>
                <div className="owner-form-group">
                  <label>Amount (₹)</label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, amount: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>
                <div className="owner-form-group">
                  <label>Method</label>
                  <select
                    value={paymentForm.method}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, method: e.target.value })
                    }
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <button type="submit" className="owner-btn owner-btn-primary">
                  Record Payment
                </button>
              </form>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div>
          <div className="owner-detail-card">
            <h3>Tenancy History</h3>
            {currentHistory.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "14px" }}>
                No tenancy history yet.
              </p>
            ) : (
              currentHistory.map((entry, idx) => (
                <div key={idx} className="owner-history-item">
                  <div className="owner-history-top">
                    <strong>{entry.tenantName}</strong>
                    <span className="owner-history-dates">
                      {entry.startDate
                        ? new Date(entry.startDate).toLocaleDateString("en-IN")
                        : "—"}{" "}
                      —{" "}
                      {entry.endDate
                        ? new Date(entry.endDate).toLocaleDateString("en-IN")
                        : "Present"}
                    </span>
                  </div>

                  {entry.payments && entry.payments.length > 0 && (
                    <div className="owner-payment-list">
                      {entry.payments.map((p, pIdx) => (
                        <div key={pIdx} className="owner-payment-item">
                          <span>
                            {new Date(p.date).toLocaleDateString("en-IN")} · {p.method}
                          </span>
                          <span>₹{p.amount?.toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="owner-history-total">
                    Total Paid: ₹{entry.totalPaid?.toLocaleString("en-IN") || 0}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OwnerRoomDetail;
