import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Ban, Heart, MapPin, ShieldAlert, UserRound, X } from "lucide-react";
import toast from "react-hot-toast";

import api from "../../api/axios";
import confirmAction from "../../utils/confirmAction";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/useNotifications";
import RoommateSubnav from "./RoommateSubnav";
import "../../styles/roommate-chat.css";

const formatSeeking = (value) => ({
  room: "Looking for a room",
  roommate: "Has a room to share",
  both: "Open to either",
}[value] || "Looking for a roommate");

function RoommateFinder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { refreshRoommateBadges } = useNotifications();
  const [profile, setProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ city: "", area: "", budget: "", sharingType: "" });
  const [reportingId, setReportingId] = useState("");
  const [reportReason, setReportReason] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [mine, discover] = await Promise.all([
        api.get("/roommates/me"),
        api.get("/roommates/discover"),
      ]);
      setProfile(mine.data.profile);
      setProfiles(discover.data.profiles || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load roommate suggestions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) Promise.resolve().then(loadData);
  }, [user, loadData]);

  const matches = useMemo(() => profiles.filter((person) => {
    const cityMatches = !filters.city || person.city?.toLowerCase().includes(filters.city.trim().toLowerCase());
    const areaMatches = !filters.area || person.area?.toLowerCase().includes(filters.area.trim().toLowerCase());
    const budget = Number(filters.budget) || 0;
    const budgetMatches = !budget || !person.budgetMin && !person.budgetMax ||
      ((!person.budgetMin || person.budgetMin <= budget) && (!person.budgetMax || person.budgetMax >= budget));
    const sharingMatches = !filters.sharingType || !person.sharingType || person.sharingType === filters.sharingType;
    return cityMatches && areaMatches && budgetMatches && sharingMatches;
  }), [filters, profiles]);

  const sendRequest = async (personId) => {
    try {
      const response = await api.post(`/roommates/requests/${personId}`);
      toast.success(response.data.message || "Interest sent");
      if (response.data.status === "accepted") navigate("/roommates/messages");
      await Promise.all([loadData(), refreshRoommateBadges()]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not send interest");
    }
  };

  const block = async (personId) => {
    if (!await confirmAction("Block this profile? They will no longer see you or contact you.", { confirmText: "Block" })) return;
    try {
      await api.post(`/roommates/block/${personId}`);
      toast.success("Profile blocked");
      await Promise.all([loadData(), refreshRoommateBadges()]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not block profile");
    }
  };

  const report = async (event) => {
    event.preventDefault();
    if (!reportingId) return;
    try {
      await api.post(`/roommates/report/${reportingId}`, { reason: reportReason });
      toast.success("Report submitted");
      setReportingId("");
      setReportReason("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not submit report");
    }
  };

  if (!user) {
    return (
      <main className="roommate-hub-page">
        <RoommateSubnav active="discover" />
        <div className="roommate-hub-empty">
          <h1>Discover roommates</h1>
          <p>Log in to see roommate suggestions that match your preferences.</p>
          <button className="roommate-primary-action" type="button" onClick={() => navigate("/login")}>Log in</button>
        </div>
      </main>
    );
  }

  const profileReady = Boolean(profile?.setupComplete);

  return (
    <main className="roommate-hub-page">
      <RoommateSubnav active="discover" />
      <header className="roommate-hub-heading">
        <p className="roommate-hub-eyebrow">Roommate Finder</p>
        <h1>Discover</h1>
        <p>Explore compatible roommate profiles. Your contact details stay private.</p>
      </header>

      {!loading && !profileReady && (
        <aside className="roommate-profile-banner">
          <span><strong>Create your roommate profile</strong><small>Add your preferences to unlock compatible matches.</small></span>
          <Link to="/roommates/profile">Create profile</Link>
        </aside>
      )}
      {!loading && profileReady && !profile.active && (
        <aside className="roommate-profile-banner">
          <span><strong>Discovery is paused</strong><small>Turn it on from your roommate profile to appear in matches.</small></span>
          <Link to="/roommates/profile">Update profile</Link>
        </aside>
      )}

      <section className="roommate-discovery-filters" aria-label="Filter roommate matches">
        <label>
          <span>City</span>
          <input value={filters.city} onChange={(event) => setFilters((current) => ({ ...current, city: event.target.value }))} placeholder="Any city" />
        </label>
        <label>
          <span>Area</span>
          <input value={filters.area} onChange={(event) => setFilters((current) => ({ ...current, area: event.target.value }))} placeholder="Any area" />
        </label>
        <label>
          <span>Budget per month</span>
          <input type="number" min="0" value={filters.budget} onChange={(event) => setFilters((current) => ({ ...current, budget: event.target.value }))} placeholder="Any budget" />
        </label>
        <label>
          <span>Sharing</span>
          <select value={filters.sharingType} onChange={(event) => setFilters((current) => ({ ...current, sharingType: event.target.value }))}>
            <option value="">Any sharing</option>
            <option value="Single">Single</option>
            <option value="Double">Double</option>
            <option value="Triple">Triple</option>
            <option value="Other">Other</option>
          </select>
        </label>
      </section>

      {loading ? (
        <div className="roommate-discovery-cards" aria-label="Loading matches">
          {[1, 2, 3].map((item) => <div className="roommate-discovery-skeleton" key={item} />)}
        </div>
      ) : !profileReady ? (
        <div className="roommate-hub-empty">
          <h2>Set up your roommate profile first</h2>
          <p>Your preferences help us show relevant roommate matches.</p>
        </div>
      ) : !profile.active ? (
        <div className="roommate-hub-empty">
          <h2>Your profile is hidden</h2>
          <p>Turn discovery on when you are ready to find a roommate.</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="roommate-hub-empty">
          <h2>{profiles.length ? "No profiles match these filters" : "No compatible roommates yet"}</h2>
          <p>{profiles.length ? "Try changing or clearing a filter." : "New compatible profiles will appear here."}</p>
        </div>
      ) : (
        <section className="roommate-discovery-cards" aria-label="Roommate matches">
          {matches.map((person) => (
            <article className="roommate-discovery-card" key={person.id}>
              <Link to={`/roommates/profile/${person.id}`} className="roommate-discovery-person">
                {person.avatar
                  ? <img src={person.avatar} alt="" />
                  : <span className="roommate-hub-avatar">{person.name?.charAt(0)?.toUpperCase() || "R"}</span>}
                <span>
                  <strong>{person.name}</strong>
                  <small>{formatSeeking(person.seeking)}</small>
                </span>
              </Link>
              <span className="roommate-match-score"><Heart size={14} /> {person.compatibility}% match</span>
              <div className="roommate-match-facts">
                {(person.area || person.city) && <span><MapPin size={14} />{[person.area, person.city].filter(Boolean).join(", ")}</span>}
                {(person.budgetMin || person.budgetMax) && (
                  <span>₹{Number(person.budgetMin || 0).toLocaleString("en-IN")} – ₹{Number(person.budgetMax || 0).toLocaleString("en-IN")} / month</span>
                )}
                {person.sharingType && <span>{person.sharingType} sharing</span>}
                {person.moveInDate && <span>Move-in {new Date(person.moveInDate).toLocaleDateString("en-IN")}</span>}
              </div>
              {person.bio && <p className="roommate-match-bio">{person.bio}</p>}
              <div className="roommate-discovery-actions">
                {person.outgoingStatus === "accepted" || person.incomingStatus === "accepted" ? (
                  <Link className="roommate-primary-action" to="/roommates/messages">Open messages</Link>
                ) : person.outgoingStatus === "pending" ? (
                  <span className="roommate-request-status is-pending">Interest sent</span>
                ) : person.incomingStatus === "pending" ? (
                  <Link className="roommate-primary-action" to="/roommates/requests">View received interest</Link>
                ) : (
                  <button className="roommate-primary-action" type="button" onClick={() => sendRequest(person.id)}>Send interest</button>
                )}
                <Link className="roommate-icon-action" to={`/roommates/profile/${person.id}`} aria-label={`View ${person.name}'s profile`} title="View profile"><UserRound size={17} /></Link>
                <button className="roommate-icon-action" type="button" title="Block profile" aria-label="Block profile" onClick={() => block(person.id)}><Ban size={17} /></button>
                <button className="roommate-icon-action" type="button" title="Report profile" aria-label="Report profile" onClick={() => setReportingId(person.id)}><ShieldAlert size={17} /></button>
              </div>
            </article>
          ))}
        </section>
      )}
      <p className="roommate-private-note"><ShieldAlert size={14} /> Contact details are not shared. <Link to="/privacy">Privacy details</Link></p>
      {reportingId && <div className="roommate-report-overlay" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setReportingId("");
      }}>
        <form className="roommate-report-modal" onSubmit={report}>
          <button type="button" className="roommate-report-close" aria-label="Close report dialog" onClick={() => setReportingId("")}><X size={18} /></button>
          <h2>Report profile</h2>
          <p>Tell us what happened. Our team will review your report.</p>
          <textarea value={reportReason} maxLength={500} onChange={(event) => setReportReason(event.target.value)} placeholder="Describe the issue (optional)" />
          <button className="roommate-primary-action" type="submit">Submit report</button>
        </form>
      </div>}
    </main>
  );
}

export default RoommateFinder;
