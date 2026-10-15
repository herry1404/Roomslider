import { useState } from "react";
import { BellRing, Megaphone } from "lucide-react";
import BroadcastComposer from "../../components/notifications/BroadcastComposer";
import PushNotifications from "./PushNotifications";
import "../../styles/admin/theme.css";

function NotificationsCenter() {
  const [activeTab, setActiveTab] = useState("announcement");

  return (
    <main className="admin-page notifications-center">
      <header className="admin-page-header">
        <div>
          <h1>Notifications</h1>
          <p>Manage user announcements and browser push campaigns from one place.</p>
        </div>
        <BellRing size={26} />
      </header>
      <div className="notifications-tabs" role="tablist" aria-label="Notification type">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "announcement"}
          className={activeTab === "announcement" ? "active" : ""}
          onClick={() => setActiveTab("announcement")}
        >
          <Megaphone size={17} /> In-app announcement
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "push"}
          className={activeTab === "push" ? "active" : ""}
          onClick={() => setActiveTab("push")}
        >
          <BellRing size={17} /> Browser push
        </button>
      </div>
      <section role="tabpanel">
        {activeTab === "announcement" ? <BroadcastComposer /> : <PushNotifications embedded />}
      </section>
    </main>
  );
}

export default NotificationsCenter;
