import { useEffect, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, HeartPulse, Phone } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import "../../styles/blood.css";

const DISCLAIMER = "RoomSlider only connects people. It is not a blood bank or a medical service. In an emergency call 108 or contact the nearest blood bank. Blood must not be bought or sold. Verify the request at the hospital before donating.";
const label = (value = "") => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function BloodRequestDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [request, setRequest] = useState(null);
  const [view, setView] = useState("");
  const [contact, setContact] = useState(location.state?.contact || null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [closed, setClosed] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get(`/blood-requests/${id}`);
      setRequest(data.request);
      setView(data.view);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Blood request could not be loaded");
      setRequest(null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!request || searchParams.get("help") !== "1" || view !== "donor") return;
    let active = true;
    api.post(`/blood-requests/${id}/help`).then(({ data }) => {
      if (!active) return;
      setContact(data.contact);
      toast.success("Your response was recorded");
    }).catch((error) => {
      if (active) toast.error(error?.response?.data?.message || "Your response could not be recorded");
    }).finally(() => {
      if (active) setSearchParams({}, { replace: true });
    });
    return () => { active = false; };
  }, [id, request, searchParams, setSearchParams, view]);

  const offerHelp = async () => {
    setResponding(true);
    try {
      const { data } = await api.post(`/blood-requests/${id}/help`);
      setContact(data.contact);
      toast.success("Your response was recorded. Please verify the request at the hospital.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Your response could not be recorded");
    } finally {
      setResponding(false);
    }
  };

  const unavailable = async () => {
    setResponding(true);
    try {
      await api.post(`/blood-requests/${id}/unavailable`);
      setClosed(true);
      toast.success("Your response was recorded");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Your response could not be recorded");
    } finally {
      setResponding(false);
    }
  };

  const closeRequest = async () => {
    setResponding(true);
    try {
      await api.put(`/blood-requests/${id}/close`);
      setRequest((current) => ({ ...current, status: "closed" }));
      toast.success("Request closed");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Request could not be closed");
    } finally {
      setResponding(false);
    }
  };

  if (loading) return <main className="blood-page"><div className="blood-detail-skeleton"><i /><i /><i /><i /></div></main>;
  if (!request) return <main className="blood-page"><Link to="/blood" className="blood-back"><ArrowLeft size={16} /> Blood requests</Link><div className="blood-empty">This request is unavailable or you are not authorized to view it.</div></main>;

  const phoneDigits = String(contact?.contactNumber || "").replace(/\D/g, "");
  return <main className="blood-page">
    <Link to={view === "requester" ? "/blood" : "/notifications"} className="blood-back"><ArrowLeft size={16} /> {view === "requester" ? "My requests" : "Notifications"}</Link>
    <div className="blood-disclaimer">{DISCLAIMER}</div>
    <article className="blood-detail">
      <header className="blood-detail-head"><span className="blood-icon"><HeartPulse size={24} /></span><span className="blood-group-tag">{request.bloodGroup}</span><span className={`blood-status ${request.status}`}>{label(request.status)}</span></header>
      <h1>{view === "requester" ? request.patientName : "Blood request"}</h1>
      <div className="blood-detail-grid">
        <div><small>Blood group</small><strong>{request.bloodGroup}</strong></div>
        <div><small>Units needed</small><strong>{request.unitsNeeded}</strong></div>
        <div><small>Hospital</small><strong>{request.hospitalName}</strong></div>
        <div><small>Area</small><strong>{request.area}</strong></div>
        <div><small>Needed by</small><strong>{new Date(request.neededBy).toLocaleString("en-IN")}</strong></div>
        <div><small>Urgency</small><strong>{label(request.urgency)}</strong></div>
        {view === "requester" && <div><small>Helpers</small><strong>{request.helperCount || 0}</strong></div>}
      </div>
      {view === "requester" && <section className="blood-private-contact"><h2>Request contact</h2><p>{request.contactName} · <a href={`tel:${request.contactNumber}`}>{request.contactNumber}</a></p>{request.address && <p>{request.address}</p>}{request.note && <p>{request.note}</p>}{request.rejectReason && <p>Review note: {request.rejectReason}</p>}</section>}
      {view === "donor" && !contact && request.status === "approved" && !closed && <div className="blood-response-actions"><button className="blood-primary" disabled={responding} onClick={offerHelp}>{responding ? "Saving…" : "I can help"}</button><button className="blood-secondary" disabled={responding} onClick={unavailable}>Not available</button></div>}
      {closed && <p className="blood-response-note">Thank you. Your response has been recorded.</p>}
      {contact && <section className="blood-revealed-contact"><h2>Requester contact</h2><p>{contact.contactName}</p><div className="blood-response-actions"><a className="blood-primary" href={`tel:${contact.contactNumber}`}><Phone size={16} /> Call requester</a>{phoneDigits && <a className="blood-secondary" href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noreferrer">WhatsApp</a>}</div><p className="blood-verify-reminder">Verify the request at the hospital before donating.</p></section>}
      {view === "requester" && ["pending", "approved"].includes(request.status) && <button className="blood-danger" disabled={responding} onClick={closeRequest}>Close request</button>}
    </article>
  </main>;
}

export default BloodRequestDetail;
