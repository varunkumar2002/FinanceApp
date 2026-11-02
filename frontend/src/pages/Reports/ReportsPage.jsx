
import { useEffect, useMemo, useState } from "react";

import {
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Wallet,
    IndianRupee,
    CalendarDays,
    ArrowUpRight,
    ArrowDownRight,
    FileBarChart,
    Download
} from "lucide-react";

import { getReportsSummary } from "../../services/reportService";

import "./ReportsPage.css";


function getDateRange(period) {
    const today = new Date();

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const start = new Date(today);

    if (period === "this_month") {
        start.setDate(1);
    } else if (period === "last_month") {
        start.setDate(1);
        start.setMonth(start.getMonth() - 1);

        const end = new Date(today);
        end.setDate(0);

        return {
            startDate: formatDate(start),
            endDate: formatDate(end)
        };
    } else if (period === "this_year") {
        start.setMonth(0, 1);
    } else if (period === "last_30_days") {
        start.setDate(start.getDate() - 29);
    }

    return {
        startDate: formatDate(start),
        endDate: formatDate(today)
    };
}


function formatCurrency(amount, currency = "INR") {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(amount || 0));
}


function formatMonth(month) {
    const [year, monthNumber] = month.split("-");

    return new Date(
        Number(year),
        Number(monthNumber) - 1,
        1
    ).toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit"
    });
}


