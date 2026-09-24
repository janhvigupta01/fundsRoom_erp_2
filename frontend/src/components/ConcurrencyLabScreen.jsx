import React, { useState } from "react";
import { api } from "../services/api";
import {
  Zap,
  Play,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Database,
  Code2,
  Cpu
} from "lucide-react";

export const ConcurrencyLabScreen = () => {
  const [location, setLocation] = useState("Warehouse Mumbai");
  const [item, setItem] = useState("Steel Rods");
  const [userAQty, setUserAQty] = useState(80);
  const [userBQty, setUserBQty] = useState(50);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const runSimulation = async () => {
    setRunning(true);
    setError("");
    setResult(null);

    try {
      const data = await api.simulateConcurrency({
        location,
        item,
        userARequestQty: userAQty,
        userBRequestQty: userBQty
      });
      setResult(data);
    } catch (err) {
      setError(err.message || "Simulation failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="stat-icon indigo" style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)" }}>
            <Zap size={20} />
          </div>
          <h2>Concurrency & Race Condition Sandbox</h2>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: 4 }}>
          Live demonstration of backend atomic database serialization preventing race conditions during simultaneous reservations.
        </p>
      </div>

      {/* Case Study Requirement Card */}
      <div className="card" style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)", color: "#ffffff", border: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <ShieldCheck size={20} />
          <h3 style={{ color: "#ffffff", fontSize: "1.125rem" }}>Case Study Concurrency Mandate</h3>
        </div>
        <p style={{ fontSize: "0.875rem", opacity: 0.9, lineHeight: 1.6 }}>
          "Two users must not be able to reserve more stock than actually exists.
          <br />
          <strong>Example:</strong> Available = 100. User A attempts to reserve 80. User B attempts to reserve 50.
          Both requests must <strong>not</strong> succeed. Solve this correctly at the backend/database level."
        </p>
      </div>

      {/* Simulation Controls */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: 16 }}>
          <Cpu size={18} color="var(--primary-700)" />
          Simulate Parallel Concurrent Reservation Requests
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Location</label>
            <select className="form-select" value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="Warehouse Mumbai">Warehouse Mumbai</option>
              <option value="Plant Pune">Plant Pune</option>
              <option value="Delhi Hub">Delhi Hub</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Item</label>
            <select className="form-select" value={item} onChange={(e) => setItem(e.target.value)}>
              <option value="Steel Rods">Steel Rods</option>
              <option value="Electric Motors">Electric Motors</option>
              <option value="Microcontrollers">Microcontrollers</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">User A Requested Reservation</label>
            <input
              type="number"
              className="form-input"
              value={userAQty}
              onChange={(e) => setUserAQty(Number(e.target.value))}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">User B Requested Reservation</label>
            <input
              type="number"
              className="form-input"
              value={userBQty}
              onChange={(e) => setUserBQty(Number(e.target.value))}
            />
          </div>
        </div>

        <button
          className="btn btn-primary"
          style={{ width: "100%", padding: "12px", fontSize: "0.9375rem" }}
          onClick={runSimulation}
          disabled={running}
        >
          <Play size={18} />
          {running ? "Firing Parallel Database Requests..." : "Execute Simultaneous Concurrent Requests"}
        </button>

        {error && (
          <div className="alert alert-danger" style={{ marginTop: 16 }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results Section */}
      {result && (
        <div className="card" style={{ borderColor: "var(--primary-300)" }}>
          <div className="card-header">
            <h3 className="card-title">
              <Database size={20} color="var(--primary-700)" />
              Atomic Database Execution Outcome
            </h3>
            <span className="badge badge-green">Atomic Guard Active</span>
          </div>

          <div style={{ fontSize: "0.875rem", marginBottom: 16, color: "var(--text-secondary)" }}>
            <strong>Scenario:</strong> {result.scenario}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            {/* User A Outcome */}
            <div
              style={{
                padding: 16,
                borderRadius: "var(--radius-md)",
                border: `1px solid ${result.userA.success ? "var(--success-border)" : "var(--danger-border)"}`,
                background: result.userA.success ? "var(--success-bg)" : "var(--danger-bg)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <strong>User A Request: {result.userA.requested} units</strong>
                {result.userA.success ? (
                  <CheckCircle2 size={20} color="var(--success-solid)" />
                ) : (
                  <XCircle size={20} color="var(--danger-solid)" />
                )}
              </div>
              <div style={{ marginTop: 8, fontSize: "0.8125rem", fontWeight: 700, color: result.userA.success ? "var(--success-text)" : "var(--danger-text)" }}>
                STATUS: {result.userA.result}
              </div>
            </div>

            {/* User B Outcome */}
            <div
              style={{
                padding: 16,
                borderRadius: "var(--radius-md)",
                border: `1px solid ${result.userB.success ? "var(--success-border)" : "var(--danger-border)"}`,
                background: result.userB.success ? "var(--success-bg)" : "var(--danger-bg)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <strong>User B Request: {result.userB.requested} units</strong>
                {result.userB.success ? (
                  <CheckCircle2 size={20} color="var(--success-solid)" />
                ) : (
                  <XCircle size={20} color="var(--danger-solid)" />
                )}
              </div>
              <div style={{ marginTop: 8, fontSize: "0.8125rem", fontWeight: 700, color: result.userB.success ? "var(--success-text)" : "var(--danger-text)" }}>
                STATUS: {result.userB.result}
              </div>
            </div>
          </div>

          {result.finalInventory && (
            <div style={{ padding: 14, background: "var(--bg-subtle)", borderRadius: "var(--radius-md)", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: "0.8125rem", marginBottom: 6 }}>
                Updated Inventory State in MongoDB:
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: "0.875rem" }}>
                <span>Physical: <strong>{result.finalInventory.physicalQuantity}</strong></span>
                <span>Reserved: <strong>{result.finalInventory.reservedQuantity}</strong></span>
                <span>Available: <strong style={{ color: "var(--success-solid)" }}>{result.finalInventory.availableQuantity}</strong></span>
              </div>
            </div>
          )}

          {/* Explanation for Interviewers */}
          <div style={{ background: "var(--primary-50)", border: "1px solid var(--primary-200)", padding: 16, borderRadius: "var(--radius-md)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: "var(--primary-900)", marginBottom: 6 }}>
              <Code2 size={16} />
              How to Explain this in the Interview:
            </div>
            <p style={{ fontSize: "0.8125rem", color: "var(--primary-950)", lineHeight: 1.6 }}>
              We solve race conditions at the database layer using an <strong>atomic conditional write</strong> with MongoDB's <code>findOneAndUpdate</code>:
            </p>
            <pre style={{ background: "#0f172a", color: "#38bdf8", padding: 12, borderRadius: 6, fontSize: "0.75rem", marginTop: 8, overflowX: "auto" }}>
{`await Inventory.findOneAndUpdate(
  {
    _id: inventoryId,
    availableQuantity: { $gte: requestedQuantity } // ATOMIC GUARD
  },
  {
    $inc: {
      reservedQuantity: requestedQuantity,
      availableQuantity: -requestedQuantity
    }
  },
  { new: true }
);`}
            </pre>
            <p style={{ fontSize: "0.8125rem", color: "var(--primary-950)", marginTop: 8 }}>
              Because MongoDB executes document-level updates atomically, even if User A and User B send requests at the exact same millisecond, MongoDB serializes them. Whichever update hits first satisfies <code>$gte</code> and decrements available stock; the second concurrent update evaluates against the newly reduced stock, fails the condition, returns <code>null</code>, and is rejected!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
