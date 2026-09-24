import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Building2, Shield, Lock, Mail, ArrowRight, UserCheck, AlertCircle } from "lucide-react";

export const LoginScreen = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@erp.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError("");
    setSubmitting(true);
    try {
      await login(demoEmail, demoPass);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <Building2 size={32} />
          </div>
          <h2>Mini Operations ERP</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: 4 }}>
            Sign in to access multi-location operations & inventory
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ padding: "10px 14px", fontSize: "0.8125rem" }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: 38 }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@erp.com"
                required
              />
              <Mail
                size={16}
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: 38 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <Lock
                size={16}
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", padding: "12px", marginTop: 8 }}
            disabled={submitting}
          >
            {submitting ? "Signing in..." : "Sign In to ERP"}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Demo Login Chips for Interviewer */}
        <div className="quick-login-chips">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <UserCheck size={14} color="var(--primary-700)" />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary-900)", textTransform: "uppercase" }}>
              1-Click Demo Login
            </span>
          </div>

          <button
            type="button"
            className="quick-chip"
            onClick={() => handleQuickLogin("admin@erp.com", "admin123")}
          >
            <div>
              <div style={{ fontWeight: 700 }}>Janhavi (Admin)</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                Creates Work Orders, full operational oversight
              </div>
            </div>
            <span className="badge badge-blue">Admin</span>
          </button>

          <button
            type="button"
            className="quick-chip"
            onClick={() => handleQuickLogin("ops@erp.com", "ops123")}
          >
            <div>
              <div style={{ fontWeight: 700 }}>Rahul Sharma (Ops)</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                Manages Inventory, Dispatches & Receives Transfers
              </div>
            </div>
            <span className="badge badge-green">Operations</span>
          </button>

          <button
            type="button"
            className="quick-chip"
            onClick={() => handleQuickLogin("sales@erp.com", "sales123")}
          >
            <div>
              <div style={{ fontWeight: 700 }}>Pooja Verma (Sales)</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                Creates Customer Orders & reserves stock
              </div>
            </div>
            <span className="badge badge-amber">Sales</span>
          </button>
        </div>
      </div>
    </div>
  );
};
