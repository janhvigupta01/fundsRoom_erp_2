import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  ShoppingCart,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  X,
  RotateCcw
} from "lucide-react";

export const CustomerOrdersScreen = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState({ locations: [], items: [] });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    orderId: "",
    customerName: "",
    location: "Warehouse Mumbai",
    item: "Steel Rods",
    quantity: 60
  });

  const [availableStock, setAvailableStock] = useState(null);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canCreateOrder = user && (user.role === "Admin" || user.role === "Sales User");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await api.getOrders();
      setOrders(data || []);
    } catch (err) {
      console.error("Failed to fetch customer orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const meta = await api.getInventoryMetadata();
      setMetadata(meta);
    } catch (err) {
      console.error("Failed to load metadata:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchMetadata();
  }, []);

  // Fetch available stock when location or item changes in modal
  useEffect(() => {
    if (showModal && formData.location && formData.item) {
      const checkAvailable = async () => {
        try {
          const inv = await api.getInventory({ location: formData.location, item: formData.item });
          const totalAvail = (inv.items || []).reduce((sum, item) => sum + item.availableQuantity, 0);
          setAvailableStock(totalAvail);
        } catch (e) {
          setAvailableStock(null);
        }
      };
      checkAvailable();
    }
  }, [showModal, formData.location, formData.item]);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setActionError("");
    setActionSuccess("");

    if (!canCreateOrder) {
      setActionError("Only Sales Users and Admins can create customer orders.");
      return;
    }

    if (!formData.customerName || !formData.quantity) {
      setActionError("Customer name and quantity are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createOrder(formData);
      setActionSuccess(`Order ${res.order.orderId} created & ${formData.quantity} units reserved atomically!`);
      setTimeout(() => {
        setShowModal(false);
        setActionSuccess("");
        setFormData({
          orderId: "",
          customerName: "",
          location: "Warehouse Mumbai",
          item: "Steel Rods",
          quantity: 60
        });
        fetchOrders();
      }, 900);
    } catch (err) {
      setActionError(err.message || "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async (order) => {
    if (!window.confirm(`Are you sure you want to cancel order ${order.orderId}? This will release ${order.quantity} units back into available inventory.`)) {
      return;
    }

    setActionError("");
    setActionSuccess("");
    try {
      const res = await api.cancelOrder(order._id);
      setActionSuccess(res.message || `Order cancelled and ${order.quantity} units released back to available inventory.`);
      fetchOrders();
    } catch (err) {
      setActionError(err.message || "Failed to cancel order");
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2>Customer Orders & Stock Reservation</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Sales order intake with atomic database-level stock reservation and cancellation inventory release
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-secondary" onClick={fetchOrders} disabled={loading}>
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>

          {canCreateOrder ? (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} />
              <span>Create Customer Order</span>
            </button>
          ) : (
            <div
              className="badge badge-amber"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px" }}
              title="Operations users cannot create customer orders"
            >
              <ShieldAlert size={14} />
              <span>Sales/Admin Only</span>
            </div>
          )}
        </div>
      </div>

      {actionError && (
        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
          <AlertCircle size={18} />
          <span>{actionError}</span>
        </div>
      )}
      {actionSuccess && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <CheckCircle2 size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Orders Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer Name</th>
              <th>Location</th>
              <th>Item & Batch</th>
              <th style={{ textAlign: "right" }}>Reserved Qty</th>
              <th>Sales Agent</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                  Loading customer orders...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: 40 }}>
                  <ShoppingCart size={32} color="var(--text-muted)" style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontWeight: 600 }}>No customer orders placed yet</div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    {canCreateOrder ? "Click 'Create Customer Order' to place one" : "Switch to Sales User to place customer orders"}
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((ord) => {
                let badgeClass = "badge-blue";
                if (ord.status === "Fulfilled") badgeClass = "badge-green";
                if (ord.status === "Cancelled") badgeClass = "badge-red";

                return (
                  <tr key={ord._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: "var(--primary-800)" }}>{ord.orderId}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{ord.customerName}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ord.location}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ord.item}</div>
                      <code style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{ord.batch}</code>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, fontSize: "0.9375rem" }}>
                      <span className="badge badge-amber">{ord.quantity} units</span>
                    </td>
                    <td>
                      <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{ord.salesUser}</div>
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`}>{ord.status}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {ord.status === "Reserved" && canCreateOrder && (
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleCancelOrder(ord)}
                          title="Cancel order and return reserved stock back to available stock"
                        >
                          <RotateCcw size={13} />
                          Cancel & Release Stock
                        </button>
                      )}
                      {ord.status === "Cancelled" && (
                        <span style={{ fontSize: "0.75rem", color: "var(--danger-text)", fontWeight: 600 }}>
                          Stock Released
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Order Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="card-title">
                <ShoppingCart size={20} color="var(--primary-700)" />
                Create Customer Order & Reserve Stock
              </h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowModal(false)}
                style={{ padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder}>
              <div className="modal-body">
                {actionError && (
                  <div className="alert alert-danger" style={{ padding: "8px 12px", fontSize: "0.8125rem" }}>
                    <AlertCircle size={16} />
                    <span>{actionError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Customer Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Tata Motors Ltd, Reliance Infra"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Fulfillment Location *</label>
                    <select
                      className="form-select"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    >
                      <option value="Warehouse Mumbai">Warehouse Mumbai</option>
                      <option value="Plant Pune">Plant Pune</option>
                      <option value="Delhi Hub">Delhi Hub</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Item / Material *</label>
                    <select
                      className="form-select"
                      value={formData.item}
                      onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                    >
                      {metadata.items.map((it) => (
                        <option key={it} value={it}>{it}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Real-time available indicator */}
                <div style={{ marginBottom: 16, padding: "8px 12px", background: "var(--bg-subtle)", borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8125rem" }}>
                  <span>Currently Available Stock:</span>
                  <span className="badge badge-green" style={{ fontSize: "0.8125rem" }}>
                    {availableStock !== null ? `${availableStock} units` : "Checking..."}
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Order Quantity to Reserve *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    required
                  />
                  {availableStock !== null && formData.quantity > availableStock && (
                    <div style={{ fontSize: "0.75rem", color: "var(--danger-solid)", marginTop: 4, fontWeight: 600 }}>
                      ⚠️ Warning: Requested quantity ({formData.quantity}) exceeds available stock ({availableStock}). The backend atomic check will reject this request!
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Reserving..." : "Create Order & Reserve"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
