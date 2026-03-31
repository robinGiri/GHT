import { useState, useEffect } from "react";
import { useAdmin } from "../../context/AdminContext";

export default function AdminInventory() {
  const { headers } = useAdmin();
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState({}); // productId -> {stock, fileUrl}
  const [saved, setSaved] = useState({});

  useEffect(() => {
    fetch("/api/admin/inventory", { headers })
      .then((r) => r.json())
      .then(setItems);
  }, []);

  function startEdit(p) {
    setEditing((prev) => ({
      ...prev,
      [p.id]: { stock: p.stock_quantity ?? "", file_url: p.file_url ?? "" },
    }));
  }

  async function save(productId) {
    const payload = editing[productId];
    await fetch(`/api/admin/inventory/${productId}`, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        stock_quantity: payload.stock === "" ? null : parseInt(payload.stock, 10),
        file_url: payload.file_url || null,
      }),
    });
    setSaved((prev) => ({ ...prev, [productId]: true }));
    setTimeout(() => setSaved((prev) => ({ ...prev, [productId]: false })), 1500);
    // Refresh row
    const res = await fetch("/api/admin/inventory", { headers });
    const data = await res.json();
    setItems(data);
    setEditing((prev) => { const e = { ...prev }; delete e[productId]; return e; });
  }

  return (
    <div>
      <h2>Inventory</h2>
      <p className="admin-hint">
        Set file URLs for digital maps (private S3/GDrive link sent in confirmation email).
        Leave stock blank for unlimited.
      </p>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Product</th><th>Type</th><th>Stock</th><th>File URL</th><th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => {
            const isEditing = !!editing[p.id];
            const val = editing[p.id] ?? {};
            return (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.type}</td>
                <td>
                  {isEditing
                    ? <input type="number" min="0" value={val.stock}
                        onChange={(e) => setEditing((prev) => ({ ...prev, [p.id]: { ...prev[p.id], stock: e.target.value } }))}
                        style={{ width: 70 }} />
                    : (p.stock_quantity ?? "∞")}
                </td>
                <td>
                  {isEditing
                    ? <input type="url" value={val.file_url}
                        onChange={(e) => setEditing((prev) => ({ ...prev, [p.id]: { ...prev[p.id], file_url: e.target.value } }))}
                        style={{ width: 320 }} />
                    : p.file_url
                      ? <span className="admin-badge admin-badge--ok">Set</span>
                      : <span className="admin-badge admin-badge--warn">Missing</span>}
                </td>
                <td>
                  {isEditing
                    ? <button className="admin-btn-primary" onClick={() => save(p.id)}>Save</button>
                    : <button className="admin-btn-sm" onClick={() => startEdit(p)}>Edit</button>}
                  {saved[p.id] && <span className="admin-success"> ✓</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
