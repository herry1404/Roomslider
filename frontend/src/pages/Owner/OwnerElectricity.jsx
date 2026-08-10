import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../../api/axios";

import "../../styles/owner/dashboard.css";

function OwnerElectricity() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ratePerUnit, setRatePerUnit] = useState("");
  const [rooms, setRooms] = useState([]);
  const [unitsInput, setUnitsInput] = useState({});

  const fetchSetup = async () => {
    try {
      const res = await api.get("/electricity/my-setup");
      setRatePerUnit(res.data.ratePerUnit || "");
      setRooms(res.data.rooms || []);

      const initialUnits = {};
      res.data.rooms.forEach((r) => {
        initialUnits[r._id] = r.currentBill?.unitsConsumed ?? "";
      });
      setUnitsInput(initialUnits);
    } catch (error) {
      console.error("ELECTRICITY SETUP ERROR:", error);
      toast.error(error.response?.data?.message || "Failed to load electricity setup");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSetup();
  }, []);

  const handleSaveRate = async () => {
    if (!ratePerUnit || Number(ratePerUnit) <= 0) {
      toast.error("Enter a valid rate per unit");
      return;
    }

    try {
      await api.put("/electricity/rate", { ratePerUnit: Number(ratePerUnit) });
      toast.success("Rate updated");
    } catch (error) {
      console.error("SET RATE ERROR:", error);
      toast.error(error.response?.data?.message || "Failed to update rate");
    }
  };

  const handleUnitsChange = (roomId, value) => {
    setUnitsInput({ ...unitsInput, [roomId]: value });
  };

  const handleSaveAll = async () => {
    if (!ratePerUnit || Number(ratePerUnit) <= 0) {
      toast.error("Set your rate per unit first");
      return;
    }

    const now = new Date();
    const entries = rooms
      .filter((r) => unitsInput[r._id] !== "" && unitsInput[r._id] !== undefined)
      .map((r) => ({
        roomId: r._id,
        unitsConsumed: Number(unitsInput[r._id]),
      }));

    if (entries.length === 0) {
      toast.error("Enter units for at least one room");
      return;
    }

    setSaving(true);
    try {
      await api.post("/electricity/bulk-update", {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        entries,
      });
      toast.success("Electricity bills updated");
      fetchSetup();
    } catch (error) {
      console.error("BULK UPDATE ERROR:", error);
      toast.error(error.response?.data?.message || "Failed to update bills");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="owner-dashboard">
        <p>Loading electricity setup...</p>
      </div>
    );
  }

  return (
    <div className="owner-dashboard">
      <button className="owner-detail-back" onClick={() => navigate("/owner/dashboard")}>
        ← Back to Dashboard
      </button>

      <div className="owner-dashboard-top">
        <div>
          <h2>Electricity Bills</h2>
          <p>Set your rate and update this month's units for all rooms in one place.</p>
        </div>
      </div>

      <div className="owner-electricity-rate-bar">
        <label>Rate per unit (₹)</label>
        <input
          type="number"
          value={ratePerUnit}
          onChange={(e) => setRatePerUnit(e.target.value)}
          placeholder="e.g. 10"
        />
        <button className="owner-btn owner-btn-secondary" onClick={handleSaveRate}>
          Save Rate
        </button>
      </div>

      {rooms.length === 0 ? (
        <div className="owner-empty-state">
          <p>No occupied rooms to bill yet.</p>
        </div>
      ) : (
        <>
          <div className="owner-electricity-table-wrapper">
          <table className="owner-electricity-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Tenant</th>
                <th>Units This Month</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => {
                const units = unitsInput[room._id] ?? "";
                const amount = units && ratePerUnit ? Number(units) * Number(ratePerUnit) : 0;

                return (
                  <tr key={room._id}>
                    <td>
                      {room.title}
                      {room.roomNumber && ` · #${room.roomNumber}`}
                    </td>
                    <td>{room.tenantName || "—"}</td>
                    <td>
                      <input
                        type="number"
                        value={units}
                        onChange={(e) => handleUnitsChange(room._id, e.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td className="owner-electricity-amount">
                      ₹{amount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>

          <div style={{ marginTop: 20 }}>
            <button
              className="owner-btn owner-btn-primary"
              onClick={handleSaveAll}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save All Bills"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default OwnerElectricity;
