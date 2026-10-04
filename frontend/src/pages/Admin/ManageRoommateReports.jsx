import { useCallback, useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import EmptyState from "../../components/ui/EmptyState";
import "../../styles/admin/theme.css";

function ManageRoommateReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    try {
      const response = await api.get("/roommates/admin/reports");
      setReports(response.data.reports || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Reports could not be loaded");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(loadReports);
  }, [loadReports]);

  const setStatus = async (reportId, status) => {
    try {
      await api.put(`/roommates/admin/reports/${reportId}`, { status });
      setReports((current) => current.map((report) =>
        report._id === reportId ? { ...report, status } : report
      ));
      toast.success(`Report marked ${status}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Report status could not be updated");
    }
  };

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div><h1>Roommate reports</h1><p>Review user reports and update their status.</p></div>
      </header>
      {loading ? <div className="admin-empty">Loading reports…</div> : reports.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="No reports yet" description="User reports will appear here for review." className="admin-empty" />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Reported user</th><th>Reported by</th><th>Reason</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>{reports.map((report) => (
              <tr key={report._id}>
                <td>{report.reported?.name || "Deleted user"}</td>
                <td>{report.reporter?.name || "Deleted user"}</td>
                <td className="roommate-report-reason">{report.reason || "No details provided"}</td>
                <td>{new Date(report.createdAt).toLocaleDateString("en-IN")}</td>
                <td>
                  <select value={report.status || "open"} onChange={(event) => setStatus(report._id, event.target.value)} aria-label={`Set report status for ${report.reported?.name || "user"}`}>
                    <option value="open">Open</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default ManageRoommateReports;
