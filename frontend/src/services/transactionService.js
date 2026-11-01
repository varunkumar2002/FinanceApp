
const API_URL = "http://127.0.0.1:8000/api/v1/transactions";
const ACCOUNT_API_URL = "http://127.0.0.1:8000/api/v1/accounts";

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.detail || "Something went wrong. Please try again."
    );
  }

  return data;
}

export const getTransactions = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.transaction_type) {
    params.append("transaction_type", filters.transaction_type);
  }

  if (filters.account_id) {
    params.append("account_id", filters.account_id);
  }

  if (filters.category_id) {
    params.append("category_id", filters.category_id);
  }

  const query = params.toString();

  const response = await fetch(
    `${API_URL}/${query ? `?${query}` : ""}`
  );

  return handleResponse(response);
};

export const getTransactionCategories = async () => {
  const response = await fetch(`${API_URL}/categories`);
  return handleResponse(response);
};

export const getAccounts = async () => {
  const response = await fetch(`${ACCOUNT_API_URL}/`);
  return handleResponse(response);
};

export const createTransaction = async (transaction) => {
  const response = await fetch(`${API_URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(transaction),
  });

  return handleResponse(response);
};

export const updateTransaction = async (id, transaction) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(transaction),
  });

  return handleResponse(response);
};

export const deleteTransaction = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  return handleResponse(response);
};
