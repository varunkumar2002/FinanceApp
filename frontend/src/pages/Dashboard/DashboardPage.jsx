import { useEffect, useState } from "react";
import {
  Wallet,
  Building2,
  Banknote,
  Smartphone,
  CircleDollarSign,
  RefreshCw
} from "lucide-react";

import { getDashboardSummary } from "../../services/dashboardService";
import "./DashboardPage.css";

function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getDashboardSummary();
      setDashboard(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const formatCurrency = (amount, currency = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2
    }).format(Number(amount || 0));
  };

  const getAccountIcon = (type) => {
    switch (type) {
      case "bank":
        return <Building2 size={21} />;

      case "cash":
        return <Banknote size={21} />;

      case "wallet":
        return <Smartphone size={21} />;

      default:
        return <Wallet size={21} />;
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <RefreshCw className="loading-icon" size={22} />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error">
          <p>{error}</p>
          <button onClick={loadDashboard}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">

      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Here's an overview of your money.</p>
        </div>

        <button
          className="dashboard-refresh-btn"
          onClick={loadDashboard}
          title="Refresh dashboard"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="dashboard-summary-grid">

        <div className="dashboard-summary-card total-money-card">
          <div className="dashboard-card-top">
            <div className="dashboard-card-icon">
              <CircleDollarSign size={22} />
            </div>
            <span>Total Money</span>
          </div>

          <h2>
            {formatCurrency(dashboard.total_balance, dashboard.currency)}
          </h2>

          <p>Across all active accounts</p>
        </div>

        <div className="dashboard-summary-card">
          <div className="dashboard-card-top">
            <div className="dashboard-card-icon">
              <Wallet size={22} />
            </div>
            <span>Total Accounts</span>
          </div>

          <h2>{dashboard.total_accounts}</h2>

          <p>Your active money accounts</p>
        </div>

      </div>

      <div className="dashboard-summary-grid">
        <div className="dashboard-summary-card">
          <div className="dashboard-card-top"><div className="dashboard-card-icon"><Wallet size={22} /></div><span>Total Liabilities</span></div>
          <h2>{formatCurrency(dashboard.total_liabilities, dashboard.currency)}</h2>
          <p>Loans and credit card outstanding</p>
        </div>
        <div className="dashboard-summary-card">
          <div className="dashboard-card-top"><div className="dashboard-card-icon"><CircleDollarSign size={22} /></div><span>Net Worth</span></div>
          <h2>{formatCurrency(dashboard.net_worth, dashboard.currency)}</h2>
          <p>Total assets minus liabilities</p>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="dashboard-section-header"><div><h2>Recent Activity</h2><p>Your latest income, expenses and card activity</p></div></div>
        {(dashboard.recent_transactions || []).length === 0 ? (
          <div className="dashboard-empty"><p>No recent activity yet.</p></div>
        ) : (
          <div className="dashboard-recent-list">
            {dashboard.recent_transactions.map((item) => (
              <div className="dashboard-recent-row" key={item.id}>
                <div><strong>{item.title}</strong><p>{item.category_name || "Transaction"} · {new Date(item.transaction_date).toLocaleDateString("en-IN")}</p></div>
                <strong className={item.transaction_type === "income" || item.transaction_type === "refund" ? "dashboard-positive" : ""}>
                  {item.transaction_type === "income" || item.transaction_type === "refund" ? "+" : item.transaction_type === "payment" ? "−" : "−"}
                  {formatCurrency(item.amount, dashboard.currency)}
                </strong>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account list */}
      <div className="dashboard-section">

        <div className="dashboard-section-header">
          <div>
            <h2>My Accounts</h2>
            <p>Money available across your accounts</p>
          </div>
        </div>

        {dashboard.accounts.length === 0 ? (
          <div className="dashboard-empty">
            <Wallet size={35} />
            <h3>No accounts added yet</h3>
            <p>
              Add your bank accounts, cash, or digital wallets
              under My Money to see them here.
            </p>
          </div>
        ) : (
          <div className="dashboard-accounts-grid">

            {dashboard.accounts.map((account) => (
              <div className="dashboard-account-card" key={account.id}>

                <div className="dashboard-account-icon">
                  {getAccountIcon(account.account_type)}
                </div>

                <div className="dashboard-account-details">
                  <h3>{account.account_name}</h3>

                  <p>
                    {account.institution_name ||
                      account.account_type}
                  </p>

                  <h2>
                    {formatCurrency(
                      account.balance,
                      account.currency
                    )}
                  </h2>
                </div>

              </div>
            ))}

          </div>
        )}

      </div>

    </div>
  );
}

export default DashboardPage;