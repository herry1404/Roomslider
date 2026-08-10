import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Phone } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

function CompleteProfile() {

  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) {

    navigate("/login", { replace: true });
    return null;

  }

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (phone.length !== 10) {

      toast.error("Enter a valid 10-digit phone number");
      return;

    }

    try {

      setLoading(true);

      const res = await api.patch("/auth/update-phone", { phone });

      const updatedUser = { ...user, phone: res.data.user.phone };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      toast.success(res.data.message || "Phone number added");

      navigate("/", { replace: true });

    } catch (error) {

      console.error("❌ Update Phone Error:", error);

      toast.error(
        error.response?.data?.message ||
        "Failed to add phone number"
      );

    } finally {

      setLoading(false);

    }

  };

  return (

    <>

      <Helmet>
        <title>Complete Your Profile | RoomSlider</title>
      </Helmet>

      <section style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}>

        <div style={{
          maxWidth: "400px",
          width: "100%",
          background: "white",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
        }}>

          <h2 style={{ marginBottom: "8px", fontSize: "22px", fontWeight: 700 }}>
            One last step
          </h2>

          <p style={{ marginBottom: "24px", color: "#6b7280", fontSize: "14px" }}>
            Add your phone number so you can log in with either your email or phone.
          </p>

          <form onSubmit={handleSubmit}>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "12px 14px",
              marginBottom: "16px",
            }}>

              <Phone size={18} color="#6b7280" />

              <input
                type="tel"
                placeholder="10-digit phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                style={{ border: "none", outline: "none", flex: 1, fontSize: "15px" }}
              />

            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {loading ? "Saving..." : "Save & Continue"}
            </button>

          </form>

        </div>

      </section>

    </>

  );

}

export default CompleteProfile;
