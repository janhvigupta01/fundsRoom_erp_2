const API_BASE = "/api";

// Helper to get auth headers with JWT token
const getHeaders = () => {
  const token = localStorage.getItem("erp_token");
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

// Generic fetch handler with friendly error handling
const handleResponse = async (response) => {
  const contentType = response.headers.get("content-type");
  let data = null;
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = { message: await response.text() };
  }

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }
  return data;
};

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getUsers: async () => {
    const res = await fetch(`${API_BASE}/auth/users`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Inventory
  getInventory: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/inventory?${query}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getInventoryMetadata: async () => {
    const res = await fetch(`${API_BASE}/inventory/metadata`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  addStock: async (payload) => {
    const res = await fetch(`${API_BASE}/inventory`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  // Work Orders
  getWorkOrders: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/work-orders?${query}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  checkStockAndShortage: async (location, item, requiredQuantity) => {
    const query = new URLSearchParams({ location, item, requiredQuantity }).toString();
    const res = await fetch(`${API_BASE}/work-orders/check-stock?${query}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  createWorkOrder: async (payload) => {
    const res = await fetch(`${API_BASE}/work-orders`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  updateWorkOrderStatus: async (id, status) => {
    const res = await fetch(`${API_BASE}/work-orders/${id}/status`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  },

  // Transfers
  getTransfers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/transfers?${query}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  createTransfer: async (payload) => {
    const res = await fetch(`${API_BASE}/transfers`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  dispatchTransfer: async (id) => {
    const res = await fetch(`${API_BASE}/transfers/${id}/dispatch`, {
      method: "PATCH",
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  receiveTransfer: async (id) => {
    const res = await fetch(`${API_BASE}/transfers/${id}/receive`, {
      method: "PATCH",
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Customer Orders
  getOrders: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/orders?${query}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  createOrder: async (payload) => {
    const res = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  cancelOrder: async (id) => {
    const res = await fetch(`${API_BASE}/orders/${id}/cancel`, {
      method: "PATCH",
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  simulateConcurrency: async (payload) => {
    const res = await fetch(`${API_BASE}/orders/simulate-concurrency`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  // Audit Logs
  getAuditLogs: async () => {
    const res = await fetch(`${API_BASE}/audit`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  }
};
