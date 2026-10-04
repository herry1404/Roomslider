import { optimizeCloudinaryImage } from "../../utils/optimizeCloudinaryImage";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../../api/axios";
import { useNotifications } from "../../context/useNotifications";
import RoommateSubnav from "./RoommateSubnav";
import "../../styles/roommate-chat.css";

const TABS = [
  { id: "received", label: "Received" },
  { id: "sent", label: "Sent" },
];

function RoommateRequests() {
  const [tab, setTab] = useState("received");
  const [result, setResult] = useState({ tab: "", requests: [] });
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const { refreshRoommateBadges, loadLatest } = useNotifications();
  const requests = result.tab === tab ? result.requests : [];

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/roommates/requests", { params: { type: tab } });
      setResult({ tab, requests: response.data.requests || [] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Requests could not be loaded");
      setResult({ tab, requests: [] });
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    Promise.resolve().then(loadRequests);
  }, [loadRequests]);

  const actOnRequest = async (request, status) => {
    setWorkingId(request.id);
    try {
      await api.put(`/roommates/requests/${request.id}`, { status });
      toast.success(status === "accepted" ? "Roommate connection accepted" : "Request declined");
      await Promise.all([loadRequests(), refreshRoommateBadges(), loadLatest()]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Request could not be updated");
    } finally {
      setWorkingId("");
    }
  };

  const cancelRequest = async (request) => {
    setWorkingId(request.id);
    try {
      await api.delete(`/roommates/requests/${request.id}`);
      toast.success("Request cancelled");
      await Promise.all([loadRequests(), refreshRoommateBadges()]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Request could not be cancelled");
    } finally {
      setWorkingId("");
    }
  };

  return (
    <main className="roommate-hub-page">
      <RoommateSubnav active="requests" />
      <header className="roommate-hub-heading">
        <p className="roommate-hub-eyebrow">Roommate Finder</p>
        <h1>Requests</h1>
        <p>Review incoming interests or check the requests you have sent.</p>
      </header>
      <div className="roommate-request-tabs" role="tablist" aria-label="Request direction">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? "is-active" : ""}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <section className="roommate-hub-list" aria-live="polite">
        {loading ? (
          <div className="roommate-hub-skeletons">
            {[1, 2, 3].map((item) => <div className="roommate-hub-skeleton" key={item} />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="roommate-hub-empty">
            <h2>{tab === "received" ? "No new roommate requests" : "No sent requests"}</h2>
            <p>{tab === "received" ? "New interests will appear here." : "When you send an interest, it will appear here."}</p>
            <Link to="/roommates">Discover roommates</Link>
          </div>
        ) : requests.map((request) => {
          const pending = request.status === "pending";
          return (
            <article className="roommate-hub-row" key={request.id}>
              <Link className="roommate-hub-person" to={`/roommates/profile/${request.person._id}`}>
                {request.person.avatar
                  ? <img src={optimizeCloudinaryImage(request.person.avatar, 256)} alt="" loading="lazy" />
                  : <span className="roommate-hub-avatar">{request.person.name?.charAt(0)?.toUpperCase() || "R"}</span>}
                <span>
                  <strong>{request.person.name}</strong>
                  <small>{tab === "received" ? "Interested in connecting" : "You sent an interest"}</small>
                </span>
              </Link>
              <div className="roommate-hub-row-actions">
                <span className={`roommate-request-status is-${request.status}`}>{request.status}</span>
                {tab === "received" && pending && (
                  <>
                    <button type="button" className="roommate-primary-action" disabled={workingId === request.id} onClick={() => actOnRequest(request, "accepted")}>Accept</button>
                    <button type="button" className="roommate-secondary-action" disabled={workingId === request.id} onClick={() => actOnRequest(request, "declined")}>Decline</button>
                  </>
                )}
                {tab === "sent" && pending && (
                  <button type="button" className="roommate-secondary-action" disabled={workingId === request.id} onClick={() => cancelRequest(request)}>Cancel</button>
                )}
                {request.status === "accepted" && (
                  <Link className="roommate-primary-action" to="/roommates/messages">Open messages</Link>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

export default RoommateRequests;
