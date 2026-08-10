import { useEffect, useState } from "react";
import {
  UserCog,
  Phone,
  Building2,
  Home,
  Trash2,
  Plus,
  Search,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import "../../styles/manageOwners.css";

function ManageOwners() {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    propertyName: "",
  });

  // GET ALL OWNERS
  const fetchOwners = async () => {
    try {
      setLoading(true);
      const res = await api.get("/owners");
      setOwners(res.data || []);
    } catch (error) {
      console.log(error);
      toast.error(
        error.response?.data?.message || "Owners load nahi ho paye"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  // CREATE OWNER
  const handleAddOwner = async (e) => {
    e.preventDefault();
    try {
      await api.post("/owners", form);
      toast.success("Owner created successfully");
      setShowAddModal(false);
      setForm({ name: "", phone: "", password: "", propertyName: "" });
      fetchOwners();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Owner create failed"
      );
    }
  };

  // DELETE OWNER
  const handleDelete = async (id) => {
    const confirm = window.confirm(
      "Kya aap is owner ko delete karna chahte ho?"
    );
    if (!confirm) return;

    try {
      await api.delete(`/owners/${id}`);
      toast.success("Owner deleted successfully");
      fetchOwners();
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  // SEARCH
  const filteredOwners = owners.filter((owner) => {
    const value = search.toLowerCase();
    return (
      owner.name?.toLowerCase().includes(value) ||
      owner.phone?.toLowerCase().includes(value) ||
      owner.propertyName?.toLowerCase().includes(value)
    );
  });

  return (
    <div className="manage-owners-page">
      <div className="owners-header">
        <div>
          <h1>Manage Owners</h1>
          <p>Property owners ko manage kare</p>
        </div>

        <div className="owners-header-actions">
          <div className="owners-search">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search owner or property..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button className="add-owner-btn" onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            Add Owner
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-box">Loading Owners...</div>
      ) : (
        <div className="owners-grid">
          {filteredOwners.map((owner) => (
            <div
              className="owner-card"
              key={owner._id}
              onClick={() => navigate(`/admin/owners/${owner._id}`)}
            >
              <div className="owner-top">
                <div className="avatar">
                  <UserCog size={28} />
                </div>
                <div>
                  <h3>{owner.name}</h3>
                  <span>{owner.propertyName || "No property name"}</span>
                </div>
              </div>

              <div className="owner-details">
                <div className="detail-row">
                  <Phone size={16} />
                  <p>{owner.phone}</p>
                </div>
              </div>

              <div className="owner-stats">
                <div className="stat-box">
                  <Home size={16} />
                  <span>{owner.totalRooms}</span>
                  <p>Total</p>
                </div>
                <div className="stat-box occupied">
                  <span>{owner.occupiedRooms}</span>
                  <p>Occupied</p>
                </div>
                <div className="stat-box vacant">
                  <span>{owner.vacantRooms}</span>
                  <p>Vacant</p>
                </div>
              </div>

              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(owner._id);
                }}
              >
                <Trash2 size={17} />
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {filteredOwners.length === 0 && !loading && (
        <div className="empty-owners">
          <Building2 size={45} />
          <h3>No Owners Found</h3>
          <p>Koi owner add nahi hua hai abhi tak.</p>
        </div>
      )}

      {/* ADD OWNER MODAL */}
      {showAddModal && (
        <div className="profile-overlay">
          <div className="profile-modal">
            <button className="close-modal" onClick={() => setShowAddModal(false)}>
              <X size={20} />
            </button>

            <h2>Add New Owner</h2>

            <form className="add-owner-form" onSubmit={handleAddOwner}>
              <input
                type="text"
                placeholder="Owner Name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                type="tel"
                placeholder="Mobile Number (e.g. 9876543210)"
                required
                pattern="[6-9][0-9]{9}"
                maxLength={10}
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })
                }
              />
              <input
                type="password"
                placeholder="Password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <input
                type="text"
                placeholder="Property Name (e.g. Ambe's Building)"
                value={form.propertyName}
                onChange={(e) => setForm({ ...form, propertyName: e.target.value })}
              />

              <button type="submit" className="submit-btn">
                Create Owner
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageOwners;
