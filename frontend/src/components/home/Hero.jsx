import { useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Hero() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const handleSearch = () => {
    const value = search.trim();
    navigate(value ? `/rooms?search=${encodeURIComponent(value)}` : "/rooms");
  };

  return (
    <section className="hs-section">
      <div className="container">
        <div className="hs-pill">
          <div className="hs-field">
            <small>Where</small>
            <span>Indore</span>
          </div>

          <label className="hs-field hs-field-input">
            <small>College or area</small>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search Vijay Nagar, IPS, DAVV..."
            />
          </label>

          <button className="hs-go" onClick={handleSearch} aria-label="Search">
            <Search size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}

export default Hero;
