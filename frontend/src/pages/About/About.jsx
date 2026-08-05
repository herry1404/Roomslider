import { Helmet } from "react-helmet-async";
import {
  Users,
  GraduationCap,
  Target,
  Rocket,
  Heart,
} from "lucide-react";

import "../../styles/about.css";

function About() {
  return (
    <>
      <Helmet>
        <title>About Us | RoomSlider</title>
      </Helmet>

      <section className="about-page">

        {/* Hero */}

        <div className="about-hero">
          <h1>About RoomSlider</h1>

          <p>
            Built by Students. Designed for Everyone Searching for a Home.
          </p>
        </div>

        {/* Story */}

        <div className="about-section">

          <div className="about-icon">
            <Users size={40} />
          </div>

          <h2>Our Story</h2>

          <p>
            RoomSlider wasn't created by a large company or a corporate team.
            It was built by <strong>two friends</strong> who personally
            experienced the struggles of finding a room in a new city.
          </p>

          <p>
            As students, we moved away from our hometowns to continue our
            education. Instead of focusing on our studies, we spent countless
            hours visiting different areas, talking to brokers, calling random
            phone numbers, and searching from street to street just to find a
            decent place to live.
          </p>

          <p>
            That frustrating experience inspired us to create RoomSlider—a
            platform that makes finding Rooms, PGs, Hostels, and Flats simple,
            transparent, and stress-free.
          </p>

        </div>

        {/* Why */}

        <div className="about-section">

          <div className="about-icon">
            <Target size={40} />
          </div>

          <h2>Why We Built RoomSlider</h2>

          <div className="about-cards">

            <div className="about-card">
              <Heart size={28} />
              <h3>Save Time</h3>
              <p>
                No more wandering from street to street searching for a room.
              </p>
            </div>

            <div className="about-card">
              <GraduationCap size={28} />
              <h3>Help Students</h3>
              <p>
                Built especially for students and working professionals moving
                to new cities.
              </p>
            </div>

            <div className="about-card">
              <Rocket size={28} />
              <h3>Easy Search</h3>
              <p>
                Find Rooms, PGs, Hostels and Flats in just a few clicks.
              </p>
            </div>

          </div>

        </div>

        {/* Mission */}

        <div className="about-section">

          <h2>Our Mission</h2>

          <p>
            We believe finding a place to stay should never be stressful.
          </p>

          <p>
            Our mission is to help students and working professionals discover
            verified rental properties quickly, safely, and without unnecessary
            hassle.
          </p>

          <blockquote>
            "No student should have to spend days searching for a place to call
            home."
          </blockquote>

        </div>

        {/* Future */}

        <div className="about-section">

          <h2>Our Vision</h2>

          <p>
            This is only the beginning.
          </p>

          <p>
            We are continuously improving RoomSlider with smarter search,
            verified listings, better user experience, and many exciting
            features that will make room hunting easier than ever.
          </p>

        </div>

        {/* Footer */}

        <div className="about-footer">

          <h2>Thank You ❤️</h2>

          <p>
            Thank you for being part of our journey.
          </p>

          <h3>Welcome to RoomSlider</h3>

          <span>Find Your Perfect Stay, Without the Hassle.</span>

        </div>

      </section>
    </>
  );
}

export default About;