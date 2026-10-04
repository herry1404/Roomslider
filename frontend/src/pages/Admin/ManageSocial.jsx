import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import confirmAction from "../../utils/confirmAction";
import "../../styles/admin/theme.css";

const CATEGORIES = ["free-food", "blood", "shelter", "medical", "helpline", "scholarship", "volunteer"];
const title = (value = "") => value.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");

function ManageSocial() {
  const [tab, setTab] = useState("places");
  const [places, setPlaces] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "places") {
        const { data } = await api.get("/social/admin/all");
        setPlaces(data.places || []);
      } else {
        const { data } = await api.get("/social/admin/suggestions");
        setSuggestions(data.suggestions || []);
      }
    } catch {
      toast.error(tab === "places" ? "Listings could not be loaded" : "Suggestions could not be loaded");
    } finally {
      setLoading(false);
    }
  }, [tab]);
  useEffect(() => { Promise.resolve().then(load); }, [load]);

  const review = async (suggestion, action) => {
    try {
      await api.post(`/social/admin/suggestions/${suggestion._id}/${action}`);
      toast.success(action === "approve" ? "Suggestion approved as a draft listing" : "Suggestion rejected");
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Suggestion could not be reviewed");
    }
  };

  const removePlace = async (place) => {
    if (!await confirmAction(`Delete "${place.name}"?`, { confirmText: "Delete" })) return;
    try {
      await api.delete(`/social/${place._id}`);
      setPlaces((current) => current.filter((item) => item._id !== place._id));
      toast.success("Listing deleted");
    } catch {
      toast.error("Listing could not be deleted");
    }
  };

  const visiblePlaces = places.filter((place) => category === "all" || place.category === category);
  return <div className="admin-page">
    <div className="admin-page-header"><div><h1>Social Work</h1><p>Manage community listings and review suggestions.</p></div>{tab === "places" && <Link to="/admin/social/add" className="admin-btn"><Plus size={16} /> Add listing</Link>}</div>
    <div className="admin-toolbar">
      <button className={`admin-btn ${tab === "places" ? "" : "secondary"}`} onClick={() => setTab("places")}>Listings</button>
      <button className={`admin-btn ${tab === "suggestions" ? "" : "secondary"}`} onClick={() => setTab("suggestions")}>Suggestions</button>
      {tab === "places" && <select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{CATEGORIES.map((value) => <option key={value} value={value}>{title(value)}</option>)}</select>}
    </div>
    <div className="admin-table-wrap">{loading ? <div className="admin-empty">Loading…</div> : tab === "places" ? visiblePlaces.length === 0 ? <div className="admin-empty"><h3>No listings found</h3></div> : <table className="admin-table">
      <thead><tr><th>Name</th><th>Category</th><th>Area</th><th>Published</th><th>Verified</th><th>Actions</th></tr></thead>
      <tbody>{visiblePlaces.map((place) => <tr key={place._id}><td>{place.name}</td><td>{title(place.category)}{place.subType && <><br /><small>{title(place.subType)}</small></>}</td><td>{place.area}</td><td>{place.isActive ? "Yes" : "Draft"}</td><td>{place.isVerified ? "Yes" : "No"}</td><td><div style={{ display: "flex", gap: 8, alignItems: "center" }}><Link className="admin-btn secondary" to={`/admin/social/edit/${place._id}`}>Edit</Link><button className="admin-btn secondary" onClick={() => removePlace(place)}>Delete</button></div></td></tr>)}</tbody>
    </table> : suggestions.length === 0 ? <div className="admin-empty"><h3>No suggestions to review</h3></div> : <table className="admin-table">
      <thead><tr><th>Place</th><th>Category</th><th>Area / address</th><th>Contact</th><th>Suggested by</th><th>Status / actions</th></tr></thead>
      <tbody>{suggestions.map((suggestion) => <tr key={suggestion._id}><td>{suggestion.name}<br /><small>{suggestion.description}</small></td><td>{title(suggestion.category)}{suggestion.subType && <><br /><small>{title(suggestion.subType)}</small></>}</td><td>{suggestion.area}<br /><small>{suggestion.address}</small></td><td>{suggestion.contactNumber || "—"}</td><td>{suggestion.suggestedBy?.name || "—"}</td><td>{suggestion.status === "pending" ? <div style={{ display: "flex", gap: 7 }}><button className="admin-btn" onClick={() => review(suggestion, "approve")}>Approve draft</button><button className="admin-btn secondary" onClick={() => review(suggestion, "reject")}>Reject</button></div> : <span className="admin-badge">{title(suggestion.status)}</span>}</td></tr>)}</tbody>
    </table>}</div>
  </div>;
}

export default ManageSocial;
