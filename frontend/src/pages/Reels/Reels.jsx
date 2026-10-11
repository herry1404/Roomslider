import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin, Volume2, VolumeX } from "lucide-react";
import api from "../../api/axios";
import "../../styles/reels.css";

function ReelCard({ reel, active, onVisible }) {
  const cardRef = useRef(null);
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || !("IntersectionObserver" in window)) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      onVisible(reel._id, entry.isIntersecting && entry.intersectionRatio >= 0.65);
    }, { threshold: [0, 0.65, 1] });
    observer.observe(card);
    return () => observer.disconnect();
  }, [onVisible, reel._id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [active]);

  const toggleMuted = () => {
    setMuted((current) => !current);
    if (videoRef.current) videoRef.current.muted = !videoRef.current.muted;
  };

  return (
    <article className="reel-feed-card" ref={cardRef} data-reel-card={reel._id}>
      <video
        ref={videoRef}
        className="reel-feed-video"
        src={active ? reel.videoUrl : undefined}
        poster={reel.thumbnailUrl}
        muted={muted}
        playsInline
        loop
        preload="none"
        aria-label={reel.caption || "Room tour reel"}
      />
      <div className="reel-feed-shade" />
      <div className="reel-feed-copy">
        {reel.owner?.slug && (
          <Link to={`/owner/${reel.owner.slug}`} className="reel-feed-owner">
            {reel.owner.photo && <img src={reel.owner.photo} alt="" loading="lazy" />}
            <span>{reel.owner.propertyName || reel.owner.name}</span>
          </Link>
        )}
        {reel.caption && <p>{reel.caption}</p>}
        {reel.room && (
          <Link to={`/rooms/${reel.room.slug || reel.room._id}`} className="reel-feed-room">
            {reel.room.images?.[0] && <img src={reel.room.images[0]} alt="" loading="lazy" />}
            <span>
              <strong>{reel.room.title}</strong>
              <small><MapPin size={13} /> {reel.room.location}</small>
            </span>
          </Link>
        )}
      </div>
      <div className="reel-feed-actions">
        <span aria-label={`${reel.likes} likes`}><Heart size={22} />{reel.likes}</span>
        <button type="button" onClick={toggleMuted} aria-label={muted ? "Unmute reel" : "Mute reel"}>
          {muted ? <VolumeX size={22} /> : <Volume2 size={22} />}
        </button>
      </div>
    </article>
  );
}

function Reels() {
  const [reels, setReels] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const handleVisible = useCallback((id, visible) => {
    setActiveId((current) => visible ? id : current === id ? null : current);
  }, []);

  const fetchPage = useCallback(async (nextPage) => {
    const { data } = await api.get("/reels", { params: { page: nextPage } });
    setReels((current) => nextPage === 1 ? data.reels : [...current, ...data.reels]);
    setPage(data.page);
    setHasMore(data.hasMore);
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.get("/reels", { params: { page: 1 } })
      .then(({ data }) => {
        if (cancelled) return;
        setReels(data.reels);
        setPage(data.page);
        setHasMore(data.hasMore);
      })
      .catch((fetchError) => {
        if (!cancelled) setError(fetchError.response?.data?.message || "Unable to load reels.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setError("");
    try {
      await fetchPage(page + 1);
    } catch (fetchError) {
      setError(fetchError.response?.data?.message || "Unable to load more reels.");
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) return <div className="reels-state" role="status">Loading reels…</div>;
  if (error && reels.length === 0) return <div className="reels-state" role="alert">{error}</div>;
  if (reels.length === 0) return <div className="reels-state">No reels yet. Check back soon.</div>;

  return (
    <main className="reels-page">
      <h1 className="reels-heading">Room Reels</h1>
      <div className="reels-feed" aria-label="Room reels">
        {reels.map((reel) => (
          <ReelCard
            key={reel._id}
            reel={reel}
            active={activeId === reel._id}
            onVisible={handleVisible}
          />
        ))}
        {hasMore && (
          <div className="reels-more">
            {error && <p role="alert">{error}</p>}
            <button type="button" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Loading…" : "Load more reels"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default Reels;
