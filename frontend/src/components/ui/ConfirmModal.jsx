import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";
import "../../styles/confirm-modal.css";

export default function ConfirmModalHost() {
  const [requests, setRequests] = useState([]);
  const current = requests[0];

  useEffect(() => {
    const onConfirm = (event) => {
      setRequests((items) => [...items, event.detail]);
    };
    window.addEventListener("roomslider:confirm", onConfirm);
    return () => window.removeEventListener("roomslider:confirm", onConfirm);
  }, []);

  const finish = useCallback((accepted) => {
    current?.resolve(accepted);
    setRequests((items) => items.slice(1));
  }, [current]);

  useEffect(() => {
    if (!current) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") finish(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [current, finish]);

  if (!current) return null;
  const { options = {} } = current;

  return createPortal(
    <div className="confirm-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) finish(false);
    }}>
      <section
        className="confirm-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
      >
        <span className="confirm-modal-icon"><AlertTriangle size={22} /></span>
        <h2 id="confirm-modal-title">{options.title || "Please confirm"}</h2>
        <p id="confirm-modal-message">{current.message}</p>
        <div className="confirm-modal-actions">
          <button type="button" className="confirm-modal-cancel" onClick={() => finish(false)}>
            {options.cancelText || "Cancel"}
          </button>
          <button type="button" className="confirm-modal-accept" onClick={() => finish(true)}>
            {options.confirmText || "Continue"}
          </button>
        </div>
      </section>
    </div>,
    document.body
  );
}
