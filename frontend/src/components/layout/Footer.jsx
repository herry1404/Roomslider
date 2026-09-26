import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Building2 } from "lucide-react";
import {
  FaWhatsapp,
  FaInstagram,
  FaLinkedinIn,
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
              Verified Rooms, PGs, Hostels and Flats across Indore.
            </p>

            <div className="footer-socials">
              <a
                href="https://wa.me/919131181848?text=Hi%20RoomSlider,%20I%20need%20help."
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="WhatsApp"
              >
                <FaWhatsapp size={15} />
              </a>

              <a
                href="https://instagram.com/roomslider"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="Instagram"
              >
                <FaInstagram size={15} />
              </a>

              <a
                href="https://www.linkedin.com/in/roomslider"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="LinkedIn"
              >
                <FaLinkedinIn size={15} />
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

          {/* Company + Contact combined */}
          <div className="footer-links">
            <h4>Company</h4>
            <ul>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/terms">Terms</Link></li>
              <li><Link to="/privacy">Privacy</Link></li>
            </ul>

            <ul className="footer-contact">
              <li>
                <MapPin size={14} />
                <span>Indore, MP</span>
              </li>
              <li>
                <Phone size={14} />
                <span>+91 9131181848</span>
              </li>
              <li>
                <Mail size={14} />
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
              <Building2 size={20} />
            </div>

            <div className="footer-property-text">
              <h4>Own a property?</h4>
              <p>List it on WhatsApp</p>
            </div>

            <div className="footer-property-action">
              <FaWhatsapp size={16} />
              <span>WhatsApp</span>
            </div>
          </a>
        </div>

        {/* ===================== BOTTOM ===================== */}

        <div className="footer-bottom">
          <p>© {year} RoomSlider</p>
          <p className="footer-map-credit">
            Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>
          </p>
        </div>

      </Container>
    </footer>
  );
}

export default Footer;
