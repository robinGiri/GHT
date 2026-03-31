import { useState, useEffect } from "react";
import { useAdmin } from "../../context/AdminContext";

export default function AdminFulfillment() {
  const { headers } = useAdmin();
  const [orders, setOrders] = useState([]);
  const [busy, setBusy] = useState({});
  const [msgs, setMsgs] = useState({});

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/admin/orders?status=paid", { headers });
    const data = await res.json();
    setOrders(data.filter((o) => o.has_physical || o.has_digital));
  }

  async function resendLinks(orderId) {
    setBusy((prev) => ({ ...prev, [orderId]: true }));
    const res = await fetch(`/api/admin/orders/${orderId}/resend-links`, {
      method: "POST",
      headers,
    });
    const data = await res.json();
    setMsgs((prev) => ({ ...prev, [orderId]: data.message || "Sent." }));
    setBusy((prev) => ({ ...prev, [orderId]: false }));
  }

  async function markShipped(orderId) {
    setBusy((prev) => ({ ...prev, [orderId]: true }));
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "shipped" }),
    });
    setBusy((prev) => ({ ...prev, [orderId]: false }));
    setMsgs((prev) => ({ ...prev, [orderId]: "Marked as shipped." }));
    load();
  }

  if (orders.length === 0)
    return (
      <div>
        <h2>Fulfillment</h2>
        <p className="admin-hint">No paid orders pending fulfillment.</p>
      </div>
    );

  return (
    <div>
      <h2>Fulfillment</h2>
      <p className="admin-hint">Paid orders awaiting digital delivery or physical shipment.</p>
      {orders.map((o) => (
        <div key={o.id} className="admin-fulfillment-card">
          <div className="admin-fulfillment-header">
            <span>Order #{o.id} — {o.customer_name} &lt;{o.customer_email}&gt;</span>
            <span>${o.total_amount.toFixed(2)} · {new Date(o.created_at).toLocaleDateString()}</span>
          </div>
          <ul>
            {(o.items || []).map((item, i) => (
              <li key={i}>
                {item.product_name} × {item.quantity}
                {item.product_type === "physical_book" && (
                  <span className="admin-badge admin-badge--warn" style={{ marginLeft: 8 }}>Physical</span>
                )}
              </li>
            ))}
          </ul>
          {o.shipping_address && (
            <p className="admin-ship-address">
              <strong>Ship to:</strong>{" "}
              {[
                o.shipping_address.line1,
                o.shipping_address.line2,
                o.shipping_address.city,
                o.shipping_address.state,
                o.shipping_address.postal_code,
                o.shipping_address.country,
              ].filter(Boolean).join(", ")}
            </p>
          )}
          <div className="admin-fulfillment-actions">
            <button
              onClick={() => resendLinks(o.id)}
              disabled={!!busy[o.id]}
              className="admin-btn-sm"
            >
              Resend download links
            </button>
            {o.has_physical && (
              <button
                onClick={() => markShipped(o.id)}
                disabled={!!busy[o.id]}
                className="admin-btn-primary"
              >
                Mark as shipped
              </button>
            )}
            {msgs[o.id] && <span className="admin-success">{msgs[o.id]}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
