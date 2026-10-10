import { Helmet } from "react-helmet-async";
import { cloudinarySrcSet, cloudinaryUrl } from "../../utils/optimizeCloudinaryImage";
import { roomPath } from "../../utils/roomUrl";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MapPin, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import ShareButton from "../ui/ShareButton";

import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";
import { requestLogin } from "../../utils/loginPrompt";

function CategorySection({ title, viewAllPath, rooms, priority = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlist();

  const goToDetails = (room) => {
    const detailsPath = room.building && room.property?._id
      ? `/property/${room.property.slug || room.property._id}?building=${room.building}&sharing=${encodeURIComponent((room.sharingType || "").toLowerCase())}`
      : roomPath(room);

    navigate(detailsPath);
  };

  const toggleWishlist = async (roomId) => {
    if (!user) {
      requestLogin("Please login first");
      return;
    }

    try {
      if (isWishlisted(roomId)) {
        await removeFromWishlist(roomId);
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist(roomId);
        toast.success("Added to wishlist ❤️");
      }
    } catch (error) {
      console.error("Wishlist Error:", error);
      toast.error(error.response?.data?.message || "Wishlist failed");
    }
  };

  if (!rooms || rooms.length === 0) {
    return null;
  }

  const firstImage = rooms[0]?.images?.[0];

  return (
    <>
      {priority && firstImage && (
        <Helmet>
          <link
            rel="preload"
            as="image"
            href={cloudinaryUrl(firstImage, 280)}
            imageSrcSet={cloudinarySrcSet(firstImage)}
            imageSizes="(max-width:600px) 50vw, 280px"
            fetchPriority="high"
          />
        </Helmet>
      )}
      <section className="latest-rooms">
        <div className="container">
          <div className="section-header">
            <h2>{title}</h2>

            <Link to={viewAllPath} className="view-all" aria-label={`View all ${title.toLowerCase()}`}>
              View All
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="rooms-grid">
            {rooms.map((room, index) => {
              const wishlisted = isWishlisted(room._id);
              const genderLabel = { Male: "Boys", Female: "Girls" }[room.gender];
              const sharingLabel = { Single: "Single Room", Double: "Double Sharing", Triple: "Triple Sharing" }[room.sharingType] || room.category;
              const typeLine = [sharingLabel, genderLabel].filter(Boolean).join(" · ");
              const building = room.property?.buildings?.find(
                (item) => item._id === room.building
              );
              const cardTitle = building
                ? `${room.property.name} · ${building.name}`
                : room.title;
              const detailsPath = room.building && room.property?._id
                ? `/property/${room.property.slug || room.property._id}?building=${room.building}&sharing=${encodeURIComponent((room.sharingType || "").toLowerCase())}`
                : roomPath(room);

              return (
                <article
                  key={room._id}
                  className="room-card"
                  onClick={() => goToDetails(room)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="room-image-wrap">
                    <img
                      src={cloudinaryUrl(room.images?.[0], 280)}
                      srcSet={cloudinarySrcSet(room.images?.[0])}
                      sizes="(max-width:600px) 50vw, 280px"
                      width="280"
                      height="280"
                      fetchPriority={priority && index === 0 ? "high" : undefined}
                      loading={priority && index < 2 ? "eager" : "lazy"}
                      decoding="async"
                      alt={`${room.category || "Rental"} ${room.title} in ${room.location || "Indore"}`}
                      className="room-image"
                    />

                    <ShareButton room={room} variant="tile" />

                    <button
                      className={`wishlist-btn ${wishlisted ? "active" : ""}`}
                      type="button"
                      aria-label={`${wishlisted ? "Remove" : "Add"} ${cardTitle} ${wishlisted ? "from" : "to"} wishlist`}
                      aria-pressed={wishlisted}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(room._id);
                      }}
                    >
                      <Heart
                        size={16}
                        fill={wishlisted ? "currentColor" : "none"}
                      />
                    </button>
                  </div>

                  <div className="room-info">
                    <h3>
                      <Link
                        to={detailsPath}
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: "inherit", textDecoration: "none" }}
                      >
                        {cardTitle}
                      </Link>
                    </h3>

                    <p className="room-price">₹{room.price}<small>/month</small></p>

                    <p className="room-type">{typeLine}</p>

                    <p className="room-location">
                      <MapPin size={14} />
                      {room.location}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

export default CategorySection;
