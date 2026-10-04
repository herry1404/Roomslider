import { useEffect, useState } from "react";
import { BellRing, Send } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import EmptyState from "../../components/ui/EmptyState";
import "../../styles/notifications.css";
import "../../styles/admin/push-notifications.css";

function PushNotifications() {
  const [form, setForm] = useState({
    title: "", message: "", hiTitle: "", hiMessage: "", link: "/", audience: "all",
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    api.get("/admin/push/history")
      .then(({ data }) => setHistory(data.history || []))
      .catch((error) => toast.error(error.response?.data?.message || "Push history could not be loaded"))
      .finally(() => setLoading(false));
  }, []);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const updateImage = (event) => {
    const file = event.target.files?.[0] || null;
    setImage(file);
    setPreview(file ? URL.createObjectURL(file) : "");
  };

  const send = async (event) => {
    event.preventDefault();
    if (sending) return;
    try {
      setSending(true);
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (image) payload.append("image", image);
      const { data } = await api.post("/admin/push/send", payload);
      setHistory((current) => [data.history, ...current]);
      setForm({ title: "", message: "", hiTitle: "", hiMessage: "", link: "/", audience: "all" });
      setImage(null);
      setPreview("");
      toast.success(`Push sent to ${data.push.delivered} device(s)`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Push could not be sent");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div><h1>Push Notifications</h1><p>Send a browser notification to a selected audience.</p></div>
        <BellRing size={26} />
      </header>

      <section className="push-admin-card">
        <form className="push-admin-form" onSubmit={send}>
          <label>Title<input name="title" value={form.title} onChange={update} maxLength={100} required /></label>
          <label>Message<textarea name="message" value={form.message} onChange={update} maxLength={500} rows={3} required /></label>
          <details>
            <summary>Optional Hinglish version</summary>
            <label>Hinglish title<input name="hiTitle" value={form.hiTitle} onChange={update} maxLength={100} /></label>
            <label>Hinglish message<textarea name="hiMessage" value={form.hiMessage} onChange={update} maxLength={500} rows={3} /></label>
          </details>
          <div className="push-admin-fields">
            <label>Link<input name="link" value={form.link} onChange={update} maxLength={300} placeholder="/" /></label>
            <label>Audience<select name="audience" value={form.audience} onChange={update}>
              <option value="all">Everyone</option>
              <option value="owners">Owners</option>
              <option value="students">Students</option>
            </select></label>
          </div>
          <label>Image (optional, max 5 MB)<input type="file" accept="image/*" onChange={updateImage} /></label>
          {preview && <img className="push-admin-preview" src={preview} alt="Notification preview" />}
          <button type="submit" disabled={sending}><Send size={17} />{sending ? "Sending…" : "Send push"}</button>
        </form>
      </section>

      <section className="push-admin-history">
        <h2>Recent sends</h2>
        {loading ? <p>Loading history…</p> : history.length === 0 ? (
          <EmptyState icon={BellRing} title="No push notifications yet" description="Sent notifications will appear here." />
        ) : history.map((item) => (
          <article className="push-admin-history-item" key={item._id}>
            <div><strong>{item.title}</strong><p>{item.message}</p><small>{item.audience} · {new Date(item.createdAt).toLocaleString("en-IN")}</small></div>
            <span>{item.delivered} delivered{item.failed ? ` · ${item.failed} failed` : ""}</span>
          </article>
        ))}
      </section>
    </main>
  );
}

export default PushNotifications;
