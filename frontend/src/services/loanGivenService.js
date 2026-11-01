//loanGivenService.js 

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

export const getLoans = () =>
  apiRequest("/loans-given/");

export const getLoanSummary = () =>
  apiRequest("/loans-given/summary");

export const createLoan = (loanData) =>
  apiRequest("/loans-given/", {
    method: "POST",
    body: JSON.stringify(loanData),
  });

export const updateLoan = (loanId, loanData) =>
  apiRequest(`/loans-given/${loanId}`, {
    method: "PUT",
    body: JSON.stringify(loanData),
  });

export const getLoanDetails = (loanId) =>
  apiRequest(`/loans-given/${loanId}`);

export const getLoanInterests = (loanId) =>
  apiRequest(`/loans-given/${loanId}/interests`);

export const getLoanPayments = (loanId) =>
  apiRequest(`/loans-given/${loanId}/payments`);

export const recordLoanPayment = (loanId, paymentData) =>
  apiRequest(`/loans-given/${loanId}/payments`, {
    method: "POST",
    body: JSON.stringify(paymentData),
  });

export const generateLoanInterest = (asOfDate) =>
  apiRequest(
    `/loans-given/generate-interest?as_of_date=${asOfDate}`,
    {
      method: "POST",
    }
  );
