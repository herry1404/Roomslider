import "../../styles/skeleton.css";

export default function Skeleton({ className = "", width, height = 16, circle = false }) {
  return (
    <span
      className={`skeleton shimmer ${circle ? "skeleton-circle" : ""} ${className}`.trim()}
      aria-hidden="true"
      style={{ width, height }}
    />
  );
}
