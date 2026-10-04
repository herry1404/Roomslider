import useRecentlyViewedListings from "../../hooks/useRecentlyViewedListings";
import CategorySection from "../../components/home/CategorySection";
import EmptyState from "../../components/ui/EmptyState";
import { Clock3 } from "lucide-react";

function RecentlyViewed() {
  const { rooms, loading, hasHistory } = useRecentlyViewedListings();

  return (
    <div className="container" style={{ padding: "40px 0" }}>
      <h1>Recently viewed</h1>
      {loading ? <p>Loading your recently viewed listings…</p> : rooms.length ? (
        <CategorySection title="Your recent listings" viewAllPath="/rooms" rooms={rooms} />
      ) : (
        <EmptyState
          icon={Clock3}
          title={hasHistory ? "No recent listings available" : "No listings viewed yet"}
          description={hasHistory ? "These listings may no longer be available." : "Listings you open will show up here on this device."}
        />
      )}
    </div>
  );
}

export default RecentlyViewed;
