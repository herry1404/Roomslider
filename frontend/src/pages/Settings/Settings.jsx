import { useState } from "react";
import { BellRing } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../../components/ThemeToggle";
import SavedSearches from "../../components/settings/SavedSearches";

function decodeVapidKey(value) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(window.atob(base64), (character) => character.charCodeAt(0));
}

function Settings() {
  const { user } = useAuth();
  const [enablingAdminPush, setEnablingAdminPush] = useState(false);

  const enableAdminPush = async () => {
    if (enablingAdminPush) return;
    setEnablingAdminPush(true);
    try {
      if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Push notifications are not supported on this device");
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Notification permission was not granted");
      const { data } = await api.get("/push/config");
      if (!data.publicKey) throw new Error("Push notifications are not configured yet");
      await navigator.serviceWorker.register(import.meta.env.PROD ? "/sw.js" : "/push-sw.js");
      const registration = await navigator.serviceWorker.ready;
      const subscription = (await registration.pushManager.getSubscription())
        || await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeVapidKey(data.publicKey),
        });
      await api.post("/admin/push/subscribe", subscription.toJSON());
      toast.success("Instant admin alerts enabled on this device");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Could not enable instant alerts");
    } finally {
      setEnablingAdminPush(false);
    }
  };

  return (
    <div className="container" style={{ padding: "48px 0", maxWidth: "600px" }}>
      <h1 style={{ marginBottom: "24px" }}>Settings</h1>

      {user?.role === "admin" && (
        <section
          style={{
            marginBottom: "16px",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div>
            <p style={{ fontWeight: 600, marginBottom: "4px" }}>Instant admin alerts</p>
            <p style={{ fontSize: "14px", color: "var(--color-text-light)" }}>
              Receive urgent alerts as browser notifications on this device.
            </p>
          </div>
          <button type="button" className="admin-btn primary" onClick={enableAdminPush} disabled={enablingAdminPush}>
            <BellRing size={17} />
            {enablingAdminPush ? "Enabling…" : "Enable instant alerts on this device"}
          </button>
        </section>
      )}

      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          padding: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p style={{ fontWeight: 600, marginBottom: "4px" }}>Appearance</p>
          <p style={{ fontSize: "14px", color: "var(--color-text-light)" }}>
            Switch between light and dark mode
          </p>
        </div>
        <ThemeToggle />
      </div>
      <SavedSearches />
    </div>
  );
}

export default Settings;
