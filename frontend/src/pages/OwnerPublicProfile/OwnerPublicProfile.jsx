import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import RoomCard from "../../components/ui/RoomCard";
import "../../styles/owner-public-profile.css";

function OwnerPublicProfile() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("reels");
  const [rooms, setRooms] = useState([]);
  const [reels, setReels] = useState([]);
  const [reelsLoading, setReelsLoading] = useState(false);
  const [roomsLoaded, setRoomsLoaded] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      setRooms([]);
      setRoomsLoaded(false);
      setReels([]);
      try {
        const { data } = await api.get(`/owners/${encodeURIComponent(slug)}`);
        if (cancelled) return;
        setProfile(data.owner);
        setFollowing(data.isFollowing);
        setFollowersCount(data.followersCount);
        setReelsLoading(true);
        api.get(`/owners/${encodeURIComponent(slug)}/reels`)
          .then((reelsResponse) => {
            if (!cancelled) setReels(reelsResponse.data.reels || []);
          })
          .catch((reelsError) => {
            if (!cancelled) setError(reelsError.response?.data?.message || "Unable to load reels.");
          })
          .finally(() => {
            if (!cancelled) setReelsLoading(false);
          });
      } catch (fetchError) {
        if (cancelled) return;
        setProfile(null);
        setReels([]);
        setError(fetchError.response?.data?.message || "Unable to load this owner profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const loadRooms = async () => {
    if (!profile?._id || roomsLoaded || roomsLoading) return;
    setRoomsLoading(true);
    try {
      const { data } = await api.get("/rooms", {
        params: { owner: profile._id, limit: 100 },
      });
      setRooms(data.rooms || []);
      setRoomsLoaded(true);
      setError("");
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Unable to load this owner's listings.");
    } finally {
      setRoomsLoading(false);
    }
  };

  const toggleFollow = async () => {
    if (!user) {
      navigate("/login", { state: { from: location } });
      return;
    }
    if (!["user", "admin"].includes(user.role) || followLoading) return;

    const previousFollowing = following;
    const previousCount = followersCount;
    const nextFollowing = !previousFollowing;
    setFollowing(nextFollowing);
    setFollowersCount(Math.max(0, previousCount + (nextFollowing ? 1 : -1)));
    setFollowLoading(true);

    try {
      const request = nextFollowing
        ? api.post(`/follow/${profile._id}`)
        : api.delete(`/follow/${profile._id}`);
      const { data } = await request;
      setFollowing(data.following);
      setFollowersCount(data.followersCount);
    } catch (followError) {
      setFollowing(previousFollowing);
      setFollowersCount(previousCount);
      setError(followError.response?.data?.message || "Unable to update your follow.");
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return <div className="owner-public-state" role="status">Loading owner profile…</div>;
  }

  if (!profile) {
    return <div className="owner-public-state" role="alert">{error || "Owner not found."}</div>;
  }

  const displayName = profile.propertyName || profile.name;
  const canFollow = !user || ["user", "admin"].includes(user.role);

  return (
    <main className="owner-public-page">
      <Helmet>
        <title>{displayName} | RoomSlider</title>
        <meta name="description" content={profile.bio || `${displayName} on RoomSlider`} />
        <link rel="canonical" href={`https://roomslider.in/owner/${profile.slug}`} />
      </Helmet>

      <header className="owner-public-header">
        <div className="owner-public-photo-wrap">
          {profile.photo ? (
            <img className="owner-public-photo" src={profile.photo} alt={`${displayName} profile`} />
          ) : (
            <div className="owner-public-photo owner-public-photo-fallback" aria-hidden="true">
              {displayName?.charAt(0)?.toUpperCase() || "O"}
            </div>
          )}
        </div>
        <div className="owner-public-info">
          <h1>{displayName}</h1>
          {profile.bio && <p className="owner-public-bio">{profile.bio}</p>}
          {profile.area && <p className="owner-public-area">{profile.area}</p>}
          <div className="owner-public-stats">
            <span><strong>{followersCount}</strong> followers</span>
            <span><strong>{profile.listingsCount}</strong> listings</span>
          </div>
          {canFollow ? (
            <button
              className={`owner-follow-button${following ? " is-following" : ""}`}
              type="button"
              onClick={toggleFollow}
              disabled={followLoading}
            >
              {followLoading ? "Updating…" : following ? "Following" : "Follow"}
            </button>
          ) : (
            <p className="owner-follow-note">Sign in with a user account to follow owners.</p>
          )}
        </div>
      </header>

      {error && <p className="owner-public-error" role="alert">{error}</p>}

      <nav className="owner-public-tabs" aria-label="Owner profile sections">
        {["reels", "listings"].map((tab) => (
          <button
            className={`owner-public-tab${activeTab === tab ? " is-active" : ""}`}
            key={tab}
            type="button"
            aria-pressed={activeTab === tab}
            onClick={() => {
              setActiveTab(tab);
              if (tab === "listings") loadRooms();
            }}
          >
            {tab === "reels" ? "Reels" : "Listings"}
          </button>
        ))}
      </nav>

      <section className="owner-public-content">
        {activeTab === "reels" ? (
            reelsLoading ? (
              <div className="owner-public-empty" role="status">Loading reels…</div>
            ) : reels.length ? (
              <div className="owner-reel-grid">
                {reels.map((reel) => (
                  <Link className="owner-reel-tile" to="/reels" key={reel._id}>
                    <img src={reel.thumbnailUrl} alt={reel.caption || `${displayName} room reel`} loading="lazy" />
                    {reel.caption && <span>{reel.caption}</span>}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="owner-public-empty">No reels yet.</div>
            )
        ) : roomsLoading ? (
          <div className="owner-public-empty" role="status">Loading listings…</div>
        ) : rooms.length ? (
          <div className="listing-grid">
            {rooms.map((room) => <RoomCard key={room._id} room={room} />)}
          </div>
        ) : (
          <div className="owner-public-empty">No active listings right now.</div>
        )}
      </section>
    </main>
  );
}

export default OwnerPublicProfile;
