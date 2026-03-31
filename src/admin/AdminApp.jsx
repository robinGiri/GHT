import { Routes, Route, Navigate } from "react-router-dom";
import { AdminProvider, useAdmin } from "../context/AdminContext";
import AdminLogin from "./AdminLogin";
import AdminNav from "./AdminNav";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProducts from "./pages/AdminProducts";
import AdminOrders from "./pages/AdminOrders";
import AdminInventory from "./pages/AdminInventory";
import AdminFulfillment from "./pages/AdminFulfillment";

function AdminGuard() {
  const { isAuthenticated } = useAdmin();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return (
    <div className="admin-layout">
      <AdminNav />
      <main className="admin-content">
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="fulfillment" element={<AdminFulfillment />} />
        </Routes>
      </main>
    </div>
  );
}

export default function AdminApp() {
  return (
    <AdminProvider>
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route path="*" element={<AdminGuard />} />
      </Routes>
    </AdminProvider>
  );
}
