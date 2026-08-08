import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Pencil,
  Trash2,
  Search,
  PlusCircle,
  MapPin,
  IndianRupee,
} from "lucide-react";

import toast from "react-hot-toast";
import api from "../../api/axios";

import "../../styles/admin/manage-rooms.css";

function ManageRooms() {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchRooms = async () => {
    try {
      const res = await api.get("/rooms?includeOccupied=true");

      const data = res.data.rooms || [];

      setRooms(data);
      setFilteredRooms(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    const keyword = search.toLowerCase();

    const filtered = rooms.filter((room) => {
      return (
        room.title?.toLowerCase().includes(keyword) ||
        room.location?.toLowerCase().includes(keyword) ||
        room.category?.toLowerCase().includes(keyword)
      );
    });

    setFilteredRooms(filtered);
  }, [search, rooms]);

  const deleteRoom = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this room?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/rooms/${id}`);

      toast.success("Room deleted successfully");

      const updatedRooms = rooms.filter((room) => room._id !== id);

      setRooms(updatedRooms);
      setFilteredRooms(updatedRooms);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete room");
    }
  };

  if (loading) {
    return (
      <div className="manage-rooms-page">
        <h2>Loading Rooms...</h2>
      </div>
    );
  }

  return (
    <div className="manage-rooms-page">

      <div className="rooms-header">

        <div>
          <h1>Manage Rooms</h1>
          <p>
            Total Rooms : <strong>{filteredRooms.length}</strong>
          </p>
        </div>

        <Link
          to="/admin/rooms/add"
          className="add-room-btn"
        >
          <PlusCircle size={18} />
          Add Room
        </Link>

      </div>

      <div className="search-box">

        <Search size={18} />

        <input
          type="text"
          placeholder="Search by title, location or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

      </div>

      {filteredRooms.length === 0 ? (

        <div className="no-room">
          <h2>No Rooms Found 😕</h2>
        </div>

      ) : (

        <div className="admin-room-grid">

          {filteredRooms.map((room) => (

            <div
              className="admin-room-card"
              key={room._id}
            >

              <img
                src={room.images?.[0]}
                alt={room.title}
              />

              <div className="room-body">

                <h3>{room.title}</h3>

                <p>
                  <MapPin size={15} />
                  {room.location}
                </p>

                <h4>
                  <IndianRupee size={17} />
                  {room.price?.toLocaleString()}
                </h4>

                <span className="category-badge">
                  {room.category}
                </span>

                <div className="room-actions">

                  <Link
                    to={`/admin/rooms/edit/${room._id}`}
                    className="edit-btn"
                  >
                    <Pencil size={16} />
                    Edit
                  </Link>

                  <button
                    className="delete-btn"
                    onClick={() => deleteRoom(room._id)}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>

                </div>

              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  );
}

export default ManageRooms;