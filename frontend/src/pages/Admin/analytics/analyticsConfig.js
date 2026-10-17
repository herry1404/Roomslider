export const ANALYTICS_METRICS = {
  pageViews: {
    name: "Page views",
    color: "#38bdf8",
    description: "Site par kul kitne pages khole gaye.",
    unit: "pages",
  },
  visitors: {
    name: "Visitors (sessions)",
    color: "#34d399",
    description: "Har din ke alag anonymous browser sessions; wahi session alag din phir gin sakta hai.",
    unit: "sessions",
  },
  todayVisitors: {
    name: "Aaj aaye visitors (andaza)",
    color: "#34d399",
    description: "Anonymous browser/session IDs se andaaza; zaroori nahi har ID alag insaan ho.",
    unit: "log",
  },
  activeVisitors: {
    name: "Aaj abhi active",
    color: "#f59e0b",
    description: "Pichhle 30 minute mein site dekhne wale alag log.",
    unit: "log",
  },
  totalTime: {
    name: "Aaj ka total waqt",
    color: "#f59e0b",
    description: "Aaj logon ne milkar jitna waqt bitaya. Nayi tracking ab se; page chhodne par record hota hai.",
    unit: "min",
  },
  averageTime: {
    name: "Har visitor ka waqt",
    color: "#a78bfa",
    description: "Aaj har visitor ne ausatan jitna waqt bitaya. Nayi tracking ab se; page chhodne par record hota hai.",
    unit: "min",
  },
  trackedVisits: {
    name: "Saved page visits",
    color: "#2dd4bf",
    description: "Analytics record mein ab tak save hue kul page visits.",
    unit: "visits",
  },
  signups: {
    name: "Naye accounts",
    color: "#a78bfa",
    description: "Har din kitne naye logon ne account banaya.",
    unit: "accounts",
  },
  searches: {
    name: "Searches",
    color: "#f59e0b",
    description: "Har din site par kitni baar search hui.",
    unit: "searches",
  },
  menuViews: {
    name: "Menu views",
    color: "#2dd4bf",
    description: "Cafe ke online menu kitni baar khole gaye.",
    unit: "menus",
  },
  menuVisitors: {
    name: "Menu visitors (sessions)",
    color: "#fb7185",
    description: "Har din cafe menu dekhne wale alag anonymous browser sessions.",
    unit: "sessions",
  },
  cafeUniqueVisitors: {
    name: "Menu ke alag sessions",
    color: "#fb7185",
    description: "Chune hue samay mein cafe menu dekhne wale alag anonymous browser sessions.",
    unit: "sessions",
  },
  listingViews: {
    name: "Listing views",
    color: "#60a5fa",
    description: "Logon ne listings kitni baar dekhi.",
    unit: "views",
  },
  adImpressions: {
    name: "Ad impressions",
    color: "#c084fc",
    description: "Cafe menu par ads kitni baar dikhaye gaye.",
    unit: "baar",
  },
  adClicks: {
    name: "Ad clicks",
    color: "#f97316",
    description: "Cafe menu par ads kitni baar click hue.",
    unit: "clicks",
  },
  adClickRate: {
    name: "Ad click rate",
    color: "#f97316",
    description: "Ad dekhne walon mein se kitne logon ne click kiya.",
    unit: "%",
  },
};

export const DATE_RANGES = [
  { key: "today", label: "Aaj", days: 1 },
  { key: "7", label: "7 din", days: 7 },
  { key: "30", label: "30 din", days: 30 },
  { key: "90", label: "90 din", days: 90 },
  { key: "all", label: "Shuru se", days: null },
];

export const ANALYTICS_TABS = [
  { key: "overview", label: "Overview" },
  { key: "site", label: "Site Traffic" },
  { key: "ads", label: "Ads Traffic" },
  { key: "sources", label: "Traffic Sources" },
  { key: "listings", label: "Listings & Engagement" },
];

export const formatCount = (value) => (Number(value) || 0).toLocaleString("en-IN");

export const formatAxisValue = (value) => {
  const number = Number(value) || 0;
  if (number >= 100000) return `${(number / 100000).toFixed(1).replace(/\.0$/, "")}L`;
  if (number >= 1000) return `${(number / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(number);
};

export const formatAnalyticsDate = (date) => {
  if (!date) return "";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};
