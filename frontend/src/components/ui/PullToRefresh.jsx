import { useRef, useState } from "react";
import { RotateCw } from "lucide-react";
import "../../styles/pull-to-refresh.css";

export default function PullToRefresh({ onRefresh, children }) {
  const startY = useRef(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = (event) => {
    if (window.scrollY === 0) startY.current = event.touches[0].clientY;
  };
  const onTouchMove = (event) => {
    if (startY.current === null || refreshing) return;
    const distance = event.touches[0].clientY - startY.current;
    if (distance > 0) setPull(Math.min(distance * 0.45, 72));
  };
  const onTouchEnd = async () => {
    startY.current = null;
    if (pull < 52 || refreshing) {
      setPull(0);
      return;
    }
    setRefreshing(true);
    setPull(52);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
      setPull(0);
    }
  };

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div className="pull-refresh-indicator" style={{ height: pull }} aria-live="polite">
        {(pull > 0 || refreshing) && <><RotateCw size={18} className={refreshing ? "is-refreshing" : ""} />{refreshing ? "Refreshing" : "Pull to refresh"}</>}
      </div>
      {children}
    </div>
  );
}
