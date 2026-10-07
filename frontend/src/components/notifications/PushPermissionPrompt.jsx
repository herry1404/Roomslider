import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import "../../styles/push-permission.css";

const SNOOZE_KEY = "pushPromptSnoozedUntil";
const IOS_TIP_KEY = "pushIosTipDismissed";
const SNOOZE_DURATION = 7 * 24 * 60 * 60 * 1000;

function decodeVapidKey(value) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(window.atob(base64), (character) => character.charCodeAt(0));
}

function isIosDevice() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
}

export default function PushPermissionPrompt() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [iosTipDismissed, setIosTipDismissed] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const [snoozed, setSnoozed] = useState(true);
  const [nativePermission, setNativePermission] = useState(null);

  const nativeApp = Capacitor.isNativePlatform();
  const iosNeedsInstall = user && !nativeApp && isIosDevice() && !isStandalone();
  const iosTipVisible = iosNeedsInstall && !iosTipDismissed && localStorage.getItem(IOS_TIP_KEY) !== "1";
  const pushSupported = !nativeApp && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;

  useEffect(() => {
    if (!user || !nativeApp) return undefined;
    let active = true;
    PushNotifications.checkPermissions()
      .then(({ receive }) => {
        if (active) setNativePermission(receive);
      })
      .catch((error) => {
        console.error("NATIVE NOTIFICATION PERMISSION CHECK ERROR:", error);
        if (active) setNativePermission("denied");
      });
    return () => {
      active = false;
    };
  }, [nativeApp, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSnoozed(Number(localStorage.getItem(SNOOZE_KEY) || 0) > Date.now());
    }, 0);
    return () => window.clearTimeout(timer);
  }, [user]);

  const visible = Boolean(
    user
    && !iosNeedsInstall
    && !dismissed
    && (nativeApp
      ? nativePermission === "prompt" || nativePermission === "prompt-with-rationale"
      : pushSupported && Notification.permission === "default")
    && !snoozed
  );

  const dismissIosTip = () => {
    localStorage.setItem(IOS_TIP_KEY, "1");
    setIosTipDismissed(true);
  };

  const snooze = () => {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DURATION));
    setSnoozed(true);
    setDismissed(true);
  };

  const enablePush = async () => {
    if (enabling) return;
    setEnabling(true);
    try {
      if (nativeApp) {
        const { receive } = await PushNotifications.requestPermissions();
        setNativePermission(receive);
        setDismissed(true);
        if (receive === "granted") toast.success("Device notification permission enabled");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setDismissed(true);
        return;
      }

      const { data } = await api.get("/push/config");
      if (!data.publicKey) throw new Error("Push notifications are not configured yet");

      const workerUrl = import.meta.env.PROD ? "/sw.js" : "/push-sw.js";
      await navigator.serviceWorker.register(workerUrl);
      const registration = await navigator.serviceWorker.ready;
      const subscription = (await registration.pushManager.getSubscription())
        || await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeVapidKey(data.publicKey),
        });
      await api.post("/push/subscribe", subscription.toJSON());
      setDismissed(true);
      toast.success("Notifications enabled");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Notifications could not be enabled");
    } finally {
      setEnabling(false);
    }
  };

  return (
    <>
      {visible && (
        <div className="push-prompt-backdrop">
          <section className="push-prompt" role="dialog" aria-modal="true" aria-labelledby="push-prompt-title">
            <span className="push-prompt-icon"><Bell size={24} /></span>
            <h2 id="push-prompt-title">Updates chahiye?</h2>
            <p>{nativeApp
              ? "Allow RoomSlider to show notifications on this device."
              : "Get useful updates about messages, bookings and new listings."}</p>
            <div className="push-prompt-actions">
              <button type="button" className="push-prompt-allow" onClick={enablePush} disabled={enabling}>
                {enabling ? "Please wait…" : "Allow"}
              </button>
              <button type="button" className="push-prompt-later" onClick={snooze}>Later</button>
            </div>
          </section>
        </div>
      )}
      {iosTipVisible && (
        <aside className="push-ios-tip" role="status">
          <span>For notifications, tap Share &gt; Add to Home Screen.</span>
          <button type="button" onClick={dismissIosTip} aria-label="Dismiss notification tip"><X size={18} /></button>
        </aside>
      )}
    </>
  );
}
