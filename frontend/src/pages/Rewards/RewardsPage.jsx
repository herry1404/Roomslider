import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Flame, Gift, LockKeyhole, Sparkles } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { isProfileComplete } from "../../utils/isProfileComplete";
import "../../styles/rewards.css";

const fallbackReward = {
  key: "better-luck",
  label: "Better luck next time",
  valueRs: 0,
  weight: 1,
  minStreak: 0,
  isNoWin: true,
};

function wheelPath(startAngle, endAngle, radius = 110) {
  if (endAngle - startAngle >= 359.99) {
    return `M 120 10 A ${radius} ${radius} 0 1 1 120 230 A ${radius} ${radius} 0 1 1 120 10 Z`;
  }
  const point = (angle) => {
    const radians = (angle * Math.PI) / 180;
    return [120 + radius * Math.cos(radians), 120 + radius * Math.sin(radians)];
  };
  const [startX, startY] = point(startAngle);
  const [endX, endY] = point(endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M 120 120 L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`;
}

function RewardWheel({ segments, wheelRef, spinning }) {
  const totalWeight = segments.reduce((total, segment) => total + segment.weight, 0) || 1;
  const colors = ["#1c9a68", "#28754f", "#42b883", "#155f49", "#70c69c", "#2a8a61", "#b4e3c8", "#0f4938"];
  const slices = segments.map((segment, index) => {
    const before = segments.slice(0, index).reduce((total, item) => total + item.weight, 0);
    return {
      segment,
      index,
      startAngle: -90 + (before / totalWeight) * 360,
      endAngle: -90 + ((before + segment.weight) / totalWeight) * 360,
    };
  });
  return (
    <div className="rewards-wheel-wrap">
      <span className="rewards-wheel-pointer" aria-hidden="true" />
      <svg
        ref={wheelRef}
        className={`rewards-wheel${spinning ? " is-spinning" : ""}`}
        viewBox="0 0 240 240"
        role="img"
        aria-label="Daily rewards spin wheel"
      >
        <circle cx="120" cy="120" r="116" fill="#082b20" />
        {slices.map(({ segment, index, startAngle, endAngle }) => {
          const centerAngle = (startAngle + endAngle) / 2;
          const labelRadians = (centerAngle * Math.PI) / 180;
          const labelX = 120 + 72 * Math.cos(labelRadians);
          const labelY = 120 + 72 * Math.sin(labelRadians);
          return (
            <g key={`${segment.key}-${index}`}>
              <path d={wheelPath(startAngle, endAngle)} fill={colors[index % colors.length]} stroke="#d0f0dd" strokeWidth="1.5" />
              <text
                x={labelX}
                y={labelY}
                fill="#fff"
                fontSize={segments.length > 6 ? "8" : "9"}
                fontWeight="700"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {segment.label.length > 14 ? `${segment.label.slice(0, 12)}…` : segment.label}
              </text>
            </g>
          );
        })}
        <circle cx="120" cy="120" r="23" fill="#f4fff8" stroke="#d0f0dd" strokeWidth="4" />
        <circle cx="120" cy="120" r="7" fill="#159260" />
      </svg>
    </div>
  );
}

function expiryText(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function RewardsPage() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [info, setInfo] = useState(null);
  const [myRewards, setMyRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const [wheelSegments, setWheelSegments] = useState([]);
  const wheelRef = useRef(null);
  const rotationRef = useRef(0);
  const returnTo = `${location.pathname}${location.search}`;

  useEffect(() => {
    if (!user || !["user", "admin"].includes(user.role)) return;
    if (!String(user.phone || "").trim()) {
      navigate("/complete-profile", { replace: true, state: { returnTo } });
    } else if (!isProfileComplete(user)) {
      navigate("/profile/edit", { replace: true, state: { returnTo } });
    }
  }, [user, navigate, location, returnTo]);

  const loadPage = useCallback(async () => {
    const [infoResponse, rewardsResponse] = await Promise.all([
      api.get(`/rewards/${encodeURIComponent(slug)}`),
      api.get("/rewards/me"),
    ]);
    setInfo(infoResponse.data);
    setMyRewards(rewardsResponse.data.rewards || []);
    setSpinResult(infoResponse.data.user?.todaySpin || null);
    setLoadError("");
  }, [slug]);

  useEffect(() => {
    if (!user || !["user", "admin"].includes(user.role) || !isProfileComplete(user)) return;
    let active = true;
    Promise.all([
      api.get(`/rewards/${encodeURIComponent(slug)}`),
      api.get("/rewards/me"),
    ]).then(([infoResponse, rewardsResponse]) => {
      if (!active) return;
      setInfo(infoResponse.data);
      setMyRewards(rewardsResponse.data.rewards || []);
      setSpinResult(infoResponse.data.user?.todaySpin || null);
      setLoadError("");
    }).catch((error) => {
      if (active) setLoadError(error.response?.data?.message || "Rewards are temporarily unavailable.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [slug, user]);

  const streak = info?.user?.streak || 0;
  const availableSegments = useMemo(() => {
    const eligible = (info?.rewards || []).filter((reward) => reward.minStreak <= streak);
    return eligible.length ? eligible : [fallbackReward];
  }, [info, streak]);

  async function retryLoad() {
    setLoading(true);
    setLoadError("");
    try {
      await loadPage();
    } catch (error) {
      setLoadError(error.response?.data?.message || "Rewards are temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckIn(event) {
    event.preventDefault();
    if (busy) return;
    try {
      setBusy(true);
      await api.post(`/rewards/${encodeURIComponent(slug)}/checkin`, { code: code.trim().toUpperCase() });
      setCode("");
      await loadPage();
      toast.success("Check-in complete! Your daily spin is unlocked.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not check in.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSpin() {
    if (busy || !info?.user?.checkedInToday || info.user.spunToday) return;
    try {
      setBusy(true);
      setSpinResult(null);
      const response = await api.post(`/rewards/${encodeURIComponent(slug)}/spin`);
      const result = response.data;
      const segments = result.segments?.length ? result.segments : [fallbackReward];
      setWheelSegments(segments);
      setSpinResult(result);
      setSpinning(true);
      setTimeout(() => {
        const winnerIndex = Math.max(0, segments.findIndex((segment) => segment.key === result.segmentKey));
        const weightTotal = segments.reduce((total, segment) => total + segment.weight, 0) || 1;
        const beforeWinner = segments.slice(0, winnerIndex).reduce((total, segment) => total + segment.weight, 0);
        const centerAngle = ((beforeWinner + segments[winnerIndex].weight / 2) / weightTotal) * 360;
        const rotation = rotationRef.current + 7 * 360 + ((360 - centerAngle) % 360);
        rotationRef.current = rotation;
        if (wheelRef.current) wheelRef.current.style.transform = `rotate(${rotation}deg)`;
      }, 40);
      window.setTimeout(async () => {
        setSpinning(false);
        setInfo((current) => current ? {
          ...current,
          user: { ...current.user, spunToday: true, todaySpin: result },
        } : current);
        try {
          const rewardsResponse = await api.get("/rewards/me");
          setMyRewards(rewardsResponse.data.rewards || []);
        } catch (error) {
          toast.error(error.response?.data?.message || "Could not refresh your rewards.");
        } finally {
          setBusy(false);
        }
      }, 5400);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not spin right now.");
      setBusy(false);
    }
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!["user", "admin"].includes(user.role)) {
    return <main className="rewards-page rewards-loading"><strong>Daily rewards are available to customer accounts.</strong></main>;
  }
  if (!isProfileComplete(user)) {
    return <div className="rewards-loading" role="status">Taking you to finish your profile…</div>;
  }

  if (loading) {
    return (
      <main className="rewards-page rewards-loading" role="status">
        <span className="rewards-loader" />
        <strong>Waking up the rewards…</strong>
        <span>The first load may take a few seconds.</span>
      </main>
    );
  }

  if (loadError || !info) {
    return (
      <main className="rewards-page rewards-loading" role="alert">
        <strong>{loadError || "Rewards are temporarily unavailable."}</strong>
        <button className="rewards-spin-button" type="button" onClick={retryLoad}>Try again</button>
      </main>
    );
  }

  const userState = info?.user || { streak: 0, checkedInToday: false, spunToday: false };
  const displayedSegments = spinning && wheelSegments.length ? wheelSegments : availableSegments;

  return (
    <main className="rewards-page">
      <Helmet>
        <title>Daily Rewards | {info?.cafe?.name || "RoomSlider"}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <header className="rewards-heading">
        <span className="rewards-eyebrow"><Sparkles size={15} /> ROOMSLIDER REWARDS</span>
        <h1>Daily Check-in</h1>
        <p>{info?.cafe?.name} · check in once a day and spin for a cafe reward.</p>
      </header>

      <section className="rewards-streak-card" aria-label="Your check-in streak">
        <div className="rewards-streak-icon"><Flame size={27} fill="currentColor" /></div>
        <div><span>YOUR STREAK</span><strong>{userState.streak} {userState.streak === 1 ? "day" : "days"}</strong></div>
        <span className="rewards-streak-caption">{userState.checkedInToday ? "Checked in today" : "Keep your streak alive"}</span>
      </section>

      {!userState.checkedInToday ? (
        <section className="rewards-panel">
          <div className="rewards-panel-title"><span className="rewards-step">1</span><div><h2>Enter today’s code</h2><p>Get the daily code from the cafe after your order.</p></div></div>
          <form className="rewards-code-form" onSubmit={handleCheckIn}>
            <label className="sr-only" htmlFor="daily-reward-code">Daily cafe code</label>
            <input
              id="daily-reward-code"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, "").slice(0, 5))}
              placeholder="ABC23"
              maxLength={5}
              required
              aria-describedby="reward-code-help"
            />
            <button type="submit" disabled={busy || code.length !== 5}>{busy ? "Checking…" : "Check in"}</button>
          </form>
          <small id="reward-code-help">3 letters + 2 numbers · 5 attempts per day</small>
        </section>
      ) : (
        <section className="rewards-panel rewards-checkin-done">
          <span className="rewards-step rewards-step--done">✓</span>
          <div><h2>Today’s check-in is complete</h2><p>Your streak is active and your daily spin is {userState.spunToday ? "used" : "unlocked"}.</p></div>
        </section>
      )}

      <section className="rewards-panel rewards-spin-panel">
        <div className="rewards-panel-title"><span className="rewards-step">2</span><div><h2>Daily spin</h2><p>Eligible rewards unlock as your streak grows.</p></div></div>
        <RewardWheel segments={displayedSegments} wheelRef={wheelRef} spinning={spinning} />
        <button
          className="rewards-spin-button"
          type="button"
          disabled={!userState.checkedInToday || userState.spunToday || busy}
          onClick={handleSpin}
        >
          {!userState.checkedInToday ? <><LockKeyhole size={17} /> Check in to unlock</>
            : userState.spunToday ? "Today's spin used"
              : busy ? "Spinning…" : <><Gift size={17} /> Spin now</>}
        </button>
        {spinResult && !spinning && (
          <div className={`rewards-spin-result${spinResult.reward.isNoWin ? " is-no-win" : ""}`} role="status">
            <strong>{spinResult.reward.label}</strong>
            {spinResult.redeemCode && <span>Redeem code <code>{spinResult.redeemCode}</code> · expires {expiryText(spinResult.expiresAt)}</span>}
          </div>
        )}
      </section>

      <section className="rewards-panel rewards-my-panel">
        <div className="rewards-panel-title"><span className="rewards-my-icon"><Gift size={18} /></span><div><h2>My Rewards</h2><p>Unused codes are valid for 2 days.</p></div></div>
        {myRewards.length ? (
          <div className="rewards-list">
            {myRewards.map((reward) => (
              <article className="rewards-list-item" key={reward.redeemCode}>
                <div><strong>{reward.reward.label}</strong><small>{reward.cafe?.name || "RoomSlider"} · Expires {expiryText(reward.expiresAt)}</small></div>
                <div className="rewards-list-code"><code>{reward.redeemCode}</code><span className={`rewards-status status-${reward.status}`}>{reward.status}</span></div>
              </article>
            ))}
          </div>
        ) : <p className="rewards-empty">Your redeemable rewards will appear here after a winning spin.</p>}
      </section>
      <footer className="rewards-footer"><Link to="/">RoomSlider</Link> · Rewards are managed by the demo cafe.</footer>
    </main>
  );
}

export default RewardsPage;
