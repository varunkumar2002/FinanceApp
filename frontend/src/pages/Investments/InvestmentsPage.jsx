import { useEffect, useState } from "react";
import {
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  TrendingDown,
  Wallet,
  Pencil,
  Trash2,
  X,
  ArrowUpRight,
  ArrowDownRight,
  History,
} from "lucide-react";

import {
  getInvestments,
  getInvestmentSummary,
  createInvestment,
  updateInvestment,
  deleteInvestment,
  getInvestmentTransactions,
  addInvestmentTransaction,
} from "../../services/investmentService";

import "./InvestmentsPage.css";


const CATEGORIES = [
  { value: "stocks", label: "Stocks" },
  { value: "mutual_funds", label: "Mutual Funds" },
  { value: "etfs", label: "ETFs" },
  { value: "gold", label: "Gold" },
  { value: "fixed_deposits", label: "Fixed Deposits" },
  { value: "bonds", label: "Bonds" },
  { value: "crypto", label: "Cryptocurrency" },
  { value: "other", label: "Other" },
];

const emptyInvestment = {
  name: "",
  symbol: "",
  category: "stocks",
  current_price: "0",
  notes: "",
};

const emptyTransaction = {
  transaction_type: "buy",
  quantity: "",
  unit_price: "",
  amount: "",
  transaction_date: new Date().toISOString().slice(0, 10),
  notes: "",
};

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const number = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 4,
  });

const categoryLabel = (value) =>
  CATEGORIES.find((item) => item.value === value)?.label || value;

const dateLabel = (value) => {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
};


