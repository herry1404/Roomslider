import toast from "react-hot-toast";

async function shareProperty(room) {
  const url = window.location.href;
  const shareData = {
    title: room.title,
    text: `${room.title}${room.location ? ` - ${room.location}` : ""} | RoomSlider`,
    url,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    toast.success("Listing link copied");
  } catch {
    toast.error("Could not copy listing link");
  }
}

export default shareProperty;
