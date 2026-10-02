import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import RoommatePreferencesFields from "../../components/profile/RoommatePreferencesFields";
import "../../styles/profile.css";

const BIO_MAX = 150;
const MAX_PHOTO_MB = 10;

const EMPTY = {
  name: "",
  username: "",
  bio: "",
  occupation: "",
  organization: "",
  course: "",
  subject: "",
  studyYear: "",
  gender: "",
  dob: "",
  city: "",
  area: "",
  hometown: "",
};

const EMPTY_ROOMMATE_PREFERENCES = {
  active: true,
  seeking: "both",
  budgetMin: "",
  budgetMax: "",
  moveInDate: "",
  sharingType: "",
  lifestyle: {
    cleanliness: "",
    sleepSchedule: "",
    smoking: "",
    guests: "",
  },
};

function ProfileEdit() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  const [form, setForm] = useState(EMPTY);
  const [roommatePreferences, setRoommatePreferences] = useState(EMPTY_ROOMMATE_PREFERENCES);
  const [roommatePreferencesTouched, setRoommatePreferencesTouched] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isUserAccount = user && (!user.role || ["user", "admin"].includes(user.role));
  const loading = Boolean(isUserAccount && profileLoading);

  const syncLocalUser = (u) => {
    const merged = {
      ...user,
      name: u.name,
      username: u.username,
      bio: u.bio,
      avatar: u.avatar,
      occupation: u.occupation,
      city: u.city,
      area: u.area,
      organization: u.organization,
      course: u.course,
      subject: u.subject,
      studyYear: u.studyYear,
      roommatePreferences: u.roommatePreferences,
    };
    localStorage.setItem("user", JSON.stringify(merged));
    setUser(merged);
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!isUserAccount) {
      return;
    }

    const loadProfile = async () => {
      try {
        const res = await api.get("/users/me");
        const u = res.data.user;
        setForm({
          name: u.name || "",
          username: u.username || "",
          bio: u.bio || "",
          occupation: u.occupation || "",
          organization: u.organization || "",
          course: u.course || "",
          subject: u.subject || "",
          studyYear: u.studyYear || "",
          gender: u.gender || "",
          dob: u.dob ? String(u.dob).slice(0, 10) : "",
          city: u.city || "",
          area: u.area || "",
          hometown: u.hometown || "",
        });
        if (u.roommatePreferences) {
          setRoommatePreferences({
            ...EMPTY_ROOMMATE_PREFERENCES,
            ...u.roommatePreferences,
            lifestyle: {
              ...EMPTY_ROOMMATE_PREFERENCES.lifestyle,
              ...(u.roommatePreferences.lifestyle || {}),
            },
          });
        }
        setAvatar(u.avatar || null);
      } catch (err) {
        toast.error(err.response?.data?.message || "Profile load nahi hua");
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "occupation" && value !== "student"
        ? { course: "", subject: "", studyYear: "" }
        : {}),
    }));
  };

  const changeRoommatePreference = (key, value) => {
    setRoommatePreferences((current) => ({ ...current, [key]: value }));
    setRoommatePreferencesTouched(true);
  };

  const changeRoommateLifestyle = (key, value) => {
    setRoommatePreferences((current) => ({
      ...current,
      lifestyle: { ...current.lifestyle, [key]: value },
    }));
    setRoommatePreferencesTouched(true);
  };

  const handlePhoto = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Sirf photo select karo");
      return;
    }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      toast.error("Photo " + MAX_PHOTO_MB + "MB se chhoti honi chahiye");
      return;
    }

    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await api.put("/users/me/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const u = res.data.user;
      setAvatar(u.avatar);
      syncLocalUser(u);
      toast.success("Photo update ho gayi");
    } catch (err) {
      toast.error(err.response?.data?.message || "Photo upload nahi hui");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;

    const payload = { ...form };
    if (!payload.username.trim()) delete payload.username;

    try {
      setSaving(true);
      if (roommatePreferencesTouched) {
        payload.roommatePreferences = {
          ...roommatePreferences,
          budgetMin: Number(roommatePreferences.budgetMin) || 0,
          budgetMax: Number(roommatePreferences.budgetMax) || 0,
          moveInDate: roommatePreferences.moveInDate || null,
        };
      }
      const res = await api.put("/users/me", payload);
      syncLocalUser(res.data.user);
      toast.success("Profile save ho gayi");
    } catch (err) {
      toast.error(err.response?.data?.message || "Profile save nahi hui");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-card">Loading...</div>
      </div>
    );
  }

  if (!isUserAccount) {
    return (
      <div className="profile-page">
        <div className="profile-card">Ye profile page sirf users ke liye hai.</div>
      </div>
    );
  }

  const initial = (form.name || "U").trim().charAt(0).toUpperCase();
  const today = new Date().toISOString().slice(0, 10);
  const orgLabel = form.occupation === "student" ? "College" : "Company / Business";

  return (
    <div className="profile-page">
      <form className="profile-card" onSubmit={handleSave}>
        <div className="profile-avatar-wrap">
          {avatar ? (
            <img className="profile-avatar-img" src={avatar} alt="Profile" />
          ) : (
            <div className="profile-avatar">{initial}</div>
          )}
        </div>

        <div className="profile-photo-actions">
          <button
            type="button"
            className="profile-photo-btn"
            disabled={uploading}
            onClick={() => cameraRef.current && cameraRef.current.click()}
          >
            Take photo
          </button>
          <button
            type="button"
            className="profile-photo-btn"
            disabled={uploading}
            onClick={() => galleryRef.current && galleryRef.current.click()}
          >
            Gallery
          </button>
        </div>
        {uploading && <span className="profile-hint profile-center">Photo upload ho rahi hai...</span>}

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="user"
          hidden
          onChange={handlePhoto}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handlePhoto}
        />

        <h1 className="profile-title">Edit Profile</h1>

        <label className="profile-label">Name</label>
        <input
          className="profile-input"
          name="name"
          value={form.name}
          onChange={handleChange}
          maxLength={60}
          required
        />

        <label className="profile-label">Username</label>
        <input
          className="profile-input"
          name="username"
          value={form.username}
          onChange={handleChange}
          placeholder="e.g. jams_indore"
          maxLength={20}
          autoCapitalize="none"
        />
        <span className="profile-hint">3-20 characters: a-z, 0-9, _ aur .</span>

        <label className="profile-label">Bio</label>
        <textarea
          className="profile-input profile-textarea"
          name="bio"
          value={form.bio}
          onChange={handleChange}
          maxLength={BIO_MAX}
          rows={3}
          placeholder="Apne baare mein kuch likho"
        />
        <span className="profile-hint">
          {form.bio.length}/{BIO_MAX}
        </span>

        <h2 className="profile-section">About you</h2>

        <label className="profile-label">Occupation</label>
        <select
          className="profile-input"
          name="occupation"
          value={form.occupation}
          onChange={handleChange}
        >
          <option value="">Select</option>
          <option value="student">Student</option>
          <option value="working">Working professional</option>
          <option value="business">Business</option>
          <option value="other">Other</option>
        </select>

        <label className="profile-label">{orgLabel}</label>
        <input
          className="profile-input"
          name="organization"
          value={form.organization}
          onChange={handleChange}
          maxLength={80}
          placeholder={form.occupation === "student" ? "e.g. IET DAVV" : "e.g. company ya business ka naam"}
        />

        {form.occupation === "student" && (
          <>
            <label className="profile-label">Degree / course</label>
            <input
              className="profile-input"
              name="course"
              value={form.course}
              onChange={handleChange}
              maxLength={100}
              placeholder="e.g. B.Tech, B.Com, MBA"
            />

            <label className="profile-label">Subject / branch / major</label>
            <input
              className="profile-input"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              maxLength={100}
              placeholder="e.g. Computer Science"
            />

            <label className="profile-label">Current year / semester</label>
            <input
              className="profile-input"
              name="studyYear"
              value={form.studyYear}
              onChange={handleChange}
              maxLength={40}
              placeholder="e.g. 2nd year or Semester 4"
            />
          </>
        )}

        <label className="profile-label">Gender</label>
        <select
          className="profile-input"
          name="gender"
          value={form.gender}
          onChange={handleChange}
        >
          <option value="">Select</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>

        <label className="profile-label">Date of birth</label>
        <input
          className="profile-input"
          type="date"
          name="dob"
          value={form.dob}
          onChange={handleChange}
          max={today}
        />

        <h2 className="profile-section">Location</h2>

        <label className="profile-label">City</label>
        <input
          className="profile-input"
          name="city"
          value={form.city}
          onChange={handleChange}
          maxLength={60}
          placeholder="e.g. Indore"
        />

        <label className="profile-label">Area</label>
        <input
          className="profile-input"
          name="area"
          value={form.area}
          onChange={handleChange}
          maxLength={60}
          placeholder="e.g. Vijay Nagar"
        />

        <label className="profile-label">Hometown</label>
        <input
          className="profile-input"
          name="hometown"
          value={form.hometown}
          onChange={handleChange}
          maxLength={60}
        />
        <span className="profile-hint">
          Roommate suggestions may show your gender, education and basic profile info. DOB and hometown remain private.
        </span>
        <RoommatePreferencesFields
          value={roommatePreferences}
          onChange={changeRoommatePreference}
          onLifestyleChange={changeRoommateLifestyle}
        />

        <button className="profile-save" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}

export default ProfileEdit;
