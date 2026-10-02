import { useState } from "react";
import { Search, ShieldCheck, Camera, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";

const popularAreas = [
  "Vijay Nagar",
  "Bhawarkuan",
  "Palasia",
  "DAVV",
  "IPS Academy",
  "Rau",
];

function Hero() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const goSearch = (value) => {
    const v = (value || "").trim();
    navigate(v ? `/rooms?search=${encodeURIComponent(v)}` : "/rooms");
  };

  return (
    <section className="hs-section">
      <div className="hs-bg" aria-hidden="true" />
      <div className="container hs-inner">
        <span className="hs-eyebrow hs-rise" style={{ "--d": "0s" }}>
          <i className="hs-dot" />
          Verified rooms, PGs &amp; hostels in Indore
        </span>

        <h1 className="hs-title hs-rise" style={{ "--d": ".08s" }}>
          Find a place that feels <span className="hs-grad">like home</span>
        </h1>

        <p className="hs-sub hs-rise" style={{ "--d": ".16s" }}>
          Real photos. Direct owner contact. Search by college or area.
        </p>

        <div className="hs-pill hs-rise" style={{ "--d": ".24s" }}>
          <div className="hs-field">
            <small>Where</small>
            <span>Indore</span>
          </div>

          <label className="hs-field hs-field-input">
            <small>College or area</small>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && goSearch(search)}
              placeholder="Search Vijay Nagar, IPS, DAVV..."
            />
          </label>

          <button
            className="hs-go"
            onClick={() => goSearch(search)}
            aria-label="Search"
          >
            <Search size={20} />
          </button>
        </div>

        <div className="hs-areas hs-rise" style={{ "--d": ".32s" }}>
          <span className="hs-areas-label">Popular:</span>
          {popularAreas.map((a) => (
            <button key={a} className="hs-chip" onClick={() => goSearch(a)}>
              {a}
            </button>
          ))}
        </div>

        <ul className="hs-trust hs-rise" style={{ "--d": ".4s" }}>
          <li><ShieldCheck size={15} /> Verified owners</li>
          <li><Camera size={15} /> Real photos</li>
          <li><Phone size={15} /> Direct contact</li>
        </ul>
      </div>
    </section>
  );
}

export default Hero;