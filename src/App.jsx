import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import MapDetailPage from "./pages/MapDetailPage";
import OrderSuccess from "./pages/OrderSuccess";
import OrderCancel from "./pages/OrderCancel";
import AdminApp from "./admin/AdminApp";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/shop/maps/:id" element={<MapDetailPage />} />
      <Route path="/checkout/success" element={<OrderSuccess />} />
      <Route path="/checkout/cancel" element={<OrderCancel />} />
      <Route path="/admin/*" element={<AdminApp />} />
    </Routes>
  );
}
