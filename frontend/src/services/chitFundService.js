
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api/v1";


async function apiRequest(endpoint, options = {}) {

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {

    const message =
      data?.detail ||
      data?.message ||
      "Request failed.";

    throw new Error(
      typeof message === "string"
        ? message
        : JSON.stringify(message)
    );
  }

  return data;
}


// Get all chit funds
export const getChitFunds = () =>
  apiRequest("/chit-funds/");


// Get dashboard summary
export const getChitFundSummary = () =>
  apiRequest("/chit-funds/summary");


// Create chit fund
export const createChitFund = (payload) =>
  apiRequest("/chit-funds/", {
    method: "POST",
    body: JSON.stringify(payload),
  });


// Update chit fund
export const updateChitFund = (id, payload) =>
  apiRequest(`/chit-funds/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });


// Get individual chit fund
export const getChitFund = (id) =>
  apiRequest(`/chit-funds/${id}`);


// Update installment auction details
export const updateChitInstallment = (
  fundId,
  installmentId,
  payload
) =>
  apiRequest(
    `/chit-funds/${fundId}/installments/${installmentId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );


// Get payment history
export const getChitPayments = (id) =>
  apiRequest(`/chit-funds/${id}/payments`);


// Record contribution or prize receipt
export const createChitPayment = (id, payload) =>
  apiRequest(`/chit-funds/${id}/payments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
