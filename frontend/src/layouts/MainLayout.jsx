import { Suspense, lazy } from "react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";
import FirstVisitTour from "../components/onboarding/FirstVisitTour";

const AIAssistant = lazy(() => import("../components/assistant/AIAssistant"));

function MainLayout({ children }) {
  const { pathname } = useLocation();
  const immersiveChat = pathname.startsWith("/roommates/chat/");
  const [assistantStarted, setAssistantStarted] = useState(false);
  const [backToTopVisible, setBackToTopVisible] = useState(false);

  useEffect(() => {
    const update = () => setBackToTopVisible(window.scrollY > 500);
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    const closeAssistant = () => setAssistantStarted(false);
    window.addEventListener("roomslider:assistant-close", closeAssistant);
    return () => window.removeEventListener("roomslider:assistant-close", closeAssistant);
  }, []);

  return (
    <>
      <Navbar />
      {pathname === "/" && <FirstVisitTour />}

      <main style={{ minHeight: "calc(100vh - var(--navbar-height))" }}>
        {children}
      </main>

      {!immersiveChat && <Footer />}
      {!immersiveChat && <BottomNav />}
      {!assistantStarted && !backToTopVisible && (
        <button
          type="button"
          className="ai-assistant-launcher"
          aria-label="Open AI Room Finder"
          onClick={() => setAssistantStarted(true)}
        >
          <MessageCircle size={27} strokeWidth={2.4} aria-hidden="true" />
        </button>
      )}
      {assistantStarted && (
        <Suspense fallback={null}>
          <AIAssistant
            initialOpen
            onClose={() => setAssistantStarted(false)}
          />
        </Suspense>
      )}
    </>
  );
}

export default MainLayout;
