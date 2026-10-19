import { useEffect, useRef, useState } from "react";

export default function useCountUp(value, duration = 550) {
  const target = Number(value) || 0;
  const [count, setCount] = useState(target);
  const previousValue = useRef(target);

  useEffect(() => {
    const start = performance.now();
    const initial = previousValue.current;
    let frame;
    const update = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setCount(initial + (target - initial) * eased);
      if (progress < 1) frame = requestAnimationFrame(update);
      else previousValue.current = target;
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return count.toLocaleString("en-IN", {
    maximumFractionDigits: Number.isInteger(target) ? 0 : 1,
  });
}
