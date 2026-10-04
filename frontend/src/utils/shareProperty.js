import toast from "react-hot-toast";
import { roomPath } from "./roomUrl";

async function shareProperty(room) {
  let propertyUrl = room.property?._id
    ? `/property/${room.property.slug || room.property._id}`
    : roomPath(room);
  if (room.property?._id) {
    const params = new URLSearchParams();
    if (room.building) params.set("building", room.building);
    if (room.sharingType && room.sharingType !== "Other") {
      params.set("sharing", room.sharingType.toLowerCase());
    }
    const query = params.toString();
    if (query) propertyUrl += `?${query}`;
  }
  const url = `${window.location.origin}${propertyUrl}`;
  const priceText = room.price != null ? `₹${Number(room.price).toLocaleString("en-IN")} / month` : "";
  const shareData = {
    title: room.title,
    text: [room.title, priceText, room.location, "RoomSlider"].filter(Boolean).join(" · "),
    url,
  };

  if (navigator.share) {
    let imageFile = null;
    const imageUrl = room.images?.[0];
    if (imageUrl && navigator.canShare && typeof File !== "undefined") {
      try {
        const response = await fetch(imageUrl);
        if (response.ok) {
          const blob = await response.blob();
          const extension = blob.type.split("/")[1] || "jpg";
          const candidate = new File([blob], `roomslider-listing.${extension}`, { type: blob.type });
          if (navigator.canShare({ files: [candidate] })) imageFile = candidate;
        }
      } catch {
        imageFile = null;
      }
    }

    if (imageFile) {
      try {
        await navigator.share({ ...shareData, files: [imageFile] });
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }

    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }

  try {
    await navigator.clipboard.writeText(`${shareData.text} ${url}`);
    toast.success("Listing link copied");
  } catch {
    toast.error("Could not copy listing link");
  }
}

export default shareProperty;
