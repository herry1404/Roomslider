import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BellRing, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import EmptyState from "../ui/EmptyState";
import "../../styles/saved-searches.css";

const INITIAL_FORM = { area: "", category: "Any", maxPrice: "", gender: "Any" };

function SavedSearches() {
  const { user } = useAuth();
  const [searches, setSearches] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const canManage = user && ["user", "admin"].includes(user.role);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(async () => {
      if (!canManage) {
        if (active) {
          setSearches([]);
          setLoading(false);
        }
        return;
      }
      try {
        const { data } = await api.get("/saved-searches");
        if (active) setSearches(data.searches || []);
      } catch (error) {
        toast.error(error.response?.data?.message || "Saved searches could not be loaded");
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => { active = false; };
  }, [canManage]);

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    try {
      setSaving(true);
      const { data } = await api.post("/saved-searches", {
        ...form,
        maxPrice: form.maxPrice ? Number(form.maxPrice) : 0,
      });
      setSearches((current) => [data.search, ...current]);
      setForm(INITIAL_FORM);
      toast.success("Search alert saved");
    } catch (error) {
      toast.error(error.response?.data?.message || "Search alert could not be saved");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/saved-searches/${id}`);
      setSearches((current) => current.filter((search) => search._id !== id));
      toast.success("Saved search removed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Saved search could not be removed");
    }
  };

  return (
    <section className="settings-saved-searches">
      <header>
        <div><h2>Saved searches</h2><p>Get an alert when a new listing matches your filters.</p></div>
        <BellRing size={20} />
      </header>
      {!canManage ? (
        <p><Link to="/login" state={{ from: "/settings" }}>Log in</Link> to create and manage saved searches.</p>
      ) : (
        <>
          <form onSubmit={submit}>
            <label>Area<input value={form.area} maxLength={80} required placeholder="e.g. Vijay Nagar" onChange={(event) => setForm((current) => ({ ...current, area: event.target.value }))} /></label>
            <div className="saved-search-fields">
              <label>Category<select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
                <option value="Any">Any category</option><option value="Room">Room</option><option value="PG">PG</option><option value="Hostel">Hostel</option><option value="Flat">Flat</option>
              </select></label>
              <label>Maximum price<input type="number" min="0" value={form.maxPrice} placeholder="No limit" onChange={(event) => setForm((current) => ({ ...current, maxPrice: event.target.value }))} /></label>
              <label>Gender<select value={form.gender} onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}>
                <option value="Any">Any</option><option value="Male">Boys</option><option value="Female">Girls</option>
              </select></label>
            </div>
            <button type="submit" disabled={saving}>{saving ? "Saving…" : "Save search"}</button>
          </form>
          {loading ? <p>Loading saved searches…</p> : searches.length ? (
            <div className="saved-search-list">
              {searches.map((search) => (
                <article key={search._id}>
                  <div><strong>{search.area}</strong><span>{search.category} · {search.gender}{search.maxPrice ? ` · Up to ₹${Number(search.maxPrice).toLocaleString("en-IN")}` : ""}</span></div>
                  <button type="button" aria-label={`Remove search for ${search.area}`} onClick={() => remove(search._id)}><Trash2 size={17} /></button>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState icon={BellRing} title="No saved searches yet" description="Save an area and optional filters to get listing alerts." />
          )}
        </>
      )}
    </section>
  );
}

export default SavedSearches;
