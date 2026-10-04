import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ArrowUpRight, Bath, BedDouble, Building2 } from "lucide-react";
import toast from "react-hot-toast";

import api from "../../api/axios";
import { roomPath } from "../../utils/roomUrl";
import shareProperty from "../../utils/shareProperty";
import PhotoGallery from "../../components/property/PhotoGallery";
import PropertyHeader from "../../components/property/PropertyHeader";
import HostRow from "../../components/property/HostRow";
import Amenities from "../../components/property/Amenities";
import LocationSection from "../../components/property/LocationSection";
import PropertyDetailsSkeleton from "../../components/property/PropertyDetailsSkeleton";
import "../../styles/property-details.css";

const propertyCategoryPath = {
  Hostel: "/hostels",
  PG: "/pg",
  Flat: "/flats",
  Room: "/rooms",
};

function PropertyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlight = (searchParams.get("sharing") || "").toLowerCase();
  const selectedBuilding = searchParams.get("building");
  const [propertyResult, setPropertyResult] = useState(null);
  const [roomsResult, setRoomsResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const loading = propertyResult?.id !== id;

  useEffect(() => {
    let active = true;
    api.get(`/properties/${id}`)
      .then(({ data }) => {
        if (!active) return;
        const property = data?.property || null;
        setNotFound(!property);
        setPropertyResult({ id, property });
        setRoomsResult({ id, rooms: data?.rooms || [] });
      })
      .catch((error) => {
        if (!active) return;
        toast.error(error.response?.data?.message || "Property could not be loaded");
        setNotFound(true);
        setPropertyResult({ id, property: null });
        setRoomsResult({ id, rooms: [] });
      });
    return () => {
      active = false;
    };
  }, [id]);

  const property = propertyResult?.id === id ? propertyResult.property : null;
  const rooms = roomsResult?.id === id ? roomsResult.rooms : [];
  const visibleRooms = selectedBuilding
    ? rooms.filter((room) => String(room.building || "") === selectedBuilding)
    : rooms;
  const sections = useMemo(() => {
    const groups = new Map();
    visibleRooms.forEach((room) => {
      const sharing = room.sharingType || "Rooms";
      const building = property?.buildings?.find(
        (item) => String(item._id) === String(room.building)
      );
      const groupId = `${room.building || "legacy"}:${sharing}`;
      if (!groups.has(groupId)) groups.set(groupId, { sharing, building, rooms: [] });
      groups.get(groupId).rooms.push(room);
    });
    const order = ["Single", "Double", "Triple", "Other", "Rooms"];
    return [...groups.values()].sort((first, second) => {
      const firstOrder = order.indexOf(first.sharing);
      const secondOrder = order.indexOf(second.sharing);
      return (firstOrder < 0 ? order.length : firstOrder) -
        (secondOrder < 0 ? order.length : secondOrder) ||
        (first.building?.name || "").localeCompare(second.building?.name || "");
    });
  }, [property, visibleRooms]);

  const galleryImages = useMemo(
    () => [...new Set(visibleRooms.flatMap((room) => room.images || []).filter(Boolean))].slice(0, 5),
    [visibleRooms]
  );
  const amenities = useMemo(
    () => [...new Set(visibleRooms.flatMap((room) => room.amenities || []).filter(Boolean))],
    [visibleRooms]
  );

  if (property?.slug && id !== property.slug) {
    return <Navigate to={`/property/${property.slug}${window.location.search}`} replace />;
  }

  if (loading) return <PropertyDetailsSkeleton />;

  if (notFound || !property) {
    return (
      <main className="pd-root pd-not-found">
        <h1>Property not found</h1>
        <Link to="/">Back to home</Link>
      </main>
    );
  }

  const groupedListing = {
    title: property.name,
    location: [property.area, "Indore"].filter(Boolean).join(", "),
    isVerified: property.owner?.isVerified,
  };
  const title = `${property.name} - ${property.propertyType} in ${property.area} | RoomSlider`;
  const backPath = propertyCategoryPath[property.propertyType] || "/rooms";
  const ownerName = property.owner?.name;
  const availableCount = visibleRooms.length;

  return (
    <main className="pd-root pd-grouped-property">
      <Helmet>
        <title>{title}</title>
        <meta
          name="description"
          content={`${property.name} in ${property.area}, Indore. See sharing options, prices and vacant rooms.`}
        />
      </Helmet>

      <Link className="pd-grouped-back" to={backPath}>
        <ArrowLeft size={16} /> Back to {property.propertyType}
      </Link>
      <PropertyHeader room={groupedListing} showSave={false} />
      <div className="pd-grouped-type">
        <Building2 size={16} aria-hidden="true" />
        <span>{property.propertyType}</span>
        <span className="pd-grouped-separator" aria-hidden="true">·</span>
        <span>{availableCount} available {availableCount === 1 ? "option" : "options"}</span>
      </div>
      <PhotoGallery
        images={galleryImages}
        title={property.name}
        onBack={() => navigate(backPath)}
        onShare={() => shareProperty(groupedListing)}
        showSave={false}
      />

      <div className="pd-layout pd-grouped-layout">
        <div className="pd-details">
          <section className="pd-section pd-grouped-options-section">
            <h2>Choose your room</h2>
            <p className="pd-grouped-muted">Browse available rooms and monthly prices.</p>
            {sections.length === 0 ? (
              <div className="pd-grouped-empty">
                {selectedBuilding
                  ? "No vacant rooms in this building right now."
                  : "No vacant rooms right now."}
              </div>
            ) : (
              <div className="pd-grouped-options">
                {sections.map(({ sharing, building, rooms: groupedRooms }) => {
                  const prices = groupedRooms
                    .map((room) => room.price)
                    .filter((price) => price != null && Number.isFinite(Number(price)))
                    .map(Number);
                  const minPrice = prices.length ? Math.min(...prices) : null;
                  const isHighlighted = highlight && sharing.toLowerCase() === highlight;
                  return (
                    <section
                      className={`pd-grouped-option${isHighlighted ? " pd-grouped-option--highlighted" : ""}`}
                      key={`${building?._id || "legacy"}:${sharing}`}
                    >
                      <div className="pd-grouped-option-head">
                        <h3>{building ? `${building.name} · ` : ""}{sharing === "Rooms" ? "Rooms" : `${sharing} sharing`}</h3>
                        <span>
                          {minPrice == null ? "Price unavailable" : `From ₹${minPrice.toLocaleString("en-IN")} / month`}
                          {" · "}{groupedRooms.length} available
                        </span>
                      </div>
                      {groupedRooms.map((room) => (
                        <Link className="pd-grouped-room" key={room._id} to={roomPath(room)}>
                          <span className="pd-grouped-room-info">
                            <strong>{room.roomNumber ? `Room ${room.roomNumber}` : room.title}</strong>
                            {(room.rooms != null || room.bathrooms != null) && (
                              <small>
                                {room.rooms != null && (
                                  <><BedDouble size={14} aria-hidden="true" /> {room.rooms} room{room.rooms === 1 ? "" : "s"}</>
                                )}
                                {room.bathrooms != null && (
                                  <><Bath size={14} aria-hidden="true" /> {room.bathrooms} bath</>
                                )}
                              </small>
                            )}
                          </span>
                          {room.price != null && Number.isFinite(Number(room.price)) && (
                            <span className="pd-grouped-room-price">
                              <strong>₹{Number(room.price).toLocaleString("en-IN")}</strong>
                              <small>/month</small>
                              <ArrowUpRight size={16} aria-hidden="true" />
                            </span>
                          )}
                          {(room.price == null || !Number.isFinite(Number(room.price))) && (
                            <ArrowUpRight size={16} aria-hidden="true" />
                          )}
                        </Link>
                      ))}
                    </section>
                  );
                })}
              </div>
            )}
          </section>
          <Amenities amenities={amenities} />
          <LocationSection
            location={property.area ? `${property.area}, Indore` : ""}
            title={property.name}
          />
        </div>

        <aside className="pd-grouped-host">
          {ownerName ? (
            <>
              <span className="pd-grouped-host-label">Property host</span>
              <HostRow ownerName={ownerName} owner={property.owner} />
            </>
          ) : (
            <p className="pd-grouped-muted">Owner details are available on each room listing.</p>
          )}
        </aside>
      </div>
    </main>
  );
}

export default PropertyPage;
