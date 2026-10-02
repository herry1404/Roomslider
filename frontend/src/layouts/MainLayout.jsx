import { useLocation } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";

function MainLayout({ children }) {
  const { pathname } = useLocation();
  const immersiveChat = pathname.startsWith("/roommates/chat/");

  return (
    <>
      <Navbar />

      <main style={{ minHeight: "calc(100vh - var(--navbar-height))" }}>
        {children}
      </main>

      {!immersiveChat && <Footer />}
      {!immersiveChat && <BottomNav />}
    </>
  );
}

export default MainLayout;
