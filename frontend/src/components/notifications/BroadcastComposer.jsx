import { useState } from "react";
import { Send } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import "../../styles/notifications.css";

function BroadcastComposer() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const send = async (event) => {
    event.preventDefault();
    if (sending) return;

    try {
      setSending(true);
      setResult(null);
      const response = await api.post("/notifications/broadcast", { title, message });
      const { recipientCount, push } = response.data;
      setResult({ recipientCount, push });
      setTitle("");
      setMessage("");
      if (!push.configured) {
        toast.success(`In-app message saved for ${recipientCount} users`);
      } else {
        toast.success(`Message sent to ${recipientCount} users`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Message send nahi hua");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="notification-composer">
      <div className="notification-composer-heading">
        <div>
          <h2>Send a notification</h2>
          <p>Message all RoomSlider user accounts. Browser push reaches users who enabled it.</p>
        </div>
      </div>

      <form onSubmit={send}>
        <label>
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={100}
            placeholder="Announcement title"
            required
          />
        </label>
        <label>
          Message
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Write your message..."
            required
          />
        </label>
        <button type="submit" disabled={sending}>
          <Send size={17} />
          {sending ? "Sending..." : "Send to everyone"}
        </button>
      </form>

      {result && (
        <p className="notification-composer-result" role="status">
          Saved for {result.recipientCount} user accounts.
          {result.push.configured
            ? ` Browser push delivered to ${result.push.delivered} device(s)${
                result.push.failed ? `; ${result.push.failed} failed` : ""
              }.`
            : " Browser push requires VAPID server configuration."}
        </p>
      )}
    </section>
  );
}

export default BroadcastComposer;
