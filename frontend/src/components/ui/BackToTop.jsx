import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import "../../styles/back-to-top.css";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let assistantOpen = false;
    const update = () => setVisible(window.scrollY > 500 && !assistantOpen);
    const assistantVisibilityChanged = (event) => {
      assistantOpen = event.detail?.open === true;
      update();
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("roomslider:assistant-visibility", assistantVisibilityChanged);
    update();
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("roomslider:assistant-visibility", assistantVisibilityChanged);
    };
  }, []);
  if (!visible) return null;
  return (
    <button
      className="back-to-top"
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <ArrowUp size={19} />
    </button>
  );
}
