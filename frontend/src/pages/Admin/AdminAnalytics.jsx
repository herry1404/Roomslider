import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import "../../styles/admin/theme.css";
import "./analytics/analytics.css";
import {
  AnalyticsEmptyState,
  AnalyticsList,
  AnalyticsSkeleton,
  MetricCard,
  TrendChart,
} from "./analytics/AnalyticsComponents";
import {
  ANALYTICS_TABS,
  DATE_RANGES,
  formatCount,
} from "./analytics/analyticsConfig";

const todayKey = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

const yesterdayKey = () => {
  const date = new Date(`${todayKey()}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
};

const sumValues = (rows, key) => (rows || []).reduce((sum, row) => sum + (Number(row[key]) || 0), 0);

const formatMinutes = (seconds) => {
  const minutes = Math.floor((Number(seconds) || 0) / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`;
};

const aggregateCafeViews = (rows) => Object.values((rows || []).reduce((result, row) => {
  const name = row.cafe || "Unknown";
  result[name] = result[name] || { cafe: name, views: 0 };
  result[name].views += Number(row.views) || 0;
  return result;
}, {})).sort((left, right) => right.views - left.views).slice(0, 8);

const periodText = (range) => range === "today" ? "Aaj" : `Pichhle ${range} din`;

function comparePercent(current, previous) {
  if (!previous || previous <= 0 || !current) return null;
  return ((current - previous) / previous) * 100;
}

function Glossary() {
  const terms = [
    ["Visitors", "Alag log jo site ya menu dekhne aaye. Ek hi log alag din phir gine ja sakte hain."],
    ["Page views", "Site par khole gaye kul pages."],
    ["Sessions", "Ek baar site khol kar dekhne ka daura."],
    ["Referrer", "Woh website ya app jahan se koi yahan aaya."],
    ["Organic", "Search ya seedha visit se aaya hua traffic; paid ad se nahi."],
    ["Ads/UTM", "Ad link ke tags, jinse pata chalta hai log kis campaign se aaye."],
    ["Conversion", "Jab visitor koi kaam poora kare, jaise signup ya ad click."],
  ];

  return (
    <details className="analytics-glossary">
      <summary>Ye words kya hain?</summary>
      <dl>
        {terms.map(([term, definition]) => (
          <div key={term}><dt>{term}</dt><dd>{definition}</dd></div>
        ))}
      </dl>
    </details>
  );
}

function AdminAnalytics() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = ANALYTICS_TABS.some(({ key }) => key === searchParams.get("tab"))
    ? searchParams.get("tab")
    : "overview";
  const [range, setRange] = useState("7");
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [traffic, setTraffic] = useState(null);
  const [history, setHistory] = useState(null);
  const [cafe, setCafe] = useState(null);

  const chooseTab = (key) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", key);
    setSearchParams(next);
  };

  useEffect(() => {
    if (location.hash === "#cafe-ads") {
      navigate(`${location.pathname}?tab=listings`, { replace: true });
    } else if (!searchParams.has("tab")) {
      navigate(`${location.pathname}?tab=overview`, { replace: true });
    }
  }, [location.hash, location.pathname, navigate, searchParams]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    const apiDays = range === "today" ? 7 : Number(range);
    const results = await Promise.allSettled([
      api.get("/admin/analytics"),
      api.get("/admin/traffic", { params: { days: apiDays } }),
      api.get("/admin/traffic", { params: { days: 90 } }),
      api.get("/ads/admin/analytics", { params: { days: apiDays } }),
    ]);
    const labels = ["Listings and engagement", "Site traffic", "Traffic history", "Cafe menu and ad"];
    const rejected = results
      .map((result, index) => result.status === "rejected" ? `${labels[index]}: ${result.reason.response?.data?.message || "load nahi ho paya."}` : "")
      .filter(Boolean);
    const [analyticsResult, trafficResult, historyResult, cafeResult] = results;
    setAnalytics(analyticsResult.status === "fulfilled" ? analyticsResult.value.data.analytics : null);
    setTraffic(trafficResult.status === "fulfilled" ? trafficResult.value.data.traffic : null);
    setHistory(historyResult.status === "fulfilled" ? historyResult.value.data.traffic : null);
    setCafe(cafeResult.status === "fulfilled" ? cafeResult.value.data.analytics : null);
    setError(rejected.join(" "));
    setLoading(false);
  }, [range]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics, retry]);

  const siteDays = useMemo(() => {
    const rows = history?.daily || [];
    return range === "today" ? rows.filter((row) => row.date === todayKey()) : rows.slice(-Number(range));
  }, [history, range]);
  const previousSiteDays = useMemo(() => {
    if (range === "today") return (history?.daily || []).filter((row) => row.date === yesterdayKey());
    const days = Number(range);
    return (history?.daily || []).slice(-2 * days, -days);
  }, [history, range]);
  const pageViews = sumValues(siteDays, "pageViews");
  const visitors = sumValues(siteDays, "uniqueVisitors");
  const pageViewsChange = comparePercent(pageViews, sumValues(previousSiteDays, "pageViews"));
  const visitorChange = comparePercent(visitors, sumValues(previousSiteDays, "uniqueVisitors"));
  const activityRows = useMemo(() => {
    const rows = analytics?.dailyActivity || [];
    if (range === "today") return rows.filter((row) => row.date === todayKey());
    return rows.slice(-Math.min(Number(range), 30));
  }, [analytics, range]);
  const cafeRows = useMemo(() => {
    const rows = cafe?.dailyViews || [];
    if (range === "today") return rows.filter((row) => row.date === todayKey());
    return rows;
  }, [cafe, range]);

  const summaryText = pageViews > 0
    ? `${periodText(range)} mein ${formatCount(pageViews)} pages khole gaye.${pageViewsChange !== null ? ` ${range === "today" ? "Kal" : "Pichhle period"} se ${Math.abs(pageViewsChange).toLocaleString("en-IN", { maximumFractionDigits: 1 })}% ${pageViewsChange >= 0 ? "zyada" : "kam"}.` : ""}`
    : "Abhi koi data nahi. Jaise hi log site dekhenge yahan dikhega.";

  return (
    <main className="admin-page admin-analytics analytics-hub">
      <header className="admin-page-header analytics-hub-header">
        <div>
          <span className="admin-analytics-eyebrow"><BarChart3 size={16} /> ROOMSLIDER KI REPORT</span>
          <h1>Analytics</h1>
          <p>Yahan site, cafe menus aur listings par log kya kar rahe hain, seedhe shabdon mein dekho.</p>
        </div>
      </header>

      <section className="analytics-date-filter" aria-label="Date range">
        <h2>Kitne din ka data?</h2>
        <div className="analytics-date-options">
          {DATE_RANGES.map((item) => (
            <button
              type="button"
              key={item.key}
              className={range === item.key ? "selected" : ""}
              aria-pressed={range === item.key}
              onClick={() => setRange(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <nav className="analytics-tabs" aria-label="Analytics categories">
        {ANALYTICS_TABS.map((tab) => (
          <button
            type="button"
            key={tab.key}
            className={activeTab === tab.key ? "active" : ""}
            aria-current={activeTab === tab.key ? "page" : undefined}
            onClick={() => chooseTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "overview" && (
        <section className="analytics-tab-content">
          <p className="analytics-summary" aria-live="polite">{summaryText}</p>
          {loading ? <AnalyticsSkeleton /> : (
            <>
              {error && (
                <div className="analytics-error" role="alert">
                  <p>{error}</p>
                  <button type="button" className="admin-btn secondary" onClick={() => setRetry((value) => value + 1)}>Dobara koshish karein</button>
                </div>
              )}
              {history && (
                <>
                  <div className="admin-stats-grid analytics-stats-grid">
                    <MetricCard metric="pageViews" value={pageViews} comparison={pageViewsChange} periodLabel={range === "today" ? "Kal" : "Pichhle period"} />
                    <MetricCard metric="visitors" value={visitors} comparison={visitorChange} periodLabel={range === "today" ? "Kal" : "Pichhle period"} />
                    {traffic && (
                      <>
                        <MetricCard metric="todayVisitors" value={traffic.summary.uniqueVisitors} />
                        <MetricCard metric="activeVisitors" value={traffic.summary.activeVisitors} />
                        <MetricCard
                          metric="totalTime"
                          value={(Number(traffic.summary.durationSeconds) || 0) / 60}
                          displayValue={formatMinutes(traffic.summary.durationSeconds)}
                        />
                        <MetricCard
                          metric="averageTime"
                          value={traffic.summary.uniqueVisitors ? (Number(traffic.summary.durationSeconds) || 0) / traffic.summary.uniqueVisitors / 60 : 0}
                          displayValue={formatMinutes(traffic.summary.uniqueVisitors ? (Number(traffic.summary.durationSeconds) || 0) / traffic.summary.uniqueVisitors : 0)}
                        />
                      </>
                    )}
                    {history?.tracked && (
                      <MetricCard metric="trackedVisits" value={history.tracked.pageViews} />
                    )}
                    {analytics && (
                      <MetricCard metric="listingViews" value={analytics.todayViews} />
                    )}
                  </div>
                  <TrendChart
                    title="Site par logon ki aamad"
                    description="Page views = kitne pages khule. Visitors = har din aaye alag log; ek hi log dobara aa sakta hai."
                    data={siteDays}
                    lines={[
                      { key: "pageViews", metric: "pageViews" },
                      { key: "uniqueVisitors", metric: "visitors" },
                    ]}
                    emptyMessage="Jaise hi koi site dekhega, yahan roz ka graph dikhega."
                  />
                  <div className="admin-analytics-grid analytics-lists-grid">
                    {traffic && (
                      <>
                        <AnalyticsList
                          title="Log kahan se aaye?"
                          description="Sabse zyada pages dekhne wale sources."
                          rows={range === "today" ? [] : traffic.sources}
                          labelKey="source"
                          valueKey="pageViews"
                          emptyMessage={range === "today" ? "Aaj ke source ka data abhi available nahi." : undefined}
                        />
                        <AnalyticsList
                          title="Kaun se device par?"
                          description="Phone ya computer se khole gaye pages."
                          rows={range === "today" ? [] : traffic.platforms}
                          labelKey="platform"
                          valueKey="pageViews"
                          emptyMessage={range === "today" ? "Aaj ke device ka data abhi available nahi." : undefined}
                        />
                        <AnalyticsList
                          title="Sabse zyada dekhe gaye pages"
                          description="Site ke popular pages aur unke views."
                          rows={range === "today" ? [] : traffic.topPages}
                          labelKey="path"
                          valueKey="pageViews"
                          emptyMessage={range === "today" ? "Aaj ke page breakdown ka data abhi available nahi." : undefined}
                        />
                      </>
                    )}
                    {traffic && <article className="admin-analytics-card analytics-list-card">
                      <header className="analytics-chart-heading">
                        <div><h2>Abhi-abhi site par aaye</h2><p>Recent page visits; koi personal jaankari nahi.</p></div>
                      </header>
                      {range !== "today" && traffic.recent?.length ? (
                        <div className="analytics-list">
                          {traffic.recent.slice(0, 8).map((visit, index) => (
                            <div className="analytics-list-row analytics-recent-row" key={`${visit.createdAt}-${visit.path}-${index}`}>
                              <span>{visit.path === "/" ? "Home page" : visit.path}<small>{visit.source} · {visit.platform}</small></span>
                              <time dateTime={visit.createdAt}>{new Date(visit.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</time>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="admin-empty analytics-empty"><h3>Abhi koi data nahi</h3><p>{range === "today" ? "Aaj ki recent visits yahan dikhengi." : "Jaise hi log site dekhenge yahan dikhega."}</p></div>
                      )}
                    </article>}
                  </div>
                </>
              )}
            </>
          )}
        </section>
      )}

      {activeTab === "site" && <AnalyticsEmptyState />}
      {activeTab === "ads" && <AnalyticsEmptyState />}
      {activeTab === "sources" && <AnalyticsEmptyState />}

      {activeTab === "listings" && (
        <section className="analytics-tab-content">
          <p className="analytics-summary">Listings aur cafe menus par logon ki dilchaspi yahan dikhti hai.</p>
          {loading ? <AnalyticsSkeleton /> : (
            <>
              {error && (
                <div className="analytics-error" role="alert">
                  <p>{error}</p>
                  <button type="button" className="admin-btn secondary" onClick={() => setRetry((value) => value + 1)}>Dobara koshish karein</button>
                </div>
              )}
              <div className="admin-stats-grid analytics-stats-grid">
                <MetricCard metric="signups" value={sumValues(activityRows, "signups")} />
                <MetricCard metric="searches" value={sumValues(activityRows, "searches")} />
                {range === "today" && analytics && <MetricCard metric="listingViews" value={analytics.todayViews} />}
                {cafe && range !== "today" && (
                  <>
                    <MetricCard metric="menuViews" value={cafe.summary.menuViews} />
                    <MetricCard metric="cafeUniqueVisitors" value={cafe.summary.uniqueVisitors} />
                    <MetricCard metric="adImpressions" value={cafe.summary.adImpressions} />
                    <MetricCard metric="adClicks" value={cafe.summary.adClicks} />
                    <MetricCard metric="adClickRate" value={cafe.summary.clickRate} suffix="%" />
                  </>
                )}
                {cafe && range === "today" && (
                  <>
                    <MetricCard metric="menuViews" value={sumValues(cafeRows, "views")} />
                    <MetricCard metric="menuVisitors" value={sumValues(cafeRows, "uniqueVisitors")} />
                    <MetricCard metric="adImpressions" value={0} />
                    <MetricCard metric="adClicks" value={0} />
                  </>
                )}
              </div>
              {analytics && (
                <TrendChart
                  title="Naye accounts aur searches"
                  description="Naye accounts = roz kitne logon ne signup kiya. Searches = site par roz kitni baar dhoonda."
                  data={activityRows}
                  lines={[
                    { key: "signups", metric: "signups" },
                    { key: "searches", metric: "searches" },
                  ]}
                  note={Number(range) > 30 ? "Is chart ke liye abhi sirf aakhri 30 din ka data milta hai." : undefined}
                  emptyMessage="Signup aur search hote hi yahan unka roz ka graph dikhega."
                />
              )}
              {cafe && (
                <>
                  <TrendChart
                    title="Cafe menu kitni baar khule"
                    description="Menu views = cafe ke online menu kitni baar khole gaye. Visitors = har din dekhne wale alag log."
                    data={cafeRows}
                    lines={[
                      { key: "views", metric: "menuViews" },
                      { key: "uniqueVisitors", metric: "menuVisitors" },
                    ]}
                    emptyMessage="Jaise hi koi cafe ka menu dekhega, yahan graph dikhega."
                  />
                  {range === "today" && (
                    <p className="analytics-chart-note">Aaj ke ad impressions aur clicks ka daily data API mein nahi milta, isliye unka aaj ka number nahi dikhaya ja raha.</p>
                  )}
                  <div className="admin-analytics-grid analytics-lists-grid">
                    <AnalyticsList title="Cafe ke hisaab se" description="Kaun se cafe menu zyada khule." rows={range === "today" ? [] : aggregateCafeViews(cafe.byCafe)} labelKey="cafe" valueKey="views" />
                    <AnalyticsList title="Jagah ke hisaab se" description="Kaun si location ke menu zyada khule." rows={range === "today" ? [] : cafe.byLocation} labelKey="location" valueKey="views" />
                    <AnalyticsList title="Menu par log kahan se aaye?" description="Cafe menu tak pahunchne ke sources." rows={range === "today" ? [] : cafe.bySource} labelKey="source" valueKey="views" />
                    <AnalyticsList title="Cafe menu kis device par?" description="Phone ya computer se khole gaye menu." rows={range === "today" ? [] : cafe.byPlatform} labelKey="platform" valueKey="views" />
                  </div>
                  <AnalyticsList
                    title="Cafe menu par dikhaye gaye ads"
                    description="Impressions = ad kitni baar dikha. Clicks = ad kitni baar dabaya."
                    rows={range === "today" ? [] : (cafe.adPerformance || []).map((item) => ({
                      ad: `${item.text} · ${item.cafe} · ${item.location}`,
                      result: `${formatCount(item.impressions)} dikhaye · ${formatCount(item.clicks)} clicks · ${item.clickRate || 0}%`,
                    }))}
                    labelKey="ad"
                    valueKey="result"
                    emptyMessage={range === "today" ? "Aaj ke ad ka hisaab is API mein nahi aata." : "Jab cafe ads dekhe ya click honge, unka hisaab yahan aayega."}
                  />
                </>
              )}
              {analytics && (
                <div className="admin-analytics-grid analytics-lists-grid">
                  <AnalyticsList title="Listings kis category mein hain?" description="Har category mein kitni listings hain." rows={analytics.listingsByCategory} labelKey="category" valueKey="count" />
                  <AnalyticsList title="Listings kis area mein hain?" description="Zyada listings wale areas." rows={analytics.topAreas} labelKey="area" valueKey="count" />
                  <article className="admin-analytics-card analytics-list-card">
                    <header className="analytics-chart-heading"><div><h2>Baaki site activity</h2><p>Campaign aur aaj ke listing views.</p></div></header>
                    <div className="analytics-list">
                      <div className="analytics-list-row"><span>Aaj ke listing views</span><strong>{formatCount(analytics.todayViews)}</strong></div>
                      <div className="analytics-list-row"><span>Bheje gaye push campaigns</span><strong>{formatCount(analytics.pushSentCount)}</strong></div>
                    </div>
                  </article>
                </div>
              )}
            </>
          )}
        </section>
      )}

      <Glossary />
    </main>
  );
}

export default AdminAnalytics;
