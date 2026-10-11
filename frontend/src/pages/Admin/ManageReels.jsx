import { useEffect, useState } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import confirmAction from "../../utils/confirmAction";
import "../../styles/admin/theme.css";

function ManageReels() {
  const [reels, setReels] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchReels = async () => {
      try {
        const { data } = await api.get("/reels/admin", { params: { page: 1 } });
        if (cancelled) return;
        setReels(data.reels || []);
        setPage(data.page);
        setHasMore(data.hasMore);
      } catch (error) {
        if (!cancelled) toast.error(error.response?.data?.message || "Unable to load reels.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchReels();
    return () => { cancelled = true; };
  }, []);

  const loadMore = async () => {
    try {
      const { data } = await api.get("/reels/admin", { params: { page: page + 1 } });
      setReels((current) => [...current, ...data.reels]);
      setPage(data.page);
      setHasMore(data.hasMore);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load more reels.");
    }
  };

  const changeStatus = async (reel) => {
    const status = reel.status === "active" ? "hidden" : "active";
    try {
      const { data } = await api.patch(`/reels/${reel._id}/status`, { status });
      setReels((current) => current.map((item) => item._id === reel._id ? { ...item, status: data.reel.status } : item));
      toast.success(status === "hidden" ? "Reel hidden." : "Reel restored.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update reel.");
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

  return (
    <main className="admin-page">
      <div className="admin-page-header">
        <div><h1>Manage Reels</h1><p>Review owner videos, hide, restore, or remove them.</p></div>
      </div>
      {loading ? (
        <p style={{ color: "var(--admin-muted)" }}>Loading reels…</p>
      ) : reels.length ? (
        <div className="admin-reels-grid">
          {reels.map((reel) => (
            <article className="admin-reel-card" key={reel._id}>
              <video src={reel.videoUrl} poster={reel.thumbnailUrl} controls muted playsInline preload="none" />
              <h3>{reel.owner?.propertyName || reel.owner?.name || "Owner"}</h3>
              <p>{reel.caption || "No caption"}</p>
              <span className={`admin-reel-status ${reel.status}`}>{reel.status}</span>
              <div>
                <button type="button" className="admin-btn secondary" onClick={() => changeStatus(reel)}>
                  {reel.status === "active" ? <EyeOff size={16} /> : <Eye size={16} />}
                  {reel.status === "active" ? "Hide" : "Restore"}
                </button>
                <button type="button" className="admin-btn danger" onClick={() => deleteReel(reel)}>
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="admin-empty"><h3>No reels yet</h3></div>
      )}
      {!loading && hasMore && (
        <button className="admin-btn secondary" type="button" onClick={loadMore}>Load more</button>
      )}
    </main>
  );
}

export default ManageReels;
