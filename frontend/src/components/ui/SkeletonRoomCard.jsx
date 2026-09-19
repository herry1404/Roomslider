import "../../styles/skeleton.css";

function SkeletonRoomCard() {
  return (
    <div className="room-card skeleton-card">
      <div className="skeleton shimmer" style={{ height: "240px", borderRadius: "22px 22px 0 0" }} />
      <div className="room-content">
        <div className="skeleton shimmer" style={{ height: "20px", width: "70%", marginBottom: "10px", borderRadius: "6px" }} />
        <div className="skeleton shimmer" style={{ height: "14px", width: "50%", marginBottom: "10px", borderRadius: "6px" }} />
        <div className="skeleton shimmer" style={{ height: "18px", width: "40%", marginBottom: "10px", borderRadius: "6px" }} />
        <div className="skeleton shimmer" style={{ height: "14px", width: "90%", marginBottom: "6px", borderRadius: "6px" }} />
        <div className="skeleton shimmer" style={{ height: "14px", width: "60%", marginBottom: "14px", borderRadius: "6px" }} />
        <div className="skeleton shimmer" style={{ height: "38px", width: "100%", borderRadius: "10px" }} />
      </div>
    </div>
  );
}

export default SkeletonRoomCard;
