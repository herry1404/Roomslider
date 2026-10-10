import { Helmet } from "react-helmet-async";
import { optimizeCloudinaryImage } from "../utils/optimizeCloudinaryImage";

export const SITE_URL = "https://www.roomslider.in";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export const PAGE_SEO = {
  home: {
    title: "PG, Hostel & Flats for Rent in Indore | RoomSlider",
    description: "Find verified PGs, hostels, flats and rooms in Indore near colleges. Compare rent, photos and locations, and contact owners directly on RoomSlider.",
    path: "/",
  },
  pg: {
    title: "Affordable PG in Indore for Boys & Girls | RoomSlider",
    description: "Browse affordable PG accommodation in Indore with food, WiFi and AC options. Compare boys' and girls' stays near Vijay Nagar and Bhawarkua, then filter by budget and college.",
    path: "/pg",
  },
  hostels: {
    title: "Student Hostels in Indore for Girls & Boys | RoomSlider",
    description: "Explore girls' and boys' hostels in Indore near Vijay Nagar, Bhawarkua and Vishnupuri. Compare rent, facilities and photos near colleges before visiting.",
    path: "/hostels",
  },
  flats: {
    title: "1BHK, 2BHK & Furnished Flats in Indore | RoomSlider",
    description: "Rent 1BHK, 2BHK and furnished flats in Indore. Compare photos and clear prices, explore popular areas, and contact owners on RoomSlider. Find a flat today.",
    path: "/flats",
  },
  rooms: {
    title: "Rooms for Rent in Indore Near Colleges | RoomSlider",
    description: "Find single and shared rooms for rent in Indore at student-friendly prices. Compare photos, monthly rent and locations near Vijay Nagar, Bhawarkua and local colleges.",
    path: "/rooms",
  },
  explore: {
    title: "Explore Rentals and Local Services in Indore | RoomSlider",
    description: "Explore rentals, local services and useful resources across Indore. Discover rooms, PGs, hostels, flats and short stays, then compare options near your preferred area.",
    path: "/explore",
  },
  about: {
    title: "About RoomSlider: Finding Rentals in Indore | Our Story",
    description: "Learn how RoomSlider helps people find verified rooms, PGs, hostels and flats in Indore with clear listing details, photos and direct owner contact. Learn more.",
    path: "/about",
  },
  contact: {
    title: "Contact RoomSlider: Rental and Listing Help in Indore",
    description: "Contact RoomSlider in Indore for rental help, listing support, or questions about rooms, PGs, hostels, flats and marketplace services. Contact our team today.",
    path: "/contact",
  },
  sitemap: {
    title: "Sitemap for RoomSlider Rentals and Services in Indore",
    description: "Browse the RoomSlider sitemap to find rooms, PGs, hostels, flats, short stays, local services and helpful information for renters and property owners in Indore.",
    path: "/sitemap",
  },
  terms: {
    title: "RoomSlider Rental Marketplace Terms of Use in Indore",
    description: "Read RoomSlider terms for browsing rental listings, contacting owners and using marketplace services for rooms, PGs, hostels and flats in Indore today.",
    path: "/terms",
  },
  privacy: {
    title: "RoomSlider Privacy Policy for Rental Searches in Indore",
    description: "RoomSlider uses your account and listing details for rental searches. Learn how information is handled when finding rooms, PGs, hostels and flats in Indore.",
    path: "/privacy",
  },
  shortStays: {
    title: "Book Short Stays in Indore by the Hour | RoomSlider",
    description: "Find hourly rooms and short stays in Indore for a few hours or an overnight visit. Compare facilities, photos and prices, then choose a convenient local stay.",
    path: "/hourly-rooms",
  },
  roommates: {
    title: "Find Roommates in Indore | Match with Flatmates | RoomSlider",
    description: "Find roommates in Indore by comparing area, budget and sharing preferences. Create a profile to discover flatmates while keeping contact details private on RoomSlider.",
    path: "/roommates",
  },
};

export function canonicalUrl(path = "/") {
  const pathOnly = String(path).split(/[?#]/, 1)[0] || "/";
  const normalized = `/${pathOnly}`.replace(/\/+/g, "/").replace(/\/+$/, "") || "/";
  return `${SITE_URL}${normalized === "/" ? "/" : normalized}`;
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function breadcrumbSchema(items = []) {
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  };
}

export default function SEO({
  title,
  description,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  type = "website",
  noindex = false,
  breadcrumbs,
  structuredData,
}) {
  const canonical = canonicalUrl(path);
  const schemas = [
    ...(structuredData ? (Array.isArray(structuredData) ? structuredData : [structuredData]) : []),
    ...(breadcrumbs?.length ? [breadcrumbSchema(breadcrumbs)] : []),
  ];
  const socialImage = image?.includes("/image/upload/")
    ? optimizeCloudinaryImage(image, 1200, 630, true)
    : image || DEFAULT_OG_IMAGE;

  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={socialImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="RoomSlider" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={socialImage} />
      {schemas.map((schema, index) => (
        <script key={`${schema["@type"]}-${index}`} type="application/ld+json">
          {safeJson(schema)}
        </script>
      ))}
    </Helmet>
  );
}