export default function InvestmentsPage() {
  const [investments, setInvestments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [investmentModal, setInvestmentModal] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState(null);
  const [investmentForm, setInvestmentForm] = useState(emptyInvestment);

  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const [transactionModal, setTransactionModal] = useState(false);
  const [transactionForm, setTransactionForm] = useState(emptyTransaction);

  const [activeTab, setActiveTab] = useState("holdings");


  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [investmentData, summaryData] = await Promise.all([
        getInvestments(),
        getInvestmentSummary(),
      ]);

      setInvestments(investmentData);
      setSummary(summaryData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadData();
  }, []);


  async function openDetails(investment) {
    try {
      setError("");

      const transactionData = await getInvestmentTransactions(
        investment.id
      );

      setSelectedInvestment(investment);
      setTransactions(transactionData);
      setActiveTab("holdings");
    } catch (err) {
      setError(err.message);
    }
  }


  function openCreateModal() {
    setEditingInvestment(null);
    setInvestmentForm(emptyInvestment);
    setInvestmentModal(true);
  }


  function openEditModal(investment) {
    setEditingInvestment(investment);

    setInvestmentForm({
      name: investment.name,
      symbol: investment.symbol || "",
      category: investment.category,
      current_price: String(investment.current_price),
      notes: investment.notes || "",
      price_updated_at:
        investment.price_updated_at ||
        new Date().toISOString().slice(0, 10),
    });

    setInvestmentModal(true);
  }


  async function saveInvestment(event) {
    event.preventDefault();

    if (!investmentForm.name.trim()) {
      setError("Please enter an investment name.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        ...investmentForm,
        name: investmentForm.name.trim(),
        symbol: investmentForm.symbol.trim() || null,
        current_price: Number(investmentForm.current_price),
        notes: investmentForm.notes.trim() || null,
      };

      if (editingInvestment) {
        await updateInvestment(editingInvestment.id, {
          ...payload,
          price_updated_at:
            investmentForm.price_updated_at ||
            new Date().toISOString().slice(0, 10),
        });
        setNotice("Investment updated successfully.");
      } else {
        await createInvestment(payload);
        setNotice("Investment created successfully.");
      }

      setInvestmentModal(false);
      await loadData();

      if (selectedInvestment) {
        setSelectedInvestment(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }


  async function removeInvestment(investment) {
    const confirmed = window.confirm(
      `Delete ${investment.name} and its transaction history?`
    );

    if (!confirmed) return;

    try {
      setError("");
      await deleteInvestment(investment.id);

      setSelectedInvestment(null);
      setNotice("Investment deleted successfully.");

      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }


  function openTransactionModal(type = "buy") {
    setTransactionForm({
      ...emptyTransaction,
      transaction_type: type,
    });

    setTransactionModal(true);
  }


  function updateTransactionField(field, value) {
    setTransactionForm((previous) => {
      const updated = {
        ...previous,
        [field]: value,
      };

      if (
        field === "quantity" ||
        field === "unit_price"
      ) {
        const quantity = Number(updated.quantity || 0);
        const unitPrice = Number(updated.unit_price || 0);

        updated.amount = (quantity * unitPrice).toFixed(2);
      }

      return updated;
    });
  }


  async function saveTransaction(event) {
    event.preventDefault();

    if (!selectedInvestment) return;

    const type = transactionForm.transaction_type;

    if (type === "buy" || type === "sell") {
      if (
        Number(transactionForm.quantity) <= 0 ||
        Number(transactionForm.unit_price) <= 0
      ) {
        setError("Enter a valid quantity and unit price.");
        return;
      }
    }

    if (type === "dividend" && Number(transactionForm.amount) <= 0) {
      setError("Enter a valid dividend amount.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        ...transactionForm,
        quantity:
          type === "dividend"
            ? 0
            : Number(transactionForm.quantity),
        unit_price:
          type === "dividend"
            ? 0
            : Number(transactionForm.unit_price),
        amount: Number(transactionForm.amount),
      };

      await addInvestmentTransaction(
        selectedInvestment.id,
        payload
      );

      setTransactionModal(false);
      setNotice("Investment transaction recorded.");

      await loadData();

      const updatedTransactions =
        await getInvestmentTransactions(selectedInvestment.id);

      setTransactions(updatedTransactions);

      const updatedInvestments = await getInvestments();

      const updatedSelected = updatedInvestments.find(
        (item) => item.id === selectedInvestment.id
      );

      setInvestments(updatedInvestments);

      if (updatedSelected) {
        setSelectedInvestment(updatedSelected);
      }

      const updatedSummary = await getInvestmentSummary();
      setSummary(updatedSummary);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }


  const filteredInvestments = investments.filter((investment) => {
    const matchesSearch =
      investment.name.toLowerCase().includes(search.toLowerCase()) ||
      (investment.symbol || "")
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" ||
      investment.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });


  if (loading) {
    return (
      <div className="investment-page investment-loading">
        <RefreshCw className="spin" size={24} />
        <p>Loading investments...</p>
      </div>
    );
  }


  return (
    <div className="investment-page">

      <div className="investment-header">
        <div>
          <h1>Investments</h1>
          <p>Track your portfolio and monitor your returns.</p>
        </div>

        <div className="investment-header-actions">
          <button
            className="investment-secondary-button"
            onClick={loadData}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            className="investment-primary-button"
            onClick={openCreateModal}
          >
            <Plus size={17} />
            Add Investment
          </button>
        </div>
      </div>


      {error && (
        <div className="investment-alert error">
          {error}
          <button onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {notice && (
        <div className="investment-alert success">
          {notice}
          <button onClick={() => setNotice("")}>
            <X size={16} />
          </button>
        </div>
      )}


      {summary && (
        <div className="investment-summary-grid">

          <div className="investment-summary-card">
            <div className="investment-summary-icon">
              <Wallet size={20} />
            </div>
            <p>Total Invested</p>
            <h2>{currency(summary.total_invested)}</h2>
          </div>

          <div className="investment-summary-card">
            <div className="investment-summary-icon">
              <TrendingUp size={20} />
            </div>
            <p>Current Value</p>
            <h2>{currency(summary.current_value)}</h2>
          </div>

          <div className="investment-summary-card">
            <div className="investment-summary-icon">
              {Number(summary.total_profit_loss) >= 0 ? (
                <ArrowUpRight size={20} />
              ) : (
                <ArrowDownRight size={20} />
              )}
            </div>
            <p>Total Profit / Loss</p>
            <h2
              className={
                Number(summary.total_profit_loss) >= 0
                  ? "positive"
                  : "negative"
              }
            >
              {currency(summary.total_profit_loss)}
            </h2>
            <span>{number(summary.return_percentage)}% return</span>
          </div>

          <div className="investment-summary-card">
            <div className="investment-summary-icon">
              <History size={20} />
            </div>
            <p>Dividends Received</p>
            <h2>{currency(summary.dividends_received)}</h2>
          </div>

        </div>
      )}


      {summary && summary.category_breakdown.length > 0 && (
        <section className="investment-panel">
          <div className="investment-section-heading">
            <div>
              <h2>Portfolio Allocation</h2>
              <p>Current value by investment category</p>
            </div>
          </div>

          <div className="investment-allocation-list">
            {summary.category_breakdown.map((item) => {
              const percentage =
                Number(summary.current_value) > 0
                  ? (Number(item.current_value) /
                      Number(summary.current_value)) *
                    100
                  : 0;

              return (
                <div
                  className="investment-allocation-item"
                  key={item.category}
                >
                  <div className="investment-allocation-label">
                    <span>{categoryLabel(item.category)}</span>
                    <strong>{currency(item.current_value)}</strong>
                  </div>

                  <div className="investment-progress">
                    <div
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <small>{percentage.toFixed(1)}%</small>
                </div>
              );
            })}
          </div>
        </section>
      )}


      {selectedInvestment ? (
        <section className="investment-panel investment-detail-panel">

          <div className="investment-detail-heading">
            <div>
              <button
                className="investment-back-button"
                onClick={() => setSelectedInvestment(null)}
              >
                ← Back to investments
              </button>

              <h2>{selectedInvestment.name}</h2>

              <p>
                {selectedInvestment.symbol || "No symbol"} ·{" "}
                {categoryLabel(selectedInvestment.category)}
              </p>
            </div>

            <div className="investment-header-actions">
              <button
                className="investment-secondary-button"
                onClick={() => openEditModal(selectedInvestment)}
              >
                <Pencil size={15} />
                Edit
              </button>

              <button
                className="investment-danger-button"
                onClick={() => removeInvestment(selectedInvestment)}
              >
                <Trash2 size={15} />
                Delete
              </button>
            </div>
          </div>


          <div className="investment-detail-grid">
            <div>
              <span>Units held</span>
              <strong>{number(selectedInvestment.quantity_held)}</strong>
            </div>

            <div>
              <span>Average net invested</span>
              <strong>{currency(selectedInvestment.total_invested)}</strong>
            </div>

            <div>
              <span>Current price</span>
              <strong>{currency(selectedInvestment.current_price)}</strong>
            </div>

            <div>
              <span>Current value</span>
              <strong>{currency(selectedInvestment.current_value)}</strong>
            </div>

            <div>
              <span>Profit / Loss</span>
              <strong
                className={
                  Number(selectedInvestment.profit_loss) >= 0
                    ? "positive"
                    : "negative"
                }
              >
                {currency(selectedInvestment.profit_loss)}
              </strong>
            </div>

            <div>
              <span>Last price update</span>
              <strong>{dateLabel(selectedInvestment.price_updated_at)}</strong>
            </div>
          </div>


          <div className="investment-detail-actions">
            <button
              className="investment-primary-button"
              onClick={() => openTransactionModal("buy")}
            >
              <Plus size={16} />
              Record Purchase
            </button>

            <button
              className="investment-secondary-button"
              onClick={() => openTransactionModal("sell")}
            >
              <ArrowUpRight size={16} />
              Record Sale
            </button>

            <button
              className="investment-secondary-button"
              onClick={() => openTransactionModal("dividend")}
            >
              <Wallet size={16} />
              Record Dividend
            </button>
          </div>


          <div className="investment-section-heading">
            <div>
              <h2>Transaction History</h2>
              <p>Purchases, sales and dividends</p>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="investment-empty">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="investment-table-wrapper">
              <table className="investment-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Amount</th>
                    <th>Notes</th>
                  </tr>
                </thead>

                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{dateLabel(transaction.transaction_date)}</td>
                      <td>
                        <span
                          className={`investment-type ${transaction.transaction_type}`}
                        >
                          {transaction.transaction_type}
                        </span>
                      </td>
                      <td>{number(transaction.quantity)}</td>
                      <td>{currency(transaction.unit_price)}</td>
                      <td>{currency(transaction.amount)}</td>
                      <td>{transaction.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </section>
      ) : (

        <section className="investment-panel">
          <div className="investment-section-heading">
            <div>
              <h2>My Investments</h2>
              <p>{investments.length} investments in your portfolio</p>
            </div>
          </div>

          <div className="investment-toolbar">
            <div className="investment-search">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search investments..."
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((category) => (
                <option
                  value={category.value}
                  key={category.value}
                >
                  {category.label}
                </option>
              ))}
            </select>
          </div>


          {filteredInvestments.length === 0 ? (
            <div className="investment-empty">
              <Wallet size={32} />
              <h3>No investments found</h3>
              <p>Add an investment to start tracking your portfolio.</p>

              <button
                className="investment-primary-button"
                onClick={openCreateModal}
              >
                <Plus size={16} />
                Add Investment
              </button>
            </div>
          ) : (
            <div className="investment-table-wrapper">
              <table className="investment-table">
                <thead>
                  <tr>
                    <th>Investment</th>
                    <th>Category</th>
                    <th>Units</th>
                    <th>Invested</th>
                    <th>Current Value</th>
                    <th>Profit / Loss</th>
                    <th>Return</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {filteredInvestments.map((investment) => (
                    <tr key={investment.id}>
                      <td>
                        <button
                          className="investment-name-button"
                          onClick={() => openDetails(investment)}
                        >
                          {investment.name}
                        </button>
                        <small>{investment.symbol || "—"}</small>
                      </td>

                      <td>{categoryLabel(investment.category)}</td>
                      <td>{number(investment.quantity_held)}</td>
                      <td>{currency(investment.total_invested)}</td>
                      <td>{currency(investment.current_value)}</td>

                      <td
                        className={
                          Number(investment.profit_loss) >= 0
                            ? "positive"
                            : "negative"
                        }
                      >
                        {currency(investment.profit_loss)}
                      </td>

                      <td
                        className={
                          Number(investment.return_percentage) >= 0
                            ? "positive"
                            : "negative"
                        }
                      >
                        {number(investment.return_percentage)}%
                      </td>

                      <td>
                        <button
                          className="investment-icon-button"
                          title="Edit investment"
                          onClick={() => openEditModal(investment)}
                        >
                          <Pencil size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}


      {/* Add / Edit Investment Modal */}

      {investmentModal && (
        <div
          className="investment-modal-backdrop"
          onClick={() => setInvestmentModal(false)}
        >
          <div
            className="investment-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="investment-modal-heading">
              <div>
                <h2>
                  {editingInvestment ? "Edit Investment" : "Add Investment"}
                </h2>
                <p>Enter the investment details below.</p>
              </div>

              <button onClick={() => setInvestmentModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveInvestment}>
              <label>
                Investment Name *
                <input
                  required
                  value={investmentForm.name}
                  onChange={(event) =>
                    setInvestmentForm({
                      ...investmentForm,
                      name: event.target.value,
                    })
                  }
                  placeholder="e.g. HDFC Top 100 Fund"
                />
              </label>

              <label>
                Symbol / Code
                <input
                  value={investmentForm.symbol}
                  onChange={(event) =>
                    setInvestmentForm({
                      ...investmentForm,
                      symbol: event.target.value,
                    })
                  }
                  placeholder="e.g. HDFCBANK"
                />
              </label>

              <label>
                Category *
                <select
                  value={investmentForm.category}
                  onChange={(event) =>
                    setInvestmentForm({
                      ...investmentForm,
                      category: event.target.value,
                    })
                  }
                >
                  {CATEGORIES.map((category) => (
                    <option
                      value={category.value}
                      key={category.value}
                    >
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Current Price / Unit (₹)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={investmentForm.current_price}
                  onChange={(event) =>
                    setInvestmentForm({
                      ...investmentForm,
                      current_price: event.target.value,
                    })
                  }
                />
              </label>

              {editingInvestment && (
                <label>
                  Price Updated Date
                  <input
                    type="date"
                    value={investmentForm.price_updated_at || ""}
                    onChange={(event) =>
                      setInvestmentForm({
                        ...investmentForm,
                        price_updated_at: event.target.value,
                      })
                    }
                  />
                </label>
              )}

              <label>
                Notes
                <textarea
                  rows="3"
                  value={investmentForm.notes}
                  onChange={(event) =>
                    setInvestmentForm({
                      ...investmentForm,
                      notes: event.target.value,
                    })
                  }
                  placeholder="Optional notes"
                />
              </label>

              <div className="investment-modal-actions">
                <button
                  type="button"
                  className="investment-secondary-button"
                  onClick={() => setInvestmentModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="investment-primary-button"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Investment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Add Transaction Modal */}

      {transactionModal && (
        <div
          className="investment-modal-backdrop"
          onClick={() => setTransactionModal(false)}
        >
          <div
            className="investment-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="investment-modal-heading">
              <div>
                <h2>Record Transaction</h2>
                <p>{selectedInvestment?.name}</p>
              </div>

              <button onClick={() => setTransactionModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveTransaction}>
              <label>
                Transaction Type
                <select
                  value={transactionForm.transaction_type}
                  onChange={(event) =>
                    setTransactionForm({
                      ...emptyTransaction,
                      transaction_type: event.target.value,
                      transaction_date:
                        new Date().toISOString().slice(0, 10),
                    })
                  }
                >
                  <option value="buy">Purchase</option>
                  <option value="sell">Sale</option>
                  <option value="dividend">Dividend</option>
                </select>
              </label>

              {transactionForm.transaction_type !== "dividend" && (
                <>
                  <label>
                    Quantity *
                    <input
                      required
                      type="number"
                      min="0.0001"
                      step="0.0001"
                      value={transactionForm.quantity}
                      onChange={(event) =>
                        updateTransactionField(
                          "quantity",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    Unit Price (₹) *
                    <input
                      required
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={transactionForm.unit_price}
                      onChange={(event) =>
                        updateTransactionField(
                          "unit_price",
                          event.target.value
                        )
                      }
                    />
                  </label>
                </>
              )}

              <label>
                {transactionForm.transaction_type === "dividend"
                  ? "Dividend Amount (₹)"
                  : "Total Amount (₹)"}
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={transactionForm.amount}
                  onChange={(event) =>
                    updateTransactionField("amount", event.target.value)
                  }
                />
              </label>

              <label>
                Transaction Date *
                <input
                  required
                  type="date"
                  value={transactionForm.transaction_date}
                  onChange={(event) =>
                    setTransactionForm({
                      ...transactionForm,
                      transaction_date: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Notes
                <textarea
                  rows="3"
                  value={transactionForm.notes}
                  onChange={(event) =>
                    setTransactionForm({
                      ...transactionForm,
                      notes: event.target.value,
                    })
                  }
                />
              </label>

              <div className="investment-modal-actions">
                <button
                  type="button"
                  className="investment-secondary-button"
                  onClick={() => setTransactionModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="investment-primary-button"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}