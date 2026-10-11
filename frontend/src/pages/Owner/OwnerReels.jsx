import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Upload } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import confirmAction from "../../utils/confirmAction";
import "../../styles/reels.css";

const MAX_VIDEO_BYTES = 20 * 1024 * 1024;
const ACCEPTED_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

function OwnerReels() {
  const [reels, setReels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [video, setVideo] = useState(null);
  const [caption, setCaption] = useState("");
  const [room, setRoom] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const [reelsResponse, roomsResponse] = await Promise.all([
          api.get("/reels/me", { params: { page: 1 } }),
          api.get("/owners/me"),
        ]);
        if (cancelled) return;
        setReels(reelsResponse.data.reels || []);
        setPage(reelsResponse.data.page);
        setHasMore(reelsResponse.data.hasMore);
        setRooms((roomsResponse.data.rooms || []).filter((item) => item.status === "vacant"));
      } catch (error) {
        if (!cancelled) toast.error(error.response?.data?.message || "Unable to load your reels.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const selectVideo = (file) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Choose an MP4, WebM, or MOV video.");
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      toast.error("Video must be 20 MB or smaller.");
      return;
    }
    setVideo(file);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!video || uploading) return;

    const formData = new FormData();
    formData.append("video", video);
    formData.append("caption", caption);
    if (room) formData.append("room", room);

    setUploading(true);
    try {
      const { data } = await api.post("/reels", formData);
      setReels((current) => [data.reel, ...current]);
      setVideo(null);
      setCaption("");
      setRoom("");
      formRef.current?.reset();
      toast.success("Reel uploaded.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Reel upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const deleteReel = async (reel) => {
    if (!await confirmAction("Delete this reel permanently?", { confirmText: "Delete" })) return;
    try {
      await api.delete(`/reels/${reel._id}`);
      setReels((current) => current.filter((item) => item._id !== reel._id));
      toast.success("Reel deleted.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete reel.");
    }
  };

  const loadMore = async () => {
    try {
      const { data } = await api.get("/reels/me", { params: { page: page + 1 } });
      setReels((current) => [...current, ...data.reels]);
      setPage(data.page);
      setHasMore(data.hasMore);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load more reels.");
    }
  };

  return (
    <main className="reels-manage-page">
      <div className="reels-manage-header">
        <div>
          <h1>Your Reels</h1>
          <p>Upload room videos up to 60 seconds and 20 MB.</p>
        </div>
        <Link to="/owner/dashboard">Back to dashboard</Link>
      </div>

      <form ref={formRef} className="reel-upload-form" onSubmit={handleUpload}>
        <label>
          Video
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            required
            onChange={(event) => selectVideo(event.target.files?.[0])}
          />
        </label>
        {video && <p className="reel-upload-filename">{video.name} · {(video.size / 1024 / 1024).toFixed(1)} MB</p>}
        <label>
          Caption
          <textarea value={caption} maxLength={300} onChange={(event) => setCaption(event.target.value)} />
        </label>
        <label>
          Link a room (optional)
          <select value={room} onChange={(event) => setRoom(event.target.value)}>
            <option value="">No linked room</option>
            {rooms.map((item) => <option value={item._id} key={item._id}>{item.title}</option>)}
          </select>
        </label>
        <button className="reel-upload-submit" type="submit" disabled={!video || uploading}>
          <Upload size={17} /> {uploading ? "Uploading…" : "Publish reel"}
        </button>
      </form>

      <h2>Published videos</h2>
      {loading ? (
        <p className="reels-state" role="status">Loading your reels…</p>
      ) : reels.length ? (
        <div className="reels-manage-grid">
          {reels.map((reel) => (
            <article className="reel-manage-card" key={reel._id}>
              <video src={reel.videoUrl} poster={reel.thumbnailUrl} controls muted playsInline preload="none" />
              <div>
                <p>{reel.caption || "No caption"}</p>
                <span className={`reel-status reel-status-${reel.status}`}>{reel.status}</span>
                <button type="button" aria-label="Delete reel" onClick={() => deleteReel(reel)}><Trash2 size={17} /></button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="reels-state">You haven’t published a reel yet.</p>
      )}
      {!loading && hasMore && (
        <button className="reels-load-more" type="button" onClick={loadMore}>Load more</button>
      )}
    </main>
  );
}

export default OwnerReels;
