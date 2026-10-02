import { Megaphone } from "lucide-react";
import BroadcastComposer from "../../components/notifications/BroadcastComposer";

function ManageNotifications() {
  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Notifications</h1>
          <p>Send an announcement to RoomSlider users.</p>
        </div>
        <Megaphone size={26} />
      </div>
      <BroadcastComposer />
    </div>
  );
}

export default ManageNotifications;
