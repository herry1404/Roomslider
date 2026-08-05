import { useState } from "react";
import { Search, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroRoom from "../../assets/images/hero-room.webp";

function Hero() {

  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const handleSearch = () => {

    const value = search.trim();

    if (value) {
      navigate(`/rooms?search=${value}`);
    } else {
      navigate("/rooms");
    }

  };


  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };


  return (
    <section className="hero">
      <div className="container">

        <div className="hero-wrapper">


          <div className="hero-left">

            <span className="hero-badge">
              🚀 India's Smart Room Finding Platform
            </span>


            <h1 className="hero-title">
              Find Your Perfect <span>Room</span> Without Hassle.
            </h1>


            <p className="hero-description">
              Discover verified Rooms, PGs, Hostels and Flats across Indore.
              Trusted listings, simple search and hassle-free experience.
            </p>



            <div className="hero-search">


              <div className="location-box">

                <MapPin size={18}/>

                <select>
                  <option>Indore</option>
                </select>

              </div>



              <div className="search-box">

                <Search size={18}/>

                <input
                  value={search}
                  onChange={(e)=>setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search Rooms..."
                />

              </div>



              <button
                className="search-btn"
                onClick={handleSearch}
              >

                <Search size={18}/>

                <span className="search-btn-text">
                  Search
                </span>

              </button>


            </div>


          </div>




          <div className="hero-right">

            <img
              src={heroRoom}
              alt="RoomSlider Hero"
              className="hero-image"
            />

          </div>



        </div>

      </div>
    </section>
  );
}

export default Hero;