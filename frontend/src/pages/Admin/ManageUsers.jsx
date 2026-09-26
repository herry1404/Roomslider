import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Trash2,
  Eye,
  Search,
  ShieldCheck,
  Users as UsersIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import "../../styles/admin/theme.css";

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users");
      setUsers(res.data.users || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Users load nahi ho paye");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Kya aap is user ko delete karna chahte ho?")) return;

    try {
      await api.delete(`/admin/users/${id}`);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  const filteredUsers = users.filter((user) => {
    const value = search.toLowerCase();
    return (
      user.name?.toLowerCase().includes(value) ||
      user.email?.toLowerCase().includes(value) ||
      user.phone?.includes(value)
    );
  });

  const withPhone = users.filter((u) => u.phone).length;
  const admins = users.filter((u) => u.role === "admin").length;

  if (loading) {
    return (
      <div className="admin-page">
        <p style={{ color: "var(--admin-muted)" }}>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Manage Users</h1>
          <p>RoomSlider users ko manage kare.</p>
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Total Users</span>
            <div className="admin-stat-icon admin-badge green">
              <UsersIcon size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{users.length}</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">With Phone</span>
            <div className="admin-stat-icon admin-badge blue">
              <Phone size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{withPhone}</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Admins</span>
            <div className="admin-stat-icon admin-badge amber">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{admins}</div>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-table-wrap">
        {filteredUsers.length === 0 ? (
          <div className="admin-empty">
            <h3>No users found</h3>
            <p>Koi user available nahi hai.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Joined</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div className="admin-row-thumb">
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: "var(--admin-accent-soft)",
                          color: "var(--admin-accent)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <User size={18} />
                      </div>
                      <span>{user.name}</span>
                    </div>
                  </td>
                  <td style={{ color: "var(--admin-muted)" }}>{user.email}</td>
                  <td style={{ color: "var(--admin-muted)" }}>{user.phone || "No Phone"}</td>
                  <td>
                    <span className={`admin-badge ${user.role === "admin" ? "amber" : "green"}`}>
                      <span className="admin-badge-dot" />
                      {user.role || "User"}
                    </span>
                  </td>
                  <td style={{ color: "var(--admin-muted)" }}>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                  </td>
                  <td>
                    <div className="admin-row-actions" style={{ justifyContent: "flex-end" }}>
                      <button
                        className="admin-icon-btn accent"
                        title="View Profile"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="admin-icon-btn danger"
                        title="Delete"
                        onClick={() => handleDelete(user._id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedUser && (
        <div
          onClick={() => setSelectedUser(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--admin-card)",
              border: "1px solid var(--admin-border)",
              borderRadius: 16,
              padding: 26,
              width: "90%",
              maxWidth: 380,
              position: "relative",
            }}
          >
            <button
              onClick={() => setSelectedUser(null)}
              style={{
                position: "absolute",
                top: 12,
                right: 14,
                background: "none",
                border: "none",
                color: "var(--admin-muted)",
                fontSize: 22,
                cursor: "pointer",
              }}
            >
              ×
            </button>

            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "var(--admin-accent-soft)",
                color: "var(--admin-accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
              }}
            >
              <User size={30} />
            </div>

            <h2 style={{ textAlign: "center", marginBottom: 18 }}>{selectedUser.name}</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14 }}>
              <p style={{ display: "flex", alignItems: "center", gap: 10, margin: 0, color: "var(--admin-muted)" }}>
                <Mail size={16} /> {selectedUser.email}
              </p>
              <p style={{ display: "flex", alignItems: "center", gap: 10, margin: 0, color: "var(--admin-muted)" }}>
                <Phone size={16} /> {selectedUser.phone || "Not Available"}
              </p>
              <p style={{ display: "flex", alignItems: "center", gap: 10, margin: 0, color: "var(--admin-muted)" }}>
                <ShieldCheck size={16} /> Role: {selectedUser.role || "User"}
              </p>
              <p style={{ display: "flex", alignItems: "center", gap: 10, margin: 0, color: "var(--admin-muted)" }}>
                <Calendar size={16} /> Joined:{" "}
                {selectedUser.createdAt
                  ? new Date(selectedUser.createdAt).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageUsers;
