import { NavLink } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";

const links = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/inventory", label: "Inventory" },
  { to: "/admin/fulfillment", label: "Fulfillment" },
];

export default function AdminNav() {
  const { logout } = useAdmin();
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">GHT Admin</div>
      <nav>
        {links.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              "admin-nav-link" + (isActive ? " admin-nav-link--active" : "")
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <button className="admin-logout-btn" onClick={logout}>
        Sign out
      </button>
    </aside>
  );
}
