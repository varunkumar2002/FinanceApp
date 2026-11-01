
const API_URL = "http://127.0.0.1:8000/api/v1/reports";

export async function getReportsSummary(startDate, endDate) {
    const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate
    });

    const response = await fetch(`${API_URL}/summary?${params}`);

    if (!response.ok) {
        let message = "Unable to load reports.";

        try {
            const errorData = await response.json();
            message = errorData.detail || message;
        } catch {
            // Keep the default error message.
        }

        throw new Error(message);
    }

    return response.json();
}
