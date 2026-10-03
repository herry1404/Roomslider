import { useEffect, useRef, useState } from "react";
import { Banknote, CheckCircle2, Clock3, MapPin, X } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import "../../styles/loan-modal.css";

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  dob: "",
  houseNumber: "",
  area: "",
  nearby: "",
  city: "",
  state: "",
  postalCode: "",
  amount: "",
  purpose: "other",
  note: "",
  college: "",
  course: "",
  pan: "",
  guardianName: "",
  guardianPhone: "",
  guardianOccupation: "",
  familyIncomeRange: "",
  idType: "",
};

const STATUS_LABELS = {
  new: "Application received",
  submitted: "Application received",
  under_review: "Under review",
  contacted: "Contact from our team",
  approved: "Approved",
  rejected: "Not approved",
};

const PAN_HOLDER_TYPES = "ABCFGHLJPT";
const isPanCharacterValid = (index, character) => {
  if (index >= 5 && index <= 8) return /^\d$/.test(character);
  if (index === 3) return PAN_HOLDER_TYPES.includes(character);
  return /^[A-Z]$/.test(character);
};

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

const getAdultDateCutoff = () => {
  const now = new Date();
  const year = now.getUTCFullYear() - 18;
  const month = now.getUTCMonth();
  const day = Math.min(now.getUTCDate(), new Date(Date.UTC(year, month + 1, 0)).getUTCDate());
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

function LoanModal({ onClose }) {
  const { user } = useAuth();
  const panInputRefs = useRef([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [idPhoto, setIdPhoto] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [application, setApplication] = useState(null);
  const [profile, setProfile] = useState(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [postalLookup, setPostalLookup] = useState("");
  const [postalAreas, setPostalAreas] = useState([]);

  useEffect(() => {
    let active = true;
    const loadFormData = async () => {
      try {
        const [profileResponse, loanResponse] = await Promise.all([
          api.get("/users/me"),
          api.get("/loans"),
        ]);
        if (!active) return;

        const currentProfile = profileResponse.data.user;
        setProfile(currentProfile);
        setApplication(loanResponse.data.loan || null);
        setForm((current) => ({
          ...current,
          name: currentProfile.name || user?.name || "",
          phone: currentProfile.phone || user?.phone || "",
          email: currentProfile.email || user?.email || "",
          dob: currentProfile.dob ? String(currentProfile.dob).slice(0, 10) : "",
          area: currentProfile.area || "",
          city: currentProfile.city || "",
          college: currentProfile.organization || currentProfile.preferredCollege || "",
          course: currentProfile.course || "",
        }));
      } catch (error) {
        if (active) {
          toast.error(error.response?.data?.message || "Could not load your profile details.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadFormData();
    return () => {
      active = false;
    };
  }, [user?.email, user?.name, user?.phone]);

  useEffect(() => {
    const postalCode = form.postalCode;
    if (!/^\d{6}$/.test(postalCode)) {
      return undefined;
    }

    let active = true;
    const timeoutId = setTimeout(async () => {
      setPostalLookup("loading");
      try {
        const response = await fetch(
          `https://api.postalpincode.in/pincode/${postalCode}`
        );
        if (!response.ok) throw new Error("PIN code lookup failed");

        const [result] = await response.json();
        const offices = result?.Status === "Success" && Array.isArray(result.PostOffice)
          ? result.PostOffice
          : [];
        if (!offices.length) {
          if (active) {
            setPostalAreas([]);
            setPostalLookup("not-found");
          }
          return;
        }

        if (!active) return;
        const areas = [...new Set(offices.map((office) => office.Name).filter(Boolean))];
        const office = offices[0];
        setPostalAreas(areas);
        setForm((previous) => ({
          ...previous,
          area: areas[0] || previous.area,
          city: office.District || office.Block || previous.city,
          state: office.State || previous.state,
        }));
        setPostalLookup("success");
      } catch {
        if (active) {
          setPostalAreas([]);
          setPostalLookup("error");
        }
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [form.postalCode]);

  const update = (key) => (event) =>
    setForm((previous) => ({ ...previous, [key]: event.target.value }));

  const updateDigits = (key, maxLength) => (event) => {
    const value = event.target.value.replace(/\D/g, "").slice(0, maxLength);
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const updatePostalCode = (event) => {
    const postalCode = event.target.value.replace(/\D/g, "").slice(0, 6);
    setForm((previous) => ({ ...previous, postalCode }));
    setCurrentLocation(null);
    if (!/^\d{6}$/.test(postalCode)) {
      setPostalLookup("");
      setPostalAreas([]);
    }
  };

  const updatePanCharacter = (index, input) => {
    const character = input.toUpperCase();
    if (character && !isPanCharacterValid(index, character)) return;

    setForm((previous) => {
      const pan = previous.pan.padEnd(10, " ").split("");
      pan[index] = character || " ";
      return { ...previous, pan: pan.join("").trimEnd() };
    });
    if (character && index < 9) panInputRefs.current[index + 1]?.focus();
  };

  const handlePanPaste = (event, startIndex) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const characters = form.pan.padEnd(10, " ").split("");
    let lastValidIndex = startIndex - 1;

    [...pasted].forEach((character, offset) => {
      const index = startIndex + offset;
      if (index > 9 || !isPanCharacterValid(index, character)) return;
      characters[index] = character;
      lastValidIndex = index;
    });

    setForm((previous) => ({ ...previous, pan: characters.join("").trimEnd() }));
    panInputRefs.current[Math.min(lastValidIndex + 1, 9)]?.focus();
  };

  const handlePanKeyDown = (event, index) => {
    if (event.key === "Backspace" && !form.pan[index] && index > 0) {
      panInputRefs.current[index - 1]?.focus();
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location is not available on this device.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const location = {
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
        setCurrentLocation(location);
        try {
          const query = new URLSearchParams({
            format: "jsonv2",
            addressdetails: "1",
            lat: String(location.latitude),
            lon: String(location.longitude),
          });
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?${query.toString()}`,
            { headers: { "Accept-Language": "en" } }
          );
          if (!response.ok) throw new Error("Address lookup failed");

          const result = await response.json();
          const address = result.address || {};
          setForm((previous) => ({
            ...previous,
            houseNumber: address.house_number || previous.houseNumber,
            area:
              address.neighbourhood ||
              address.suburb ||
              address.quarter ||
              address.residential ||
              address.city_district ||
              address.county ||
              previous.area,
            nearby: address.road || previous.nearby,
            city:
              address.city ||
              address.town ||
              address.village ||
              address.municipality ||
              previous.city,
            state: address.state || previous.state,
            postalCode:             /^\d{6}$/.test(address.postcode?.replace(/\D/g, "") || "")
              ? address.postcode.replace(/\D/g, "")
              : previous.postalCode,
          }));
          toast.success("Current location added to the address fields.");
        } catch {
          toast.error("Location was found, but its address could not be looked up. Enter the address manually.");
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        setLocating(false);
        toast.error(
          error.code === 1
            ? "Allow location access in your browser and try again."
            : "Could not get your current location."
        );
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 }
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const requiredFields = {
      name: "Name",
      phone: "Phone",
      email: "Email",
      dob: "Date of birth",
      houseNumber: "House / flat number",
      area: "Area / locality",
      city: "City",
      state: "State",
      postalCode: "6-digit PIN code",
      amount: "Amount",
      college: "College",
      course: "Course",
      pan: "PAN number",
      guardianName: "Guardian name",
      guardianPhone: "Guardian phone",
      guardianOccupation: "Guardian occupation",
      familyIncomeRange: "Family income",
      idType: "ID type",
    };
    for (const [key, label] of Object.entries(requiredFields)) {
      if (!String(form[key]).trim()) {
        toast.error(`${label} is required.`);
        return;
      }
    }
    if (form.dob > getAdultDateCutoff()) {
      toast.error("Applicants must be at least 18 years old.");
      return;
    }
    if (!/^\d{6}$/.test(form.postalCode)) {
      toast.error("Enter a valid 6-digit PIN code.");
      return;
    }
    if (!(Number(form.amount) > 0)) {
      toast.error("Enter a valid loan amount.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      toast.error("Enter a valid 10-digit phone number.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(form.guardianPhone)) {
      toast.error("Enter a valid 10-digit guardian phone number.");
      return;
    }
    if (!/^[A-Z]{3}[ABCFGHLJPT][A-Z][0-9]{4}[A-Z]$/.test(form.pan)) {
      toast.error("Enter a valid PAN format, such as ABCPE1234F. The fourth letter must match the PAN holder type.");
      return;
    }
    if (!idPhoto) {
      toast.error("Upload an ID photo.");
      return;
    }
    if (!consentGiven) {
      toast.error("Consent is required to continue.");
      return;
    }

    try {
      setSaving(true);
      const data = new FormData();
      const { houseNumber, area, nearby, city, state, postalCode, ...applicationFields } = form;
      Object.entries(applicationFields).forEach(([key, value]) => {
        if (value) data.append(key, value);
      });
      data.append("addressDetails", JSON.stringify({
        houseNumber,
        area,
        nearby,
        city,
        state,
        postalCode,
      }));
      data.append(
        "address",
        [
          houseNumber,
          area,
          nearby ? `Near ${nearby}` : "",
          city,
          `${state} - ${postalCode}`,
        ].filter(Boolean).join(", ")
      );
      data.append("consentGiven", "true");
      data.append("idPhoto", idPhoto);
      if (currentLocation) {
        data.append("currentLocation", JSON.stringify(currentLocation));
      }

      const response = await api.post("/loans", data);
      setApplication(response.data.loan);
      toast.success("Application submitted. You can track its status here.");
    } catch (error) {
      const responseMessage = error.response?.data?.message || "Could not submit your application.";
      toast.error(responseMessage);
      if (error.response?.data?.loanSubmitted || error.response?.status === 409) {
        try {
          const response = await api.get("/loans");
          setApplication(response.data.loan || null);
        } catch (loadError) {
          toast.error(loadError.response?.data?.message || "Could not load your application status.");
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const renderApplication = () => {
    if (!application) return null;
    const history = application.statusHistory?.length
      ? application.statusHistory
      : [{ status: application.status, changedAt: application.createdAt }];
    const initial = (profile?.name || user?.name || "U").trim().charAt(0).toUpperCase();

    return (
      <div className="loan-application">
        <div className="loan-applicant">
          {profile?.avatar ? (
            <img src={profile.avatar} alt="" className="loan-applicant-avatar" />
          ) : (
            <div className="loan-applicant-avatar loan-applicant-initial">{initial}</div>
          )}
          <div>
            <span className="loan-kicker">Your application</span>
            <h3>{profile?.name || user?.name}</h3>
            <p>Submitted {formatDate(application.createdAt)}</p>
          </div>
        </div>

        <div className="loan-status-current">
          <Clock3 size={18} aria-hidden="true" />
          <div>
            <span>Current status</span>
            <strong>{STATUS_LABELS[application.status] || "Application received"}</strong>
          </div>
        </div>

        <div className="loan-timeline" aria-label="Application status history">
          {[...history].reverse().map((item, index) => (
            <div className="loan-timeline-item" key={`${item.status}-${item.changedAt || index}`}>
              <span className="loan-timeline-icon">
                <CheckCircle2 size={16} aria-hidden="true" />
              </span>
              <div>
                <strong>{STATUS_LABELS[item.status] || item.status}</strong>
                {item.message && <p>{item.message}</p>}
                <span>{formatDate(item.changedAt)}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="loan-notice">
          Status changes will also appear in your profile notifications.
        </p>
        <button type="button" className="loan-submit" onClick={onClose}>
          Done
        </button>
      </div>
    );
  };

  return (
    <div className="loan-overlay">
      <div className="loan-card" role="dialog" aria-modal="true" aria-labelledby="loan-title">
        <button className="loan-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="loan-header">
          <Banknote size={26} color="var(--color-primary, #16a34a)" />
          <h2 id="loan-title">Student Loan Assistance</h2>
          <p>Apply once and track every update from your profile.</p>
        </div>

        {loading ? (
          <div className="loan-loading" role="status">Loading your profile...</div>
        ) : application ? (
          renderApplication()
        ) : (
          <form className="loan-body" onSubmit={handleSubmit}>
            <div className="loan-profile-note">
              {profile?.avatar ? (
                <img src={profile.avatar} alt="" className="loan-applicant-avatar" />
              ) : (
                <div className="loan-applicant-avatar loan-applicant-initial">
                  {(profile?.name || "U").trim().charAt(0).toUpperCase()}
                </div>
              )}
              <span className="loan-profile-avatar-label">{profile?.name || user?.name || "Applicant"}</span>
            </div>

            <div className="loan-section-title">Basic details</div>
            <input placeholder="Full name" autoComplete="name" required maxLength={100} value={form.name} onChange={update("name")} />
            <div className="loan-row-2">
              <input placeholder="Phone" type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="tel" maxLength={10} required value={form.phone} onChange={updateDigits("phone", 10)} />
              <input placeholder="Email" type="email" autoComplete="email" required value={form.email} onChange={update("email")} />
            </div>
            <label className="loan-field-label" htmlFor="loan-dob">Date of birth</label>
            <input id="loan-dob" aria-label="Date of birth" type="date" autoComplete="bday" max={getAdultDateCutoff()} required value={form.dob} onChange={update("dob")} />
            <span className="loan-location-hint">Applicants must be at least 18 years old.</span>
            <div className="loan-section-title">Current address</div>
            <div className="loan-address-grid">
              <input placeholder="House / flat number" autoComplete="address-line1" required maxLength={100} value={form.houseNumber} onChange={update("houseNumber")} />
              <input placeholder="Area / locality" autoComplete="address-line2" list="loan-postal-areas" required maxLength={100} value={form.area} onChange={update("area")} />
              <input placeholder="Street / nearby landmark (optional)" maxLength={100} value={form.nearby} onChange={update("nearby")} />
              <input placeholder="City" autoComplete="address-level2" required maxLength={80} value={form.city} onChange={update("city")} />
              <input placeholder="State" autoComplete="address-level1" required maxLength={80} value={form.state} onChange={update("state")} />
              <input placeholder="PIN code" type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="postal-code" required maxLength={6} value={form.postalCode} onChange={updatePostalCode} aria-describedby="loan-postal-status" />
              <datalist id="loan-postal-areas">
                {postalAreas.map((area) => <option key={area} value={area} />)}
              </datalist>
            </div>
            <span className={`loan-postal-status${postalLookup ? ` loan-postal-status--${postalLookup}` : ""}`} id="loan-postal-status" aria-live="polite">
              {postalLookup === "loading" && "Looking up locality, city, and state..."}
              {postalLookup === "success" && "City, state, and available localities filled from PIN code."}
              {postalLookup === "not-found" && "PIN code not found. Enter the address details manually."}
              {postalLookup === "error" && "Could not look up this PIN code. Enter the address details manually."}
            </span>
            <div className="loan-location-control">
              <button type="button" className="loan-location-button" onClick={detectLocation} disabled={locating}>
                <MapPin size={16} aria-hidden="true" />
                {locating ? "Finding your address..." : currentLocation ? "Update current location" : "Use current location"}
              </button>
              <span className="loan-location-hint">
                Current location fills the address fields when available. You can also enter or edit each field manually.
              </span>
            </div>

            <div className="loan-section-title">Loan details</div>
            <div className="loan-row-2">
              <input placeholder="Amount needed (₹)" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={12} required value={form.amount} onChange={updateDigits("amount", 12)} />
              <select aria-label="Loan purpose" value={form.purpose} onChange={update("purpose")}>
                <option value="rent">Rent</option>
                <option value="deposit">Security Deposit</option>
                <option value="fees">College Fees</option>
                <option value="other">Other</option>
              </select>
            </div>
            <textarea placeholder="Any extra note (optional)" maxLength={500} value={form.note} onChange={update("note")} />

            <div className="loan-section-title">Education</div>
            <div className="loan-row-2">
              <input placeholder="College / University" autoComplete="organization" required maxLength={150} value={form.college} onChange={update("college")} />
              <input placeholder="Course" required maxLength={150} value={form.course} onChange={update("course")} />
            </div>

            <div className="loan-section-title">Eligibility and verification</div>
            <div className="loan-pan-fields" role="group" aria-label="PAN number">
              {Array.from({ length: 10 }, (_, index) => {
                const numeric = index >= 5 && index <= 8;
                const alphabetic = !numeric;
                return (
                  <input
                    key={index}
                    ref={(element) => { panInputRefs.current[index] = element; }}
                    className={`loan-pan-character${index === 5 || index === 9 ? " loan-pan-character--group-start" : ""}`}
                    type="text"
                    inputMode={numeric ? "numeric" : "text"}
                    pattern={numeric ? "[0-9]" : index === 3 ? "[ABCFGHLJPT]" : "[A-Z]"}
                    aria-label={`PAN character ${index + 1}, ${numeric ? "number" : "letter"}`}
                    autoCapitalize={alphabetic ? "characters" : "off"}
                    autoComplete="off"
                    spellCheck="false"
                    required
                    maxLength={1}
                    value={form.pan[index] || ""}
                    onChange={(event) => updatePanCharacter(index, event.target.value)}
                    onKeyDown={(event) => handlePanKeyDown(event, index)}
                    onPaste={(event) => handlePanPaste(event, index)}
                  />
                );
              })}
            </div>
            <span className="loan-location-hint">
              Enter the PAN exactly as printed on the card. Format is checked; issuance is not verified online.
            </span>
            <div className="loan-row-2">
              <input placeholder="Guardian name" autoComplete="name" required maxLength={100} value={form.guardianName} onChange={update("guardianName")} />
              <input placeholder="Guardian phone" type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="off" maxLength={10} required value={form.guardianPhone} onChange={updateDigits("guardianPhone", 10)} />
            </div>
            <div className="loan-row-2">
              <input placeholder="Guardian occupation" required maxLength={100} value={form.guardianOccupation} onChange={update("guardianOccupation")} />
              <select aria-label="Family income" required value={form.familyIncomeRange} onChange={update("familyIncomeRange")}>
                <option value="">Family income</option>
                <option value="below_2l">Below ₹2L/yr</option>
                <option value="2l_5l">₹2L - ₹5L/yr</option>
                <option value="5l_10l">₹5L - ₹10L/yr</option>
                <option value="above_10l">Above ₹10L/yr</option>
              </select>
            </div>

            <div className="loan-section-title">ID verification</div>
            <select aria-label="ID type" required value={form.idType} onChange={update("idType")}>
              <option value="">Select ID type</option>
              <option value="aadhaar">Aadhaar</option>
              <option value="voter_id">Voter ID</option>
              <option value="driving_license">Driving License</option>
              <option value="college_id">College ID</option>
            </select>
            <label className="loan-file-label">
              Upload ID photo (front side)
              <input type="file" required accept="image/*" onChange={(event) => setIdPhoto(event.target.files?.[0] || null)} />
            </label>

            <label className="loan-consent">
              <input type="checkbox" checked={consentGiven} onChange={(event) => setConsentGiven(event.target.checked)} />
              <span>
                I confirm that the information provided is accurate and authorize RoomSlider to share it with lending partners. If I provide my current location, I also consent to sharing it for this application.
              </span>
            </label>

            <button type="submit" className="loan-submit" disabled={saving}>
              {saving ? "Submitting..." : "Submit application"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default LoanModal;
