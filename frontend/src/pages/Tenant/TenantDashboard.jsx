import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { X, Wallet, Sparkles, ShoppingBasket, Zap, Wrench, MessageCircle } from "lucide-react";

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
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    title: "",
    description: "",
    category: "other",
  });
  const [maintenancePhoto, setMaintenancePhoto] = useState(null);
  const [maintenanceSubmitting, setMaintenanceSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [requestsLoaded, setRequestsLoaded] = useState(false);
  const [showLaundryModal, setShowLaundryModal] = useState(false);
  const [laundryVendors, setLaundryVendors] = useState({ matched: [], all: [] });
  const [laundryLoaded, setLaundryLoaded] = useState(false);
  const [laundryLoading, setLaundryLoading] = useState(false);

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

  const handlePayRent = async () => {
    try {
      const roomId = data?.room?.id;

      if (!roomId) {
        toast.error("Room not found");
        return;
      }

      const orderRes = await api.post("/payments/create-order", {
        roomId,
        type: "rent",
      });

      const { orderId, amount, currency, key } = orderRes.data;

      const options = {
        key,
        amount,
        currency,
        order_id: orderId,
        name: "RoomSlider",
        description: "Rent Payment",
        handler: async (response) => {
          try {
            await api.post("/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              roomId,
              type: "rent",
            });

            toast.success("Rent paid successfully!");
            setShowPayModal(false);
            fetchTenancy();
          } catch (verifyError) {
            console.error("PAYMENT VERIFY ERROR:", verifyError);
            toast.error("Payment could not be verified. Contact support.");
          }
        },
        prefill: {
          name: data?.tenancy?.name || "",
        },
        theme: {
          color: "#16a34a",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("CREATE ORDER ERROR:", error);
      toast.error(
        error.response?.data?.message || "Failed to start payment"
      );
    }
  };

  const openMaintenanceModal = async () => {
    setShowMaintenanceModal(true);

    if (!requestsLoaded) {
      try {
        const res = await api.get("/maintenance/my-requests");
        setMyRequests(res.data.requests || []);
        setRequestsLoaded(true);
      } catch (error) {
        console.error("FETCH MAINTENANCE REQUESTS ERROR:", error);
      }
    }
  };

  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault();

    if (!maintenanceForm.title || !maintenanceForm.description) {
      toast.error("Title and description are required");
      return;
    }

    try {
      setMaintenanceSubmitting(true);

      const roomId = data?.room?.id;
      const formData = new FormData();
      formData.append("roomId", roomId);
      formData.append("title", maintenanceForm.title);
      formData.append("description", maintenanceForm.description);
      formData.append("category", maintenanceForm.category);
      if (maintenancePhoto) {
        formData.append("photo", maintenancePhoto);
      }

      const res = await api.post("/maintenance", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMyRequests((prev) => [res.data.request, ...prev]);
      setMaintenanceForm({ title: "", description: "", category: "other" });
      setMaintenancePhoto(null);
      toast.success("Request submitted");
    } catch (error) {
      console.error("CREATE MAINTENANCE REQUEST ERROR:", error);
      toast.error(
        error.response?.data?.message || "Failed to submit request"
      );
    } finally {
      setMaintenanceSubmitting(false);
    }
  };

  const openLaundryModal = async () => {
    setShowLaundryModal(true);

    if (!laundryLoaded) {
      setLaundryLoading(true);
      try {
        const ownerId = data?.owner?.id;
        const res = await api.get("/laundry-vendors/my-vendor", {
          params: { ownerId },
        });
        setLaundryVendors({
          matched: res.data.matched || [],
          all: res.data.all || [],
        });
        setLaundryLoaded(true);
      } catch (error) {
        console.error("FETCH LAUNDRY VENDORS ERROR:", error);
      } finally {
        setLaundryLoading(false);
      }
    }
  };

  const buildLaundryWhatsAppLink = (vendorName, phone) => {
    const cleanPhone = (phone || "").replace(/\D/g, "");
    const phoneWithCountryCode = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    const message = `Hi ${vendorName}, I'm a tenant on RoomSlider and would like to get laundry service.`;
    return `https://wa.me/${phoneWithCountryCode}?text=${encodeURIComponent(message)}`;
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
  const laundryList = laundryVendors.matched.length > 0 ? laundryVendors.matched : laundryVendors.all;

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
            {SERVICES.map((s) => {
              const isMaintenance = s.name === "Repairs & Maintenance";
              const isLaundry = s.name === "Laundry";
              const isActive = isMaintenance || isLaundry;
              const handleClick = isMaintenance
                ? openMaintenanceModal
                : isLaundry
                ? openLaundryModal
                : undefined;

              return (
                <div
                  key={s.name}
                  className="tenant-service-card"
                  onClick={handleClick}
                  style={isActive ? { cursor: "pointer" } : undefined}
                >
                  <div className="tenant-service-icon">
                    <s.icon size={20} />
                  </div>
                  <div className="tenant-service-name">{s.name}</div>
                  {isActive ? (
                    <span
                      className="tenant-service-soon"
                      style={{ background: "#dcfce7", color: "#15803d" }}
                    >
                      {isMaintenance ? "Raise Request" : "Contact Vendor"}
                    </span>
                  ) : (
                    <span className="tenant-service-soon">Coming Soon</span>
                  )}
                </div>
              );
            })}
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

      {/* Maintenance Request modal */}
      {showMaintenanceModal && (
        <div
          className="tenant-modal-overlay"
          onClick={() => setShowMaintenanceModal(false)}
        >
          <div className="tenant-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tenant-modal-header">
              <h3>Repairs & Maintenance</h3>
              <button
                className="tenant-modal-close"
                onClick={() => setShowMaintenanceModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={handleMaintenanceSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}
            >
              <input
                type="text"
                placeholder="Issue title (e.g. Leaking tap)"
                value={maintenanceForm.title}
                onChange={(e) =>
                  setMaintenanceForm({ ...maintenanceForm, title: e.target.value })
                }
                style={{ padding: 10, borderRadius: 8, border: "1px solid #d1d5db" }}
              />
              <textarea
                placeholder="Describe the issue"
                value={maintenanceForm.description}
                onChange={(e) =>
                  setMaintenanceForm({ ...maintenanceForm, description: e.target.value })
                }
                rows={3}
                style={{ padding: 10, borderRadius: 8, border: "1px solid #d1d5db" }}
              />
              <select
                value={maintenanceForm.category}
                onChange={(e) =>
                  setMaintenanceForm({ ...maintenanceForm, category: e.target.value })
                }
                style={{ padding: 10, borderRadius: 8, border: "1px solid #d1d5db" }}
              >
                <option value="electrical">Electrical</option>
                <option value="plumbing">Plumbing</option>
                <option value="appliance">Appliance</option>
                <option value="structural">Structural</option>
                <option value="other">Other</option>
              </select>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setMaintenancePhoto(e.target.files[0])}
              />
              <button
                type="submit"
                className="tenant-modal-pay-btn"
                disabled={maintenanceSubmitting}
              >
                {maintenanceSubmitting ? "Submitting..." : "Submit Request"}
              </button>
            </form>

            <h3 style={{ marginBottom: 12 }}>Your Requests</h3>
            {myRequests.length === 0 ? (
              <p className="tenant-empty">No requests raised yet.</p>
            ) : (
              myRequests.map((r) => (
                <div key={r._id} className="tenant-payment-item">
                  <div>
                    <div className="tenant-payment-date">{r.title}</div>
                    <div className="tenant-payment-method">
                      {new Date(r.createdAt).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                  <div
                    className="tenant-payment-amount"
                    style={{ fontSize: 12, textTransform: "capitalize" }}
                  >
                    {r.status.replace("_", " ")}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Laundry modal */}
      {showLaundryModal && (
        <div
          className="tenant-modal-overlay"
          onClick={() => setShowLaundryModal(false)}
        >
          <div className="tenant-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tenant-modal-header">
              <h3>Laundry</h3>
              <button
                className="tenant-modal-close"
                onClick={() => setShowLaundryModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            {laundryLoading ? (
              <p className="tenant-empty">Loading vendors...</p>
            ) : laundryList.length === 0 ? (
              <p className="tenant-empty">No laundry vendors available yet.</p>
            ) : (
              <>
                {laundryVendors.matched.length === 0 && (
                  <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>
                    No vendor set for your building yet — here are nearby options:
                  </p>
                )}
                {laundryList.map((v) => (
                  <div key={v._id} className="tenant-payment-item">
                    <div>
                      <div className="tenant-payment-date">{v.vendorName}</div>
                      <div className="tenant-payment-method">
                        {v.area || v.owner?.name || "Nearby"}
                      </div>
                    </div>
                    <a
                      href={buildLaundryWhatsAppLink(v.vendorName, v.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="owner-whatsapp-btn"
                      style={{ textDecoration: "none" }}
                    >
                      <MessageCircle size={15} />
                      WhatsApp
                    </a>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TenantDashboard;
