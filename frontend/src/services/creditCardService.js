const API = "http://127.0.0.1:8000/api/v1/credit-cards";

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.detail || "Credit card request failed.");
  return data;
}

export const getCreditCards = () => request("/");
export const createCreditCard = (data) => request("/", { method: "POST", body: JSON.stringify(data) });
export const updateCreditCard = (id, data) => request(`/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const getCreditCardTransactions = (id) => request(`/${id}/transactions`);
export const createCreditCardTransaction = (id, data) => request(`/${id}/transactions`, { method: "POST", body: JSON.stringify(data) });
