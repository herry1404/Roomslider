import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios";
import LocationPicker from "../../components/map/LazyLocationPicker";
import AmenitiesInput from "../../components/forms/AmenitiesInput";
import HourlySlabsInput from "../../components/forms/HourlySlabsInput";
import { normalizeAmenities } from "../../utils/amenities";

import "../../styles/add-room.css";

function EditRoom() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    deposit: "",
    location: "",
    description: "",
    category: "Room",
    gender: "Any",
    sharingType: "",
    rooms: 1,
    bathrooms: 1,
    furnished: false,
    ownerName: "",
    contact: "",
    whatsapp: "",
    amenities: [],
    nearby: "",
    priority: 9999,
    latitude: null,
    longitude: null,
    hourlyEnabled: false,
    hourlyOnly: false,
    hourlySlabs: [],
    extraHourPrice: "",
    checkIn24x7: false,
  });

  useEffect(() => {
    let active = true;
    api.get(`/rooms/${id}`)
      .then((res) => {
        if (!active) return;
        const room = res.data.room;
        setFormData({
          title: room.title || "",
          price: room.price || "",
          deposit: room.deposit || "",
          location: room.location || "",
          description: room.description || "",
          category: room.category || "Room",
          gender: room.gender || "Any",
          sharingType: room.sharingType || "",
          rooms: room.rooms || 1,
          bathrooms: room.bathrooms || 1,
          furnished: room.furnished || false,
          ownerName: room.ownerName || "",
          contact: room.contact || "",
          whatsapp: room.whatsapp || "",
          amenities: normalizeAmenities(room.amenities),
          nearby: (room.nearby || []).join(", "),
          priority: room.priority || 9999,
          latitude: room.latitude || null,
          longitude: room.longitude || null,
          hourlyEnabled: room.hourlyEnabled || false,
          hourlyOnly: room.hourlyOnly || false,
          hourlySlabs: (room.hourlySlabs || []).map((slab) => ({
            hours: slab.hours,
            price: slab.price,
          })),
          extraHourPrice: room.extraHourPrice || "",
          checkIn24x7: room.checkIn24x7 || false,
        });
      })
      .catch((error) => {
        if (!active) return;
        toast.error("Failed to load room");
        console.error(error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [id]);

  const changeHandler = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const payload = {
        ...formData,
        hourlyOnly: formData.hourlyEnabled && formData.hourlyOnly,
        amenities: JSON.stringify(normalizeAmenities(formData.amenities)),
        nearby: JSON.stringify(
          formData.nearby
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
        ),
        hourlySlabs: formData.hourlySlabs
          .filter((slab) => slab.hours !== "" && slab.price !== "")
          .map((slab) => ({ hours: Number(slab.hours), price: Number(slab.price) })),
      };

      await api.put(`/rooms/${id}`, payload);

      toast.success("Room Updated Successfully");

      navigate("/admin/rooms");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="add-room-page">
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div className="add-room-page">
      <h1>Edit Room</h1>

      <form className="add-room-form" onSubmit={submitHandler}>

        <input
          name="title"
          placeholder="Room Title"
          value={formData.title}
          onChange={changeHandler}
          required
        />

        <input
          name="price"
          type="number"
          placeholder="Price"
          value={formData.price}
          onChange={changeHandler}
          required
        />

        <input
          name="deposit"
          type="number"
          placeholder="Deposit"
          value={formData.deposit}
          onChange={changeHandler}
        />

        <input
          name="location"
          placeholder="Location"
          value={formData.location}
          onChange={changeHandler}
          required
        />

        <LocationPicker
          latitude={formData.latitude}
          longitude={formData.longitude}
          onChange={(lat, lng) => setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }))}
        />

        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={changeHandler}
        />

        <select
          name="category"
          value={formData.category}
          onChange={changeHandler}
        >
          <option>Room</option>
          <option>PG</option>
          <option>Hostel</option>
          <option>Flat</option>
        </select>

        <select
          name="sharingType"
          value={formData.sharingType}
          onChange={changeHandler}
        >
          <option value="">Sharing type (not set)</option>
          <option value="Single">Single sharing</option>
          <option value="Double">Double sharing</option>
          <option value="Triple">Triple sharing</option>
          <option value="Other">Other</option>
        </select>

        <select
          name="gender"
          value={formData.gender}
          onChange={changeHandler}
        >
          <option value="Any">Any (Male + Female)</option>
          <option value="Male">Male Only</option>
          <option value="Female">Female Only</option>
        </select>

        <input
          name="rooms"
          type="number"
          placeholder="Rooms"
          value={formData.rooms}
          onChange={changeHandler}
        />

        <input
          name="bathrooms"
          type="number"
          placeholder="Bathrooms"
          value={formData.bathrooms}
          onChange={changeHandler}
        />

        <label>
          <input
            type="checkbox"
            name="furnished"
            checked={formData.furnished}
            onChange={changeHandler}
          />
          Furnished
        </label>

        <input
          name="ownerName"
          placeholder="Owner Name"
          value={formData.ownerName}
          onChange={changeHandler}
        />

        <input
          name="contact"
          placeholder="Contact Number"
          value={formData.contact}
          onChange={changeHandler}
        />

        <input
          name="whatsapp"
          placeholder="WhatsApp Number"
          value={formData.whatsapp}
          onChange={changeHandler}
        />

        <section className="form-section">
          <h2>Amenities</h2>
          <AmenitiesInput
            value={formData.amenities}
            onChange={(amenities) => setFormData((prev) => ({ ...prev, amenities }))}
          />
        </section>

        <HourlySlabsInput
          enabled={formData.hourlyEnabled}
          onEnabledChange={(hourlyEnabled) => setFormData((prev) => ({
            ...prev,
            hourlyEnabled,
            hourlyOnly: hourlyEnabled ? prev.hourlyOnly : false,
          }))}
          hourlyOnly={formData.hourlyOnly}
          onHourlyOnlyChange={(hourlyOnly) => setFormData((prev) => ({ ...prev, hourlyOnly }))}
          slabs={formData.hourlySlabs}
          onSlabsChange={(hourlySlabs) => setFormData((prev) => ({ ...prev, hourlySlabs }))}
          extraHourPrice={formData.extraHourPrice}
          onExtraHourPriceChange={(extraHourPrice) => setFormData((prev) => ({ ...prev, extraHourPrice }))}
          checkIn24x7={formData.checkIn24x7}
          onCheckIn24x7Change={(checkIn24x7) => setFormData((prev) => ({ ...prev, checkIn24x7 }))}
        />

        <textarea
          name="nearby"
          placeholder="Nearby Places (comma separated)"
          value={formData.nearby}
          onChange={changeHandler}
        />

        <input
          name="priority"
          type="number"
          value={formData.priority}
          onChange={changeHandler}
        />

        <button type="submit" disabled={saving}>
          {saving ? "Updating..." : "Update Room"}
        </button>

      </form>
    </div>
  );
}
export default EditRoom;