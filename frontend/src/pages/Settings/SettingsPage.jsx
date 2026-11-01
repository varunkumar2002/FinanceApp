import { useEffect, useState } from "react";
import {
    getSettings,
    updateProfile,
    updatePreferences,
    updateReminders,
} from "../../services/settingsService";

import "./SettingsPage.css";

function SettingsPage() {
    const [activeTab, setActiveTab] = useState("profile");

    const [profile, setProfile] = useState({
        full_name: "",
        email: "",
    });

    const [preferences, setPreferences] = useState({
        currency: "INR",
        date_format: "DD/MM/YYYY",
        theme: "light",
    });

    const [reminders, setReminders] = useState({
        loan_reminders: true,
        chit_fund_reminders: true,
        payment_reminders: true,
        reminder_days_before: 3,
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            setLoading(true);
            setError("");

            const data = await getSettings();

            setProfile({
                full_name: data.profile.full_name || "",
                email: data.profile.email || "",
            });

            setPreferences({
                currency: data.preferences.currency,
                date_format: data.preferences.date_format,
                theme: data.preferences.theme,
            });

            setReminders({
                loan_reminders: data.reminders.loan_reminders,
                chit_fund_reminders: data.reminders.chit_fund_reminders,
                payment_reminders: data.reminders.payment_reminders,
                reminder_days_before:
                    data.reminders.reminder_days_before,
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function updateProfileField(field, value) {
        setProfile((previous) => ({
            ...previous,
            [field]: value,
        }));
    }

    function updatePreferenceField(field, value) {
        setPreferences((previous) => ({
            ...previous,
            [field]: value,
        }));
    }

    function updateReminderField(field, value) {
        setReminders((previous) => ({
            ...previous,
            [field]: value,
        }));
    }

    async function handleProfileSave(event) {
        event.preventDefault();

        try {
            setSaving(true);
            setMessage("");
            setError("");

            const updated = await updateProfile(profile);

            setProfile({
                full_name: updated.full_name,
                email: updated.email,
            });

            setMessage("Profile updated successfully.");
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function handlePreferencesSave(event) {
        event.preventDefault();

        try {
            setSaving(true);
            setMessage("");
            setError("");

            const updated = await updatePreferences(preferences);

            setPreferences(updated);
            setMessage("Preferences saved successfully.");

            // Apply the selected theme to the document.
            document.documentElement.setAttribute(
                "data-theme",
                updated.theme
            );
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleRemindersSave(event) {
        event.preventDefault();

        try {
            setSaving(true);
            setMessage("");
            setError("");

            const updated = await updateReminders(reminders);

            setReminders(updated);
            setMessage("Reminder preferences saved successfully.");
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="settings-loading">
                Loading settings...
            </div>
        );
    }

    return (
        <div className="settings-page">
            <div className="settings-header">
                <div>
                    <h1>Settings</h1>
                    <p>Manage your profile and application preferences.</p>
                </div>
            </div>

            {message && (
                <div className="settings-message success">
                    {message}
                </div>
            )}

            {error && (
                <div className="settings-message error">
                    {error}
                </div>
            )}

            <div className="settings-layout">
                <div className="settings-sidebar">
                    <button
                        className={
                            activeTab === "profile" ? "active" : ""
                        }
                        onClick={() => setActiveTab("profile")}
                    >
                        <span>👤</span>
                        Profile
                    </button>

                    <button
                        className={
                            activeTab === "preferences" ? "active" : ""
                        }
                        onClick={() => setActiveTab("preferences")}
                    >
                        <span>⚙️</span>
                        Preferences
                    </button>

                    <button
                        className={
                            activeTab === "reminders" ? "active" : ""
                        }
                        onClick={() => setActiveTab("reminders")}
                    >
                        <span>🔔</span>
                        Reminders
                    </button>
                </div>

                <div className="settings-content">

                    {/* PROFILE */}
                    {activeTab === "profile" && (
                        <form onSubmit={handleProfileSave}>
                            <div className="settings-section-heading">
                                <h2>Profile Information</h2>
                                <p>
                                    Update your personal information.
                                </p>
                            </div>

                            <div className="settings-form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={profile.full_name}
                                    onChange={(event) =>
                                        updateProfileField(
                                            "full_name",
                                            event.target.value
                                        )
                                    }
                                    required
                                    minLength={2}
                                />
                            </div>

                            <div className="settings-form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    value={profile.email}
                                    onChange={(event) =>
                                        updateProfileField(
                                            "email",
                                            event.target.value
                                        )
                                    }
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="settings-save-button"
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </form>
                    )}

                    {/* PREFERENCES */}
                    {activeTab === "preferences" && (
                        <form onSubmit={handlePreferencesSave}>
                            <div className="settings-section-heading">
                                <h2>Application Preferences</h2>
                                <p>
                                    Customize how information is displayed.
                                </p>
                            </div>

                            <div className="settings-form-group">
                                <label>Default Currency</label>
                                <select
                                    value={preferences.currency}
                                    onChange={(event) =>
                                        updatePreferenceField(
                                            "currency",
                                            event.target.value
                                        )
                                    }
                                >
                                    <option value="INR">
                                        INR - Indian Rupee (₹)
                                    </option>
                                    <option value="USD">
                                        USD - US Dollar ($)
                                    </option>
                                    <option value="EUR">
                                        EUR - Euro (€)
                                    </option>
                                    <option value="GBP">
                                        GBP - British Pound (£)
                                    </option>
                                    <option value="AED">
                                        AED - UAE Dirham
                                    </option>
                                </select>
                            </div>

                            <div className="settings-form-group">
                                <label>Date Format</label>
                                <select
                                    value={preferences.date_format}
                                    onChange={(event) =>
                                        updatePreferenceField(
                                            "date_format",
                                            event.target.value
                                        )
                                    }
                                >
                                    <option value="DD/MM/YYYY">
                                        DD/MM/YYYY
                                    </option>
                                    <option value="MM/DD/YYYY">
                                        MM/DD/YYYY
                                    </option>
                                    <option value="YYYY-MM-DD">
                                        YYYY-MM-DD
                                    </option>
                                </select>
                            </div>

                            <div className="settings-form-group">
                                <label>Appearance</label>
                                <select
                                    value={preferences.theme}
                                    onChange={(event) =>
                                        updatePreferenceField(
                                            "theme",
                                            event.target.value
                                        )
                                    }
                                >
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                    <option value="system">System Default</option>
                                </select>
                                <small>
                                    The selected theme is saved here.
                                    Full application-wide theme styling
                                    needs to be connected separately.
                                </small>
                            </div>

                            <button
                                type="submit"
                                className="settings-save-button"
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Save Preferences"}
                            </button>
                        </form>
                    )}

                    {/* REMINDERS */}
                    {activeTab === "reminders" && (
                        <form onSubmit={handleRemindersSave}>
                            <div className="settings-section-heading">
                                <h2>Reminder Preferences</h2>
                                <p>
                                    Choose which payment reminders you
                                    want to enable.
                                </p>
                            </div>

                            <div className="settings-toggle-row">
                                <div>
                                    <h3>Loan Reminders</h3>
                                    <p>
                                        Reminders for loans given and
                                        loans taken.
                                    </p>
                                </div>

                                <input
                                    type="checkbox"
                                    checked={reminders.loan_reminders}
                                    onChange={(event) =>
                                        updateReminderField(
                                            "loan_reminders",
                                            event.target.checked
                                        )
                                    }
                                />
                            </div>

                            <div className="settings-toggle-row">
                                <div>
                                    <h3>Chit Fund Reminders</h3>
                                    <p>
                                        Reminders for upcoming chit
                                        installments.
                                    </p>
                                </div>

                                <input
                                    type="checkbox"
                                    checked={reminders.chit_fund_reminders}
                                    onChange={(event) =>
                                        updateReminderField(
                                            "chit_fund_reminders",
                                            event.target.checked
                                        )
                                    }
                                />
                            </div>

                            <div className="settings-toggle-row">
                                <div>
                                    <h3>Payment Reminders</h3>
                                    <p>
                                        Reminders for upcoming payments
                                        and dues.
                                    </p>
                                </div>

                                <input
                                    type="checkbox"
                                    checked={reminders.payment_reminders}
                                    onChange={(event) =>
                                        updateReminderField(
                                            "payment_reminders",
                                            event.target.checked
                                        )
                                    }
                                />
                            </div>

                            <div className="settings-form-group">
                                <label>
                                    Remind me how many days in advance?
                                </label>

                                <select
                                    value={reminders.reminder_days_before}
                                    onChange={(event) =>
                                        updateReminderField(
                                            "reminder_days_before",
                                            Number(event.target.value)
                                        )
                                    }
                                >
                                    <option value={0}>On the due date</option>
                                    <option value={1}>1 day before</option>
                                    <option value={2}>2 days before</option>
                                    <option value={3}>3 days before</option>
                                    <option value={5}>5 days before</option>
                                    <option value={7}>7 days before</option>
                                    <option value={15}>15 days before</option>
                                    <option value={30}>30 days before</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="settings-save-button"
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Save Reminder Settings"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SettingsPage;