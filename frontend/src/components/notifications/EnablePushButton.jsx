import toast from "react-hot-toast";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

function decodeVapidKey(value) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(window.atob(base64), (character) => character.charCodeAt(0));
}

function EnablePushButton({ className, onEnabled, children, ...buttonProps }) {
  const { user } = useAuth();

  const enableNotifications = async () => {
    if (!user) {
      toast.error("Push notifications ke liye pehle login karo");
      return;
    }
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Is browser mein push notifications support nahi hain");
      return;
    }
    if (Notification.permission === "denied") {
      toast.error("Browser settings mein RoomSlider notifications allow karo");
      return;
    }

    try {
      const permission =
        Notification.permission === "granted"
          ? "granted"
          : await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Push notifications allow nahi ki gayi");
        return;
      }

      const configResponse = await api.get("/notifications/push-config");
      if (!configResponse.data.publicKey) {
        toast.error("Push server configure nahi hai; administrator se VAPID setup karwao");
        return;
      }

      const workerUrl = import.meta.env.PROD ? "/sw.js" : "/push-sw.js";
      await navigator.serviceWorker.register(workerUrl);
      const registration = await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeVapidKey(configResponse.data.publicKey),
        }));
      await api.put("/notifications/push-subscriptions", subscription.toJSON());
      toast.success("Push notifications enabled");
      onEnabled?.();
    } catch (error) {
      toast.error(error.response?.data?.message || "Push notifications enable nahi hui");
    }
  };

  return (
    <button
      type="button"
      className={className}
      onClick={enableNotifications}
      {...buttonProps}
    >
      {children}
    </button>
  );
}

export default EnablePushButton;
