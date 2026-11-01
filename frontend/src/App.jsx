// App.jsx
import { useEffect, useState } from "react";

import AccountPage from "./pages/Accounts/AccountPage";
import { getDashboardSummary } from "./services/dashboardService";
import { checkBackendHealth } from "./services/api";
import TransactionsPage from "./pages/Transactions/TransactionsPage";
import LoansGivenPage from "./pages/LoansGiven/LoansGivenPage";
import LoansTakenPage from "./pages/LoansTaken/LoansTakenPage";
import ChitFundsPage from "./pages/ChitFunds/ChitFundsPage";
import InvestmentsPage from "./pages/Investments/InvestmentsPage";
import ReportsPage from "./pages/Reports/ReportsPage";
import SettingsPage from "./pages/Settings/SettingsPage";

import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  HandCoins,
  Landmark,
  Users,
  ChartNoAxesCombined,
  Settings,
  Bell,
  Search,
  CircleUserRound,
  Menu,
  ChevronDown,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  IndianRupee,
  RefreshCw
} from "lucide-react";

import "./App.css";

const navigation = [
  {
    title: "OVERVIEW",
    items: [
      { name: "Dashboard", icon: LayoutDashboard },
      { name: "My Money", icon: Wallet },
      { name: "Transactions", icon: ArrowLeftRight }
    ]
  },
  {
    title: "FINANCIAL MANAGEMENT",
    items: [
      { name: "Loans Given", icon: HandCoins },
      { name: "Loans Taken", icon: Landmark },
      { name: "Chit Funds", icon: Users },
      { name: "Investments", icon: ChartNoAxesCombined }
    ]
  },
  {
    title: "OTHERS",
    items: [
      { name: "Reports", icon: ChartNoAxesCombined },
      { name: "Settings", icon: Settings }
    ]
  }
];

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [backendStatus, setBackendStatus] = useState("Checking...");

  // Dashboard data
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");

  // Check backend connection
  useEffect(() => {
    async function checkConnection() {
      try {
        const result = await checkBackendHealth();

        setBackendStatus(
          result.database === "connected"
            ? "Connected"
            : "Database disconnected"
        );
      } catch {
        setBackendStatus("Backend unavailable");
      }
    }

    checkConnection();
  }, []);

  // Fetch Dashboard data whenever Dashboard is opened
  useEffect(() => {
    if (activePage !== "Dashboard") return;

    async function loadDashboard() {
      try {
        setDashboardLoading(true);
        setDashboardError("");

        const result = await getDashboardSummary();

        setDashboardData(result);
      } catch (error) {
        console.error("Dashboard loading error:", error);
        setDashboardError("Unable to load financial information.");
      } finally {
        setDashboardLoading(false);
      }
    }

    loadDashboard();
  }, [activePage]);

  // Manual Dashboard refresh
  const refreshDashboard = async () => {
    try {
      setDashboardLoading(true);
      setDashboardError("");

      const result = await getDashboardSummary();

      setDashboardData(result);
    } catch (error) {
      console.error("Dashboard refresh error:", error);
      setDashboardError("Unable to refresh dashboard.");
    } finally {
      setDashboardLoading(false);
    }
  };

  // Format INR currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(amount || 0));
  };

  // Financial values
const availableBalance = Number(
    dashboardData?.available_balance || 0
);

const totalAssets = Number(
    dashboardData?.total_assets || 0
);

const totalLiabilities = Number(
    dashboardData?.total_liabilities || 0
);

