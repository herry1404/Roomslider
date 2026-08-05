import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Mail, Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import heroRoom from "../../assets/images/hero-room.webp";

import "../../styles/admin-login.css";

function OwnerLogin() {
  const navigate = useNavigate();
  const { ownerLogin, logout } = useAuth();

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      return toast.error("Owner email required");
    }

    if (!formData.password.trim()) {
      return toast.error("Password required");
    }

    try {
      setLoading(true);

      const result = await ownerLogin(formData);

      if (result.user.role !== "owner") {
        logout();
        toast.error("Access Denied");
        return;
      }

      toast.success("Welcome back");

      navigate("/owner/dashboard");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Login Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="admin-login-page"
      style={{
        backgroundImage: `url(${heroRoom})`,
      }}
    >
      <div className="admin-overlay">

        <div className="admin-card">

          <div className="admin-logo">

            <Home size={55} />

            <h1>RoomSlider</h1>

            <p>Owner Panel</p>

          </div>

          <form onSubmit={handleSubmit}>

            <div className="admin-input">

              <Mail size={18} />

              <input
                name="email"
                type="email"
                placeholder="Owner Email"
                value={formData.email}
                onChange={handleChange}
              />

            </div>

            <div className="admin-input">

              <Lock size={18} />

              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />

              <button
                type="button"
                className="eye-btn"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>

            </div>

            <button
              className="admin-btn"
              disabled={loading}
            >
              {loading
                ? "Signing In..."
                : "Login as Owner"}
            </button>

          </form>

        </div>

      </div>
    </section>
  );
}

export default OwnerLogin;
