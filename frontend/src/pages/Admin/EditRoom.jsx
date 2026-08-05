import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios";

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
    rooms: 1,
    bathrooms: 1,
    furnished: false,
    ownerName: "",
    contact: "",
    whatsapp: "",
    amenities: "",
    nearby: "",
    priority: 9999,
  });

  useEffect(() => {
    fetchRoom();
  }, []);

  const fetchRoom = async () => {
    try {
      const res = await api.get(`/rooms/${id}`);
      const room = res.data.room;

      setFormData({
        title: room.title || "",
        price: room.price || "",
        deposit: room.deposit || "",
        location: room.location || "",
        description: room.description || "",
        category: room.category || "Room",
        rooms: room.rooms || 1,
        bathrooms: room.bathrooms || 1,
        furnished: room.furnished || false,
        ownerName: room.ownerName || "",
        contact: room.contact || "",
        whatsapp: room.whatsapp || "",
        amenities: (room.amenities || []).join(", "),
        nearby: (room.nearby || []).join(", "),
        priority: room.priority || 9999,
      });
    } catch (err) {
      toast.error("Failed to load room");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
        amenities: JSON.stringify(
          formData.amenities
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
        ),
        nearby: JSON.stringify(
          formData.nearby
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
        ),
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

        <textarea
          name="amenities"
          placeholder="Amenities (comma separated)"
          value={formData.amenities}
          onChange={changeHandler}
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