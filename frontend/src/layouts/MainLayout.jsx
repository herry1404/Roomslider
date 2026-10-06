import { Suspense, lazy } from "react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";
import PullToRefresh from "../components/ui/PullToRefresh";

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

  return (
    <>
      <Navbar />

      <main style={{ minHeight: "calc(100vh - var(--navbar-height))" }}>
        {immersiveChat
          ? children
          : <PullToRefresh onRefresh={() => window.location.reload()}>{children}</PullToRefresh>}
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
          ✨
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
