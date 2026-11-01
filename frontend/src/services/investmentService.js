const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Something went wrong");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const getInvestments = () =>
  apiRequest("/investments/");

export const getInvestmentSummary = () =>
  apiRequest("/investments/summary");

export const getInvestment = (id) =>
  apiRequest(`/investments/${id}`);

export const createInvestment = (data) =>
  apiRequest("/investments/", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateInvestment = (id, data) =>
  apiRequest(`/investments/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteInvestment = (id) =>
  apiRequest(`/investments/${id}`, {
    method: "DELETE",
  });

export const getInvestmentTransactions = (id) =>
  apiRequest(`/investments/${id}/transactions`);

export const addInvestmentTransaction = (id, data) =>
  apiRequest(`/investments/${id}/transactions`, {
    method: "POST",
    body: JSON.stringify(data),
  });