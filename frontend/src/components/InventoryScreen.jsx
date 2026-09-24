import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Boxes,
  Plus,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Package,
  Layers,
  Lock,
  CheckCircle2,
  X
} from "lucide-react";

export const InventoryScreen = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ totalPhysical: 0, totalReserved: 0, totalAvailable: 0, count: 0 });
  const [metadata, setMetadata] = useState({ locations: [], categories: [], items: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    item: "",
    category: "Raw Material",
    location: "Warehouse Mumbai",
    batch: "",
    physicalQuantity: ""
  });
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canManageInventory = user && (user.role === "Admin" || user.role === "Operations User");

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedLocation !== "All") params.location = selectedLocation;
      if (selectedCategory !== "All") params.category = selectedCategory;
      if (search.trim()) params.search = search.trim();

      const data = await api.getInventory(params);
      setItems(data.items || []);
      setSummary(data.summary || { totalPhysical: 0, totalReserved: 0, totalAvailable: 0, count: 0 });
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const data = await api.getInventoryMetadata();
      setMetadata(data);
    } catch (err) {
      console.error("Failed to load metadata:", err);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [selectedLocation, selectedCategory, search]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const handleAddStock = async (e) => {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");

    if (!newItem.item || !newItem.batch || !newItem.physicalQuantity) {
      setModalError("Please fill out all required fields");
      return;
    }

    if (Number(newItem.physicalQuantity) <= 0) {
      setModalError("Physical quantity must be greater than 0");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.addStock(newItem);
      setModalSuccess(res.message || "Stock added successfully!");
      setTimeout(() => {
        setShowAddModal(false);
        setModalSuccess("");
        setNewItem({
          item: "",
          category: "Raw Material",
          location: "Warehouse Mumbai",
          batch: "",
          physicalQuantity: ""
        });
        fetchInventory();
        fetchMetadata();
      }, 900);
    } catch (err) {
      setModalError(err.message || "Failed to add inventory");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2>Multi-Location Inventory</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Real-time physical, reserved, and calculated available inventory across all enterprise locations
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-secondary" onClick={fetchInventory} disabled={loading}>
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>

          {canManageInventory ? (
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              <span>Add Stock / Batch</span>
            </button>
          ) : (
            <div
              className="badge badge-gray"
              title="Sales users cannot create/modify inventory stock directly"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px" }}
            >
              <Lock size={14} />
              <span>Role: View Only</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon blue">
            <Package size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Physical Quantity</span>
            <span className="stat-value">{summary.totalPhysical.toLocaleString()}</span>
            <span className="stat-desc">Total units on warehouse floors</span>
          </div>
        </div>

        <div className="stat-card amber">
          <div className="stat-icon amber">
            <Lock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Reserved Quantity</span>
            <span className="stat-value">{summary.totalReserved.toLocaleString()}</span>
            <span className="stat-desc">Committed to customer orders</span>
          </div>
        </div>

        <div className="stat-card emerald">
          <div className="stat-icon emerald">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Available Quantity</span>
            <span className="stat-value">{summary.totalAvailable.toLocaleString()}</span>
            <span className="stat-desc">Physical - Reserved (Ready for orders/WO)</span>
          </div>
        </div>

        <div className="stat-card indigo">
          <div className="stat-icon indigo">
            <Layers size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Tracked Batches</span>
            <span className="stat-value">{items.length}</span>
            <span className="stat-desc">Across {selectedLocation === "All" ? "all locations" : selectedLocation}</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ padding: 16 }}>
        <div className="action-bar" style={{ marginBottom: 0 }}>
          <div className="filter-group">
            {/* Search */}
            <div className="search-input-wrapper">
              <Search size={16} />
              <input
                type="text"
                className="search-input"
                placeholder="Search item, batch, category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Location Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 600 }}>
                Location:
              </span>
              <select
                className="filter-select"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                <option value="All">All Locations</option>
                {metadata.locations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 600 }}>
                Category:
              </span>
              <select
                className="filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                {metadata.categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 500 }}>
            Showing {items.length} inventory records
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Item & Category</th>
              <th>Location</th>
              <th>Batch Number</th>
              <th style={{ textAlign: "right" }}>Physical Qty</th>
              <th style={{ textAlign: "right" }}>Reserved Qty</th>
              <th style={{ textAlign: "right" }}>Available Qty</th>
              <th style={{ width: 180 }}>Stock Utilization</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                  Loading real-time inventory...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 40 }}>
                  <AlertCircle size={32} color="var(--text-muted)" style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontWeight: 600, color: "var(--text-main)" }}>No inventory records found</div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    Try changing your filters or add a new batch
                  </div>
                </td>
              </tr>
            ) : (
              items.map((row) => {
                const reservedPct = row.physicalQuantity > 0 ? (row.reservedQuantity / row.physicalQuantity) * 100 : 0;
                const availablePct = 100 - reservedPct;

                return (
                  <tr key={row._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: "var(--text-main)" }}>{row.item}</div>
                      <span className="badge badge-blue" style={{ fontSize: "0.6875rem", marginTop: 2 }}>
                        {row.category}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{row.location}</div>
                    </td>
                    <td>
                      <code style={{ background: "var(--bg-subtle)", padding: "2px 6px", borderRadius: 4, fontSize: "0.8125rem", border: "1px solid var(--border-color)" }}>
                        {row.batch}
                      </code>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, fontSize: "0.9375rem" }}>
                      {row.physicalQuantity}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600, color: row.reservedQuantity > 0 ? "var(--warning-text)" : "var(--text-muted)" }}>
                      {row.reservedQuantity}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span
                        className={`badge ${row.availableQuantity > 0 ? "badge-green" : "badge-red"}`}
                        style={{ fontSize: "0.8125rem", fontWeight: 800 }}
                      >
                        {row.availableQuantity}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: 2 }}>
                        <span>Avail: {Math.round(availablePct)}%</span>
                        <span>Res: {Math.round(reservedPct)}%</span>
                      </div>
                      <div className="stock-bar-container">
                        <div className="stock-bar-available" style={{ width: `${availablePct}%` }} title={`Available: ${row.availableQuantity}`} />
                        <div className="stock-bar-reserved" style={{ width: `${reservedPct}%` }} title={`Reserved: ${row.reservedQuantity}`} />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Stock Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="card-title">
                <Plus size={20} color="var(--primary-700)" />
                Add Stock / New Batch
              </h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowAddModal(false)}
                style={{ padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddStock}>
              <div className="modal-body">
                {modalError && (
                  <div className="alert alert-danger" style={{ padding: "8px 12px", fontSize: "0.8125rem" }}>
                    <AlertCircle size={16} />
                    <span>{modalError}</span>
                  </div>
                )}
                {modalSuccess && (
                  <div className="alert alert-success" style={{ padding: "8px 12px", fontSize: "0.8125rem" }}>
                    <CheckCircle2 size={16} />
                    <span>{modalSuccess}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Item Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Steel Rods, Electric Motors"
                    value={newItem.item}
                    onChange={(e) => setNewItem({ ...newItem, item: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="form-select"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  >
                    <option value="Raw Material">Raw Material</option>
                    <option value="Machinery">Machinery</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Hardware">Hardware</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Location *</label>
                  <select
                    className="form-select"
                    value={newItem.location}
                    onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                  >
                    <option value="Warehouse Mumbai">Warehouse Mumbai</option>
                    <option value="Plant Pune">Plant Pune</option>
                    <option value="Delhi Hub">Delhi Hub</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Batch Code *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. BATCH-MUM-04"
                    value={newItem.batch}
                    onChange={(e) => setNewItem({ ...newItem, batch: e.target.value })}
                    required
                  />
                  <div className="form-help">
                    If this batch already exists at this location, quantity will be safely incremented.
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Physical Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    placeholder="e.g. 50"
                    value={newItem.physicalQuantity}
                    onChange={(e) => setNewItem({ ...newItem, physicalQuantity: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Adding..." : "Add to Inventory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
