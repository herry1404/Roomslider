import { useEffect } from "react";
import Navbar from "../components/layout/Navbar";
import BottomNav from "../components/layout/BottomNav";

function MapLayout({ children }) {
  useEffect(() => {
    const prevPadding = document.body.style.paddingBottom;
    const prevOverflow = document.body.style.overflow;
    document.body.style.paddingBottom = "0px";
    document.body.style.overflow = "hidden";
    document.body.classList.add("map-page");

    return () => {
      document.body.style.paddingBottom = prevPadding;
      document.body.style.overflow = prevOverflow;
      document.body.classList.remove("map-page");
    };
  }, []);

  return (
    <>
      <Navbar />
      {children}
      <BottomNav />
    </>
  );
}

export default MapLayout;
