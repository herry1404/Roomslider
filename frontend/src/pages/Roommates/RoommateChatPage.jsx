import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import RoommateChat from "./RoommateChat";
import "../../styles/profile.css";
import "../../styles/roommate-chat.css";

function RoommateChatPage() {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const routePerson = location.state?.person;
  const hasRoutePerson = routePerson?.id === userId;
  const [connectionResult, setConnectionResult] = useState(null);
  const person = hasRoutePerson
    ? routePerson
    : connectionResult?.userId === userId ? connectionResult.person : null;
  const unavailable = connectionResult?.userId === userId && connectionResult.unavailable;
  const loading = !hasRoutePerson && connectionResult?.userId !== userId;

  useEffect(() => {
    let active = true;
    if (!user || hasRoutePerson) return () => { active = false; };
    api.get("/roommates/connections")
      .then((response) => {
        if (!active) return;
        const connection = (response.data.connections || []).find((item) => item.id === userId);
        setConnectionResult({ userId, person: connection || null, unavailable: !connection });
      })
      .catch((error) => {
        if (!active) return;
        setConnectionResult({ userId, person: null, unavailable: true });
        toast.error(error.response?.data?.message || "Roommate connection could not be loaded");
      });
    return () => { active = false; };
  }, [hasRoutePerson, user, userId]);

  if (!user) {
    return (
      <main className="roommate-chat-page">
        <div className="roommate-chat-message-state">
          <p>Log in to open your roommate chats.</p>
          <button className="roommate-profile-chat-link" onClick={() => navigate("/login")}>Log in</button>
        </div>
      </main>
    );
  }

  if (loading) {
    return <main className="roommate-chat-page"><div className="roommate-chat-message-state">Loading chat...</div></main>;
  }

  if (!person || unavailable) {
    return (
      <main className="roommate-chat-page">
        <div className="roommate-chat-message-state">
          <p>This roommate connection is not available.</p>
          <button className="roommate-profile-chat-link" onClick={() => navigate("/roommates")}>
            Back to roommate matches
          </button>
        </div>
      </main>
    );
  }

  return (
    <RoommateChat
      person={person}
      currentUserId={user?._id || user?.id}
      onClose={() => navigate("/roommates")}
    />
  );
}

export default RoommateChatPage;
