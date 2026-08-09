import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";

import api from "../../api/axios";

import "../../styles/owner/dashboard.css";

function OwnerExpenses() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState({
    title: "",
    category: "other",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [expensesRes, summaryRes] = await Promise.all([
        api.get("/expenses"),
        api.get("/expenses/summary"),
      ]);
      setExpenses(expensesRes.data.expenses || []);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error("EXPENSES FETCH ERROR:", error);
      toast.error(error.response?.data?.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddExpense = async (e) => {
    e.preventDefault();

    if (!form.title || !form.amount || Number(form.amount) <= 0) {
      toast.error("Enter a title and valid amount");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/expenses", form);
      toast.success("Expense added");
      setForm({ title: "", category: "other", amount: "", date: new Date().toISOString().slice(0, 10) });
      fetchData();
    } catch (error) {
      console.error("ADD EXPENSE ERROR:", error);
      toast.error(error.response?.data?.message || "Failed to add expense");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense?")) return;

    try {
      await api.delete(`/expenses/${id}`);
      toast.success("Expense deleted");
      fetchData();
    } catch (error) {
      console.error("DELETE EXPENSE ERROR:", error);
      toast.error(error.response?.data?.message || "Failed to delete expense");
    }
  };

  if (loading) {
    return (
      <div className="owner-dashboard">
        <p>Loading expenses...</p>
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
          <h2>Expenses & Profit</h2>
          <p>Track your maintenance costs and see this month's profit at a glance.</p>
        </div>
      </div>

      {summary && (
        <div className="owner-summary-grid">
          <div className="owner-summary-card income">
            <span>Rent Collected (This Month)</span>
            <h2>₹{summary.totalIncome.toLocaleString("en-IN")}</h2>
          </div>
          <div className="owner-summary-card expense">
            <span>Expenses (This Month)</span>
            <h2>₹{summary.totalExpenses.toLocaleString("en-IN")}</h2>
          </div>
          <div className="owner-summary-card profit">
            <span>Profit</span>
            <h2>₹{summary.profit.toLocaleString("en-IN")}</h2>
          </div>
        </div>
      )}

      <form className="owner-expense-form" onSubmit={handleAddExpense}>
        <div className="owner-form-group">
          <label>Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. AC repair"
          />
        </div>
        <div className="owner-form-group">
          <label>Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="repair">Repair</option>
            <option value="maintenance">Maintenance</option>
            <option value="utility">Utility</option>
            <option value="cleaning">Cleaning</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="owner-form-group">
          <label>Amount (₹)</label>
          <input
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0"
          />
        </div>
        <div className="owner-form-group">
          <label>Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>
        <button type="submit" className="owner-btn owner-btn-primary" disabled={submitting}>
          {submitting ? "Adding..." : "Add Expense"}
        </button>
      </form>

      <div className="owner-detail-card">
        <h3>All Expenses</h3>
        {expenses.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>No expenses recorded yet.</p>
        ) : (
          expenses.map((exp) => (
            <div key={exp._id} className="owner-expense-list-item">
              <div>
                <div className="owner-expense-title">{exp.title}</div>
                <div className="owner-expense-meta">
                  {new Date(exp.date).toLocaleDateString("en-IN")} · {exp.category}
                  {exp.room && ` · ${exp.room.title}`}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <div className="owner-expense-amount">₹{exp.amount.toLocaleString("en-IN")}</div>
                <button className="owner-expense-delete" onClick={() => handleDelete(exp._id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default OwnerExpenses;
