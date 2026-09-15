import { useEffect, useRef, useState } from "react";

// Returns true once the user scrolls down past `threshold` px,
// and false again as soon as they scroll back up.
export function useHideOnScroll(threshold = 80) {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > threshold) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return hidden;
}

export default useHideOnScroll;
