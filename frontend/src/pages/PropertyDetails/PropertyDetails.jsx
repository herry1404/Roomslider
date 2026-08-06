import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  MapPin,
  IndianRupee,
  Heart,
  Home,
  BedDouble,
  Bath,
  Sofa,
  CheckCircle2,
  Phone,
  MessageCircle,
  BadgeCheck,
  UserCircle2,
} from "lucide-react";

import toast from "react-hot-toast";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

import "../../styles/property-details.css";
import RoomMap from "../../components/map/RoomMap";

function PropertyDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishlisted, setWishlisted] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    fetchRoom();
  }, [id]);

  const fetchRoom = async () => {
    try {
      const { data } = await api.get(`/rooms/${id}`);

      setRoom(data.room);

      if (data.room.images?.length) {
        setSelectedImage(data.room.images[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addWishlist = async () => {
    if (!user) {
      toast.error("Please login first");
      return;
    }

    try {
      await api.post(`/wishlist/${id}`);

      setWishlisted(true);

      toast.success("Added to Wishlist ❤️");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Wishlist failed"
      );
    }
  };

  if (loading) {
    return (
      <div className="container">
        <h2>Loading Property...</h2>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="container">
        <h2>Property Not Found</h2>
      </div>
    );
  }

  const callLink = room.contact
    ? `tel:${room.contact}`
    : null;

  const whatsappLink = room.whatsapp
    ? `https://wa.me/91${room.whatsapp.replace(/\D/g, "")}`
    : null;

  return (
    <section className="property-details container">

      <div className="property-main">

        <div className="property-left">

          <div className="property-image">

            <img
              src={selectedImage}
              alt={room.title}
              className="main-property-image"
            />

            <button
              className={
                wishlisted
                  ? "wishlist-icon active"
                  : "wishlist-icon"
              }
              onClick={addWishlist}
            >
              <Heart
                size={24}
                fill={
                  wishlisted
                    ? "currentColor"
                    : "none"
                }
              />
            </button>

            <div className="property-thumbnails">

              {room.images?.map((img, index) => (

                <img
                  key={index}
                  src={img}
                  alt=""
                  className={
                    selectedImage === img
                      ? "thumbnail active"
                      : "thumbnail"
                  }
                  onClick={() =>
                    setSelectedImage(img)
                  }
                />

              ))}

            </div>

          </div>

          <h1 className="property-title">
            {room.title}
          </h1>

          <p className="property-location">

            <MapPin size={16} />

            {room.location}

          </p>

          <RoomMap lat={room.latitude} lng={room.longitude} title={room.title} />
                    {room.amenities?.length > 0 && (
            <div className="property-section">
              <h3>Amenities</h3>

              <div className="chip-grid">
                {room.amenities.map((item, index) => (
                  <span key={index} className="chip">
                    <CheckCircle2 size={15} />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="property-section">
            <h3>Description</h3>

            <p className="property-description">
              {room.description}
            </p>
          </div>

          {room.nearby?.length > 0 && (
            <div className="property-section">
              <h3>Nearby Landmarks</h3>

              <div className="chip-grid">
                {room.nearby.map((item, index) => (
                  <span key={index} className="chip">
                    <MapPin size={15} />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        <div className="property-right">

          <div className="price-panel">

            <div className="price-panel-amount">
              <IndianRupee size={22} />

              {room.price?.toLocaleString()}

              <small>/month</small>
            </div>

            {room.deposit > 0 && (
              <p className="price-panel-deposit">
                Deposit: ₹{room.deposit.toLocaleString()}
              </p>
            )}

            <div className="price-panel-badges">

              <span>
                <BedDouble size={16} />
                {room.rooms} Room{room.rooms > 1 ? "s" : ""}
              </span>

              <span>
                <Bath size={16} />
                {room.bathrooms} Bath
              </span>

              {room.furnished && (
                <span>
                  <Sofa size={16} />
                  Furnished
                </span>
              )}

            </div>

            <div className="price-panel-category">
              <Home size={16} />
              {room.category}
            </div>

            {room.ownerName && (

              <div className="owner-block">

                <div className="owner-info">

                  <UserCircle2 size={38} />

                  <div>

                    <p className="owner-name">
                      {room.ownerName}

                      <BadgeCheck
                        size={15}
                        className="verified-icon"
                      />

                    </p>

                    <span className="owner-tag">
                      Verified Owner
                    </span>

                  </div>

                </div>

                <div className="owner-contact-btns">

                  {callLink && (
                    <a
                      href={callLink}
                      className="contact-btn call-btn"
                    >
                      <Phone size={16} />
                      Call Now
                    </a>
                  )}

                  {whatsappLink && (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-btn whatsapp-btn"
                    >
                      <MessageCircle size={16} />
                      WhatsApp
                    </a>
                  )}

                </div>

              </div>

            )}

          </div>

        </div>

      </div>

            {(callLink || whatsappLink) && (
        <div className="mobile-sticky-bar">

          {callLink && (
            <a
              href={callLink}
              className="sticky-btn call-btn"
            >
              <Phone size={18} />
              Call
            </a>
          )}

          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="sticky-btn whatsapp-btn"
            >
              <MessageCircle size={18} />
              WhatsApp
            </a>
          )}

        </div>
      )}

    </section>
  );
}

export default PropertyDetails;