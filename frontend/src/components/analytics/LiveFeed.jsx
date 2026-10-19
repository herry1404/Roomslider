import { useEffect, useState } from "react";
import api from "../../api/axios";

const eventLabel = (event) => ({
  page_view: "Page viewed",
  listing_view: "Listing viewed",
  call_click: "Call clicked",
  whatsapp_click: "WhatsApp clicked",
  wishlist: "Saved listing",
  share: "Listing shared",
  search: "Search",
  signup: "New signup",
  login: "Login",
  menu_scan: "Cafe menu scanned",
  menu_item_view: "Menu item viewed",
}[event.type] || event.type);

export default function LiveFeed({ onUpdate }) {
  const [live, setLive] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const load = () => api.get("/analytics/live", { params: { range: "today" } })
      .then(({ data }) => { if (active) { setLive(data.live); onUpdate?.(data.live); setError(""); } })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || "Live analytics unavailable."); });
    load();
    const timer = window.setInterval(load, 10000);
    return () => { active = false; window.clearInterval(timer); };
  }, [onUpdate]);
  return (
    <section className="admin-analytics-card analytics-live-card">
      <header className="analytics-card-header">
        <h2>Live activity</h2>
        <span className="admin-badge green"><span className="admin-badge-dot" />{live?.activeNow || 0} active now</span>
      </header>
      {error ? <p className="analytics-error" role="alert">{error}</p> : live?.events?.length ? <ol className="analytics-live-list">
        {live.events.map((event) => <li key={event._id}>
          <span className="admin-badge blue">{eventLabel(event)}</span>
          <span>{event.searchQuery || event.entityId || event.area || "RoomSlider"}</span>
          <time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</time>
        </li>)}
      </ol> : <div className="admin-empty"><h3>No recent events</h3><p>New activity appears here as it is recorded.</p></div>}
    </section>
  );
}
