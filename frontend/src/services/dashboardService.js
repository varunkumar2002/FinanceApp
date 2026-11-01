const API_URL = "http://127.0.0.1:8000/api/v1/dashboard";

export const getDashboardSummary = async () => {
  const response = await fetch(`${API_URL}/summary`);

  if (!response.ok) {
    throw new Error("Unable to fetch dashboard information");
  }

  return await response.json();
};