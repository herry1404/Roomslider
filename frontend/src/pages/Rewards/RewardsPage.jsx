import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Flame, Gift, LockKeyhole, Sparkles } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import "../../styles/rewards.css";

const fallbackReward = {
  key: "better-luck",
  label: "Better luck next time",
  valueRs: 0,
  weight: 1,
  minStreak: 0,
  isNoWin: true,
};

const HOW_IT_WORKS = [
  "Order at the cafe and ask for today’s code.",
  "Log in with Google once to use online coupons and Watch & Win.",
  "Enter the cafe code to grow your streak and unlock the cafe spin.",
  "Watch a sponsor ad or choose online coupons for two additional daily spins.",
];

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
  const [activeSpinType, setActiveSpinType] = useState("cafe");
  const [adSession, setAdSession] = useState(null);
  const [adCountdown, setAdCountdown] = useState(0);
  const wheelRef = useRef(null);
  const rotationRef = useRef(0);
  const isCustomer = Boolean(user && ["user", "admin"].includes(user.role));

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
    if (!user || !["user", "admin"].includes(user.role)) return;
    let active = true;
    const requests = [api.get(`/rewards/${encodeURIComponent(slug)}`)];
    if (["user", "admin"].includes(user.role)) {
      requests.push(api.get("/rewards/me"));
    }
    Promise.all(requests).then(([infoResponse, rewardsResponse]) => {
      if (!active) return;
      setInfo(infoResponse.data);
      setMyRewards(rewardsResponse?.data?.rewards || []);
      setSpinResult(infoResponse.data.user?.todaySpin || null);
      setLoadError("");
    }).catch((error) => {
      if (active) setLoadError(error.response?.data?.message || "Rewards are temporarily unavailable.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [slug, user]);

  useEffect(() => {
    if (user && ["user", "admin"].includes(user.role)) return;
    let active = true;
    api.get(`/rewards/${encodeURIComponent(slug)}`)
      .then((response) => {
        if (!active) return;
        setInfo(response.data);
        setLoadError("");
      })
      .catch((error) => {
        if (active) setLoadError(error.response?.data?.message || "Rewards are temporarily unavailable.");
      })
      .finally(() => {
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
    if (user && ["user", "admin"].includes(user.role)) {
        await loadPage();
      } else {
        const response = await api.get(`/rewards/${encodeURIComponent(slug)}`);
        setInfo(response.data);
      }
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

  async function handleSpin(type) {
    const spinState = info?.user?.spins?.[type];
    if (busy || spinState || (type === "cafe" && !info?.user?.checkedInToday)
      || (type === "ad" && !adSession?.completed)) return;
    try {
      setBusy(true);
      setActiveSpinType(type);
      setSpinResult(null);
      const response = await api.post(`/rewards/${encodeURIComponent(slug)}/spin`, { type });
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
          user: {
            ...current.user,
            spunToday: type === "cafe" ? true : current.user.spunToday,
            todaySpin: type === "cafe" ? result : current.user.todaySpin,
            spins: { ...(current.user.spins || {}), [type]: result },
          },
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

  async function startAd() {
    if (busy || info?.user?.spins?.ad) return;
    try {
      setBusy(true);
      const response = await api.post(`/rewards/${encodeURIComponent(slug)}/ad/start`);
      setAdSession({ ...response.data, completed: false });
      setAdCountdown(response.data.sponsor.durationSec);
      setActiveSpinType("ad");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not start the sponsor ad.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!adSession || adSession.completed || adCountdown <= 0) return undefined;
    const timer = window.setTimeout(() => setAdCountdown((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [adSession, adCountdown]);

  useEffect(() => {
    if (!adSession || adSession.completed || adCountdown > 0) return;
    let active = true;
    api.post(`/rewards/${encodeURIComponent(slug)}/ad/complete`, { token: adSession.token })
      .then(() => {
        if (!active) return;
        setAdSession((current) => current ? { ...current, completed: true } : current);
        toast.success("Ad complete. Your sponsor-coupon spin is ready.");
      })
      .catch((error) => active && toast.error(error.response?.data?.message || "Ad completion could not be verified."));
    return () => { active = false; };
  }, [adSession, adCountdown, slug]);

  const streakCard = (state, status) => (
    <section className="rewards-streak-card" aria-label="Your check-in streak">
      <div className="rewards-streak-icon"><Flame size={27} fill="currentColor" /></div>
      <div>
        <span>YOUR STREAK</span>
        <strong>{state ? `${state.streak} ${state.streak === 1 ? "day" : "days"}` : status}</strong>
      </div>
      <span className="rewards-streak-caption">
        {state
          ? state.checkedInToday ? "Checked in today" : "Keep your streak alive"
          : !user ? "Log in to view your streak" : "Your check-in streak"}
      </span>
    </section>
  );

  if (!user) {
    const previewRewards = (info?.rewards || []).filter((reward) => !reward.isNoWin);
    return (
      <main className="rewards-page rewards-intro-page">
        <Helmet>
          <title>Daily Rewards | {info?.cafe?.name || "RoomSlider"}</title>
          <meta name="description" content="Check in, watch a sponsor ad, or spin for online coupons." />
        </Helmet>
        <header className="rewards-heading">
          <span className="rewards-eyebrow"><Sparkles size={15} /> {info?.cafe?.name || "ROOMSLIDER"}</span>
          <h1>Three daily spins</h1>
          <p>Check in, watch a sponsor ad, or unlock an online coupon.</p>
        </header>
        {streakCard(null, "— days")}
        {loadError && <p className="rewards-load-message" role="alert">{loadError}</p>}
        {!info && !loadError && (
          <div className="rewards-intro-status" role="status">
            <span className="rewards-loader" />
            <strong>Waking up the rewards…</strong>
            <span>The first load may take a few seconds.</span>
          </div>
        )}
        {info && (
          <>
            <section className="rewards-panel rewards-intro-steps">
              <h2>How it works</h2>
              <ol>
                {HOW_IT_WORKS.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </section>
            <section className="rewards-panel rewards-intro-rules" aria-label="Reward rules">
              <p>One spin per type each day.</p>
              <p>Only cafe check-ins build your streak.</p>
              <p>The cafe budget applies only to cafe rewards.</p>
            </section>
            <section className="rewards-panel rewards-intro-preview">
              <div className="rewards-panel-title">
                <span className="rewards-my-icon"><Gift size={18} /></span>
                <div><h2>Rewards to unlock</h2><p>Keep your streak going for more choices.</p></div>
              </div>
              <div className="rewards-preview-list">
                {previewRewards.map((reward) => {
                  const locked = reward.minStreak > 0;
                  return (
                    <article className={`rewards-preview-item${locked ? " is-locked" : ""}`} key={reward.key}>
                      <span className="rewards-preview-lock">{locked ? <LockKeyhole size={15} /> : <Gift size={15} />}</span>
                      <span className="rewards-preview-copy">
                        <strong>{reward.label}</strong>
                        {locked && <small>Unlocks at {reward.minStreak}-day streak</small>}
                      </span>
                      <span className="rewards-preview-value">₹{reward.valueRs}</span>
                    </article>
                  );
                })}
                {!previewRewards.length && <p className="rewards-empty">Reward details are loading. Please check again soon.</p>}
              </div>
            </section>
          </>
        )}
        {loadError && <button className="rewards-spin-button rewards-retry-button" type="button" onClick={retryLoad}>Try again</button>}
        <Link className="rewards-google-cta" to="/login" state={{ from: location }}>
          Login with Google to start
        </Link>
        <footer className="rewards-footer"><Link to="/">RoomSlider</Link> · Simple daily rewards at {info?.cafe?.name || "the cafe"}.</footer>
      </main>
    );
  }

  if (!isCustomer) {
    return (
      <main className="rewards-page rewards-loading" role="status">
        <strong>Daily rewards are available to customer accounts.</strong>
        <span>You are already signed in. Switch to a customer account to check in.</span>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="rewards-page rewards-loading" role="status">
        {streakCard(info?.user, info?.user ? "" : "Loading…")}
        <span className="rewards-loader" />
        <strong>Waking up the rewards…</strong>
        <span>The first load may take a few seconds.</span>
      </main>
    );
  }

  if (loadError || !info) {
    return (
      <main className="rewards-page rewards-loading" role="alert">
        {streakCard(info?.user, "Unavailable")}
        <strong>{loadError || "Rewards are temporarily unavailable."}</strong>
        <button className="rewards-spin-button" type="button" onClick={retryLoad}>Try again</button>
      </main>
    );
  }

  const userState = info.user || { streak: 0, checkedInToday: false, spunToday: false };
  const displayedSegments = spinning && wheelSegments.length ? wheelSegments : availableSegments;
  const spins = userState.spins || {};
  const activeTitle = activeSpinType === "cafe" ? "Cafe Spin"
    : activeSpinType === "ad" ? "Watch & Win" : "Online Coupons";

  return (
    <main className="rewards-page">
      <Helmet>
        <title>Daily Rewards | {info?.cafe?.name || "RoomSlider"}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <header className="rewards-heading">
        <span className="rewards-eyebrow"><Sparkles size={15} /> ROOMSLIDER REWARDS</span>
        <h1>Three daily spins</h1>
        <p>{info?.cafe?.name} · check in, watch, or claim an online coupon.</p>
      </header>

      <details className="rewards-how-details">
        <summary>How it works</summary>
        <ol>
          {HOW_IT_WORKS.map((step) => <li key={step}>{step}</li>)}
        </ol>
        <p>Each spin type is available once daily in Asia/Kolkata. Only the cafe spin grows your streak and uses the cafe budget.</p>
      </details>

      {streakCard(userState, "")}

      <section className="rewards-spin-cards" aria-label="Today's spin choices">
        <article className={`rewards-spin-card${activeSpinType === "cafe" ? " is-selected" : ""}`}>
          <div className="rewards-card-top"><div><h2>Cafe Spin</h2><p>Today’s cafe code grows your streak. Paid by the cafe.</p></div><span className={`rewards-card-status ${spins.cafe ? "used" : userState.checkedInToday ? "available" : "locked"}`}>{spins.cafe ? "Used today" : userState.checkedInToday ? "Available" : "Locked"}</span></div>
          {!userState.checkedInToday ? <form className="rewards-code-form" onSubmit={handleCheckIn}><label className="sr-only" htmlFor="daily-reward-code">Daily cafe code</label><input id="daily-reward-code" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, "").slice(0, 5))} placeholder="ABC23" maxLength={5} required /><button type="submit" disabled={busy || code.length !== 5}>{busy ? "Checking…" : "Check in"}</button></form> : <button className="rewards-card-action" type="button" disabled={Boolean(spins.cafe) || busy} onClick={() => handleSpin("cafe")}>{spins.cafe ? "Cafe spin used" : "Spin cafe rewards"}</button>}
        </article>
        <article className={`rewards-spin-card${activeSpinType === "ad" ? " is-selected" : ""}`}>
          <div className="rewards-card-top"><div><h2>Watch &amp; Win</h2><p>Watch a sponsor ad, then spin for that sponsor’s coupon.</p></div><span className={`rewards-card-status ${spins.ad ? "used" : "available"}`}>{spins.ad ? "Used today" : "Available"}</span></div>
          {!adSession ? <button className="rewards-card-action" type="button" disabled={Boolean(spins.ad) || busy} onClick={startAd}>{spins.ad ? "Ad spin used" : "Watch sponsor ad"}</button> : <div className="rewards-ad-screen"><span>SPONSORED</span>{adSession.sponsor.videoUrl ? <video src={adSession.sponsor.videoUrl} autoPlay muted playsInline /> : <div className="rewards-ad-fallback"><strong>{adSession.sponsor.name}</strong><small>Local sponsor message</small></div>}<strong>{adSession.completed ? "Reward unlocked" : `${adCountdown}s remaining`}</strong><small>Your reward is a coupon from {adSession.sponsor.name}.</small><button className="rewards-card-action" type="button" disabled={!adSession.completed || Boolean(spins.ad) || busy} onClick={() => handleSpin("ad")}>{adSession.completed ? "Spin sponsor coupons" : "Finish watching to spin"}</button></div>}
        </article>
        <article className={`rewards-spin-card${activeSpinType === "coupon" ? " is-selected" : ""}`}>
          <div className="rewards-card-top"><div><h2>Online Coupons</h2><p>Just log in and spin for an online coupon. No cafe code needed.</p></div><span className={`rewards-card-status ${spins.coupon ? "used" : "available"}`}>{spins.coupon ? "Used today" : "Available"}</span></div>
          <button className="rewards-card-action" type="button" disabled={Boolean(spins.coupon) || busy} onClick={() => handleSpin("coupon")}>{spins.coupon ? "Coupon spin used" : "Spin online coupons"}</button>
        </article>
      </section>
      <section className="rewards-panel rewards-spin-panel">
        <div className="rewards-panel-title"><span className="rewards-step">★</span><div><h2>{activeTitle}</h2><p>The server chooses the result and records this spin.</p></div></div>
        <RewardWheel segments={displayedSegments} wheelRef={wheelRef} spinning={spinning} />
        {spinResult && !spinning && <div className={`rewards-spin-result${spinResult.reward.isNoWin ? " is-no-win" : ""}`} role="status"><strong>{spinResult.reward.label}</strong>{spinResult.redeemCode && <span>Redeem code <code>{spinResult.redeemCode}</code> · expires {expiryText(spinResult.expiresAt)}</span>}{spinResult.coupon && <span>Coupon code <code>{spinResult.coupon.code}</code>{spinResult.coupon.expiresAt && ` · expires ${expiryText(spinResult.coupon.expiresAt)}`}</span>}</div>}
      </section>

      <section className="rewards-panel rewards-my-panel">
        <div className="rewards-panel-title"><span className="rewards-my-icon"><Gift size={18} /></span><div><h2>My Rewards</h2><p>Cafe redeem codes and coupon codes appear here.</p></div></div>
        {myRewards.length ? (
          <div className="rewards-list">
            {myRewards.map((reward) => (
              <article className="rewards-list-item" key={reward.redeemCode || `${reward.type}-${reward.createdAt}`}>
                <div><strong>{reward.coupon?.brand ? `${reward.coupon.brand} · ${reward.coupon.title}` : reward.reward.label}</strong><small>{reward.coupon?.terms || `${reward.cafe?.name || "RoomSlider"} · Expires ${expiryText(reward.expiresAt)}`}</small></div>
                <div className="rewards-list-code"><code>{reward.coupon?.code || reward.redeemCode}</code>{reward.coupon?.link && <a href={reward.coupon.link} target="_blank" rel="noreferrer">Open</a>}{!reward.coupon && <span className={`rewards-status status-${reward.status}`}>{reward.status}</span>}</div>
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
