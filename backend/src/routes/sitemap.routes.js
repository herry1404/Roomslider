const express = require("express");
const router = express.Router();

const Room = require("../models/room.model");
const Mess = require("../models/Mess");
const Owner = require("../models/Owner");
const Vehicle = require("../models/vehicle.model");
const Villa = require("../models/Villa");
const LaundryVendor = require("../models/laundryVendor.model");
const HourlyRoom = require("../models/HourlyRoom.model");
const Property = require("../models/property.model");
const SocialPlace = require("../models/SocialPlace");
const { ensureMessSlugs } = require("../utils/messSlug");
const { ensurePublicSlugs } = require("../utils/publicSlug");

const SITE_URL = "https://www.roomslider.in";

const slugify = (text = "") =>
  text
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");

const categoryPathMap = {
  Room: "rooms",
  PG: "pg",
  Hostel: "hostels",
  Flat: "flats",
};

router.get("/", async (req, res) => {
  try {
    const [rooms, messes, owners, vehicles, villas, vendors, hourlyRooms, properties, socialPlaces] = await Promise.all([
      Room.find({ status: "vacant" }, "_id title slug category property updatedAt"),
      Mess.find({ isActive: true }, "_id name slug updatedAt"),
      Owner.find({}, "_id name propertyName slug updatedAt"),
      Vehicle.find({ isVisible: true, isAvailable: true, brand: { $exists: true } }, "_id name brand slug updatedAt"),
      Villa.find({ isActive: true }, "_id name slug updatedAt"),
      LaundryVendor.find({ isActive: true }, "_id vendorName slug updatedAt"),
      HourlyRoom.find({ isActive: true, status: "approved" }, "_id title slug updatedAt"),
      Property.find({}, "_id name slug propertyType updatedAt"),
      SocialPlace.find({ isActive: true }, "_id category slug updatedAt"),
    ]);
    await ensureMessSlugs(Mess, messes);
    await Promise.all([
      ensurePublicSlugs(Room, rooms, (room) => room.title),
      ensurePublicSlugs(Owner, owners, (owner) => `${owner.name} ${owner.propertyName || ""}`),
      ensurePublicSlugs(Vehicle, vehicles, (vehicle) => `${vehicle.brand} ${vehicle.name}`),
      ensurePublicSlugs(Villa, villas, (villa) => villa.name),
      ensurePublicSlugs(LaundryVendor, vendors, (vendor) => vendor.vendorName),
      ensurePublicSlugs(HourlyRoom, hourlyRooms, (room) => room.title),
      ensurePublicSlugs(Property, properties, (property) => property.name),
    ]);

    const staticUrls = [
      { loc: "/", priority: "1.0", changefreq: "daily" },
      { loc: "/rooms", priority: "0.9", changefreq: "daily" },
      { loc: "/pg", priority: "0.9", changefreq: "daily" },
      { loc: "/hostels", priority: "0.9", changefreq: "daily" },
      { loc: "/flats", priority: "0.9", changefreq: "daily" },
      { loc: "/hourly-rooms", priority: "0.8", changefreq: "daily" },
      { loc: "/villas", priority: "0.8", changefreq: "daily" },
      { loc: "/mess", priority: "0.8", changefreq: "daily" },
      { loc: "/vehicles", priority: "0.7", changefreq: "weekly" },
      { loc: "/furniture", priority: "0.6", changefreq: "weekly" },
      { loc: "/services/cleaning", priority: "0.6", changefreq: "weekly" },
      { loc: "/services/packers", priority: "0.6", changefreq: "weekly" },
      { loc: "/services/furniture", priority: "0.6", changefreq: "weekly" },
      { loc: "/services/wifi", priority: "0.6", changefreq: "weekly" },
      { loc: "/services/appliance-repair", priority: "0.6", changefreq: "weekly" },
      { loc: "/explore", priority: "0.7", changefreq: "weekly" },
      { loc: "/social-work", priority: "0.7", changefreq: "weekly" },
      { loc: "/map", priority: "0.6", changefreq: "weekly" },
      { loc: "/about", priority: "0.5", changefreq: "monthly" },
      { loc: "/contact", priority: "0.5", changefreq: "monthly" },
      { loc: "/sitemap", priority: "0.3", changefreq: "monthly" },
      { loc: "/team", priority: "0.4", changefreq: "monthly" },
      { loc: "/terms", priority: "0.3", changefreq: "monthly" },
      { loc: "/privacy", priority: "0.3", changefreq: "monthly" },
    ];

    const roomUrls = rooms
      .filter((r) => categoryPathMap[r.category])
      .map((r) => ({
        loc: `/${categoryPathMap[r.category]}/${r.slug}`,
        priority: "0.8",
        changefreq: "weekly",
        lastmod: r.updatedAt,
      }));

    const messUrls = messes.map((m) => ({
      loc: `/mess/${m.slug}`,
      priority: "0.6",
      changefreq: "weekly",
      lastmod: m.updatedAt,
    }));

    const ownerUrls = owners.map((o) => ({
      loc: `/owners/${o.slug}`,
      priority: "0.5",
      changefreq: "monthly",
      lastmod: o.updatedAt,
    }));

    const vehicleUrls = vehicles.map((vehicle) => ({
      loc: `/vehicles/${vehicle.slug}`,
      priority: "0.6",
      changefreq: "weekly",
      lastmod: vehicle.updatedAt,
    }));

    const villaUrls = villas.map((villa) => ({
      loc: `/villas/${villa.slug}`,
      priority: "0.7",
      changefreq: "weekly",
      lastmod: villa.updatedAt,
    }));
    const laundryUrls = vendors.map((vendor) => ({
      loc: `/laundry/${vendor.slug}`,
      priority: "0.6",
      changefreq: "weekly",
      lastmod: vendor.updatedAt,
    }));
    const hourlyRoomUrls = hourlyRooms.map((room) => ({
      loc: `/hourly-rooms/${room.slug}`,
      priority: "0.7",
      changefreq: "weekly",
      lastmod: room.updatedAt,
    }));
    const propertyUrls = properties
      .filter((property) => categoryPathMap[property.propertyType])
      .map((property) => ({
        loc: `/property/${property.slug}`,
        priority: "0.8",
        changefreq: "weekly",
        lastmod: property.updatedAt,
      }));
    const socialCategories = [...new Set(socialPlaces.map((place) => place.category).filter(Boolean))];
    const socialCategoryUrls = socialCategories.map((category) => ({
      loc: `/social-work/${category}`,
      priority: "0.6",
      changefreq: "weekly",
    }));
    const socialPlaceUrls = socialPlaces.map((place) => ({
      loc: `/social-work/${place.category}/${place.slug || place._id}`,
      priority: "0.6",
      changefreq: "weekly",
      lastmod: place.updatedAt,
    }));

    const allUrls = [
      ...staticUrls,
      ...roomUrls,
      ...messUrls,
      ...ownerUrls,
      ...vehicleUrls,
      ...villaUrls,
      ...laundryUrls,
      ...hourlyRoomUrls,
      ...propertyUrls,
      ...socialCategoryUrls,
      ...socialPlaceUrls,
    ];

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
