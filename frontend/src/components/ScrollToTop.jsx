import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// FIX: React Router browser ka default scroll-restore behaviour follow
// karta hai, isliye naya page (About, Contact, etc.) open hone par bhi
// scroll position wahi rehti hai jaha pichle page pe thi (jaise footer
// ke paas). Ye component har route/pathname change par window ko
// turant top (0,0) par scroll kar deta hai.
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default ScrollToTop;
