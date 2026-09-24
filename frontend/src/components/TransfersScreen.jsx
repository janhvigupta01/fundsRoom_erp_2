import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeftRight,
  Plus,
  RefreshCw,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  X,
  Package
} from "lucide-react";

export const TransfersScreen = ({ prefilledTransfer, onClearPrefill }) => {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState({ locations: [], items: [] });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    transferId: "",
    sourceLocation: "Plant Pune",
    destinationLocation: "Warehouse Mumbai",
    item: "Steel Rods",
    quantity: 40
  });

  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canManageTransfers = user && (user.role === "Admin" || user.role === "Operations User");

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const data = await api.getTransfers();
      setTransfers(data || []);
    } catch (err) {
      console.error("Failed to fetch transfers:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const meta = await api.getInventoryMetadata();
      setMetadata(meta);
    } catch (err) {
      console.error("Failed to fetch metadata:", err);
    }
  };

  useEffect(() => {
    fetchTransfers();
    fetchMetadata();
  }, []);

  // Handle prefilled transfer from Work Orders shortage widget
  useEffect(() => {
    if (prefilledTransfer) {
      setFormData({
        transferId: "",
        sourceLocation: prefilledTransfer.sourceLocation || "Plant Pune",
        destinationLocation: prefilledTransfer.destinationLocation || "Warehouse Mumbai",
        item: prefilledTransfer.item || "Steel Rods",
        quantity: prefilledTransfer.quantity || 40
      });
      setShowModal(true);
      if (onClearPrefill) onClearPrefill();
    }
  }, [prefilledTransfer]);

  const handleCreateTransfer = async (e) => {
    e.preventDefault();
    setActionError("");
    setActionSuccess("");

    if (!canManageTransfers) {
      setActionError("Operations User or Admin role required to create stock transfers.");
      return;
    }

    if (formData.sourceLocation === formData.destinationLocation) {
      setActionError("Source and Destination locations must be different.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createTransfer(formData);
      setActionSuccess(res.message || "Transfer requested successfully!");
      setTimeout(() => {
        setShowModal(false);
        setActionSuccess("");
        fetchTransfers();
      }, 900);
    } catch (err) {
      setActionError(err.message || "Failed to request transfer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispatch = async (transfer) => {
    setActionError("");
    setActionSuccess("");
    try {
      const res = await api.dispatchTransfer(transfer._id);
      setActionSuccess(`Transfer ${transfer.transferId} dispatched! Source stock reduced. Destination stock NOT increased until receipt.`);
      fetchTransfers();
    } catch (err) {
      setActionError(err.message || "Dispatch failed");
    }
  };

  const handleReceive = async (transfer) => {
    setActionError("");
    setActionSuccess("");
    try {
      const res = await api.receiveTransfer(transfer._id);
      setActionSuccess(`Transfer ${transfer.transferId} received! Destination stock increased safely.`);
      fetchTransfers();
    } catch (err) {
      setActionError(err.message || "Receipt failed");
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2>Internal Stock Transfers</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Inter-facility material movement. Strictly enforces dispatch decrement, in-transit isolation, and single-receipt rules.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-secondary" onClick={fetchTransfers} disabled={loading}>
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>

          {canManageTransfers ? (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} />
              <span>Request Transfer</span>
            </button>
          ) : (
            <div
              className="badge badge-amber"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px" }}
              title="Sales users cannot create/manage transfers"
            >
              <ShieldAlert size={14} />
              <span>Operations/Admin Only</span>
            </div>
          )}
        </div>
      </div>

      {/* Global Alerts for operations */}
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

      {/* Rule Verification Callout Banner */}
      <div className="alert alert-info" style={{ marginBottom: 20 }}>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>Core ERP Transfer Rules (Verified by Tests):</div>
          <div style={{ fontSize: "0.8125rem", color: "var(--primary-900)" }}>
            • <strong>On Dispatch:</strong> Source inventory immediately reduces. Destination stock remains untouched.
            <br />
            • <strong>On Receipt:</strong> Destination inventory increases.
            <br />
            • <strong>Double-Receipt Prevention:</strong> The database rejects any duplicate receipt attempts.
          </div>
        </div>
      </div>

      {/* Transfers List */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Transfer ID</th>
              <th>Source & Destination</th>
              <th>Item & Quantity</th>
              <th>Lifecycle Timeline</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Operation Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                  Loading transfers...
                </td>
              </tr>
            ) : transfers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 40 }}>
                  <ArrowLeftRight size={32} color="var(--text-muted)" style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontWeight: 600 }}>No stock transfers found</div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    Click 'Request Transfer' to initiate inter-facility inventory movement
                  </div>
                </td>
              </tr>
            ) : (
              transfers.map((trf) => {
                let badgeClass = "badge-amber";
                if (trf.status === "Dispatched") badgeClass = "badge-blue";
                if (trf.status === "Received") badgeClass = "badge-green";

                return (
                  <tr key={trf._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: "var(--primary-800)" }}>{trf.transferId}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        By {trf.requestedBy}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: "0.875rem" }}>
                        <span>{trf.sourceLocation}</span>
                        <ArrowRight size={14} color="var(--primary-600)" />
                        <span style={{ color: "var(--primary-900)" }}>{trf.destinationLocation}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{trf.item}</div>
                      <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                        Qty: <strong>{trf.quantity}</strong> units
                      </div>
                    </td>
                    <td>
                      {/* Visual Status Step Indicator */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem" }}>
                        <span style={{ fontWeight: 700, color: "var(--primary-800)" }}>1. Requested</span>
                        <span>→</span>
                        <span style={{ fontWeight: 700, color: trf.status !== "Requested" ? "var(--primary-800)" : "var(--text-muted)" }}>
                          2. Dispatched
                        </span>
                        <span>→</span>
                        <span style={{ fontWeight: 700, color: trf.status === "Received" ? "var(--success-solid)" : "var(--text-muted)" }}>
                          3. Received
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`}>{trf.status}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {trf.status === "Requested" && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleDispatch(trf)}
                          disabled={!canManageTransfers}
                          title="Reduces stock at source location"
                        >
                          <Truck size={14} />
                          Dispatch Transfer
                        </button>
                      )}
                      {trf.status === "Dispatched" && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleReceive(trf)}
                          disabled={!canManageTransfers}
                          title="Increases stock at destination location"
                        >
                          <CheckCircle2 size={14} />
                          Receive Transfer
                        </button>
                      )}
                      {trf.status === "Received" && (
                        <span style={{ fontSize: "0.75rem", color: "var(--success-solid)", fontWeight: 700 }}>
                          ✓ Received (Locked)
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

      {/* Request Transfer Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="card-title">
                <ArrowLeftRight size={20} color="var(--primary-700)" />
                Request Internal Stock Transfer
              </h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowModal(false)}
                style={{ padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer}>
              <div className="modal-body">
                {actionError && (
                  <div className="alert alert-danger" style={{ padding: "8px 12px", fontSize: "0.8125rem" }}>
                    <AlertCircle size={16} />
                    <span>{actionError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Transfer ID (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. TRF-2002 (Auto-generated if blank)"
                    value={formData.transferId}
                    onChange={(e) => setFormData({ ...formData, transferId: e.target.value })}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Source Location *</label>
                    <select
                      className="form-select"
                      value={formData.sourceLocation}
                      onChange={(e) => setFormData({ ...formData, sourceLocation: e.target.value })}
                    >
                      <option value="Plant Pune">Plant Pune</option>
                      <option value="Warehouse Mumbai">Warehouse Mumbai</option>
                      <option value="Delhi Hub">Delhi Hub</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Destination Location *</label>
                    <select
                      className="form-select"
                      value={formData.destinationLocation}
                      onChange={(e) => setFormData({ ...formData, destinationLocation: e.target.value })}
                    >
                      <option value="Warehouse Mumbai">Warehouse Mumbai</option>
                      <option value="Plant Pune">Plant Pune</option>
                      <option value="Delhi Hub">Delhi Hub</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 12 }}>
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

                  <div className="form-group">
                    <label className="form-label">Transfer Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="alert alert-info" style={{ padding: "8px 12px", fontSize: "0.75rem", marginBottom: 0 }}>
                  <strong>Safety Check:</strong> The system will verify that {formData.sourceLocation} has at least {formData.quantity} available units of {formData.item}.
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
                  {submitting ? "Requesting..." : "Submit Transfer Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
