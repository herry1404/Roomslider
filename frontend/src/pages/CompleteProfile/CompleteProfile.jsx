import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Phone } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import "../../styles/complete-profile.css";

function CompleteProfile() {

  const navigate = useNavigate();
  const { user, setUser, promptPreferencesNow } = useAuth();

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

      promptPreferencesNow(updatedUser);

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

      <section className="cp-section">

        <div className="cp-card">

          <h2 className="cp-title">One last step</h2>

          <p className="cp-subtitle">
            Add your phone number so you can log in with either your email or phone.
          </p>

          <form onSubmit={handleSubmit}>

            <div className="cp-field">

              <Phone size={18} />

              <input
                className="cp-input"
                type="tel"
                placeholder="10-digit phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              />

            </div>

            <button
              type="submit"
              disabled={loading}
              className="cp-button"
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
