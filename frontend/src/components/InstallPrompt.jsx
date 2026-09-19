import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("installPromptDismissed");
    if (dismissed) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("installPromptDismissed", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "16px",
        left: "16px",
        right: "16px",
        maxWidth: "420px",
        margin: "0 auto",
        background: "var(--color-surface, #161A19)",
        color: "var(--color-text, #F1F5F4)",
        border: "1px solid var(--color-border, #2A2F2E)",
        borderRadius: "12px",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
        position: "relative",
        zIndex: 9999,
      }}
    >
      <div style={{ fontSize: "14px", lineHeight: 1.4 }}>
        <strong>RoomSlider install karo</strong>
        <div style={{ opacity: 0.75, marginTop: "2px" }}>
          Home screen se seedha app jaisa access
        </div>
      </div>
      <button
        onClick={handleInstall}
        style={{
          background: "#16a34a",
          color: "white",
          border: "none",
          borderRadius: "8px",
          padding: "8px 16px",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        Install
      </button>
      <button
        onClick={handleDismiss}
        aria-label="Close"
        style={{
          position: "absolute",
          top: "6px",
          right: "6px",
          background: "transparent",
          color: "var(--color-text-light, #9CA6A3)",
          border: "none",
          fontSize: "16px",
          lineHeight: 1,
          cursor: "pointer",
          padding: "4px",
        }}
      >
        ×
      </button>
    </div>
  );
}