function formatDate(date) {
    if (!date) return "—";

    return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


function ReportsPage() {
    const [reportData, setReportData] = useState(null);

    const [period, setPeriod] = useState("this_month");

    const initialRange = getDateRange("this_month");

    const [startDate, setStartDate] = useState(initialRange.startDate);
    const [endDate, setEndDate] = useState(initialRange.endDate);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadReports();
    }, [startDate, endDate]);


    async function loadReports() {
        try {
            setLoading(true);
            setError("");

            const result = await getReportsSummary(
                startDate,
                endDate
            );

            setReportData(result);
        } catch (err) {
            console.error("Reports loading error:", err);
            setError(err.message || "Unable to load reports.");
        } finally {
            setLoading(false);
        }
    }


    function handlePeriodChange(value) {
        setPeriod(value);

        if (value === "custom") {
            return;
        }

        const range = getDateRange(value);

        setStartDate(range.startDate);
        setEndDate(range.endDate);
    }


    const summary = reportData?.summary || {};

    const monthlyReport = reportData?.monthly_report || [];

    const categoryReport = reportData?.category_report || [];

    const accountReport = reportData?.account_report || [];

    const transactions = reportData?.transactions || [];


    const maxMonthlyAmount = useMemo(() => {
        return Math.max(
            1,
            ...monthlyReport.map(item =>
                Math.max(
                    Number(item.income),
                    Number(item.expenses)
                )
            )
        );
    }, [monthlyReport]);


    const maxCategoryAmount = useMemo(() => {
        return Math.max(
            1,
            ...categoryReport.map(item => Number(item.amount))
        );
    }, [categoryReport]);


    function downloadCSV() {
        if (!transactions.length) return;

        const headers = [
            "Date",
            "Title",
            "Type",
            "Amount",
            "Account ID",
            "Category ID",
            "Notes"
        ];

        const rows = transactions.map(item => [
            item.transaction_date,
            item.title,
            item.transaction_type,
            item.amount,
            item.account_id,
            item.category_id,
            item.notes || ""
        ]);

        const escapeCSV = (value) => {
            const text = String(value ?? "");
            return `"${text.replace(/"/g, '""')}"`;
        };

        const csv = [
            headers,
            ...rows
        ]
            .map(row => row.map(escapeCSV).join(","))
            .join("\n");

        const blob = new Blob(
            ["\uFEFF" + csv],
            { type: "text/csv;charset=utf-8;" }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;
        link.download = `myfinance-report-${startDate}-to-${endDate}.csv`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    }


    return (
        <div className="reports-page">

            {/* PAGE HEADER */}

            <div className="reports-header">

                <div>
                    <div className="reports-title">
                        <FileBarChart size={25} />
                        <h1>Financial Reports</h1>
                    </div>

                    <p>
                        Understand your income, expenses and financial activity.
                    </p>
                </div>

                <button
                    className="reports-refresh-btn"
                    onClick={loadReports}
                    disabled={loading}
                >
                    <RefreshCw
                        size={17}
                        className={loading ? "reports-spinning" : ""}
                    />
                    Refresh
                </button>

            </div>


            {/* FILTERS */}

            <section className="reports-filter-panel">

                <div className="reports-filter-title">
                    <CalendarDays size={19} />
                    <span>Report Period</span>
                </div>

                <div className="reports-filter-controls">

                    <select
                        value={period}
                        onChange={event =>
                            handlePeriodChange(event.target.value)
                        }
                    >
                        <option value="this_month">This Month</option>
                        <option value="last_month">Last Month</option>
                        <option value="last_30_days">Last 30 Days</option>
                        <option value="this_year">This Year</option>
                        <option value="custom">Custom Range</option>
                    </select>

                    <input
                        type="date"
                        value={startDate}
                        max={endDate}
                        onChange={event => {
                            setPeriod("custom");
                            setStartDate(event.target.value);
                        }}
                    />

                    <span>to</span>

                    <input
                        type="date"
                        value={endDate}
                        min={startDate}
                        onChange={event => {
                            setPeriod("custom");
                            setEndDate(event.target.value);
                        }}
                    />

                </div>

            </section>


            {error && (
                <div className="reports-error">
                    {error}

                    <button onClick={loadReports}>
                        Try Again
                    </button>
                </div>
            )}


            {/* SUMMARY CARDS */}

            <section className="reports-summary-grid">

                <div className="reports-summary-card">

                    <div className="reports-summary-top">
                        <span>Total Income</span>

                        <div className="reports-icon income">
                            <TrendingUp size={21} />
                        </div>
                    </div>

                    <h2>
                        {loading && !reportData
                            ? "Loading..."
                            : formatCurrency(summary.total_income)}
                    </h2>

                    <p>Money received during this period</p>

                </div>


                <div className="reports-summary-card">

                    <div className="reports-summary-top">
                        <span>Total Expenses</span>

                        <div className="reports-icon expense">
                            <TrendingDown size={21} />
                        </div>
                    </div>

                    <h2>
                        {loading && !reportData
                            ? "Loading..."
                            : formatCurrency(summary.total_expenses)}
                    </h2>

                    <p>Money spent during this period</p>

                </div>


                <div className="reports-summary-card">

                    <div className="reports-summary-top">
                        <span>Net Savings</span>

                        <div className="reports-icon savings">
                            <IndianRupee size={21} />
                        </div>
                    </div>

                    <h2 className={
                        Number(summary.net_savings) >= 0
                            ? "reports-positive"
                            : "reports-negative"
                    }>
                        {loading && !reportData
                            ? "Loading..."
                            : formatCurrency(summary.net_savings)}
                    </h2>

                    <p>Income minus expenses</p>

                </div>


                <div className="reports-summary-card">

                    <div className="reports-summary-top">
                        <span>Transactions</span>

                        <div className="reports-icon transactions">
                            <Wallet size={21} />
                        </div>
                    </div>

                    <h2>
                        {loading && !reportData
                            ? "Loading..."
                            : summary.total_transactions || 0}
                    </h2>

                    <p>Recorded transactions in this period</p>

                </div>

            </section>


            {/* MONTHLY INCOME VS EXPENSES */}

            <section className="reports-panel">

                <div className="reports-panel-heading">
                    <div>
                        <h2>Income vs Expenses</h2>
                        <p>Monthly financial performance</p>
                    </div>
                </div>


                {loading && !reportData ? (
                    <div className="reports-empty">
                        Loading monthly report...
                    </div>
                ) : monthlyReport.length === 0 ? (
                    <div className="reports-empty">
                        No financial activity found for this period.
                    </div>
                ) : (
                    <div className="monthly-chart">

                        {monthlyReport.map(item => (
                            <div
                                className="monthly-chart-column"
                                key={item.month}
                            >

                                <div className="monthly-chart-bars">

                                    <div
                                        className="monthly-bar income-bar"
                                        style={{
                                            height: `${Math.max(
                                                3,
                                                Number(item.income) /
                                                maxMonthlyAmount * 100
                                            )}%`
                                        }}
                                        title={`Income: ${formatCurrency(item.income)}`}
                                    />

                                    <div
                                        className="monthly-bar expense-bar"
                                        style={{
                                            height: `${Math.max(
                                                3,
                                                Number(item.expenses) /
                                                maxMonthlyAmount * 100
                                            )}%`
                                        }}
                                        title={`Expenses: ${formatCurrency(item.expenses)}`}
                                    />

                                </div>

                                <span className="monthly-chart-label">
                                    {formatMonth(item.month)}
                                </span>

                            </div>
                        ))}

                    </div>
                )}


                <div className="reports-chart-legend">
                    <span>
                        <i className="legend-income" />
                        Income
                    </span>

                    <span>
                        <i className="legend-expense" />
                        Expenses
                    </span>
                </div>

            </section>


            {/* CATEGORY AND ACCOUNT REPORTS */}

            <section className="reports-two-column">

                <div className="reports-panel">

                    <div className="reports-panel-heading">
                        <div>
                            <h2>Expense Breakdown</h2>
                            <p>Expenses grouped by category</p>
                        </div>
                    </div>


                    {categoryReport.length === 0 ? (
                        <div className="reports-empty">
                            No expense records found.
                        </div>
                    ) : (
                        <div className="category-report-list">

                            {categoryReport.map(item => (
                                <div
                                    className="category-report-item"
                                    key={item.category_id}
                                >

                                    <div className="category-report-info">
                                        <span>
    {item.category_name || "Uncategorized"}
</span>

                                        <strong>
                                            {formatCurrency(item.amount)}
                                        </strong>
                                    </div>

                                    <div className="category-progress">
                                        <div
                                            style={{
                                                width: `${Number(item.amount) /
                                                    maxCategoryAmount * 100}%`
                                            }}
                                        />
                                    </div>

                                </div>
                            ))}

                        </div>
                    )}

                </div>


                <div className="reports-panel">

                    <div className="reports-panel-heading">
                        <div>
                            <h2>Account Balances</h2>
                            <p>Current balances across active accounts</p>
                        </div>
                    </div>


                    {accountReport.length === 0 ? (
                        <div className="reports-empty">
                            No active accounts found.
                        </div>
                    ) : (
                        <div className="account-report-list">

                            {accountReport.map(account => (
                                <div
                                    className="account-report-item"
                                    key={account.account_id}
                                >

                                    <div className="account-report-icon">
                                        <Wallet size={19} />
                                    </div>

                                    <div className="account-report-details">
                                        <strong>{account.account_name}</strong>
                                        <span>{account.account_type}</span>
                                    </div>

                                    <strong>
                                        {formatCurrency(
                                            account.balance,
                                            account.currency || "INR"
                                        )}
                                    </strong>

                                </div>
                            ))}

                        </div>
                    )}

                </div>

            </section>


            {/* TRANSACTION REPORT */}

            <section className="reports-panel reports-transactions-panel">

                <div className="reports-panel-heading">

                    <div>
                        <h2>Transaction Report</h2>
                        <p>
                            Transactions recorded between {formatDate(startDate)}
                            {" "}and {formatDate(endDate)}
                        </p>
                    </div>

                    <button
                        className="reports-export-btn"
                        onClick={downloadCSV}
                        disabled={!transactions.length}
                    >
                        <Download size={17} />
                        Export CSV
                    </button>

                </div>


                {loading && !reportData ? (
                    <div className="reports-empty">
                        Loading transactions...
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="reports-empty">
                        No transactions found for the selected period.
                    </div>
                ) : (
                    <div className="reports-table-wrapper">

                        <table className="reports-table">

                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Type</th>
                                    <th>Account ID</th>
                                    <th>Category ID</th>
                                    <th className="amount-column">Amount</th>
                                </tr>
                            </thead>

                            <tbody>
                                {transactions.map(transaction => (
                                    <tr key={transaction.id}>

                                        <td>
                                            {formatDate(transaction.transaction_date)}
                                        </td>

                                        <td>
                                            <strong>{transaction.title}</strong>
                                        </td>

                                        <td>
                                            <span className={
                                                `reports-type-badge ${transaction.transaction_type}`
                                            }>
                                                {transaction.transaction_type}
                                            </span>
                                        </td>

                                        <td>
                                            {transaction.account_id ?? "—"}
                                        </td>

                                        <td>
                                            {transaction.category_id ?? "—"}
                                        </td>

                                        <td className={`amount-column ${
                                            transaction.transaction_type
                                        }`}>
                                            {transaction.transaction_type === "income"
                                                ? "+"
                                                : "-"}
                                            {formatCurrency(transaction.amount)}
                                        </td>

                                    </tr>
                                ))}
                            </tbody>

                        </table>

                    </div>
                )}

            </section>

        </div>
    );
}


export default ReportsPage;
