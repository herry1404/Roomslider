import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import { idFromParam, roomPath } from "../../utils/roomUrl";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";
import ReportListing from "../../components/property/ReportListing";
import PhotoGallery from "../../components/property/PhotoGallery";
import PropertyHeader from "../../components/property/PropertyHeader";
import HostRow from "../../components/property/HostRow";
import Highlights from "../../components/property/Highlights";
import Description from "../../components/property/Description";
import Amenities from "../../components/property/Amenities";
import LocationSection from "../../components/property/LocationSection";
import ThingsToKnow from "../../components/property/ThingsToKnow";
import ContactCard from "../../components/property/ContactCard";
import MobileContactBar from "../../components/property/MobileContactBar";
import NearbyStays from "../../components/property/NearbyStays";
import PropertyDetailsSkeleton from "../../components/property/PropertyDetailsSkeleton";
import shareProperty from "../../utils/shareProperty";
import { recordRecentlyViewed } from "../../utils/recentlyViewed";
import "../../styles/property-details.css";

function PropertyDetails() {
  const { id: rawId } = useParams();
  const id = idFromParam(rawId);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlist();
  const [roomResult, setRoomResult] = useState(null);
  const room = roomResult?.id === id ? roomResult.room : null;
  const loading = roomResult?.id !== id;
  const wishlisted = isWishlisted(room?._id);

  useEffect(() => {
    let active = true;
    window.scrollTo({ top: 0, behavior: "instant" });
    api.get(`/rooms/${id}`)
      .then(({ data }) => {
        if (active) {
          const loadedRoom = data.room || null;
          setRoomResult({ id, room: loadedRoom });
          if (loadedRoom?._id) recordRecentlyViewed(loadedRoom._id);
        }
      })
      .catch((error) => {
        if (!active) return;
        toast.error(error.response?.data?.message || "Listing could not be loaded");
        setRoomResult({ id, room: null });
      });
    return () => { active = false; };
  }, [id]);

  const toggleWishlist = async () => {
    if (!user) {
      toast.error("Please log in to save this listing");
      navigate("/login", { state: { from: window.location.pathname } });
      return;
    }

    try {
      if (wishlisted) {
        await removeFromWishlist(room._id);
        toast.success("Removed from saved listings");
      } else {
        await addToWishlist(room._id);
        toast.success("Listing saved");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update saved listings");
    }
  };

  if (loading) return <PropertyDetailsSkeleton />;

  if (!room) {
    return (
      <main className="pd-root pd-not-found">
        <h1>Listing not found</h1>
        <p>This listing may no longer be available.</p>
        <Link to="/">Back to home</Link>
      </main>
    );
  }

  if (room.slug && rawId !== room.slug) {
    return <Navigate to={roomPath(room)} replace />;
  }

  const ownerName = room.ownerName || room.owner?.name;
  const showCall = Boolean(room.hasPhoneContact ?? room.contact);
  const showWhatsApp = Boolean(room.hasWhatsAppContact ?? (room.whatsapp || room.contact));
  const loginHref = !user && (room.hasContact || showCall || showWhatsApp) ? "/login" : "";
  const openContact = async (channel) => {
    const whatsappWindow = channel === "whatsapp" ? window.open("about:blank", "_blank") : null;
    if (whatsappWindow) whatsappWindow.opener = null;
    try {
      const { data } = await api.get(`/rooms/${room._id}/contact`);
      const phone = channel === "call" ? data.contact : data.whatsapp;
      if (!phone) throw new Error("Contact details are not available");
      if (channel === "call") {
        window.location.assign(`tel:${phone}`);
        return;
      }
      const digits = phone.replace(/\D/g, "").replace(/^0/, "");
      const international = digits.startsWith("91") ? digits : `91${digits}`;
      const target = `https://wa.me/${international}`;
      if (whatsappWindow) whatsappWindow.location.href = target;
      else window.location.assign(target);
    } catch (error) {
      whatsappWindow?.close();
      toast.error(error.response?.data?.message || error.message || "Contact details could not be loaded");
    }
  };
  const detailLocation = room.location
    ? room.location.toLowerCase().includes("indore")
      ? room.location
      : `${room.location}, Indore`
    : "";
  const detailHeading = [room.category, detailLocation].filter(Boolean).join(" in ");

  return (
    <main className="pd-root">
      <Helmet>
        <title>{`${room.title}, Indore | RoomSlider`}</title>
        <meta
          name="description"
          content={`${room.title} - ${room.category || "rental"} for rent in ${room.location || "Indore"}. View photos, rent, amenities and contact the owner on RoomSlider.`}
        />
        <link rel="canonical" href={`https://www.roomslider.in${roomPath(room)}`} />
        <meta property="og:type" content="product" />
        <meta property="og:title" content={`${room.title} | RoomSlider`} />
        <meta property="og:description" content={`${room.title} in ${room.location || "Indore"} for ₹${Number(room.price || 0).toLocaleString("en-IN")} per month.`} />
        <meta property="og:url" content={`https://www.roomslider.in${roomPath(room)}`} />
        <meta property="og:image" content={room.images?.[0] || "https://www.roomslider.in/og-image.jpg"} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${room.title} | RoomSlider`} />
        <meta name="twitter:description" content={`${room.title} in ${room.location || "Indore"} for ₹${Number(room.price || 0).toLocaleString("en-IN")} per month.`} />
        <meta name="twitter:image" content={room.images?.[0] || "https://www.roomslider.in/og-image.jpg"} />
      </Helmet>

      <PropertyHeader room={room} wishlisted={wishlisted} onSave={toggleWishlist} />
      <PhotoGallery
        images={room.images || []}
        title={room.title}
        wishlisted={wishlisted}
        onBack={() => navigate(-1)}
        onSave={toggleWishlist}
        onShare={() => shareProperty(room)}
      />
      <ReportListing roomId={room._id} />

      <div className="pd-layout">
        <div className="pd-details">
          <section className="pd-intro">
            {detailHeading && <h2>{detailHeading}</h2>}
            <p>{[
              room.rooms != null && `${room.rooms} room${room.rooms === 1 ? "" : "s"}`,
              room.bathrooms != null && `${room.bathrooms} bath${room.bathrooms === 1 ? "" : "s"}`,
              room.sharingType && `${room.sharingType} sharing`,
            ].filter(Boolean).join(" · ")}</p>
          </section>

          <HostRow ownerName={ownerName} owner={room.owner} />
          <Highlights room={room} />
          <Description description={room.description} />
          <Amenities amenities={room.amenities || []} />
          <LocationSection
            location={room.location}
            latitude={room.latitude}
            longitude={room.longitude}
            title={room.title}
            nearby={room.nearby || []}
          />
          <ThingsToKnow room={room} />
        </div>

        <ContactCard
          price={room.price}
          deposit={room.deposit}
          ownerName={ownerName}
          showCall={showCall}
          showWhatsApp={showWhatsApp}
          loginHref={loginHref}
          onCall={() => openContact("call")}
          onWhatsApp={() => openContact("whatsapp")}
        />
      </div>

      <NearbyStays room={room} />
      <MobileContactBar
        price={room.price}
        showCall={showCall}
        showWhatsApp={showWhatsApp}
        loginHref={loginHref}
        onCall={() => openContact("call")}
        onWhatsApp={() => openContact("whatsapp")}
      />
    </main>
  );
}

export default PropertyDetails;
