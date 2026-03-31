import { useState, useEffect } from "react";
import { useAdmin } from "../../context/AdminContext";

const STATUS_OPTIONS = ["pending", "paid", "fulfilled", "shipped"];

export default function AdminOrders() {
  const { headers } = useAdmin();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { loadOrders(); }, [filter]);

  async function loadOrders() {
    const url = filter ? `/api/admin/orders?status=${filter}` : "/api/admin/orders";
    const res = await fetch(url, { headers });
    const data = await res.json();
    setOrders(data);
  }

  async function updateStatus(orderId, status) {
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadOrders();
  }

  return (
    <div>
      <h2>Orders</h2>
      <div className="admin-filters">
        <label>Filter by status: </label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="admin-count">{orders.length} orders</span>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th><th>Date</th><th>Customer</th><th>Email</th>
            <th>Total</th><th>Status</th><th></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <>
              <tr key={o.id} onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                  style={{ cursor: "pointer" }}>
                <td>#{o.id}</td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
                <td>{o.customer_name}</td>
                <td>{o.customer_email}</td>
                <td>${o.total_amount.toFixed(2)}</td>
                <td>
                  <select
                    value={o.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    className={"admin-badge admin-badge--" + o.status}
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td>{expanded === o.id ? "▲" : "▼"}</td>
              </tr>
              {expanded === o.id && (
                <tr key={o.id + "-details"}>
                  <td colSpan={7} className="admin-order-detail">
                    <strong>Items:</strong>
                    <ul>
                      {(o.items || []).map((item, i) => (
                        <li key={i}>{item.product_name} × {item.quantity} — ${item.price_at_purchase.toFixed(2)}</li>
                      ))}
                    </ul>
                    {o.shipping_address && (
                      <p><strong>Ship to:</strong> {JSON.stringify(o.shipping_address)}</p>
                    )}
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
