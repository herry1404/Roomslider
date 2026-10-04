import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Pencil, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/useNotifications";
import RoommatePreferencesFields from "../../components/profile/RoommatePreferencesFields";
import RoommateSubnav from "./RoommateSubnav";
import "../../styles/profile.css";
import "../../styles/roommate-chat.css";

const EMPTY_PREFERENCES = {
  active: true,
  seeking: "both",
  budgetMin: "",
  budgetMax: "",
  moveInDate: "",
  sharingType: "",
  lifestyle: { cleanliness: "", sleepSchedule: "", smoking: "", guests: "" },
};

const seekingLabel = {
  room: "Looking for a room",
  roommate: "Looking for a roommate",
  both: "Open to either",
};

const budgetLabel = (profile) => {
  const min = Number(profile.budgetMin) || 0;
  const max = Number(profile.budgetMax) || 0;
  if (min && max) return `₹${min.toLocaleString("en-IN")} – ₹${max.toLocaleString("en-IN")} / month`;
  if (max) return `Up to ₹${max.toLocaleString("en-IN")} / month`;
  if (min) return `From ₹${min.toLocaleString("en-IN")} / month`;
  return "Flexible budget";
};

function MyRoommateProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { refreshRoommateBadges } = useNotifications();
  const [result, setResult] = useState(null);
  const [form, setForm] = useState(EMPTY_PREFERENCES);
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const response = await api.get("/roommates/me");
      const profile = response.data.profile || {};
      const account = response.data.account || {};
      setResult({ profile, account });
      setForm({
        ...EMPTY_PREFERENCES,
        ...profile,
        lifestyle: { ...EMPTY_PREFERENCES.lifestyle, ...(profile.lifestyle || {}) },
      });
      setBio(profile.bio || "");
      setCity(profile.city || account.city || "");
      setArea(profile.area || account.area || "");
    } catch (error) {
      toast.error(error.response?.data?.message || "Roommate profile could not be loaded");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    Promise.resolve().then(loadProfile);
  }, [loadProfile, navigate, user]);

  const changePreference = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const changeLifestyle = (key, value) => setForm((current) => ({
    ...current,
    lifestyle: { ...current.lifestyle, [key]: value },
  }));

  const saveProfile = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (!city.trim() || !area.trim()) {
      toast.error("Add your city and area to create your roommate profile");
      return;
    }
    try {
      setSaving(true);
      await api.put("/roommates/me", {
        ...form,
        bio,
        city: city.trim(),
        area: area.trim(),
        budgetMin: Number(form.budgetMin) || 0,
        budgetMax: Number(form.budgetMax) || 0,
        moveInDate: form.moveInDate || null,
      });
      await loadProfile();
      setEditing(false);
      refreshRoommateBadges();
      toast.success("Roommate profile saved");
    } catch (error) {
      toast.error(error.response?.data?.message || "Roommate profile could not be saved");
    } finally {
      setSaving(false);
    }
  };

  const toggleDiscovery = async () => {
    if (toggling || !result?.profile) return;
    const active = !result.profile.active;
    setToggling(true);
    try {
      await api.put("/roommates/me", { active });
      setResult((current) => ({
        ...current,
        profile: { ...current.profile, active },
      }));
      setForm((current) => ({ ...current, active }));
      refreshRoommateBadges();
      toast.success(active ? "Discovery is on" : "Discovery is paused");
    } catch (error) {
      toast.error(error.response?.data?.message || "Discovery setting could not be changed");
    } finally {
      setToggling(false);
    }
  };

  if (!user) return null;

  const profile = result?.profile;
  const account = result?.account || {};
  const saved = Boolean(profile?.setupComplete);
  const lifestyle = Object.entries(profile?.lifestyle || {})
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `${key.replace(/([A-Z])/g, " $1")}: ${value}`);

  return (
    <main className="roommate-hub-page">
      <RoommateSubnav active="profile" />
      <header className="roommate-hub-heading">
        <p className="roommate-hub-eyebrow">Roommate Finder</p>
        <h1>My roommate profile</h1>
        <p>Choose what to share with potential roommates. Phone and email are never shown.</p>
      </header>

      {loading ? (
        <div className="roommate-profile-skeleton" aria-label="Loading roommate profile">
          <div /><div /><div />
        </div>
      ) : saved && !editing ? (
        <section className="roommate-my-profile-card">
          <div className="roommate-my-profile-heading">
            {account.avatar
              ? <img src={account.avatar} alt="" />
              : <span className="roommate-hub-avatar">{account.name?.charAt(0)?.toUpperCase() || "R"}</span>}
            <div>
              <h2>{account.name || "Your roommate profile"}</h2>
              <p>{seekingLabel[profile.seeking] || seekingLabel.both}</p>
            </div>
            <button type="button" className="roommate-secondary-action" onClick={() => setEditing(true)}>
              <Pencil size={15} /> Edit profile
            </button>
          </div>
          <div className="roommate-profile-summary">
            <span><MapPin size={16} /> {[profile.area, profile.city].filter(Boolean).join(", ") || "Location not set"}</span>
            <span>{budgetLabel(profile)}</span>
            <span>Move-in: {profile.moveInDate ? new Date(profile.moveInDate).toLocaleDateString("en-IN") : "Flexible"}</span>
            <span>Sharing: {profile.sharingType || "No preference"}</span>
          </div>
          {lifestyle.length > 0 && (
            <div className="roommate-lifestyle-chips">
              {lifestyle.map((item) => <span key={item}>{item}</span>)}
            </div>
          )}
          {profile.bio && <p className="roommate-profile-bio">{profile.bio}</p>}
          <div className="roommate-discovery-toggle">
            <span>
              <strong>Discovery</strong>
              <small>{profile.active ? "Your profile can appear in matches." : "Your profile is hidden from new matches."}</small>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(profile.active)}
              aria-label="Show profile in roommate discovery"
              className={profile.active ? "roommate-switch is-on" : "roommate-switch"}
              disabled={toggling}
              onClick={toggleDiscovery}
            >
              <span />
            </button>
          </div>
          <p className="roommate-private-note"><ShieldCheck size={15} /> Your phone and email are private and never displayed here.</p>
        </section>
      ) : (
        <form className="roommate-my-profile-card roommate-preferences-form" onSubmit={saveProfile}>
          <h2>{saved ? "Edit your details" : "Create your roommate profile"}</h2>
          <p className="roommate-form-intro">Share a few preferences so RoomSlider can find compatible roommates.</p>
          <label className="profile-label" htmlFor="roommate-city">City</label>
          <input id="roommate-city" className="profile-input" value={city} maxLength={60} onChange={(event) => setCity(event.target.value)} placeholder="e.g. Indore" required />
          <label className="profile-label" htmlFor="roommate-area">Area</label>
          <input id="roommate-area" className="profile-input" value={area} maxLength={60} onChange={(event) => setArea(event.target.value)} placeholder="e.g. Vijay Nagar" required />
          <label className="profile-label" htmlFor="roommate-bio">A little about you</label>
          <textarea id="roommate-bio" className="profile-input profile-textarea" value={bio} maxLength={150} rows={3} onChange={(event) => setBio(event.target.value)} placeholder="Your routine, preferences, or what makes a good roommate for you" />
          <RoommatePreferencesFields
            value={form}
            onChange={changePreference}
            onLifestyleChange={changeLifestyle}
          />
          <div className="roommate-form-actions">
            {saved && <button type="button" className="roommate-secondary-action" onClick={() => { setEditing(false); loadProfile(); }}>Cancel</button>}
            <button type="submit" className="roommate-primary-action" disabled={saving}>{saving ? "Saving..." : "Save roommate profile"}</button>
          </div>
          <p className="roommate-private-note"><ShieldCheck size={15} /> Phone and email stay private. Only your profile details and roommate preferences are shared.</p>
        </form>
      )}
      {!loading && !saved && (
        <Link className="roommate-profile-discover-link" to="/roommates">Browse roommate discovery</Link>
      )}
    </main>
  );
}

export default MyRoommateProfile;
