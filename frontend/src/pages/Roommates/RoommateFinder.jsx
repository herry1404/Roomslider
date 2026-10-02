import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MapPin, ShieldAlert, Ban } from "lucide-react";
import toast from "react-hot-toast";

import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import "../../styles/profile.css";

const formatSeeking = (value) => ({
  room: "Looking for a room",
  roommate: "Has a room to share",
  both: "Open to either",
}[value] || "Looking for a roommate");

function RoommateFinder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [requests, setRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [mine, discover, requestList, connectionList] = await Promise.all([
        api.get("/roommates/me"),
        api.get("/roommates/discover"),
        api.get("/roommates/requests"),
        api.get("/roommates/connections"),
      ]);
      setProfile(mine.data.profile);
      setProfiles(discover.data.profiles || []);
      setRequests(requestList.data.requests || []);
      setConnections(connectionList.data.connections || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load roommate suggestions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) Promise.resolve().then(loadData);
  }, [user, loadData]);

  const sendRequest = async (personId) => {
    try {
      const response = await api.post(`/roommates/requests/${personId}`);
      toast.success(response.data.message || "Request sent");
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not send request");
    }
  };

  const respond = async (requestId, status) => {
    try {
      await api.put(`/roommates/requests/${requestId}`, { status });
      toast.success(status === "accepted" ? "It's a match!" : "Request declined");
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update request");
    }
  };

  const block = async (personId) => {
    if (!window.confirm("Block this profile? They will no longer see you or contact you.")) return;
    try {
      await api.post(`/roommates/block/${personId}`);
      toast.success("Profile blocked");
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not block profile");
    }
  };

  const report = async (personId) => {
    const reason = window.prompt("Tell us briefly why you are reporting this profile:");
    if (reason === null) return;
    try {
      await api.post(`/roommates/report/${personId}`, { reason });
      toast.success("Report submitted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not submit report");
    }
  };

  if (!user) {
    return (
      <div className="profile-view">
        <div className="profile-empty">
          <h1>Find a roommate</h1>
          <p>Sign in to see roommate suggestions that match your RoomSlider profile.</p>
          <button className="profile-save" onClick={() => navigate("/login")}>Log in</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="profile-view"><div className="profile-empty">Loading suggestions...</div></div>;
  }

  const profileReady = Boolean(profile?.setupComplete);
  const incoming = requests.filter((request) => request.direction === "incoming" && request.status === "pending");
  const outgoing = requests.filter((request) => request.direction === "outgoing" && request.status === "pending");

  return (
    <div className="profile-view">
      <h1 className="profile-head-name">Roommate suggestions</h1>
      <p className="profile-head-line">
        Suggestions use your one RoomSlider profile. Contact details stay private until you both accept.
      </p>

      {!profileReady ? (
        <div className="profile-empty">
          <p>Complete your RoomSlider profile and roommate preferences to get suggestions.</p>
          <p>Set them in your main profile&apos;s Edit Profile page. Contact details are never shown to suggestions.</p>
        </div>
      ) : !profile.active ? (
        <div className="profile-empty">Roommate suggestions are paused. Turn them on in your RoomSlider profile to see matches.</div>
      ) : profiles.length === 0 ? (
        <div className="profile-empty">No compatible roommates yet. Suggestions will appear here as profiles become available.</div>
      ) : (
        <section className="profile-list" aria-label="Roommate suggestions">
          {profiles.map((person) => (
            <article className="profile-item" key={person.id}>
              <div className="profile-item-main">
                <strong>{person.name}</strong>
                {person.username && <span className="profile-hint">@{person.username}</span>}
                <span className="profile-item-type">{formatSeeking(person.seeking)}</span>
                {person.gender && <span className="profile-hint">Gender: {person.gender}</span>}
                {person.occupation && (
                  <span className="profile-hint">
                    {person.occupation === "student" ? "Student" : person.occupation}
                  </span>
                )}
                {person.organization && <span className="profile-hint">{person.organization}</span>}
                {person.course && <span className="profile-hint">{person.course}</span>}
                {person.subject && <span className="profile-hint">{person.subject}</span>}
                {person.studyYear && <span className="profile-hint">{person.studyYear}</span>}
                {person.bio && <span className="profile-hint">{person.bio}</span>}
                {(person.area || person.city) && (
                  <span className="profile-hint">
                    <MapPin size={13} /> {[person.area, person.city].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
              <div className="profile-item-side">
                <span className="profile-status profile-status--confirmed">
                  <Heart size={13} /> {person.compatibility}% match
                </span>
                {person.incomingStatus === "pending" ? (
                  <span className="profile-hint">They sent you a request — respond below.</span>
                ) : person.outgoingStatus === "accepted" || person.incomingStatus === "accepted" ? (
                  <span className="profile-hint">Connected — contact details are in Matches.</span>
                ) : person.outgoingStatus === "pending" ? (
                  <span className="profile-hint">Request sent</span>
                ) : (
                  <button className="profile-photo-btn" onClick={() => sendRequest(person.id)}>Request to connect</button>
                )}
                <button className="profile-photo-btn" title="Block profile" onClick={() => block(person.id)}>
                  <Ban size={15} /> Block
                </button>
                <button className="profile-photo-btn" title="Report profile" onClick={() => report(person.id)}>
                  <ShieldAlert size={15} /> Report
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {profileReady && (incoming.length > 0 || outgoing.length > 0) && (
        <section className="profile-list">
          <h2 className="profile-section">Roommate requests</h2>
          {[...incoming, ...outgoing].map((request) => (
            <div className="profile-item" key={request.id}>
              <div className="profile-item-main">
                <strong>{request.person.name}</strong>
                {request.person.username && <span className="profile-hint">@{request.person.username}</span>}
                <span className="profile-hint">{request.direction === "incoming" ? "Wants to connect" : "Request sent"}</span>
              </div>
              {request.direction === "incoming" && (
                <div className="profile-item-side">
                  <button className="profile-photo-btn" onClick={() => respond(request.id, "accepted")}>Accept</button>
                  <button className="profile-photo-btn" onClick={() => respond(request.id, "declined")}>Decline</button>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {profileReady && (
        <section className="profile-list">
          <h2 className="profile-section">Connected roommates</h2>
          <p className="profile-hint">Phone and email are shown only after the request is accepted.</p>
          {connections.length === 0 ? (
            <div className="profile-empty">Accepted connections will appear here.</div>
          ) : connections.map((connection) => (
            <div className="profile-item" key={connection.id}>
              <div className="profile-item-main">
                <strong>{connection.name}</strong>
                {connection.username && <span className="profile-hint">@{connection.username}</span>}
                <span className="profile-hint">{connection.email}{connection.phone ? ` · ${connection.phone}` : ""}</span>
              </div>
            </div>
          ))}
        </section>
      )}

      <p className="profile-hint">
        <ShieldAlert size={14} /> Meet in a public place first and never send money to someone you have not met.{" "}
        <Link to="/privacy">Privacy details</Link>
      </p>
    </div>
  );
}

export default RoommateFinder;
