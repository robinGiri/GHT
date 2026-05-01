import { useEffect, useRef } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import JourneysPage from "./pages/JourneysPage";
import PlanPage from "./pages/PlanPage";
import CulturePage from "./pages/CulturePage";
import ShopPage from "./pages/ShopPage";
import MapDetailPage from "./pages/MapDetailPage";
import OrderSuccess from "./pages/OrderSuccess";
import OrderCancel from "./pages/OrderCancel";
import AdminApp from "./admin/AdminApp";
import CartDrawer from "./components/CartDrawer";
import ChatWidget from "./components/ChatWidget";
import ErrorBoundary from "./components/ErrorBoundary";
import NotFoundPage from "./pages/NotFoundPage";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function RouteAnnouncer() {
  const { pathname } = useLocation();
  const announcerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const h1 = document.querySelector("h1");
      if (h1 && announcerRef.current) {
        announcerRef.current.textContent = h1.textContent;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div
      ref={announcerRef}
      className="sr-only"
      aria-live="polite"
      aria-atomic="true"
      role="status"
    />
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <RouteAnnouncer />
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <CartDrawer />
      <ErrorBoundary>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/journeys" element={<JourneysPage />} />
        <Route path="/plan" element={<PlanPage />} />
        <Route path="/culture" element={<CulturePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/maps/:id" element={<MapDetailPage />} />
        <Route path="/checkout/success" element={<OrderSuccess />} />
        <Route path="/checkout/cancel" element={<OrderCancel />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </ErrorBoundary>
      <ChatWidget />
    </>
  );
}
