import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../../api/axios";

import "../../styles/add-room.css";

function AddRoom() {

    /* ======================================================
                        NAVIGATION
    ====================================================== */

    const navigate = useNavigate();



    /* ======================================================
                        AMENITIES
    ====================================================== */

    const amenitiesList = [

        "WiFi",
        "AC",
        "Cooler",
        "Fan",
        "RO Water",

        "Power Backup",
        "Parking",
        "Lift",
        "CCTV",

        "Kitchen",
        "Fridge",
        "Washing Machine",

        "Bed",
        "Mattress",
        "Wardrobe",

        "Study Table",
        "Chair",
        "TV",

        "Balcony"

    ];



    /* ======================================================
                    NEARBY PLACES
    ====================================================== */

    const nearbyPlaces = [

        "College",

        "Bus Stop",

        "Railway Station",

        "Hospital",

        "Market",

        "ATM"

    ];



    /* ======================================================
                        STATES
    ====================================================== */

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

        priority: ""

    });



    /* ======================================================
                    COMMON INPUT CHANGE
    ====================================================== */

    const handleChange = (e) => {

        const { name, value, type, checked } = e.target;

        setFormData((prev) => ({

            ...prev,

            [name]: type === "checkbox" ? checked : value

        }));

    };



    /* ======================================================
                        IMAGE CHANGE
    ====================================================== */

    const handleImageChange = (e) => {

        const files = Array.from(e.target.files);

        setImages(files);

    };



    /* ======================================================
                    REMOVE IMAGE
    ====================================================== */

    const removeImage = (index) => {

        setImages(images.filter((_, i) => i !== index));

    };



    /* ======================================================
                    AMENITIES
    ====================================================== */

    const handleAmenityChange = (item) => {

        setFormData((prev) => ({

            ...prev,

            amenities: prev.amenities.includes(item)

                ? prev.amenities.filter((a) => a !== item)

                : [...prev.amenities, item]

        }));

    };



    /* ======================================================
                    NEARBY
    ====================================================== */

    const handleNearbyChange = (item) => {

        setFormData((prev) => ({

            ...prev,

            nearby: prev.nearby.includes(item)

                ? prev.nearby.filter((a) => a !== item)

                : [...prev.nearby, item]

        }));

    };



    /* ======================================================
                        SUBMIT
    ====================================================== */

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (images.length === 0) {

            toast.error("Please select room images");

            return;

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
            data.append("priority", formData.priority);

            images.forEach((image) => {
                data.append("images", image);
            });

            await api.post("/rooms", data, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast.success("Room published successfully ✅");

            navigate("/admin/rooms");

        } catch (error) {

            toast.error(
                error.response?.data?.message || "Room publish nahi ho paya"
            );

        } finally {

            setLoading(false);

        }

    };



    /* ======================================================
                        RETURN
    ====================================================== */

    return (

        <div className="add-room-page">

            <div className="add-room-card">

                <h1>Add New Room</h1>

                <form onSubmit={handleSubmit}>


{/* ===========================
        BASIC DETAILS
=========================== */}

<div className="form-section">

    <h2 className="section-title">
        Basic Details
    </h2>

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



{/* =========================
        IMAGE UPLOAD
========================= */}

<div className="form-section">

    <h2>Room Images</h2>

    <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleImageChange}
    />

    <div className="preview-grid">

        {

            images.map((image,index)=>(

                <div
                    className="preview-card"
                    key={index}
                >

                    <img
                        src={URL.createObjectURL(image)}
                        alt=""
                    />

                    <button
                        type="button"
                        onClick={()=>removeImage(index)}
                    >

                        Remove

                    </button>

                </div>

            ))

        }

    </div>

</div>



{/* =========================
        ROOM DETAILS
========================= */}

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

{/* =========================
        OWNER DETAILS
========================= */}

<div className="form-section">

    <h2>Display Priority (Optional)</h2>

    <p style={{fontSize:"13px", color:"#64748b", marginBottom:"10px"}}>
        Chhota number = upar dikhega Home page ke "Latest Rooms" mein.
        Khaali chhod do agar priority set nahi karni (normal date-order use hoga).
    </p>

    <div className="input-grid">

        <input
            type="number"
            name="priority"
            placeholder="Position Number (e.g. 1, 2, 3...)"
            value={formData.priority}
            onChange={handleChange}
            min="1"
        />

    </div>

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



{/* =========================
        AMENITIES
========================= */}

<div className="form-section">

    <h2>Amenities</h2>

    <div className="amenities-grid">

        {

            amenitiesList.map((item)=>(

                <label key={item}>

                    <input
                        type="checkbox"
                        checked={formData.amenities.includes(item)}
                        onChange={()=>handleAmenityChange(item)}
                    />

                    {item}

                </label>

            ))

        }

    </div>

</div>



{/* =========================
        NEARBY PLACES
========================= */}

<div className="form-section">

    <h2>Nearby Places</h2>

    <div className="amenities-grid">

        {

            nearbyPlaces.map((item)=>(

                <label key={item}>

                    <input
                        type="checkbox"
                        checked={formData.nearby.includes(item)}
                        onChange={()=>handleNearbyChange(item)}
                    />

                    {item}

                </label>

            ))

        }

    </div>

</div>



{/* =========================
        DESCRIPTION
========================= */}

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



{/* =========================
        SUBMIT BUTTON
========================= */}

<button
    className="publish-btn"
    disabled={loading}
>

    {

        loading

        ?

        "Publishing..."

        :

        "Publish Room"

    }

</button>

                </form>

            </div>

        </div>

    );

}

export default AddRoom;