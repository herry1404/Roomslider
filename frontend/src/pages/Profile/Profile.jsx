import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import RoomCard from "../../components/ui/RoomCard";
import "../../styles/profile.css";

const TABS = [
  { key: "saved", label: "Saved" },
  { key: "activity", label: "Activity" },
  { key: "updates", label: "Updates" },
  { key: "notifications", label: "Notifications" },
];

const OCCUPATION_LABELS = {
  student: "Student",
  working: "Working professional",
  business: "Business",
  other: "Other",
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";

function Profile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(() =>
    searchParams.get("tab") === "notifications" ? "notifications" : "saved"
  );
  const [tabLoading, setTabLoading] = useState(false);
  const [tabData, setTabData] = useState({ saved: null, activity: null, notifications: null });
  const [unread, setUnread] = useState(0);

  const isUserAccount = user && (!user.role || ["user", "admin"].includes(user.role));

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!isUserAccount) return;

    const loadProfile = async () => {
      try {
        const res = await api.get("/users/me");
        setProfile(res.data.user);
      } catch (err) {
        toast.error(err.response?.data?.message || "Profile load nahi hua");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTab = async (key) => {
    if (key === "updates" || tabData[key] !== null) return;

    try {
      setTabLoading(true);

      if (key === "saved") {
        const res = await api.get("/wishlist");
        setTabData((d) => ({ ...d, saved: res.data.wishlist || [] }));
      }

      if (key === "activity") {
        const [f, s, vehicles, villas] = await Promise.allSettled([
          api.get("/furniture-requests/mine"),
          api.get("/service-bookings/my"),
          api.get("/vehicle-requests/mine"),
          api.get("/villa-bookings/mine"),
        ]);

        const list = [];

        if (f.status === "fulfilled" && Array.isArray(f.value.data)) {
          f.value.data.forEach((r) =>
            list.push({
              id: "f" + r._id,
              type: "Furniture",
              title: "Request " + (r.requestCode || ""),
              sub: (r.items ? r.items.length : 0) + " item(s)",
              status: r.status,
              createdAt: r.createdAt,
            })
          );
        }

        if (s.status === "fulfilled" && Array.isArray(s.value.data)) {
          s.value.data.forEach((b) =>
            list.push({
              id: "s" + b._id,
              type: "Service",
              title: b.provider?.name || "Service request",
              sub: b.provider?.category || "",
              status: b.status,
              createdAt: b.createdAt,
            })
          );
        }

        if (vehicles.status === "fulfilled" && Array.isArray(vehicles.value.data)) {
          vehicles.value.data.forEach((request) =>
            list.push({
              id: "v" + request._id,
              type: "Vehicle",
              title: request.vehicle ? `${request.vehicle.brand} ${request.vehicle.name}` : "Vehicle rental request",
              sub: `${request.durationType} · ${request.pickupOption} · ₹${request.totalPrice}`,
              status: request.status,
              createdAt: request.createdAt,
            })
          );
        }

        if (villas.status === "fulfilled" && Array.isArray(villas.value.data.bookings)) {
          villas.value.data.bookings.forEach((booking) =>
            list.push({
              id: "villa" + booking._id,
              type: "Villa",
              title: booking.villa?.name || "Villa booking",
              sub: `${booking.bookingType} · ${booking.guestCount} guests · ₹${booking.amount}`,
              status: booking.status,
              createdAt: booking.createdAt,
            })
          );
        }

        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setTabData((d) => ({ ...d, activity: list }));
      }

      if (key === "notifications") {
        const res = await api.get("/notifications/my-notifications");
        setTabData((d) => ({ ...d, notifications: res.data.notifications || [] }));
        setUnread(res.data.unreadCount || 0);
      }
    } catch {
      toast.error("Ye tab load nahi hua");
    } finally {
      setTabLoading(false);
    }
  };

  useEffect(() => {
    if (profile) Promise.resolve().then(() => loadTab(tab));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, profile]);

  const markRead = async (n) => {
    if (n.read) return;
    try {
      await api.put("/notifications/" + n._id + "/read");
      setTabData((d) => ({
        ...d,
        notifications: d.notifications.map((x) =>
          x._id === n._id ? { ...x, read: true } : x
        ),
      }));
      setUnread((u) => Math.max(0, u - 1));
    } catch {
      // ignore, will retry on next click
    }
  };

  if (loading && isUserAccount) {
    return (
      <div className="profile-view">
        <div className="profile-empty">Loading...</div>
      </div>
    );
  }

  if (!isUserAccount || !profile) {
    return (
      <div className="profile-view">
        <div className="profile-empty">Ye profile page sirf users ke liye hai.</div>
      </div>
    );
  }

  const initial = (profile.name || "U").trim().charAt(0).toUpperCase();
  const meta = [
    OCCUPATION_LABELS[profile.occupation],
    profile.organization,
    profile.course,
    profile.subject,
    profile.studyYear,
    profile.gender && `Gender: ${profile.gender}`,
  ]
    .filter(Boolean)
    .join(" · ");
  const place = [profile.area, profile.city].filter(Boolean).join(", ");
  const incomplete = !profile.bio && !profile.occupation && !profile.city;

  const renderTab = () => {
    if (tab === "updates") {
      return <div className="profile-empty">Updates jald aa rahe hain.</div>;
    }

    if (tabLoading || tabData[tab] === null) {
      return <div className="profile-empty">Loading...</div>;
    }

    if (tab === "saved") {
      if (tabData.saved.length === 0) {
        return (
          <div className="profile-empty">
            Abhi koi room save nahi kiya. <Link to="/rooms">Rooms dekho</Link>
          </div>
        );
      }
      return (
        <div className="profile-saved-grid">
          {tabData.saved.map((room) => (
            <RoomCard key={room._id} room={room} />
          ))}
        </div>
      );
    }

    if (tab === "activity") {
      if (tabData.activity.length === 0) {
        return <div className="profile-empty">Abhi koi request ya booking nahi hai.</div>;
      }
      return (
        <div className="profile-list">
          {tabData.activity.map((a) => (
            <div className="profile-item" key={a.id}>
              <div className="profile-item-main">
                <span className="profile-item-type">{a.type}</span>
                <strong>{a.title}</strong>
                {a.sub && <span className="profile-hint">{a.sub}</span>}
              </div>
              <div className="profile-item-side">
                <span className={"profile-status profile-status--" + a.status}>{a.status}</span>
                <span className="profile-hint">{fmtDate(a.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (tabData.notifications.length === 0) {
      return (
        <div className="profile-empty">
          <p>Koi notification nahi hai.</p>
        </div>
      );
    }
    return (
      <div className="profile-list">
        {tabData.notifications.map((n) => (
          <div
            className={"profile-item profile-item--click" + (n.read ? "" : " profile-item--unread")}
            key={n._id}
            onClick={() => {
              markRead(n);
              if (n.actionUrl) navigate(n.actionUrl);
            }}
          >
            <div className="profile-item-main">
              <strong>{n.title}</strong>
              <span className="profile-hint">{n.message}</span>
            </div>
            <div className="profile-item-side">
              <span className="profile-hint">{fmtDate(n.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="profile-view">
      <div className="profile-head">
        {profile.avatar ? (
          <img className="profile-head-img" src={profile.avatar} alt="Profile" />
        ) : (
          <div className="profile-head-img profile-head-initial">{initial}</div>
        )}

        <div className="profile-head-info">
          <h1 className="profile-head-name">{profile.name}</h1>
          <span className="profile-head-username">
            {profile.username ? "@" + profile.username : "Username set nahi hai"}
          </span>
          {profile.bio && <p className="profile-head-bio">{profile.bio}</p>}
          {meta && <span className="profile-head-line">{meta}</span>}
          {place && <span className="profile-head-line">{place}</span>}
        </div>
      </div>

      <Link className="profile-edit-btn" to="/profile/edit">
        Edit Profile
      </Link>

      {incomplete && (
        <Link className="profile-complete-hint" to="/profile/edit">
          Apna profile complete karo: occupation, location aur bio jodo
        </Link>
      )}

      <div className="profile-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={"profile-tab" + (tab === t.key ? " profile-tab--active" : "")}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.key === "notifications" && unread > 0 && (
              <span className="profile-tab-badge">{unread}</span>
            )}
          </button>
        ))}
      </div>

      <div className="profile-tab-body">{renderTab()}</div>
    </div>
  );
}

export default Profile;
