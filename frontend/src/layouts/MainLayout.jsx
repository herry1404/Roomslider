import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

function MainLayout({ children }) {
  return (
    <>
      <Navbar />

      <main style={{ minHeight: "calc(100vh - var(--navbar-height))" }}>
        {children}
      </main>

      <Footer />
    </>
  );
}

export default MainLayout;
