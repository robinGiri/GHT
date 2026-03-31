import { useState, useEffect } from "react";
import { useAdmin } from "../../context/AdminContext";

export default function AdminProducts() {
  const { headers } = useAdmin();
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null); // product being edited
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    const res = await fetch("/api/admin/products", { headers });
    const data = await res.json();
    setProducts(data);
  }

  function openEdit(p) {
    setEditing(p.id);
    setForm({
      name: p.name,
      price: p.price,
      description: p.description ?? "",
      file_url: p.file_url ?? "",
      stock_quantity: p.stock_quantity ?? "",
      active: p.active,
      badge: p.badge ?? "",
    });
    setMsg("");
  }

  function closeEdit() { setEditing(null); setForm({}); }

  async function saveEdit() {
    setSaving(true);
    const body = {
      ...form,
      price: parseFloat(form.price),
      stock_quantity: form.stock_quantity === "" ? null : parseInt(form.stock_quantity, 10),
    };
    await fetch(`/api/admin/products/${editing}`, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setMsg("Saved.");
    await loadProducts();
    setTimeout(() => { closeEdit(); setMsg(""); }, 800);
  }

  async function toggleActive(p) {
    await fetch(`/api/admin/products/${p.id}`, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ active: !p.active }),
    });
    loadProducts();
  }

  return (
    <div>
      <h2>Products</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Type</th><th>Price</th>
            <th>Stock</th><th>File URL</th><th>Active</th><th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td><code>{p.id}</code></td>
              <td>{p.name}</td>
              <td>{p.type}</td>
              <td>${p.price.toFixed(2)}</td>
              <td>{p.stock_quantity ?? "∞"}</td>
              <td>
                {p.file_url
                  ? <span className="admin-badge admin-badge--ok">Set</span>
                  : <span className="admin-badge admin-badge--warn">Missing</span>}
              </td>
              <td>
                <button
                  className={"admin-badge " + (p.active ? "admin-badge--ok" : "admin-badge--off")}
                  onClick={() => toggleActive(p)}
                >
                  {p.active ? "Active" : "Hidden"}
                </button>
              </td>
              <td>
                <button className="admin-btn-sm" onClick={() => openEdit(p)}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing && (
        <div className="admin-modal-backdrop" onClick={closeEdit}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit {editing}</h3>
            {[
              ["Name", "name", "text"],
              ["Price ($)", "price", "number"],
              ["Description", "description", "text"],
              ["File URL (private download link)", "file_url", "text"],
              ["Stock quantity (blank = unlimited)", "stock_quantity", "number"],
              ["Badge label", "badge", "text"],
            ].map(([label, field, type]) => (
              <label key={field} className="admin-field">
                <span>{label}</span>
                <input
                  type={type}
                  value={form[field] ?? ""}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                />
              </label>
            ))}
            <label className="admin-field">
              <span>Active</span>
              <input
                type="checkbox"
                checked={!!form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
            </label>
            {msg && <p className="admin-success">{msg}</p>}
            <div className="admin-modal-actions">
              <button onClick={closeEdit}>Cancel</button>
              <button className="admin-btn-primary" onClick={saveEdit} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
