import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Flag } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios";
import EmptyState from "../../components/ui/EmptyState";
import { roomPath } from "../../utils/roomUrl";
import "../../styles/admin/theme.css";

function ManageListingReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/listing-reports");
      setReports(data.reports || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Listing reports could not be loaded");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(loadReports);
  }, [loadReports]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/listing-reports/${id}`, { status });
      setReports((current) => current.map((report) => report._id === id ? { ...report, status } : report));
      toast.success(`Report marked ${status}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Report status could not be updated");
    }
  };

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div><h1>Listing reports</h1><p>Review reports submitted on room and property listings.</p></div>
        <Flag size={25} />
      </header>
      {loading ? <div className="admin-empty">Loading reports…</div> : reports.length === 0 ? (
        <EmptyState icon={Flag} title="No listing reports yet" description="Reports from listing pages will appear here." className="admin-empty" />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Listing</th><th>Reported by</th><th>Reason</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report._id}>
                  <td>{report.room ? <Link to={roomPath(report.room)} target="_blank" rel="noreferrer">{report.room.title} <ExternalLink size={13} /></Link> : "Deleted listing"}</td>
                  <td>{report.reporter?.name || "Deleted user"}</td>
                  <td>{report.reason}</td>
                  <td>{new Date(report.createdAt).toLocaleDateString("en-IN")}</td>
                  <td>
                    <select value={report.status} onChange={(event) => updateStatus(report._id, event.target.value)} aria-label={`Set report status for ${report.room?.title || "listing"}`}>
                      <option value="open">Open</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default ManageListingReports;
