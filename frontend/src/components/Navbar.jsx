import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Boxes,
  ClipboardList,
  ArrowLeftRight,
  ShoppingCart,
  Zap,
  History,
  LogOut,
  ShieldCheck,
  Building2,
  Menu,
  X,
  User
} from "lucide-react";

export const Navbar = ({ activeTab, setActiveTab, onOpenAudit }) => {
  const { user, logout, switchRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleRoleChange = async (e) => {
    const newRole = e.target.value;
    if (newRole !== user.role) {
      await switchRole(newRole);
    }
  };

  const navItems = [
    { id: "inventory", label: "Inventory", icon: Boxes, badge: "Live" },
    { id: "work-orders", label: "Work Orders", icon: ClipboardList },
    { id: "transfers", label: "Stock Transfers", icon: ArrowLeftRight },
    { id: "orders", label: "Customer Orders", icon: ShoppingCart },
    { id: "concurrency", label: "Concurrency Lab", icon: Zap, highlight: true }
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar-container">
      {/* Upper Brand & User Action Bar */}
      <div className="navbar-top">
        <div className="navbar-top-inner">
          {/* Brand Logo & Title */}
          <div className="brand-wrapper" onClick={() => handleTabClick("inventory")}>
            <div className="brand-icon">
              <Building2 size={22} />
            </div>
            <div className="brand-text">
              <div className="brand-name">
                OpsERP
                <span className="brand-pill">Enterprise</span>
              </div>
              <span className="brand-subtitle">Multi-Location Operations Suite</span>
            </div>
          </div>

          {/* Desktop Right Utilities */}
          <div className="desktop-actions">
            {/* Quick Role Switcher for Interview / Demos */}
            <div className="role-chip" title="Switch active role to verify permissions">
              <ShieldCheck size={16} className="role-icon" />
              <div className="role-info">
                <span className="role-label">Active Role:</span>
                <select
                  className="role-dropdown"
                  value={user?.role || "Operations User"}
                  onChange={handleRoleChange}
                >
                  <option value="Admin">Admin</option>
                  <option value="Operations User">Operations User</option>
                  <option value="Sales User">Sales User</option>
                </select>
              </div>
            </div>

            {/* User Profile Pill */}
            <div className="user-profile-chip">
              <div className="user-avatar">
                <User size={15} />
              </div>
              <div className="user-details">
                <span className="user-name">{user?.name || "Janhavi"}</span>
                <span className="user-location">{user?.location || "Warehouse Mumbai"}</span>
              </div>
            </div>

            {/* Audit Log Button */}
            <button
              className="btn btn-secondary btn-sm nav-btn"
              onClick={onOpenAudit}
              title="View transaction history & audit logs"
            >
              <History size={15} />
              <span>Audit Trail</span>
            </button>

            {/* Logout Button */}
            <button
              className="btn btn-logout btn-sm"
              onClick={logout}
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Lower Navigation Tabs Bar (Desktop) */}
      <div className="navbar-bottom">
        <div className="navbar-bottom-inner">
          <nav className="tab-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  className={`tab-btn ${isActive ? "active" : ""} ${item.highlight ? "highlight" : ""}`}
                  onClick={() => handleTabClick(item.id)}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                  {item.badge && <span className="tab-pill">{item.badge}</span>}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Drawer (Responsive dropdown for small screens) */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <div className="mobile-drawer-inner">
            {/* Mobile User & Role Info */}
            <div className="mobile-user-card">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="user-avatar" style={{ width: 36, height: 36 }}>
                  <User size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-main)" }}>
                    {user?.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {user?.email} • {user?.location}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                  Switch Role for Testing:
                </label>
                <select
                  className="role-dropdown"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "#ffffff" }}
                  value={user?.role || "Operations User"}
                  onChange={handleRoleChange}
                >
                  <option value="Admin">Admin (Full Access)</option>
                  <option value="Operations User">Operations User (Inventory/Transfers)</option>
                  <option value="Sales User">Sales User (Orders/Reservations)</option>
                </select>
              </div>
            </div>

            {/* Mobile Navigation List */}
            <div className="mobile-nav-list">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    className={`mobile-nav-item ${isActive ? "active" : ""}`}
                    onClick={() => handleTabClick(item.id)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Icon size={18} />
                      <span style={{ fontWeight: 600 }}>{item.label}</span>
                    </div>
                    {item.badge && <span className="tab-pill">{item.badge}</span>}
                  </button>
                );
              })}
            </div>

            {/* Mobile Actions Footer */}
            <div className="mobile-actions-footer">
              <button
                className="btn btn-secondary"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAudit();
                }}
              >
                <History size={16} />
                <span>View Audit Trail</span>
              </button>
              <button
                className="btn btn-outline-danger"
                style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
                onClick={logout}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
