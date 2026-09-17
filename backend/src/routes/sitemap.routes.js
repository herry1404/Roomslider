const express = require("express");
const router = express.Router();

const Room = require("../models/room.model");
const Mess = require("../models/Mess");
const Owner = require("../models/Owner");

const SITE_URL = "https://www.roomslider.in";

const categoryPathMap = {
  Room: "rooms",
  PG: "pg",
  Hostel: "hostels",
  Flat: "flats",
};

router.get("/", async (req, res) => {
  try {
    const [rooms, messes, owners] = await Promise.all([
      Room.find({}, "_id category updatedAt"),
      Mess.find({}, "_id updatedAt"),
      Owner.find({}, "_id updatedAt"),
    ]);

    const staticUrls = [
      { loc: "/", priority: "1.0", changefreq: "daily" },
      { loc: "/rooms", priority: "0.9", changefreq: "daily" },
      { loc: "/pg", priority: "0.9", changefreq: "daily" },
      { loc: "/hostels", priority: "0.9", changefreq: "daily" },
      { loc: "/flats", priority: "0.9", changefreq: "daily" },
      { loc: "/hourly-rooms", priority: "0.8", changefreq: "daily" },
      { loc: "/mess", priority: "0.8", changefreq: "daily" },
      { loc: "/explore", priority: "0.7", changefreq: "weekly" },
      { loc: "/map", priority: "0.6", changefreq: "weekly" },
      { loc: "/about", priority: "0.5", changefreq: "monthly" },
      { loc: "/terms", priority: "0.3", changefreq: "monthly" },
      { loc: "/privacy", priority: "0.3", changefreq: "monthly" },
    ];

    const roomUrls = rooms
      .filter((r) => categoryPathMap[r.category])
      .map((r) => ({
        loc: `/${categoryPathMap[r.category]}/${r._id}`,
        priority: "0.8",
        changefreq: "weekly",
        lastmod: r.updatedAt,
      }));

    const messUrls = messes.map((m) => ({
      loc: `/mess/${m._id}`,
      priority: "0.6",
      changefreq: "weekly",
      lastmod: m.updatedAt,
    }));

    const ownerUrls = owners.map((o) => ({
      loc: `/owners/${o._id}`,
      priority: "0.5",
      changefreq: "monthly",
      lastmod: o.updatedAt,
    }));

    const allUrls = [...staticUrls, ...roomUrls, ...messUrls, ...ownerUrls];

    const xmlEntries = allUrls
      .map((u) => {
        const lastmodTag = u.lastmod
          ? `\n    <lastmod>${new Date(u.lastmod).toISOString().split("T")[0]}</lastmod>`
          : "";
        return `  <url>
    <loc>${SITE_URL}${u.loc}</loc>${lastmodTag}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (err) {
    console.error("Sitemap generation error:", err);
    res.status(500).send("Error generating sitemap");
  }
});

module.exports = router;
