import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { BadgeCheck, Home, Link2 } from "lucide-react";
import api from "../../api/axios";
import RoomCard from "../../components/ui/RoomCard";
import SkeletonDetailCard from "../../components/ui/SkeletonDetailCard";

function OwnerProfile() {
  const { id } = useParams();

  const [owner, setOwner] = useState(null);
  const [totalListings, setTotalListings] = useState(0);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [profileRes, roomsRes] = await Promise.all([
          api.get(`/owners/public/${id}`),
          api.get("/rooms", { params: { owner: id } }),
        ]);

        setOwner(profileRes.data.owner);
        setTotalListings(profileRes.data.totalListings);
        setRooms(roomsRes.data.rooms || []);
      } catch (error) {
        console.error("Owner Profile Fetch Error:", error);
        setOwner(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ padding: "40px 0", maxWidth: "700px" }}>
        <SkeletonDetailCard />
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="container" style={{ padding: "40px 0" }}>
        <h2>Owner not found</h2>
      </div>
    );
  }

  const memberSince = new Date(owner.createdAt).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const displayName = owner.propertyName || owner.name;

  return (
    <>
      <Helmet>
        <title>{displayName} | RoomSlider</title>
        <link rel="canonical" href={`https://www.roomslider.in/owners/${id}`} />
      </Helmet>

      <section className="container" style={{ padding: "40px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
              {displayName}
              <BadgeCheck size={20} color="#16a34a" />
            </h1>
            <p style={{ color: "#555", margin: "6px 0 0" }}>
              Verified Owner &middot; Member since {memberSince}
            </p>
            <p style={{ color: "#555", margin: "4px 0 0", display: "flex", alignItems: "center", gap: "6px" }}>
              <Home size={16} />
              {totalListings} listing{totalListings === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {(owner.instagram || owner.facebook || owner.youtube) && (
          <div style={{ display: "flex", gap: "14px", marginTop: "18px" }}>
            {owner.instagram && (
              <a href={owner.instagram} target="_blank" rel="noopener noreferrer" title="Instagram">
                Instagram
              </a>
            )}
            {owner.facebook && (
              <a href={owner.facebook} target="_blank" rel="noopener noreferrer" title="Facebook">
                Facebook
              </a>
            )}
            {owner.youtube && (
              <a href={owner.youtube} target="_blank" rel="noopener noreferrer" title="YouTube">
                YouTube
              </a>
            )}
          </div>
        )}

        <h2 style={{ marginTop: "36px" }}>Listings</h2>

        {rooms.length === 0 ? (
          <h3 style={{ marginTop: "20px" }}>No active listings right now</h3>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
              gap: "25px",
              marginTop: "20px",
            }}
          >
            {rooms.map((room) => (
              <RoomCard key={room._id} room={room} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default OwnerProfile;
