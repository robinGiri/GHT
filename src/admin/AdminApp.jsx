import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminProvider, useAdmin } from "../context/AdminContext";
import AdminLogin from "./AdminLogin";
import AdminNav from "./AdminNav";

const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/AdminProducts"));
const AdminOrders = lazy(() => import("./pages/AdminOrders"));
const AdminInventory = lazy(() => import("./pages/AdminInventory"));
const AdminFulfillment = lazy(() => import("./pages/AdminFulfillment"));

function AdminGuard() {
  const { isAuthenticated } = useAdmin();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return (
    <div className="admin-layout">
      <AdminNav />
      <main className="admin-content">
        <Suspense fallback={<div className="admin-loading">Loading…</div>}>
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="fulfillment" element={<AdminFulfillment />} />
        </Routes>
        </Suspense>
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
