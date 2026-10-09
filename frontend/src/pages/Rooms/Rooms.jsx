import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios";
import RoomCard from "../../components/ui/RoomCard";
import SkeletonRoomCard from "../../components/ui/SkeletonRoomCard";
import EmptyState from "../../components/ui/EmptyState";
import { distanceKm, findIndorePlace, normalizePlaceName } from "../../utils/indoreLocation";

const NEARBY_RADIUS_KM = 8;

function Rooms() {
  const [searchParams] = useSearchParams();
  const search = (searchParams.get("search") || "").trim();
  const [result, setResult] = useState(null);
  const loading = result?.search !== search;

  useEffect(() => {
    let active = true;
    const load = async () => {
      const place = findIndorePlace(search);
      try {
        const response = await api.get("/rooms", {
          params: search ? { search, hourly: "false" } : { category: "Room", hourly: "false" },
        });
        let rooms = response.data?.rooms || [];
        let nearbyOnly = false;
        let nearestFallback = false;

        if (search && rooms.length === 0 && place) {
          const allRoomsResponse = await api.get("/rooms", { params: { hourly: "false" } });
          const allRooms = allRoomsResponse.data?.rooms || [];
          const areaName = normalizePlaceName(place.name);
          const rankedRooms = allRooms.map((room) => {
            const distance = room.latitude != null && room.longitude != null
              ? distanceKm(room.latitude, room.longitude, place.latitude, place.longitude)
              : Infinity;
            const mentionsPlace = [
              room.location,
              room.title,
              ...(room.nearby || []),
            ].filter(Boolean).join(" ");
            const normalizedText = normalizePlaceName(mentionsPlace);
            const matchesPlace = normalizedText.includes(areaName);
            return { room, distance, mentionsPlace: matchesPlace };
          }).filter(({ distance, mentionsPlace }) =>
            mentionsPlace || Number.isFinite(distance)
          ).sort((left, right) =>
            Number(right.mentionsPlace) - Number(left.mentionsPlace) ||
            left.distance - right.distance
          );
          const inRadius = rankedRooms.filter(({ mentionsPlace, distance }) =>
            mentionsPlace || distance <= NEARBY_RADIUS_KM
          );
          const chosenRooms = inRadius.length ? inRadius : rankedRooms.slice(0, 12);
          nearestFallback = inRadius.length === 0 && chosenRooms.length > 0;
          rooms = chosenRooms.slice(0, 12).map(({ room, distance }) => ({
            ...room,
            searchDistanceKm: Number.isFinite(distance) ? distance : null,
          }));
          nearbyOnly = rooms.length > 0;
        }

        if (active) setResult({ search, rooms, place, nearbyOnly, nearestFallback });
      } catch (error) {
        if (!active) return;
        toast.error(error.response?.data?.message || "Rooms could not be loaded");
        setResult({ search, rooms: [], place, nearbyOnly: false, nearestFallback: false });
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [search]);

  const rooms = result?.search === search ? result.rooms : [];
  const place = result?.search === search ? result.place : findIndorePlace(search);
  const nearbyOnly = result?.search === search && result.nearbyOnly;
  const nearestFallback = result?.search === search && result.nearestFallback;

  if (loading) {
    return (
      <div className="container rooms-search-page">
        <div className="skeleton-grid">
          {Array.from({ length: 8 }).map((_, index) => <SkeletonRoomCard key={index} />)}
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{search ? `${search} Rooms in Indore | RoomSlider` : "Rooms for Rent in Indore | RoomSlider"}</title>
        <meta name="description" content="Find available rooms near your preferred area in Indore. Browse nearby options, compare prices and contact owners." />
        <link rel="canonical" href="https://www.roomslider.in/rooms" />
      </Helmet>

      <section className="container rooms-search-page">
        <h1>{search ? `Rooms near ${search}` : "Available Rooms"}</h1>
        {nearbyOnly ? (
          <div className="rooms-nearby-notice" role="status">
            <strong>{place.name} mein abhi rooms available nahi hain.</strong>
            <span>
              {nearestFallback
                ? "Closest available options are shown below; distance from this area is included."
                : `Yahan se ${NEARBY_RADIUS_KM} km ke andar available rooms dikha rahe hain.`}
            </span>
          </div>
        ) : (
          <p>{search ? `${rooms.length} available listing${rooms.length === 1 ? "" : "s"} found` : "Find your perfect accommodation."}</p>
        )}

        {rooms.length === 0 ? (
          <EmptyState
            title="No available rooms yet"
            description={place
              ? `${place.name} ya uske aas-paas abhi koi available room nahi mila.`
              : "Try searching a nearby area or college."}
            className="rooms-search-empty"
          />
        ) : (
          <div className="listing-grid">
            {rooms.map((room) => <RoomCard key={room._id} room={room} />)}
          </div>
        )}
      </section>
    </>
  );
}

export default Rooms;
