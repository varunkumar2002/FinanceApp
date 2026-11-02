// loanTakenService.js
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      responseData?.detail ||
      responseData?.message ||
      "Something went wrong. Please try again.";

    throw new Error(
      typeof message === "string" ? message : JSON.stringify(message)
    );
  }

  return responseData;
}

export const getTakenLoans = () => apiRequest("/loans-taken/");

export const getTakenLoanSummary = () =>
  apiRequest("/loans-taken/summary");

export const createTakenLoan = (loanData) =>
  apiRequest("/loans-taken/", {
    method: "POST",
    body: JSON.stringify(loanData),
  });

export const updateTakenLoan = (loanId, loanData) =>
  apiRequest(`/loans-taken/${loanId}`, {
    method: "PUT",
    body: JSON.stringify(loanData),
  });

export const getTakenLoanDetails = (loanId) =>
  apiRequest(`/loans-taken/${loanId}`);

export const getTakenLoanInterests = (loanId) =>
  apiRequest(`/loans-taken/${loanId}/interests`);

export const getTakenLoanPayments = (loanId) =>
  apiRequest(`/loans-taken/${loanId}/payments`);

export const recordTakenLoanPayment = (loanId, paymentData) =>
  apiRequest(`/loans-taken/${loanId}/payments`, {
    method: "POST",
    body: JSON.stringify(paymentData),
  });

export const generateTakenLoanInterest = (asOfDate) =>
  apiRequest(
    `/loans-taken/generate-interest?as_of_date=${encodeURIComponent(asOfDate)}`,
    {
      method: "POST",
    }
  );