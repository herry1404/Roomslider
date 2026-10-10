import { lazy, Suspense, useEffect, useRef, useState } from "react";

const LocationPicker = lazy(() => import("./LocationPicker"));

function LazyLocationPicker(props) {
  const containerRef = useRef(null);
  const [visible, setVisible] = useState(() => !("IntersectionObserver" in window));

  useEffect(() => {
    if (!containerRef.current) return undefined;
    if (visible || !("IntersectionObserver" in window)) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    }, { rootMargin: "200px" });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={containerRef} style={{ minHeight: 300 }}>
      {visible && (
        <Suspense fallback={<div aria-hidden="true" style={{ height: 300 }} />}>
          <LocationPicker {...props} />
        </Suspense>
      )}
    </div>
  );
}

export default LazyLocationPicker;
