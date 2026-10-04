import CategorySection from "./CategorySection";
import useRecentlyViewedListings from "../../hooks/useRecentlyViewedListings";

export default function RecentlyViewedSection() {
  const { rooms } = useRecentlyViewedListings();
  if (!rooms.length) return null;
  return <CategorySection title="Recently viewed" viewAllPath="/recently-viewed" rooms={rooms} />;
}
