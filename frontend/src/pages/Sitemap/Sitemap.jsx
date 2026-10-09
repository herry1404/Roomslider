import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import "../../styles/sitemap.css";

const sections = [
  {
    title: "Rooms and places to stay in Indore",
    description: "Browse rental homes, student accommodation and short stays.",
    links: [
      ["Rooms for rent in Indore", "/rooms"],
      ["PG accommodation in Indore", "/pg"],
      ["Hostels in Indore", "/hostels"],
      ["Flats and apartments for rent", "/flats"],
      ["Hourly rooms and short stays", "/hourly-rooms"],
      ["Villas for stays and events", "/villas"],
    ],
  },
  {
    title: "Food and local listings",
    description: "Explore everyday services and listings for local needs.",
    links: [
      ["Mess and tiffin services", "/mess"],
      ["Laundry services", "/laundry"],
      ["Rent a vehicle in Indore", "/vehicles"],
      ["Furniture and appliance rental", "/furniture"],
      ["Explore RoomSlider services", "/explore"],
    ],
  },
  {
    title: "Home and rental services",
    description: "Find local help for moving, home care, repairs and study.",
    links: [
      ["Cleaning and housekeeping", "/services/cleaning"],
      ["Packers and movers", "/services/packers"],
      ["Furniture services", "/services/furniture"],
      ["WiFi and RO water services", "/services/wifi"],
      ["Appliance repair", "/services/appliance-repair"],
      ["Study support, tutors and libraries", "/services/study-support"],
      ["Rent agreement and tenant verification", "/services/rent-agreement"],
    ],
  },
  {
    title: "Community and discovery",
    description: "Discover community resources, maps and ways to help.",
    links: [
      ["Social work directory in Indore", "/social-work"],
      ["Donate usable household items", "/donate"],
      ["Blood donor and blood request information", "/blood"],
      ["Explore listings on the map", "/map"],
      ["Roommate finder", "/roommates"],
    ],
  },
  {
    title: "About RoomSlider",
    description: "Learn about the platform and its policies.",
    links: [
      ["Home", "/"],
      ["About RoomSlider", "/about"],
      ["Our team", "/team"],
      ["Terms of use", "/terms"],
      ["Privacy policy", "/privacy"],
    ],
  },
];

function Sitemap() {
  return (
    <div className="site-map-page">
      <Helmet>
        <title>Site Map | Rooms, PGs, Hostels & Services in Indore | RoomSlider</title>
        <meta
          name="description"
          content="Browse the RoomSlider site map to find rooms for rent, PGs, hostels, flats, hourly stays, mess, local services and community listings in Indore."
        />
        <link rel="canonical" href="https://roomslider.in/sitemap" />
      </Helmet>

      <header className="site-map-hero">
        <p className="site-map-eyebrow">ROOMSLIDER DIRECTORY</p>
        <h1>Site Map</h1>
        <p>
          Find rooms for rent in Indore, PG accommodation, hostels, flats,
          hourly stays and useful local services. Use the links below to browse
          RoomSlider.
        </p>
      </header>

      <div className="site-map-content">
        {sections.map((section) => (
          <section className="site-map-section" key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.description}</p>
            <ul>
              {section.links.map(([label, path]) => (
                <li key={path}>
                  <Link to={path}>{label}</Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <p className="site-map-xml">
          Search engines can access the <a href="/sitemap.xml">XML sitemap</a>.
        </p>
      </div>
    </div>
  );
}

export default Sitemap;
