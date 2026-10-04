import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import "../../styles/profile.css";
import "../../styles/blood-donor.css";

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
  bloodGroup: "",
  bloodDonorConsent: false,
  bloodDonorAvailable: true,
  lastDonatedAt: "",
};

function ProfileEdit() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useAuth();

  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  const [form, setForm] = useState(EMPTY);
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
      bloodGroup: u.bloodGroup || "",
      bloodDonorConsent: Boolean(u.bloodDonorConsent),
      bloodDonorAvailable: u.bloodDonorAvailable !== false,
      lastDonatedAt: u.lastDonatedAt ? String(u.lastDonatedAt).slice(0, 10) : "",
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
          bloodGroup: u.bloodGroup || "",
          bloodDonorConsent: Boolean(u.bloodDonorConsent),
          bloodDonorAvailable: u.bloodDonorAvailable !== false,
          lastDonatedAt: u.lastDonatedAt ? String(u.lastDonatedAt).slice(0, 10) : "",
        });
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

  useEffect(() => {
    if (!profileLoading && location.hash === "#blood-donation") {
      document.getElementById("blood-donation")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash, profileLoading]);

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

  const setBloodConsent = (event) => {
    if (event.target.checked) {
      const dob = form.dob ? new Date(`${form.dob}T00:00:00`) : null;
      const adultDate = dob ? new Date(dob) : null;
      if (adultDate) adultDate.setFullYear(adultDate.getFullYear() + 18);
      if (!adultDate || adultDate > new Date()) {
        toast.error("Blood donor registration is available to adults aged 18 and over. Add your date of birth first.");
        return;
      }
      if (!form.bloodGroup) {
        toast.error("Select your blood group before enabling donor consent.");
        return;
      }
    }
    setForm((current) => ({ ...current, bloodDonorConsent: event.target.checked }));
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
      const res = await api.put("/users/me/avatar", fd);
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
        <div className="profile-form-fields">
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

          <section className="blood-profile-section" id="blood-donation">
            <h2 className="profile-section">Blood donation (optional)</h2>
            <p className="blood-profile-notice">You must be at least 18 years old to register as a donor. Your blood group is never shown on your public profile.</p>
            <label className="profile-label" htmlFor="blood-group">Blood group</label>
            <select className="profile-input" id="blood-group" name="bloodGroup" value={form.bloodGroup} onChange={handleChange}>
              <option value="">Select blood group</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => <option key={group} value={group}>{group}</option>)}
            </select>
            <label className="blood-profile-check">
              <input type="checkbox" checked={form.bloodDonorConsent} onChange={setBloodConsent} />
              <span>I agree to receive blood donation requests from RoomSlider and to share my contact number with a requester only when I tap “I can help”.</span>
            </label>
            <label className="blood-profile-check">
              <input type="checkbox" checked={form.bloodDonorAvailable} onChange={(event) => setForm((current) => ({ ...current, bloodDonorAvailable: event.target.checked }))} />
              <span>Available now</span>
            </label>
            <label className="profile-label" htmlFor="last-donated-at">Last donated (optional)</label>
            <input className="profile-input" id="last-donated-at" type="date" max={today} value={form.lastDonatedAt} onChange={handleChange} name="lastDonatedAt" />
            <p className="blood-profile-footnote">Turning off consent removes you from future donor matching immediately.</p>
          </section>
        </div>

        <div className="profile-save-bar">
          <button className="profile-save" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProfileEdit;
