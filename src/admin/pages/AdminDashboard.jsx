import { useState, useEffect } from "react";
import { useAdmin } from "../../context/AdminContext";

export default function AdminDashboard() {
  const { headers } = useAdmin();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/dashboard", { headers })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError("Failed to load dashboard."));
  }, []);

  if (error) return <p className="admin-error">{error}</p>;
  if (!data) return <p className="admin-loading">Loading…</p>;

  return (
    <div>
      <h2>Dashboard</h2>
      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total revenue</div>
          <div className="admin-stat-value">${data.total_revenue.toFixed(2)}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Revenue today</div>
          <div className="admin-stat-value">${data.revenue_today.toFixed(2)}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total orders</div>
          <div className="admin-stat-value">{data.total_orders}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Orders today</div>
          <div className="admin-stat-value">{data.orders_today}</div>
        </div>
        <div className="admin-stat-card admin-stat-card--warn">
          <div className="admin-stat-label">Pending fulfillment</div>
          <div className="admin-stat-value">{data.pending_book_fulfillment}</div>
        </div>
        <div className="admin-stat-card admin-stat-card--warn">
          <div className="admin-stat-label">Maps missing file URL</div>
          <div className="admin-stat-value">{data.maps_missing_file_url}</div>
        </div>
      </div>

      {data.low_stock_products.length > 0 && (
        <div className="admin-alert">
          <strong>Low stock:</strong>{" "}
          {data.low_stock_products.map((p) => `${p.name} (${p.qty})`).join(", ")}
        </div>
      )}
    </div>
  );
}
