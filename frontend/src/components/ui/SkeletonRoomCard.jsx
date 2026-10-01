import "../../styles/skeleton.css";

function SkeletonRoomCard() {
  return (
    <div className="room-card skeleton-card rc-air">
      <div className="skeleton shimmer" style={{ width: "100%", aspectRatio: "1 / 1", borderRadius: "16px" }} />
      <div className="room-content">
        <div className="skeleton shimmer" style={{ height: "16px", width: "70%", marginBottom: "8px", borderRadius: "6px" }} />
        <div className="skeleton shimmer" style={{ height: "16px", width: "40%", marginBottom: "8px", borderRadius: "6px" }} />
        <div className="skeleton shimmer" style={{ height: "13px", width: "55%", marginBottom: "8px", borderRadius: "6px" }} />
        <div className="skeleton shimmer" style={{ height: "13px", width: "45%", borderRadius: "6px" }} />
      </div>
    </div>
  );
}

export default SkeletonRoomCard;
