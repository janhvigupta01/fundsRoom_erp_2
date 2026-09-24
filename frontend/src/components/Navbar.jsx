import React from "react";
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
  Building2
} from "lucide-react";

export const Navbar = ({ activeTab, setActiveTab, onOpenAudit }) => {
  const { user, logout, switchRole } = useAuth();

  const handleRoleChange = async (e) => {
    const newRole = e.target.value;
    if (newRole !== user.role) {
      await switchRole(newRole);
    }
  };

  const navItems = [
    { id: "inventory", label: "Inventory", icon: Boxes },
    { id: "work-orders", label: "Work Orders", icon: ClipboardList },
    { id: "transfers", label: "Transfers", icon: ArrowLeftRight },
    { id: "orders", label: "Customer Orders", icon: ShoppingCart },
    { id: "concurrency", label: "Concurrency Lab", icon: Zap }
  ];

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand Section */}
        <div className="brand-section" onClick={() => setActiveTab("inventory")}>
          <div className="brand-logo-icon">
            <Building2 size={24} />
          </div>
          <div>
            <div className="brand-title">
              OpsERP
              <span className="brand-badge">Mini Suite</span>
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500 }}>
              Multi-Location ERP
            </div>
          </div>
        </div>

        {/* Center Nav Tabs */}
        <nav className="nav-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile & Role Switcher */}
        <div className="nav-actions">
          {/* Quick Role Switcher for Interview Demos */}
          <div className="role-switcher" title="Instantly switch role to test permissions">
            <ShieldCheck size={16} color="var(--primary-700)" />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
              Role:
            </span>
            <select
              className="role-select"
              value={user?.role || "Operations User"}
              onChange={handleRoleChange}
            >
              <option value="Admin">Admin</option>
              <option value="Operations User">Operations User</option>
              <option value="Sales User">Sales User</option>
            </select>
          </div>

          {/* Audit Log Trigger */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={onOpenAudit}
            title="View ERP Transaction Audit Trail"
          >
            <History size={16} />
            <span>Audit Trail</span>
          </button>

          {/* Logout Button */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={logout}
            title="Log out"
            style={{ color: "var(--danger-solid)" }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