const netWorth = Number(
    dashboardData?.net_worth || 0
);

  return (
    <div className="app-layout">

      {/* Sidebar */}

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>

        <div className="brand">

          <div className="brand-icon">
            <IndianRupee size={23} />
          </div>

          <div>
            <h2>MyFinance</h2>
            <span>PERSONAL FINANCE</span>
          </div>

        </div>

        <div className="navigation">

          {navigation.map((section) => (

            <div className="nav-section" key={section.title}>

              <p className="nav-heading">
                {section.title}
              </p>

              {section.items.map((item) => {

                const Icon = item.icon;

                return (

                  <button
                    key={item.name}
                    className={`nav-item ${
                      activePage === item.name ? "selected" : ""
                    }`}
                    onClick={() => {
                      setActivePage(item.name);
                      setSidebarOpen(false);
                    }}
                  >

                    <Icon size={19} />

                    <span>{item.name}</span>

                  </button>

                );

              })}

            </div>

          ))}

        </div>

        <div className="sidebar-bottom">

          <div className="connection-status">

            <span
              className={`status-dot ${
                backendStatus === "Connected" ? "online" : ""
              }`}
            />

            <span>{backendStatus}</span>

          </div>

          <div className="sidebar-version">
            MyFinance v1.0.0
          </div>

        </div>

      </aside>


      {/* Main section */}

      <main className="main-area">

        <header className="topbar">

          <button
            className="menu-button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={22} />
          </button>

          <div className="breadcrumb">
            Overview <span>/</span> {activePage}
          </div>

          <div className="topbar-actions">

            <button className="icon-button">
              <Search size={19} />
            </button>

            <button className="icon-button notification">
              <Bell size={19} />
            </button>

            <div className="profile">

              <div className="avatar">
                <CircleUserRound size={24} />
              </div>

              <div className="profile-info">
                <strong>My Account</strong>
                <span>Personal User</span>
              </div>

              <ChevronDown size={16} />

            </div>

          </div>

        </header>


        <div className="page-content">

          {/* DASHBOARD */}

          {activePage === "Dashboard" ? (

            <>

              <div className="page-heading">

                <div>
                  <h1>Financial Overview</h1>

                  <p>
                    Welcome to MyFinance. Here's your financial workspace.
                  </p>
                </div>

                <div style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center"
                }}>

                  <button
                    className="icon-button"
                    onClick={refreshDashboard}
                    title="Refresh Dashboard"
                    disabled={dashboardLoading}
                  >
                    <RefreshCw
                      size={18}
                      className={dashboardLoading ? "dashboard-spinning" : ""}
                    />
                  </button>

                  <button
                    className="primary-button"
                    onClick={() => setActivePage("Transactions")}
                  >
                    <Plus size={18} />
                    Add Transaction
                  </button>

                </div>

              </div>


              {/* Financial Summary */}

              {dashboardError && (
                <div style={{
                  padding: "12px 16px",
                  marginBottom: "18px",
                  background: "#fff0f0",
                  color: "#c0392b",
                  borderRadius: "8px",
                  fontSize: "13px"
                }}>
                  {dashboardError}
                  <button
                    onClick={refreshDashboard}
                    style={{
                      marginLeft: "12px",
                      border: "none",
                      background: "transparent",
                      color: "#315fc5",
                      fontWeight: "600"
                    }}
                  >
                    Retry
                  </button>
                </div>
              )}

              <section className="summary-cards">

                {/* Total Assets */}

                <div className="summary-card">

                  <div className="card-top">
                    <span>Total Assets</span>

                    <div className="card-icon blue">
                      <Wallet size={20} />
                    </div>
                  </div>

                  <h2>
                    {dashboardLoading && !dashboardData
                      ? "Loading..."
                      : formatCurrency(totalAssets)}
                  </h2>

                  <span className="card-caption">
                    Across your active accounts
                  </span>

                </div>


                {/* Total Liabilities */}

                <div className="summary-card">

                  <div className="card-top">
                    <span>Total Liabilities</span>

                    <div className="card-icon orange">
                      <Landmark size={20} />
                    </div>
                  </div>

                  <h2>
                    {formatCurrency(totalLiabilities)}
                  </h2>

                  <span className="card-caption">
                    Outstanding obligations
                  </span>

                </div>


                {/* Net Worth */}

                <div className="summary-card">

                  <div className="card-top">
                    <span>Net Worth</span>

                    <div className="card-icon green">
                      <ChartNoAxesCombined size={20} />
                    </div>
                  </div>

                  <h2>
                    {dashboardLoading && !dashboardData
                      ? "Loading..."
                      : formatCurrency(netWorth)}
                  </h2>

                  <span className="card-caption">
                    Assets minus liabilities
                  </span>

                </div>


                {/* Available Balance */}

                <div className="summary-card">

                  <div className="card-top">
                    <span>Available Balance</span>

                    <div className="card-icon purple">
                      <IndianRupee size={20} />
                    </div>
                  </div>

                  <h2>
                    {dashboardLoading && !dashboardData
                      ? "Loading..."
                      : formatCurrency(availableBalance)}
                  </h2>

                  <span className="card-caption">
                    Across your active accounts
                  </span>

                </div>

              </section>


              {/* Financial modules */}

              <section className="section-header">

                <div>
                  <h2>Financial Management</h2>
                  <p>Manage different aspects of your finances.</p>
                </div>

              </section>


              <section className="module-grid">

                {[
                  {
                    name: "My Money",
                    description: "Track income, expenses and accounts.",
                    icon: Wallet,
                    color: "blue"
                  },
                  {
                    name: "Loans Given",
                    description: "Manage borrowers and interest.",
                    icon: HandCoins,
                    color: "green"
                  },
                  {
                    name: "Loans Taken",
                    description: "Track borrowed money and repayments.",
                    icon: Landmark,
                    color: "orange"
                  },
                  {
                    name: "Chit Funds",
                    description: "Manage contributions and payouts.",
                    icon: Users,
                    color: "purple"
                  },
                  {
                    name: "Investments",
                    description: "Track your investments and returns.",
                    icon: ChartNoAxesCombined,
                    color: "teal"
                  },
                  {
                    name: "Reports",
                    description: "Understand your financial performance.",
                    icon: ArrowUpRight,
                    color: "pink"
                  }
                ].map((module) => {

                  const Icon = module.icon;

                  return (

                    <button
                      className="module-card"
                      key={module.name}
                      onClick={() => setActivePage(module.name)}
                    >

                      <div className={`module-icon ${module.color}`}>
                        <Icon size={23} />
                      </div>

                      <h3>{module.name}</h3>

                      <p>{module.description}</p>

                      <ArrowUpRight
                        className="module-arrow"
                        size={18}
                      />

                    </button>

                  );

                })}

              </section>


              {/* Recent Activity */}

              <section className="activity-panel">

                <div className="section-header">

                  <div>
                    <h2>Recent Activity</h2>

                    <p>
                      Your latest financial transactions will appear here.
                    </p>
                  </div>

                  <button
                    className="text-button"
                    onClick={() => setActivePage("Transactions")}
                  >
                    View all
                  </button>

                </div>

                <div className="empty-state">

                  {(dashboardData?.recent_transactions || []).length > 0 ? (
  <div className="recent-activity-list">
    {dashboardData.recent_transactions.map((transaction) => {
      const isIncome =
        transaction.transaction_type.toLowerCase() === "income";

      return (
        <div
          key={transaction.id}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "15px 0",
            borderBottom: "1px solid #eef0f3"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "13px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isIncome ? "#16834a" : "#d04444",
                background: isIncome ? "#e9f8ef" : "#fff0f0"
              }}
            >
              {isIncome
                ? <ArrowDownRight size={21} />
                : <ArrowUpRight size={21} />}
            </div>

            <div>
              <strong>{transaction.title}</strong>
              <p style={{ fontSize: "12px", color: "#858d9d" }}>
                {transaction.category_name || "Uncategorized"}
                {" · "}
                {new Date(
                  `${transaction.transaction_date}T00:00:00`
                ).toLocaleDateString("en-IN")}
              </p>
            </div>
          </div>

          <strong style={{ color: isIncome ? "#16834a" : "#d04444" }}>
            {isIncome ? "+" : "−"}
            {formatCurrency(transaction.amount)}
          </strong>
        </div>
      );
    })}
  </div>
) : (
  <div className="empty-state">
    <div className="empty-icon">
      <ArrowDownRight size={25} />
    </div>
    <h3>No transactions yet</h3>
    <p>
      Your financial activity will appear here once you start
      adding records.
    </p>
  </div>
)}

                </div>

              </section>

            </>

          ) : activePage === "My Money" ? (

            <AccountPage />

            ) : activePage === "Transactions" ? (
              <TransactionsPage />
              ) : activePage === "Loans Given" ? (
               <LoansGivenPage />
                ) : activePage === "Loans Taken" ? (
                    <LoansTakenPage />
                  ) : activePage === "Chit Funds" ? (
                      <ChitFundsPage />
                    ) : activePage === "Investments" ? (
                      <InvestmentsPage />
                    ): activePage === "Reports" ? (
    <ReportsPage />
) : activePage === "Settings" ? (
    <SettingsPage />
) :
                      (

            <div className="placeholder-page">

              <div className="placeholder-icon">
                <Wallet size={30} />
              </div>

              <h2>{activePage}</h2>

              <p>
                This module will be developed in an upcoming milestone.
              </p>

              <button
                className="primary-button"
                onClick={() => setActivePage("Dashboard")}
              >
                Back to Dashboard
              </button>

            </div>

          )}

        </div>

      </main>

    </div>
  );
}

export default App;
