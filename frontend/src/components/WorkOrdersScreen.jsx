import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  ClipboardList,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
  ArrowLeftRight,
  X
} from "lucide-react";

export const WorkOrdersScreen = ({ onInitiateTransfer }) => {
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState({ locations: [], items: [] });
  const [usersList, setUsersList] = useState([]);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    workOrderId: "",
    location: "Warehouse Mumbai",
    item: "Steel Rods",
    requiredQuantity: 100,
    assignedUser: "",
    notes: ""
  });

  // Live Stock Check state
  const [stockCheck, setStockCheck] = useState(null);
  const [checkingStock, setCheckingStock] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user && user.role === "Admin";

  const fetchWorkOrders = async () => {
    setLoading(true);
    try {
      const data = await api.getWorkOrders();
      setWorkOrders(data || []);
    } catch (err) {
      console.error("Failed to fetch work orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const meta = await api.getInventoryMetadata();
      setMetadata(meta);

      const users = await api.getUsers();
      setUsersList(users || []);
      if (users && users.length > 0 && !formData.assignedUser) {
        setFormData((prev) => ({ ...prev, assignedUser: users[0].name }));
      }
    } catch (err) {
      console.error("Failed to load metadata/users:", err);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
    fetchDependencies();
  }, []);

  // Run stock check whenever location, item, or requiredQuantity changes
  useEffect(() => {
    if (showCreateModal && formData.location && formData.item && formData.requiredQuantity) {
      const delay = setTimeout(async () => {
        setCheckingStock(true);
        try {
          const res = await api.checkStockAndShortage(
            formData.location,
            formData.item,
            formData.requiredQuantity
          );
          setStockCheck(res);
        } catch (err) {
          console.error("Stock check failed:", err);
        } finally {
          setCheckingStock(false);
        }
      }, 250);

      return () => clearTimeout(delay);
    }
  }, [showCreateModal, formData.location, formData.item, formData.requiredQuantity]);

  const handleCreateWorkOrder = async (e) => {
    e.preventDefault();
    setCreateError("");
    setCreateSuccess("");

    if (!isAdmin) {
      setCreateError("Only Admin users are authorized to create Work Orders.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createWorkOrder(formData);
      setCreateSuccess(res.message || "Work order created successfully!");
      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess("");
        fetchWorkOrders();
      }, 900);
    } catch (err) {
      setCreateError(err.message || "Failed to create work order");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.updateWorkOrderStatus(id, newStatus);
      fetchWorkOrders();
    } catch (err) {
      alert(err.message || "Failed to update status");
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2>Work Orders & Material Stock Check</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Create manufacturing work orders with automatic material shortage calculation & inter-location stock transfers
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-secondary" onClick={fetchWorkOrders} disabled={loading}>
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>

          {isAdmin ? (
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} />
              <span>Create Work Order</span>
            </button>
          ) : (
            <div
              className="badge badge-amber"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px" }}
              title="Only Admin can create Work Orders"
            >
              <ShieldAlert size={14} />
              <span>Admin Only: Creation Gated</span>
            </div>
          )}
        </div>
      </div>

      {/* Orders List Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Work Order ID</th>
              <th>Location</th>
              <th>Required Item</th>
              <th style={{ textAlign: "right" }}>Required Qty</th>
              <th>Assigned To</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                  Loading work orders...
                </td>
              </tr>
            ) : workOrders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 40 }}>
                  <ClipboardList size={32} color="var(--text-muted)" style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontWeight: 600 }}>No Work Orders Found</div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    {isAdmin ? "Click 'Create Work Order' to start one" : "Switch to Admin role to create work orders"}
                  </div>
                </td>
              </tr>
            ) : (
              workOrders.map((wo) => {
                let badgeClass = "badge-blue";
                if (wo.status === "In Progress") badgeClass = "badge-amber";
                if (wo.status === "Completed") badgeClass = "badge-green";

                return (
                  <tr key={wo._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: "var(--primary-800)" }}>{wo.workOrderId}</div>
                      {wo.notes && (
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{wo.notes}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{wo.location}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{wo.item}</div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, fontSize: "0.9375rem" }}>
                      {wo.requiredQuantity} units
                    </td>
                    <td>
                      <div style={{ fontSize: "0.875rem", color: "var(--text-main)" }}>{wo.assignedUser}</div>
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`}>{wo.status}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {wo.status === "Assigned" && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleStatusUpdate(wo._id, "In Progress")}
                        >
                          Start Progress
                        </button>
                      )}
                      {wo.status === "In Progress" && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleStatusUpdate(wo._id, "Completed")}
                        >
                          <CheckCircle size={14} />
                          Complete
                        </button>
                      )}
                      {wo.status === "Completed" && (
                        <span style={{ fontSize: "0.75rem", color: "var(--success-solid)", fontWeight: 700 }}>
                          ✓ Done
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

      {/* Create Work Order Modal with Automatic Material Stock Check & Shortage Calculator */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3 className="card-title">
                <ClipboardList size={20} color="var(--primary-700)" />
                Create Work Order & Stock Check
              </h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowCreateModal(false)}
                style={{ padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateWorkOrder}>
              <div className="modal-body">
                {createError && (
                  <div className="alert alert-danger" style={{ padding: "8px 12px", fontSize: "0.8125rem" }}>
                    <ShieldAlert size={16} />
                    <span>{createError}</span>
                  </div>
                )}
                {createSuccess && (
                  <div className="alert alert-success" style={{ padding: "8px 12px", fontSize: "0.8125rem" }}>
                    <CheckCircle size={16} />
                    <span>{createSuccess}</span>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Work Order ID</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. WO-1003 (Auto if blank)"
                      value={formData.workOrderId}
                      onChange={(e) => setFormData({ ...formData, workOrderId: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Plant / Location *</label>
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
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Required Item / Material *</label>
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

                  <div className="form-group">
                    <label className="form-label">Required Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={formData.requiredQuantity}
                      onChange={(e) => setFormData({ ...formData, requiredQuantity: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                {/* AUTOMATIC MATERIAL STOCK CHECK & SHORTAGE CALCULATION WIDGET */}
                <div className="stock-check-box">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: "0.8125rem", color: "var(--primary-900)", textTransform: "uppercase" }}>
                      Automatic Material Stock Check
                    </span>
                    {checkingStock && <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Checking...</span>}
                  </div>

                  {stockCheck ? (
                    <div>
                      <div className="stock-check-metric">
                        <span style={{ color: "var(--text-secondary)" }}>Required Material:</span>
                        <strong>{stockCheck.requiredMaterial} units</strong>
                      </div>
                      <div className="stock-check-metric">
                        <span style={{ color: "var(--text-secondary)" }}>Available at {stockCheck.location}:</span>
                        <strong style={{ color: "var(--primary-800)" }}>{stockCheck.availableAtLocation} units</strong>
                      </div>
                      <div className="stock-check-metric" style={{ borderTop: "1px dashed var(--border-color)", marginTop: 6, paddingTop: 6 }}>
                        <span style={{ fontWeight: 700 }}>Calculated Shortage:</span>
                        <strong style={{ color: stockCheck.shortage > 0 ? "var(--danger-solid)" : "var(--success-solid)", fontSize: "1rem" }}>
                          {stockCheck.shortage} units
                        </strong>
                      </div>

                      {/* Shortage Alert */}
                      {stockCheck.shortage > 0 && (
                        <div style={{ marginTop: 12, padding: "10px 12px", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", borderRadius: "var(--radius-sm)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--danger-solid)", fontWeight: 700, fontSize: "0.8125rem" }}>
                            <AlertTriangle size={15} />
                            <span>Material Shortage Detected!</span>
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--danger-text)", marginTop: 4 }}>
                            {stockCheck.location} lacks {stockCheck.shortage} units to fulfill this work order.
                          </div>

                          {/* Check if other locations have it */}
                          {stockCheck.otherLocationsAvailability && stockCheck.otherLocationsAvailability.length > 0 ? (
                            <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(220, 38, 38, 0.2)" }}>
                              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-main)" }}>
                                Available at other enterprise facilities:
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                                {stockCheck.otherLocationsAvailability.map((loc) => (
                                  <span key={loc._id} className="badge badge-green" style={{ fontSize: "0.75rem" }}>
                                    {loc._id}: {loc.availableQuantity} avail
                                  </span>
                                ))}
                              </div>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                style={{ marginTop: 8, width: "100%", fontSize: "0.75rem" }}
                                onClick={() => {
                                  setShowCreateModal(false);
                                  onInitiateTransfer && onInitiateTransfer({
                                    destinationLocation: formData.location,
                                    sourceLocation: stockCheck.otherLocationsAvailability[0]._id,
                                    item: formData.item,
                                    quantity: stockCheck.shortage
                                  });
                                }}
                              >
                                <ArrowLeftRight size={14} />
                                Initiate Internal Stock Transfer for {stockCheck.shortage} units
                              </button>
                            </div>
                          ) : (
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
                              No other locations have surplus stock of {stockCheck.item}.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                      Select location and item to check stock availability
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ marginTop: 16 }}>
                  <label className="form-label">Assigned User *</label>
                  <select
                    className="form-select"
                    value={formData.assignedUser}
                    onChange={(e) => setFormData({ ...formData, assignedUser: e.target.value })}
                    required
                  >
                    {usersList.map((u) => (
                      <option key={u._id} value={u.name}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Operational Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Fabrication batch for client order"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Creating..." : "Confirm Work Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
