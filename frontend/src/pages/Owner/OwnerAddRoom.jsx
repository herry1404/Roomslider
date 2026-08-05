import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../../api/axios";

import "../../styles/add-room.css";

function OwnerAddRoom() {

    const navigate = useNavigate();

    const amenitiesList = [
        "WiFi", "AC", "Cooler", "Fan", "RO Water",
        "Power Backup", "Parking", "Lift", "CCTV",
        "Kitchen", "Fridge", "Washing Machine",
        "Bed", "Mattress", "Wardrobe",
        "Study Table", "Chair", "TV",
        "Balcony"
    ];

    const nearbyPlaces = [
        "College", "Bus Stop", "Railway Station", "Hospital", "Market", "ATM"
    ];

    const [mode, setMode] = useState("single"); // "single" or "multiple"

    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState([]);
    const [formData, setFormData] = useState({
        title: "",
        category: "Room",
        location: "",
        price: "",
        deposit: "",
        rooms: "",
        bathrooms: "",
        furnished: false,
        ownerName: "",
        contact: "",
        whatsapp: "",
        description: "",
        amenities: [],
        nearby: [],
        roomNumberStart: "",
        roomNumberEnd: "",
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setImages(files);
    };

    const removeImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleAmenityChange = (item) => {
        setFormData((prev) => ({
            ...prev,
            amenities: prev.amenities.includes(item)
                ? prev.amenities.filter((a) => a !== item)
                : [...prev.amenities, item]
        }));
    };

    const handleNearbyChange = (item) => {
        setFormData((prev) => ({
            ...prev,
            nearby: prev.nearby.includes(item)
                ? prev.nearby.filter((a) => a !== item)
                : [...prev.nearby, item]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (images.length === 0) {
            toast.error("Please select room images");
            return;
        }

        if (mode === "multiple") {
            if (!formData.roomNumberStart || !formData.roomNumberEnd) {
                toast.error("Please enter both a starting and ending room number");
                return;
            }
            if (Number(formData.roomNumberStart) > Number(formData.roomNumberEnd)) {
                toast.error("Starting room number must be less than or equal to ending room number");
                return;
            }
        }

        setLoading(true);

        try {
            const data = new FormData();

            data.append("title", formData.title);
            data.append("price", formData.price);
            data.append("deposit", formData.deposit);
            data.append("location", formData.location);
            data.append("category", formData.category);
            data.append("rooms", formData.rooms);
            data.append("bathrooms", formData.bathrooms);
            data.append("furnished", formData.furnished);
            data.append("ownerName", formData.ownerName);
            data.append("contact", formData.contact);
            data.append("whatsapp", formData.whatsapp);
            data.append("description", formData.description);
            data.append("amenities", JSON.stringify(formData.amenities));
            data.append("nearby", JSON.stringify(formData.nearby));

            images.forEach((image) => {
                data.append("images", image);
            });

            if (mode === "multiple") {
                data.append("roomNumberStart", formData.roomNumberStart);
                data.append("roomNumberEnd", formData.roomNumberEnd);

                const res = await api.post("/rooms/bulk", data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });

                toast.success(res.data.message || "Rooms published successfully ✅");
            } else {
                await api.post("/rooms", data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });

                toast.success("Room published successfully ✅");
            }

            navigate("/owner/dashboard");

        } catch (error) {
            toast.error(
                error.response?.data?.message || "Room publish nahi ho paya"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-room-page">
            <div className="add-room-card">
                <h1>Add New Room</h1>

                <div className="form-section">
                    <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                        <button
                            type="button"
                            onClick={() => setMode("single")}
                            className={mode === "single" ? "publish-btn" : ""}
                            style={mode !== "single" ? { background: "#e2e8f0", color: "#1e293b" } : {}}
                        >
                            Add Single Room
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("multiple")}
                            className={mode === "multiple" ? "publish-btn" : ""}
                            style={mode !== "multiple" ? { background: "#e2e8f0", color: "#1e293b" } : {}}
                        >
                            Add Multiple Rooms
                        </button>
                    </div>
                    {mode === "multiple" && (
                        <p style={{ fontSize: "13px", color: "#64748b" }}>
                            Fill the details once below — they'll be applied to every room in the range
                            (e.g. Room 101 to Room 110), each getting its own room number and status.
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit}>

                    {mode === "multiple" && (
                        <div className="form-section">
                            <h2 className="section-title">Room Number Range</h2>

                            <div className="form-row">
                                <input
                                    type="number"
                                    name="roomNumberStart"
                                    placeholder="Starting Room Number (e.g. 101)"
                                    value={formData.roomNumberStart}
                                    onChange={handleChange}
                                    required
                                />

                                <input
                                    type="number"
                                    name="roomNumberEnd"
                                    placeholder="Ending Room Number (e.g. 110)"
                                    value={formData.roomNumberEnd}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-section">
                        <h2 className="section-title">Basic Details</h2>

                        <div className="form-row">
                            <input
                                type="text"
                                name="title"
                                placeholder="Room Title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />

                            <input
                                type="number"
                                name="price"
                                placeholder="Monthly Rent"
                                value={formData.price}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-row">
                            <input
                                type="text"
                                name="location"
                                placeholder="Location"
                                value={formData.location}
                                onChange={handleChange}
                                required
                            />

                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                            >
                                <option value="Room">Room</option>
                                <option value="PG">PG</option>
                                <option value="Hostel">Hostel</option>
                                <option value="Flat">Flat</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>Room Images</h2>

                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageChange}
                        />

                        <div className="preview-grid">
                            {images.map((image, index) => (
                                <div className="preview-card" key={index}>
                                    <img src={URL.createObjectURL(image)} alt="" />
                                    <button type="button" onClick={() => removeImage(index)}>
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>Room Details</h2>

                        <div className="input-grid">
                            <input
                                type="number"
                                name="rooms"
                                placeholder="Bedrooms"
                                value={formData.rooms}
                                onChange={handleChange}
                            />

                            <input
                                type="number"
                                name="bathrooms"
                                placeholder="Bathrooms"
                                value={formData.bathrooms}
                                onChange={handleChange}
                            />
                        </div>

                        <label className="checkbox">
                            <input
                                type="checkbox"
                                name="furnished"
                                checked={formData.furnished}
                                onChange={handleChange}
                            />
                            Fully Furnished
                        </label>
                    </div>

                    <div className="form-section">
                        <h2>Owner Details</h2>

                        <div className="input-grid">
                            <input
                                type="text"
                                name="ownerName"
                                placeholder="Owner Name"
                                value={formData.ownerName}
                                onChange={handleChange}
                            />

                            <input
                                type="text"
                                name="contact"
                                placeholder="Contact Number"
                                value={formData.contact}
                                onChange={handleChange}
                            />

                            <input
                                type="text"
                                name="whatsapp"
                                placeholder="WhatsApp Number"
                                value={formData.whatsapp}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>Amenities</h2>

                        <div className="amenities-grid">
                            {amenitiesList.map((item) => (
                                <label key={item}>
                                    <input
                                        type="checkbox"
                                        checked={formData.amenities.includes(item)}
                                        onChange={() => handleAmenityChange(item)}
                                    />
                                    {item}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>Nearby Places</h2>

                        <div className="amenities-grid">
                            {nearbyPlaces.map((item) => (
                                <label key={item}>
                                    <input
                                        type="checkbox"
                                        checked={formData.nearby.includes(item)}
                                        onChange={() => handleNearbyChange(item)}
                                    />
                                    {item}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>Description</h2>

                        <textarea
                            name="description"
                            rows="6"
                            placeholder="Write complete room description..."
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </div>

                    <button className="publish-btn" disabled={loading}>
                        {loading
                            ? "Publishing..."
                            : mode === "multiple"
                            ? "Publish Rooms"
                            : "Publish Room"}
                    </button>

                </form>
            </div>
        </div>
    );
}

export default OwnerAddRoom;
