import { Mail, MapPin, Phone } from "lucide-react";
import SEO, { PAGE_SEO } from "../../components/SEO";

function Contact() {
  return (
    <main className="container" style={{ paddingBlock: "48px", minHeight: "50vh" }}>
      <SEO
        {...PAGE_SEO.contact}
        breadcrumbs={[{ name: "Home", path: "/" }, { name: "Contact RoomSlider", path: "/contact" }]}
      />
      <h1>Contact RoomSlider in Indore</h1>
      <p>Need help finding a place or managing a listing? Get in touch with our team.</p>
      <ul style={{ display: "grid", gap: "12px", listStyle: "none", marginTop: "24px" }}>
        <li><MapPin aria-hidden="true" size={18} /> Indore, Madhya Pradesh</li>
        <li><Phone aria-hidden="true" size={18} /> <a href="tel:+919131181848">+91 9131181848</a></li>
        <li><Mail aria-hidden="true" size={18} /> <a href="mailto:support@roomslider.com">support@roomslider.com</a></li>
      </ul>
    </main>
  );
}

export default Contact;
