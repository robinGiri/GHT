import { useState } from "react";
import { useAdmin } from "../context/AdminContext";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const { login } = useAdmin();
  const navigate = useNavigate();
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard", {
        headers: { "X-Admin-Key": key },
      });
      if (res.ok) {
        login(key);
        navigate("/admin");
      } else {
        setError("Invalid API key. Check your .env ADMIN_API_KEY.");
      }
    } catch {
      setError("Cannot reach API server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <h1>GHT Admin</h1>
        <p>Enter your admin API key to continue.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Admin API key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            required
            autoComplete="current-password"
          />
          {error && <p className="admin-login-error">{error}</p>}
          <button type="submit" disabled={loading || !key}>
            {loading ? "Verifying…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
