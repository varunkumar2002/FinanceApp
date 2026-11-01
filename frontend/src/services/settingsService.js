const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

async function request(endpoint, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
        ...options,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.detail || "Something went wrong. Please try again."
        );
    }

    return data;
}

export const getSettings = () => {
    return request("/settings/");
};

export const updateProfile = (profile) => {
    return request("/settings/profile", {
        method: "PUT",
        body: JSON.stringify(profile),
    });
};

export const updatePreferences = (preferences) => {
    return request("/settings/preferences", {
        method: "PUT",
        body: JSON.stringify(preferences),
    });
};

export const updateReminders = (reminders) => {
    return request("/settings/reminders", {
        method: "PUT",
        body: JSON.stringify(reminders),
    });
};