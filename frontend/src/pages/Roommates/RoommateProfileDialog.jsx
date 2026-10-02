import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";

const formatSeeking = (value) => ({
  room: "Looking for a room",
  roommate: "Has a room to share",
  both: "Open to either",
}[value] || "Roommate preferences");

function RoommateProfileDialog({ userId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.get(`/roommates/profiles/${userId}`)
      .then((response) => {
        if (active) setData(response.data);
      })
      .catch((error) => {
        if (active) toast.error(error.response?.data?.message || "Roommate profile could not be loaded");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [userId]);

  const profile = data?.profile;
  const preferences = profile?.lifestyle || {};
  const budget = profile && (profile.budgetMin || profile.budgetMax)
    ? `₹${Number(profile.budgetMin).toLocaleString("en-IN")} – ₹${Number(profile.budgetMax).toLocaleString("en-IN")}`
    : "";

  return (
    <div className="roommate-dialog-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="roommate-profile-dialog" role="dialog" aria-modal="true" aria-label="Roommate profile">
        <button type="button" className="roommate-dialog-close" onClick={onClose} aria-label="Close profile"><X size={20} /></button>
        {loading ? <p className="profile-empty">Loading profile...</p> : !profile ? (
          <p className="profile-empty">This roommate profile is not available.</p>
        ) : (
          <>
            <header className="roommate-dialog-profile-head">
              {profile.avatar ? <img src={profile.avatar} alt="" /> : <span>{profile.name?.charAt(0)?.toUpperCase() || "R"}</span>}
              <div>
                <h2>{profile.name}</h2>
                {profile.username && <p>@{profile.username}</p>}
                <span>{formatSeeking(profile.seeking)}</span>
              </div>
            </header>
            {profile.bio && <p className="roommate-dialog-bio">{profile.bio}</p>}
            <div className="roommate-dialog-facts">
              {(profile.area || profile.city) && <span><MapPin size={15} />{[profile.area, profile.city].filter(Boolean).join(", ")}</span>}
              {profile.gender && <span>Gender: {profile.gender}</span>}
              {profile.occupation && <span>{profile.occupation === "student" ? "Student" : profile.occupation}</span>}
              {profile.organization && <span>{profile.organization}</span>}
              {profile.course && <span>{profile.course}</span>}
              {profile.subject && <span>{profile.subject}</span>}
              {profile.studyYear && <span>{profile.studyYear}</span>}
              {budget && <span>Budget: {budget}</span>}
              {profile.sharingType && <span>Sharing: {profile.sharingType}</span>}
              {profile.moveInDate && <span>Move-in: {new Date(profile.moveInDate).toLocaleDateString("en-IN")}</span>}
              {preferences.cleanliness && <span>Cleanliness: {preferences.cleanliness}</span>}
              {preferences.sleepSchedule && <span>Sleep schedule: {preferences.sleepSchedule}</span>}
              {preferences.smoking && <span>Smoking: {preferences.smoking}</span>}
              {preferences.guests && <span>Guests: {preferences.guests}</span>}
            </div>

            <h3 className="roommate-saved-title">Saved rooms</h3>
            {!data.savedRooms?.length ? (
              <p className="profile-hint">No available saved rooms to show.</p>
            ) : (
              <div className="roommate-saved-rooms">
                {data.savedRooms.map((room) => (
                  <Link className="roommate-saved-room" to={`/rooms/${room._id}`} key={room._id} onClick={onClose}>
                    {room.images?.[0] && <img src={room.images[0]} alt="" loading="lazy" />}
                    <span className="roommate-saved-room-copy">
                      <strong>{room.title}</strong>
                      <span>{room.location}</span>
                      <b>₹{Number(room.price).toLocaleString("en-IN")} / month</b>
                    </span>
                  </Link>
                ))}
              </div>
            )}
            <p className="roommate-private-note">Contact details stay private. Chat is available after the request is accepted.</p>
          </>
        )}
      </section>
    </div>
  );
}

export default RoommateProfileDialog;
