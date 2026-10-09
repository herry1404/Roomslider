import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, HeartPulse, Phone } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import "../../styles/blood.css";

const DISCLAIMER = "RoomSlider only connects people. It is not a blood bank or a medical service. In an emergency call 108 or contact the nearest blood bank. Blood must not be bought or sold. Verify the request at the hospital before donating.";
const title = (value = "") => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function BloodHome() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("token")));

  useEffect(() => {
    if (!localStorage.getItem("token")) return undefined;
    let active = true;
    api.get("/blood-requests/mine").then(({ data }) => { if (active) setRequests(data.requests || []); })
      .catch(() => toast.error("Your blood requests could not be loaded"))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const startRequest = () => {
    if (!localStorage.getItem("token")) {
      navigate("/login", { state: { from: "/blood/request" } });
      return;
    }
    navigate("/blood/request");
  };

  return <>
    <Helmet>
      <title>Blood Requests and Donor Support | RoomSlider</title>
      <meta name="description" content="RoomSlider connects people who need blood with consenting local donors in Indore. Donor contact details are shared only after they choose to help." />
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
    <main className="blood-page">
    <header className="blood-hero"><span className="blood-icon"><HeartPulse size={28} /></span><span className="blood-eyebrow">Community support</span><h1>Blood requests</h1><p>RoomSlider helps connect people who need blood with consenting local donors. Donor contact details are shared only after a donor chooses to help.</p><div className="blood-hero-actions"><button className="blood-primary" onClick={startRequest}>Request blood</button><Link className="blood-secondary" to="/profile/edit#blood-donation">Become a donor <ArrowRight size={15} /></Link></div></header>
    <div className="blood-disclaimer">{DISCLAIMER}</div>
    <section className="blood-support">
      <div><h2>Blood Donation Help &amp; Support</h2><p>For help with blood requests or social work, contact the in-charge.</p></div>
      <div className="blood-support-contact"><strong>Aryan Choudhary</strong><span>Social Work &amp; Blood Request Management In-charge</span><a href="tel:+918109148408"><Phone size={15} /> 8109148408</a></div>
    </section>
    <section className="blood-my-requests"><div className="blood-section-heading"><div><h2>My requests</h2><p>Track requests you submitted.</p></div><button className="blood-secondary" onClick={startRequest}>New request</button></div>
      {loading ? <div className="blood-request-skeletons">{[1, 2].map((item) => <i key={item} />)}</div> : !localStorage.getItem("token") ? <div className="blood-empty">Sign in to view your requests and receive updates.</div> : requests.length === 0 ? <div className="blood-empty">You have not submitted a blood request yet.</div> : <div className="blood-request-list">{requests.map((request) => <Link className="blood-request-card" key={request._id} to={`/blood/requests/${request._id}`}><span className="blood-group-tag">{request.bloodGroup}</span><span className="blood-request-info"><strong>{request.patientName}</strong><small>{request.unitsNeeded} unit(s) · {request.hospitalName} · {request.area}</small><small>Needed by {new Date(request.neededBy).toLocaleString("en-IN")}</small></span><span className={`blood-status ${request.status}`}>{title(request.status)}</span><span className="blood-helper-count">{request.helperCount} helpers</span></Link>)}</div>}
    </section>
    </main>
  </>;
}

export default BloodHome;
