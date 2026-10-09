import toast from "react-hot-toast";

export default async function shareVilla(villa) {
  const path = `/villas/${villa.slug || villa._id}`;
  const url = `${window.location.origin}${path}`;
  try {
    if (navigator.share) {
      await navigator.share({ title: villa.name, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Villa link copied");
  } catch (error) {
    if (error?.name === "AbortError") return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Villa link copied");
    } catch {
      toast.error("Could not share villa link");
    }
  }
}
