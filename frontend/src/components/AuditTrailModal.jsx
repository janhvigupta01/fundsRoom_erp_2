import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { History, X, RefreshCw, Clock, User, ShieldCheck } from "lucide-react";

export const AuditTrailModal = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data || []);
    } catch (e) {
      console.error("Failed to fetch logs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 720 }}>
        <div className="modal-header">
          <h3 className="card-title">
            <History size={20} color="var(--primary-700)" />
            Enterprise Transaction Audit Trail
          </h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: "65vh" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              Immutable audit log of all system inventory transactions & status changes
            </span>
            <button className="btn btn-secondary btn-sm" onClick={fetchLogs} disabled={loading}>
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 30, color: "var(--text-muted)" }}>Loading audit entries...</div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: "center", padding: 30, color: "var(--text-muted)" }}>No transaction history found.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {logs.map((log) => (
                <div
                  key={log._id}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-page)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className="badge badge-blue" style={{ fontSize: "0.6875rem" }}>{log.module}</span>
                      <strong style={{ fontSize: "0.8125rem" }}>{log.action}</strong>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    <User size={12} />
                    <span>Performed by: <strong>{log.performedBy}</strong></span>
                  </div>

                  {log.details && (
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", background: "#ffffff", padding: "6px 8px", borderRadius: 4, border: "1px solid #f1f5f9" }}>
                      {JSON.stringify(log.details)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close Audit Trail</button>
        </div>
      </div>
    </div>
  );
};
