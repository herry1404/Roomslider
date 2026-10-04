import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../../api/axios";
import LocationPicker from "../../components/map/LocationPicker";

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

    const [properties, setProperties] = useState([]);
    const [propertyId, setPropertyId] = useState("");
    const [buildingId, setBuildingId] = useState("");
    const [newPropertyName, setNewPropertyName] = useState("");
    const [newBuildingName, setNewBuildingName] = useState("");
    const selectedProperty = properties.find((property) => property._id === propertyId);

    useEffect(() => {
        api.get("/properties/mine")
            .then((res) => setProperties(res.data?.properties || []))
            .catch((error) => {
                toast.error(error.response?.data?.message || "Could not load your properties");
            });
    }, []);

    const [mode, setMode] = useState("single"); // "single" or "multiple"

    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState([]);
    const [formData, setFormData] = useState({
        title: "",
        category: "Room",
        sharingType: "",
        location: "",
        price: "",
        deposit: "",
        rooms: "",
        bathrooms: "",
        furnished: false,
        description: "",
        amenities: [],
        nearby: [],
        roomNumberStart: "",
        roomNumberEnd: "",
        latitude: null,
        longitude: null,
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

        if (!propertyId && !newPropertyName.trim()) {
            toast.error("Please enter a property name");
            return;
        }
        if (!buildingId && !newBuildingName.trim()) {
            toast.error("Please select or enter a building name");
            return;
        }

        setLoading(true);

        try {
            let resolvedPropertyId = propertyId;
            let resolvedBuildingId = buildingId;
            if (!resolvedPropertyId) {
                const propertyRes = await api.post("/properties", {
                    name: newPropertyName.trim(),
                    area: formData.location.trim(),
                    propertyType: formData.category,
                    buildingName: newBuildingName.trim(),
                });
                resolvedPropertyId = propertyRes.data.property._id;
                resolvedBuildingId =
                    propertyRes.data.property.buildings?.[0]?._id || "";
            }

            if (!resolvedBuildingId) {
                const buildingRes = await api.post(
                    `/properties/${resolvedPropertyId}/buildings`,
                    { name: newBuildingName.trim() }
                );
                resolvedBuildingId = buildingRes.data.building._id;
            }

            const data = new FormData();

            data.append("title", formData.title);
            data.append("price", formData.price);
            data.append("deposit", formData.deposit);
            data.append("location", formData.location);
            data.append("category", formData.category);
            if (formData.sharingType) data.append("sharingType", formData.sharingType);
            data.append("propertyId", resolvedPropertyId);
            data.append("buildingId", resolvedBuildingId);
            data.append("rooms", formData.rooms);
            data.append("bathrooms", formData.bathrooms);
            data.append("furnished", formData.furnished);
            data.append("description", formData.description);
            data.append("amenities", JSON.stringify(formData.amenities));
            data.append("nearby", JSON.stringify(formData.nearby));
            if (formData.latitude) data.append("latitude", formData.latitude);
            if (formData.longitude) data.append("longitude", formData.longitude);

            images.forEach((image) => {
                data.append("images", image);
            });

            if (mode === "multiple") {
                data.append("roomNumberStart", formData.roomNumberStart);
                data.append("roomNumberEnd", formData.roomNumberEnd);

                const res = await api.post("/rooms/bulk", data);

                toast.success(res.data.message || "Rooms published successfully ✅");
            } else {
                await api.post("/rooms", data);

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

                    <div className="form-section">
                        <h2 className="section-title">Property & Building</h2>
                        <select
                            value={propertyId}
                            onChange={(e) => {
                                setPropertyId(e.target.value);
                                setBuildingId("");
                            }}
                        >
                            <option value="">Create a new property</option>
                            {properties.map((property) => (
                                <option key={property._id} value={property._id}>
                                    {property.name} - {property.area}
                                </option>
                            ))}
                        </select>

                        {!propertyId && (
                            <input
                                type="text"
                                value={newPropertyName}
                                onChange={(e) => setNewPropertyName(e.target.value)}
                                placeholder="Property name (e.g. Sunrise Residency)"
                                required
                            />
                        )}

                        {selectedProperty?.buildings?.length > 0 && (
                            <select
                                value={buildingId}
                                onChange={(e) => setBuildingId(e.target.value)}
                            >
                                <option value="">Create a new building</option>
                                {selectedProperty.buildings.map((building) => (
                                    <option key={building._id} value={building._id}>
                                        {building.name}
                                    </option>
                                ))}
                            </select>
                        )}

                        {!buildingId && (
                            <input
                                type="text"
                                value={newBuildingName}
                                onChange={(e) => setNewBuildingName(e.target.value)}
                                placeholder="Building name (e.g. Block A)"
                                required
                            />
                        )}
                    </div>

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

                            <select
                                name="sharingType"
                                value={formData.sharingType}
                                onChange={handleChange}
                            >
                                <option value="">Sharing type (optional)</option>
                                <option value="Single">Single sharing</option>
                                <option value="Double">Double sharing</option>
                                <option value="Triple">Triple sharing</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <LocationPicker
                        latitude={formData.latitude}
                        longitude={formData.longitude}
                        onChange={(lat, lng) => setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }))}
                    />

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
                                    <img src={URL.createObjectURL(image)} alt="" loading="lazy" />
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
