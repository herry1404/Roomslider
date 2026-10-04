import { useEffect, useState } from "react";
import { Activity, HeartPulse, Megaphone } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import "../../styles/admin/theme.css";
import "../../styles/admin/blood-requests.css";

const GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const STATUSES = ["pending", "approved", "fulfilled", "closed", "rejected", "expired"];
const AUDIENCES = [
  { value: "exact", label: "Same blood group", description: "Notify consenting, available donors with the exact group. This is the default priority audience." },
  { value: "compatible", label: "Compatible groups", description: "Add donors whose blood groups are compatible with the requested group." },
  { value: "area", label: "Any consenting donor in this area", description: "Notify consenting, available donors in the same area, regardless of group." },
];
const formatDate = (value) => value ? new Date(value).toLocaleString("en-IN") : "—";
const label = (value = "") => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function ManageBloodRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");
  const [bloodGroup, setBloodGroup] = useState("");
  const [area, setArea] = useState("");
  const [broadcastRequest, setBroadcastRequest] = useState(null);
  const [audience, setAudience] = useState("exact");
  const [estimate, setEstimate] = useState(null);
  const [estimating, setEstimating] = useState(false);
  const [sending, setSending] = useState(false);
  const [rejectRequest, setRejectRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      if (bloodGroup) params.bloodGroup = bloodGroup;
      if (area.trim()) params.area = area.trim();
      const { data } = await api.get("/blood-requests/admin", { params });
      setRequests(data.requests || []);
    } catch {
      toast.error("Blood requests could not be loaded");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [status, bloodGroup, area]);

  useEffect(() => {
    if (!broadcastRequest) return undefined;
    let active = true;
    setEstimating(true);
    setEstimate(null);
    api.get(`/blood-requests/admin/${broadcastRequest._id}/estimate`, { params: { audience } })
      .then(({ data }) => { if (active) setEstimate(Number(data.estimatedRecipientCount) || 0); })
      .catch((error) => { if (active) toast.error(error?.response?.data?.message || "Recipient estimate could not be loaded"); })
      .finally(() => { if (active) setEstimating(false); });
    return () => { active = false; };
  }, [broadcastRequest, audience]);

  const approve = async (request) => {
    try {
      await api.put(`/blood-requests/admin/${request._id}/approve`);
      toast.success("Request approved");
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Request could not be approved");
    }
  };
  const reject = async (event) => {
    event.preventDefault();
    if (rejectReason.trim().length < 2) return toast.error("Enter a rejection reason");
    try {
      await api.put(`/blood-requests/admin/${rejectRequest._id}/reject`, { reason: rejectReason });
      toast.success("Request rejected");
      setRejectRequest(null);
      setRejectReason("");
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Request could not be rejected");
    }
  };
  const closeOrFulfill = async (request, nextStatus) => {
    try {
      await api.put(`/blood-requests/admin/${request._id}/status`, { status: nextStatus });
      toast.success(nextStatus === "fulfilled" ? "Request marked fulfilled" : "Request closed");
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Request status could not be updated");
    }
  };
  const broadcast = async () => {
    setSending(true);
    try {
      const { data } = await api.post(`/blood-requests/admin/${broadcastRequest._id}/broadcast`, { audience });
      toast.success(`Request sent to ${data.recipientCount} donor(s)`);
      setBroadcastRequest(null);
      setEstimate(null);
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Blood request could not be broadcast");
    } finally {
      setSending(false);
    }
  };
  const blockRequester = async (request) => {
    const current = Boolean(request.requester?.bloodRequestsBlocked);
    try {
      await api.put(`/blood-requests/admin/users/${request.requester?._id}/requests-block`, { blocked: !current });
      setRequests((items) => items.map((item) => item._id === request._id ? { ...item, requester: { ...item.requester, bloodRequestsBlocked: !current } } : item));
      toast.success(current ? "Requester can submit blood requests again" : "Requester blocked from submitting blood requests");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Account request access could not be updated");
    }
  };

  return <div className="admin-page blood-admin-page">
    <div className="admin-page-header"><div><h1>Blood Requests</h1><p>Review requests, notify eligible donors, and manage responses.</p></div><span className="blood-admin-summary"><HeartPulse size={17} /> {requests.filter((request) => request.status === "pending").length} pending in view</span></div>
    <div className="admin-toolbar blood-admin-toolbar">
      <select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{STATUSES.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select>
      <select value={bloodGroup} onChange={(event) => setBloodGroup(event.target.value)}><option value="">All blood groups</option>{GROUPS.map((value) => <option key={value}>{value}</option>)}</select>
      <input placeholder="Filter by area" value={area} onChange={(event) => setArea(event.target.value)} />
    </div>
    <div className="admin-table-wrap">{loading ? <div className="admin-empty">Loading requests…</div> : requests.length === 0 ? <div className="admin-empty"><h3>No requests found</h3></div> : <table className="admin-table blood-admin-table">
      <thead><tr><th>Request</th><th>Patient / need</th><th>Requester (admin only)</th><th>Contact / address</th><th>Status</th><th>Admin actions</th></tr></thead>
      <tbody>{requests.map((request) => <tr key={request._id}>
        <td><span className="blood-admin-group">{request.bloodGroup}</span><br />{request.unitsNeeded} unit(s)<br /><small>{label(request.urgency)}</small><br /><small>Needed by {formatDate(request.neededBy)}</small><br /><small>Submitted {formatDate(request.createdAt)}</small></td>
        <td><strong>{request.patientName}</strong><br />{request.hospitalName}<br />{request.area}{request.address && <><br /><small>{request.address}</small></>}</td>
        <td>{request.requester?.name || "—"}<br /><a href={`tel:${request.requester?.phone || ""}`}>{request.requester?.phone || "No phone"}</a><br /><small>{request.helperCount || request.helpers?.length || 0} helper(s) · {request.notifiedCount || 0} notified</small></td>
        <td>{request.contactName}<br /><a href={`tel:${request.contactNumber}`}>{request.contactNumber}</a>{request.note && <p className="blood-admin-note">{request.note}</p>}</td>
        <td><span className={`admin-badge ${request.status === "pending" ? "amber" : request.status === "approved" ? "green" : ""}`}>{label(request.status)}</span>{request.rejectReason && <p className="blood-admin-note">{request.rejectReason}</p>}</td>
        <td className="blood-admin-actions">
          {request.status === "pending" && <><button className="admin-btn" onClick={() => approve(request)}>Approve</button><button className="admin-btn secondary" onClick={() => { setRejectRequest(request); setRejectReason(""); }}>Reject</button></>}
          {request.status === "approved" && <><button className="admin-btn" onClick={() => { setBroadcastRequest(request); setAudience("exact"); }}><Megaphone size={14} /> Broadcast</button><button className="admin-btn secondary" onClick={() => closeOrFulfill(request, "fulfilled")}>Mark fulfilled</button><button className="admin-btn secondary" onClick={() => closeOrFulfill(request, "closed")}>Close</button></>}
          {request.requester?._id && <button className="admin-btn secondary" onClick={() => blockRequester(request)}>{request.requester.bloodRequestsBlocked ? "Unblock requests" : "Block new requests"}</button>}
          {request.helpers?.length > 0 && <details className="blood-admin-helpers"><summary><Activity size={13} /> Helpers ({request.helpers.length})</summary>{request.helpers.map((helper) => <div key={`${helper.user?._id || helper.user}-${helper.respondedAt}`}><strong>{helper.user?.name || "Account"}</strong><br />{helper.user?.phone && <a href={`tel:${helper.user.phone}`}>{helper.user.phone}</a>}<small>{formatDate(helper.respondedAt)}</small></div>)}</details>}
        </td>
      </tr>)}</tbody>
    </table>}</div>
    {broadcastRequest && <div className="blood-admin-overlay" onClick={() => setBroadcastRequest(null)}><section className="blood-admin-modal" role="dialog" aria-modal="true" aria-labelledby="blood-broadcast-title" onClick={(event) => event.stopPropagation()}>
      <h2 id="blood-broadcast-title">Notify eligible donors</h2><p>{broadcastRequest.bloodGroup} · {broadcastRequest.unitsNeeded} unit(s) · {broadcastRequest.hospitalName}, {broadcastRequest.area}</p>
      <div className="blood-audience-options">{AUDIENCES.map((option) => <label key={option.value} className={audience === option.value ? "selected" : ""}><input type="radio" name="audience" value={option.value} checked={audience === option.value} onChange={() => setAudience(option.value)} /><span><strong>{option.label}</strong><small>{option.description}</small></span></label>)}</div>
      {audience === "compatible" && <p className="blood-compatibility">Donor compatibility: O− to all groups; O+ to positive groups; A− to A+, A−, AB+, AB−; A+ to A+, AB+; B− to B+, B−, AB+, AB−; B+ to B+, AB+; AB− to AB+, AB−; AB+ to AB+.</p>}
      <p className="blood-estimate">{estimating ? "Estimating eligible recipients…" : estimate === null ? "Recipient estimate unavailable" : `Estimated recipients: ${estimate}`}</p>
      <div className="blood-admin-modal-actions"><button className="admin-btn" disabled={sending || estimating || !estimate} onClick={broadcast}>{sending ? "Sending…" : "Send notification"}</button><button className="admin-btn secondary" onClick={() => setBroadcastRequest(null)}>Cancel</button></div>
    </section></div>}
    {rejectRequest && <div className="blood-admin-overlay" onClick={() => setRejectRequest(null)}><form className="blood-admin-modal" onSubmit={reject} onClick={(event) => event.stopPropagation()}><h2>Reject blood request</h2><label>Reason<textarea rows="3" required maxLength={500} value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} /></label><div className="blood-admin-modal-actions"><button className="admin-btn">Reject request</button><button type="button" className="admin-btn secondary" onClick={() => setRejectRequest(null)}>Cancel</button></div></form></div>}
  </div>;
}

export default ManageBloodRequests;
