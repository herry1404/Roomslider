import { useEffect } from "react";
import Navbar from "../components/layout/Navbar";

function MapLayout({ children }) {
  useEffect(() => {
    const prevPadding = document.body.style.paddingBottom;
    const prevOverflow = document.body.style.overflow;
    document.body.style.paddingBottom = "0px";
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.paddingBottom = prevPadding;
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

export default MapLayout;
