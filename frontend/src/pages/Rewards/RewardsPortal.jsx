import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import "../../styles/rewards.css";
import "../../styles/admin/theme.css";

const blankReward = () => ({ label: "", valueRs: 0, weight: 1, minStreak: 0 });

function RewardsPortal() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [budget, setBudget] = useState("100");
  const [rewards, setRewards] = useState([]);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemResult, setRedeemResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadDashboard = useCallback(async () => {
    const response = await api.get(`/rewards/${encodeURIComponent(slug)}/portal`);
    setDashboard(response.data);
    setBudget(String(response.data.dailyBudgetRs));
    setRewards(response.data.rewards.map(({ label, valueRs, weight, minStreak }) => ({
      label, valueRs, weight, minStreak,
    })));
  }, [slug]);

  useEffect(() => {
    let active = true;
    api.get(`/rewards/${encodeURIComponent(slug)}/portal`)
      .then((response) => {
        if (!active) return;
        setDashboard(response.data);
        setBudget(String(response.data.dailyBudgetRs));
        setRewards(response.data.rewards.map(({ label, valueRs, weight, minStreak }) => ({
          label, valueRs, weight, minStreak,
        })));
      })
      .catch((error) => toast.error(error.response?.data?.message || "Cafe rewards access denied."))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  async function submit(operation, successMessage) {
    if (busy) return;
    try {
      setBusy(true);
      await operation();
      await loadDashboard();
      toast.success(successMessage);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save cafe reward settings.");
    } finally {
      setBusy(false);
    }
  }

  const changeReward = (index, key, value) => {
    setRewards((current) => current.map((reward, itemIndex) => itemIndex === index
      ? { ...reward, [key]: value }
      : reward));
  };

  if (loading) return <main className="admin-page"><p>Loading cafe rewards…</p></main>;
  if (!dashboard) {
    return <main className="admin-page"><h1>Rewards portal unavailable</h1><p>Sign in with the cafe owner or admin account that manages this demo cafe.</p></main>;
  }

  return (
    <main className="admin-page rewards-portal">
      <Helmet><title>Cafe Rewards Portal | RoomSlider</title><meta name="robots" content="noindex, nofollow" /></Helmet>
      <header className="admin-analytics-section-heading">
        <div><span className="admin-analytics-eyebrow">CAFE REWARDS</span><h1>{dashboard.cafe.name} portal</h1><p>Today · {dashboard.date} · Signed in as {user?.name || "staff"}</p></div>
      </header>
      <section className="rewards-portal-stats">
        <article className="admin-analytics-card"><span>Daily code</span><strong className="rewards-portal-code">{dashboard.code}</strong><button className="rewards-admin-button" disabled={busy} onClick={() => submit(
          () => api.post(`/rewards/${encodeURIComponent(slug)}/portal/code/regenerate`),
          "Today's code regenerated.",
        )}>Regenerate code</button></article>
        <article className="admin-analytics-card"><span>Daily budget</span><strong>₹{dashboard.dailyBudgetRs}</strong><small>Spent ₹{dashboard.spentTodayRs} · Remaining ₹{dashboard.remainingRs}</small></article>
        <article className="admin-analytics-card"><span>Today’s check-ins</span><strong>{dashboard.todayCheckins}</strong><small>Daily unique customers</small></article>
      </section>

      <section className="admin-analytics-section">
        <div className="admin-analytics-section-heading"><div><h2>Budget controls</h2><p>Budgets reset each day in Asia/Kolkata.</p></div></div>
        <form className="admin-analytics-card rewards-portal-form" onSubmit={(event) => {
          event.preventDefault();
          submit(
            () => api.put(`/rewards/${encodeURIComponent(slug)}/portal/budget`, { dailyBudgetRs: Number(budget) }),
            "Daily budget updated.",
          );
        }}>
          <label htmlFor="daily-rewards-budget">Daily budget (₹)</label>
          <input id="daily-rewards-budget" type="number" min="0" step="1" value={budget} onChange={(event) => setBudget(event.target.value)} />
          <button className="rewards-admin-button" disabled={busy}>Save budget</button>
        </form>
      </section>

      <section className="admin-analytics-section">
        <div className="admin-analytics-section-heading">
          <div><h2>Rewards</h2><p>Configure 5–7 rewards. Better luck next time is always included automatically.</p></div>
          <div className="rewards-reward-actions">
            <button className="rewards-admin-button rewards-admin-button--quiet" type="button" disabled={rewards.length >= 7} onClick={() => setRewards((current) => [...current, blankReward()])}>Add reward</button>
            <button className="rewards-admin-button" type="button" disabled={busy || rewards.length < 5 || rewards.length > 7} onClick={() => submit(
              () => api.put(`/rewards/${encodeURIComponent(slug)}/portal/rewards`, { rewards }),
              "Rewards updated.",
            )}>Save rewards</button>
          </div>
        </div>
        <div className="rewards-config-list">
          {rewards.map((reward, index) => (
            <article className="admin-analytics-card rewards-config-card" key={index}>
              <label>Reward label<input maxLength="100" value={reward.label} onChange={(event) => changeReward(index, "label", event.target.value)} /></label>
              <label>Value (₹)<input type="number" min="0" step="1" value={reward.valueRs} onChange={(event) => changeReward(index, "valueRs", Number(event.target.value))} /></label>
              <label>Weight<input type="number" min="1" step="1" value={reward.weight} onChange={(event) => changeReward(index, "weight", Number(event.target.value))} /></label>
              <label>Minimum streak<input type="number" min="0" step="1" value={reward.minStreak} onChange={(event) => changeReward(index, "minStreak", Number(event.target.value))} /></label>
              <button className="rewards-remove-button" type="button" disabled={rewards.length <= 5} onClick={() => setRewards((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-analytics-section">
        <div className="admin-analytics-section-heading"><div><h2>Redeem a reward</h2><p>Enter the customer’s one-time code. Only the customer’s name and reward are shown.</p></div></div>
        <form className="admin-analytics-card rewards-portal-form" onSubmit={(event) => {
          event.preventDefault();
          submit(async () => {
            const response = await api.post(`/rewards/${encodeURIComponent(slug)}/portal/redeem`, { code: redeemCode.trim().toUpperCase() });
            setRedeemResult(response.data);
            setRedeemCode("");
          }, "Reward redeemed.");
        }}>
          <label htmlFor="redeem-code">Redeem code</label>
          <input id="redeem-code" value={redeemCode} onChange={(event) => setRedeemCode(event.target.value.toUpperCase())} placeholder="WIN-4K7" />
          <button className="rewards-admin-button" disabled={busy || !redeemCode.trim()}>Redeem</button>
          {redeemResult && <p className="rewards-redeem-result"><strong>{redeemResult.userName}</strong> redeemed {redeemResult.reward.label}.</p>}
        </form>
      </section>

      <section className="admin-analytics-section">
        <div className="admin-analytics-section-heading"><div><h2>Regulars</h2><p>Names and visit history only—no phone numbers or email addresses.</p></div></div>
        <div className="admin-analytics-card admin-analytics-table-wrap">
          <table className="admin-analytics-table">
            <thead><tr><th>Name</th><th>Streak</th><th>Last visit</th></tr></thead>
            <tbody>{dashboard.regulars.map((regular, index) => <tr key={`${regular.name}-${regular.lastVisit}-${index}`}><td>{regular.name || "Customer"}</td><td>{regular.streak} days</td><td>{regular.lastVisit}</td></tr>)}
              {!dashboard.regulars.length && <tr><td colSpan="3">No check-ins yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default RewardsPortal;
