import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { MapPin, IndianRupee, UtensilsCrossed, Phone } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";

function MessDetail() {
  const { id } = useParams();
  const [mess, setMess] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMess = async () => {
    try {
      const res = await api.get(`/mess/public/${id}`);
      setMess(res.data);
    } catch (error) {
      console.error("Mess Detail Error:", error);
      toast.error("Mess not found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMess();
  }, [id]);

  const handleOrder = () => {
    toast("Ordering coming soon!");
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: "40px 0" }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (!mess) {
    return (
      <div className="container" style={{ padding: "40px 0" }}>
        <h2>Mess not found</h2>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{mess.name} | Mess in Indore | RoomSlider</title>
        <meta
          name="description"
          content={`Order thali from ${mess.name} in Indore. See today's menu and price per person.`}
        />
      </Helmet>

      <section
        className="container"
        style={{ padding: "40px 0", maxWidth: "700px" }}
      >
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "20px",
            padding: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "18px" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "14px",
                background: "var(--color-surface-2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              {mess.images && mess.images[0] ? (
                <img src={mess.images[0]} alt={mess.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <UtensilsCrossed size={28} color="var(--color-primary)" />
              )}
            </div>
            <div>
              <h1 style={{ fontSize: "22px", margin: 0, color: "var(--color-text)" }}>
                {mess.name}
              </h1>
              <p style={{ display: "flex", alignItems: "center", gap: 6, margin: "4px 0 0", color: "var(--color-text-light)", fontSize: 14 }}>
                <MapPin size={14} />
                {mess.address}
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 18px",
              background: "var(--color-surface-2)",
              borderRadius: "14px",
              marginBottom: "20px",
            }}
          >
            <span style={{ color: "var(--color-text-light)", fontSize: 14 }}>
              Price per person
            </span>
            <strong style={{ display: "flex", alignItems: "center", color: "var(--color-text)", fontSize: 20 }}>
              <IndianRupee size={18} />
              {mess.pricePerPerson}
            </strong>
          </div>

          <h3 style={{ marginBottom: "10px", color: "var(--color-text)" }}>
            Today's Menu {mess.todayMenu?.date ? `(${mess.todayMenu.date})` : ""}
          </h3>

          {mess.todayMenu?.items?.length > 0 ? (
            <ul style={{ marginBottom: "20px", paddingLeft: "18px", color: "var(--color-text)" }}>
              {mess.todayMenu.items.map((item, idx) => (
                <li key={idx} style={{ marginBottom: "6px" }}>
                  {item.name}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ marginBottom: "20px", color: "var(--color-text-light)" }}>
              Menu not updated yet for today.
            </p>
          )}

          <div style={{ display: "flex", gap: "10px" }}>
            <a
              href={`tel:${mess.phone}`}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "14px",
                borderRadius: "14px",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              <Phone size={17} />
              Call
            </a>

            <button
              onClick={handleOrder}
              style={{
                flex: 2,
                padding: "14px",
                borderRadius: "14px",
                border: "none",
                background: "var(--color-primary)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "15px",
                cursor: "pointer",
              }}
            >
              Order Thali
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

export default MessDetail;
