import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BottomNav from "../components/layout/BottomNav";

function MainLayout({ children }) {
  return (
    <>
      <Navbar />

      <main style={{ minHeight: "calc(100vh - var(--navbar-height))" }}>
        {children}
      </main>

      <Footer />
      <BottomNav />
    </>
  );
}

export default MainLayout;
