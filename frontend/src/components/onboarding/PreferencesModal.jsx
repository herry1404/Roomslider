import { useState, useMemo } from "react";
import { Search, X, GraduationCap, MapPin } from "lucide-react";
import { toast } from "react-hot-toast";
import indoreColleges from "../../data/indoreColleges";
import indoreAreas from "../../data/indoreAreas";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import "../../styles/preferences-modal.css";

function PreferencesModal({ onClose }) {

  const { user, setUser } = useAuth();

  const [step, setStep] = useState(1);
  const [collegeQuery, setCollegeQuery] = useState("");
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [saving, setSaving] = useState(false);

  const filteredColleges = useMemo(() => {

    if (!collegeQuery.trim()) return indoreColleges;

    const q = collegeQuery.trim().toLowerCase();

    return indoreColleges.filter((c) =>
      c.name.toLowerCase().includes(q)
    );

  }, [collegeQuery]);


  const savePreferences = async (payload) => {

    try {

      setSaving(true);

      const res = await api.patch("/auth/update-preferences", payload);

      const updatedUser = { ...user, ...res.data.user };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      toast.success("Preferences saved");
      onClose();

    } catch (error) {

      console.error("SAVE PREFERENCES ERROR", error);
      toast.error(error.response?.data?.message || "Could not save preferences");

    } finally {

      setSaving(false);

    }

  };


  const handleCollegeSelect = (college) => {

    setSelectedCollege(college);
    setStep(2);

  };


  const handleAreaSelect = (area) => {

    setSelectedArea(area);

    savePreferences({
      preferredCollege: selectedCollege?.name || null,
      preferredArea: area,
    });

  };


  const handleSkip = () => {

    onClose();

  };


  return (

    <div className="pref-overlay">

      <div className="pref-card">

        <button className="pref-close" onClick={handleSkip} aria-label="Skip">
          <X size={18} />
        </button>

        {step === 1 && (

          <>

            <div className="pref-header">
              <GraduationCap size={22} />
              <h2>Which college are you closest to?</h2>
              <p>We'll show you rooms near it first</p>
            </div>

            <div className="pref-search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search your college"
                value={collegeQuery}
                onChange={(e) => setCollegeQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className="pref-list">

              {filteredColleges.length === 0 && (
                <p className="pref-empty">No colleges found</p>
              )}

              {filteredColleges.map((c) => (
                <button
                  key={c.name}
                  className="pref-list-item"
                  onClick={() => handleCollegeSelect(c)}
                >
                  {c.name}
                </button>
              ))}

            </div>

            <button className="pref-skip" onClick={handleSkip}>
              Skip for now
            </button>

          </>

        )}

        {step === 2 && (

          <>

            <div className="pref-header">
              <MapPin size={22} />
              <h2>Which area do you prefer?</h2>
              <p>Optional — helps us sort rooms better</p>
            </div>

            <div className="pref-list">

              {indoreAreas.map((area) => (
                <button
                  key={area}
                  className="pref-list-item"
                  disabled={saving}
                  onClick={() => handleAreaSelect(area)}
                >
                  {area}
                </button>
              ))}

            </div>

            <button
              className="pref-skip"
              disabled={saving}
              onClick={() =>
                savePreferences({
                  preferredCollege: selectedCollege?.name || null,
                  preferredArea: null,
                })
              }
            >
              {saving ? "Saving..." : "Skip for now"}
            </button>

          </>

        )}

      </div>

    </div>

  );

}

export default PreferencesModal;
