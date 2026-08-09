import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { X, Wallet, Sparkles, ShoppingBasket, Zap, Wrench } from "lucide-react";

import api from "../../api/axios";

import "../../styles/tenant/dashboard.css";

const SERVICES = [
  { name: "Laundry", icon: Sparkles },
  { name: "Mess / Grocery", icon: ShoppingBasket },
  { name: "Repairs & Maintenance", icon: Wrench },
];

function TenantDashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [bill, setBill] = useState(null);
  const [showVacateForm, setShowVacateForm] = useState(false);
  const [vacateDate, setVacateDate] = useState("");
  const [vacateSubmitting, setVacateSubmitting] = useState(false);

  const fetchTenancy = async () => {
    try {
      const res = await api.get("/auth/my-tenancy");

      if (!res.data.isTenant) {
        toast.error("You are not currently renting any room on RoomSlider");
        navigate("/");
        return;
      }

      setData(res.data);

      try {
        const billRes = await api.get("/electricity/my-bill");
        setBill(billRes.data.bill || null);
      } catch (billError) {
        console.error("ELECTRICITY BILL FETCH ERROR:", billError);
      }
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

  const handlePayRent = () => {
    toast("Online rent payment is coming soon", { icon: "🛠️" });
  };

  const handleGiveNotice = async (e) => {
    e.preventDefault();

    if (!vacateDate) {
      toast.error("Select a date");
      return;
    }

    setVacateSubmitting(true);
    try {
      await api.post("/auth/vacate-notice", { vacateDate });
      toast.success("Vacate notice given");
      setShowVacateForm(false);
      fetchTenancy();
    } catch (error) {
      console.error("VACATE NOTICE ERROR:", error);
      toast.error(error.response?.data?.message || "Failed to give notice");
    } finally {
      setVacateSubmitting(false);
    }
  };

  const handleCancelNotice = async () => {
    try {
      await api.delete("/auth/vacate-notice");
      toast.success("Notice cancelled. You're continuing your stay.");
      fetchTenancy();
    } catch (error) {
      console.error("CANCEL NOTICE ERROR:", error);
      toast.error(error.response?.data?.message || "Failed to cancel notice");
    }
  };

  if (loading) {
    return (
      <div className="tenant-page">
        <p className="tenant-loading">Loading your place...</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { room, owner, tenancy } = data;
  const payments = [...(tenancy.payments || [])].reverse();
  const hasNotice = !!tenancy.vacateNoticeDate;

  return (
    <div className="tenant-page">
      <div className="tenant-header">
        <img
          className="tenant-header-photo"
          src={room.images?.[0] || "/placeholder-room.jpg"}
          alt={room.title}
        />
        <div className="tenant-header-info">
          <div className="tenant-eyebrow">Your Place</div>
          <h1>
            {room.title}
            {room.roomNumber && ` · Room ${room.roomNumber}`}
          </h1>
          <div className="tenant-header-location">{room.location}</div>
        </div>
      </div>

      {hasNotice && (
        <div className="tenant-vacate-banner">
          You've given notice to vacate on{" "}
          <strong>{new Date(tenancy.vacateNoticeDate).toLocaleDateString("en-IN")}</strong>.
          <div className="tenant-vacate-actions">
            <button className="tenant-vacate-continue-btn" onClick={handleCancelNotice}>
              I want to continue instead
            </button>
          </div>
        </div>
      )}

      <div className="tenant-grid">
        {/* LEFT COLUMN */}
        <div>
          <div className="tenant-card">
            <h3>Tenancy Details</h3>
            <div className="tenant-row">
              <span>Rent</span>
              <span>₹{room.price?.toLocaleString("en-IN")} /month</span>
            </div>
            <div className="tenant-row">
              <span>Payment Status</span>
              <span className={`tenant-badge ${tenancy.paymentStatus}`}>
                {tenancy.paymentStatus}
              </span>
            </div>
            <div className="tenant-row">
              <span>Move-in Date</span>
              <span>
                {tenancy.moveInDate
                  ? new Date(tenancy.moveInDate).toLocaleDateString("en-IN")
                  : "—"}
              </span>
            </div>
            <div className="tenant-row">
              <span>Advance Paid</span>
              <span>₹{tenancy.advanceAmount?.toLocaleString("en-IN") || 0}</span>
            </div>

            {tenancy.leaseDocumentUrl && (
              <div style={{ marginTop: 12 }}>
                <a
                  href={tenancy.leaseDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="owner-btn owner-btn-secondary"
                  style={{ display: "inline-flex", textDecoration: "none" }}
                >
                  Download Lease Document
                </a>
              </div>
            )}

            {!hasNotice && (
              <div style={{ marginTop: 16 }}>
                {!showVacateForm ? (
                  <button
                    className="owner-btn owner-btn-secondary"
                    onClick={() => setShowVacateForm(true)}
                  >
                    Give Vacate Notice
                  </button>
                ) : (
                  <form className="tenant-vacate-form" onSubmit={handleGiveNotice}>
                    <input
                      type="date"
                      value={vacateDate}
                      onChange={(e) => setVacateDate(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="tenant-vacate-submit-btn"
                      disabled={vacateSubmitting}
                    >
                      {vacateSubmitting ? "Submitting..." : "Confirm Notice"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          <div className="tenant-card">
            <h3>Electricity Bill</h3>
            {bill ? (
              <>
                <div className="tenant-row">
                  <span>{String(bill.month).padStart(2, "0")}/{bill.year}</span>
                  <span className={`tenant-badge ${bill.status}`}>{bill.status}</span>
                </div>
                <div className="tenant-row">
                  <span>Units Consumed</span>
                  <span>{bill.unitsConsumed}</span>
                </div>
                <div className="tenant-row">
                  <span>Rate</span>
                  <span>₹{bill.ratePerUnit} /unit</span>
                </div>
                <div className="tenant-row">
                  <span>Amount</span>
                  <span>₹{bill.amount?.toLocaleString("en-IN")}</span>
                </div>
              </>
            ) : (
              <p className="tenant-empty">No electricity bill yet for this month.</p>
            )}
          </div>

          <div className="tenant-section-title">Nearby Services</div>
          <div className="tenant-services-grid">
            {SERVICES.map((s) => (
              <div key={s.name} className="tenant-service-card">
                <div className="tenant-service-icon">
                  <s.icon size={20} />
                </div>
                <div className="tenant-service-name">{s.name}</div>
                <span className="tenant-service-soon">Coming Soon</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Pay Rent button */}
      <button
        className="tenant-float-btn"
        onClick={() => setShowPayModal(true)}
      >
        <Wallet size={16} />
        Pay Rent
      </button>

      {/* Pay Rent modal */}
      {showPayModal && (
        <div
          className="tenant-modal-overlay"
          onClick={() => setShowPayModal(false)}
        >
          <div className="tenant-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tenant-modal-header">
              <h3>Pay Rent</h3>
              <button
                className="tenant-modal-close"
                onClick={() => setShowPayModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="tenant-modal-rent-row">
              <div style={{ fontSize: 13, color: "#15803d", fontWeight: 600 }}>
                Rent Due This Month
              </div>
              <div className="tenant-modal-rent-amount">
                ₹{room.price?.toLocaleString("en-IN")}
              </div>
              <button className="tenant-modal-pay-btn" onClick={handlePayRent}>
                Pay Now
              </button>
            </div>

            <h3 style={{ marginBottom: 12 }}>Past Receipts</h3>
            {payments.length === 0 ? (
              <p className="tenant-empty">No payments recorded yet.</p>
            ) : (
              payments.map((p, idx) => (
                <div key={idx} className="tenant-payment-item">
                  <div>
                    <div className="tenant-payment-date">
                      {new Date(p.date).toLocaleDateString("en-IN")}
                    </div>
                    <div className="tenant-payment-method">{p.method}</div>
                  </div>
                  <div className="tenant-payment-amount">
                    ₹{p.amount?.toLocaleString("en-IN")}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TenantDashboard;
