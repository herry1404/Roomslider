import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Building2 } from "lucide-react";
import {
  FaWhatsapp,
  FaInstagram,
  FaLinkedinIn,
  FaGithub,
} from "react-icons/fa";

import Container from "../ui/Container";
import Logo from "../ui/Logo";

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <Container>

        {/* ===================== TOP ===================== */}

        <div className="footer-top">

          {/* Brand */}
          <div className="footer-brand">
            <Logo />

            <p className="footer-tagline">
              Discover verified Rooms, PGs, Hostels and Flats across Indore
              with a fast, modern and trusted experience.
            </p>

            <div className="footer-socials">

              {/* WhatsApp */}
              <a
                href="https://wa.me/919131181848?text=Hi%20RoomSlider,%20I%20need%20help."
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="WhatsApp"
              >
                <FaWhatsapp size={16} />
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com/roomslider"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="Instagram"
              >
                <FaInstagram size={16} />
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com/in/YOUR_LINKEDIN_USERNAME"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="LinkedIn"
              >
                <FaLinkedinIn size={16} />
              </a>

              {/* GitHub */}
              <a
                href="https://github.com/YOUR_GITHUB_USERNAME"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="GitHub"
              >
                <FaGithub size={16} />
              </a>

            </div>
          </div>

          {/* Explore */}
          <div className="footer-links">
            <h4>Explore</h4>

            <ul>
              <li><Link to="/rooms">Rooms</Link></li>
              <li><Link to="/pg">PG</Link></li>
              <li><Link to="/hostels">Hostels</Link></li>
              <li><Link to="/flats">Flats</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="footer-links">
            <h4>Company</h4>

            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Signup</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-links">
            <h4>Contact</h4>

            <ul className="footer-contact">

              <li>
                <MapPin size={16} />
                <span>Indore, Madhya Pradesh, India</span>
              </li>

              <li>
                <Phone size={16} />
                <span>+91 9131181848</span>
              </li>

              <li>
                <Phone size={16} />
                <span>+91 8085028799</span>
              </li>

              <li>
                <Mail size={16} />
                <span>support@roomslider.com</span>
              </li>

            </ul>
          </div>

        </div>

        {/* ===================== PROPERTY LISTING CTA ===================== */}

        <div className="footer-property-cta">

          <a
            href="https://wa.me/919131181848?text=Hi%20RoomSlider%20👋%0A%0AI%20want%20to%20list%20my%20property.%0A%0AName:%0AMobile%20Number:%0AProperty%20Type:%20(Room/PG/Hostel/Flat)%0ALocation:%0AMonthly%20Rent:"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-property-link"
          >

            <div className="footer-property-icon">
              <Building2 size={28} />
            </div>

            <div className="footer-property-text">
              <h4>Own a Room, PG, Hostel or Flat?</h4>
              <p>List your property now on WhatsApp</p>
            </div>

            <div className="footer-property-action">
              <FaWhatsapp size={18} />
              <span>WhatsApp</span>
            </div>

          </a>

        </div>

        {/* ===================== BOTTOM ===================== */}

        <div className="footer-bottom">

          <p>© {year} RoomSlider. All rights reserved.</p>

          <div className="footer-bottom-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>

        </div>

      </Container>
    </footer>
  );
}

export default Footer;