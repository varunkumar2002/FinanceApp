
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  X,
  RefreshCw,
  ReceiptText,
  CalendarDays,
  Wallet,
} from "lucide-react";

import {
  getTransactions,
  getTransactionCategories,
  getAccounts,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../../services/transactionService";

import "./TransactionsPage.css";

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const emptyForm = {
  title: "",
  amount: "",
  transaction_type: "expense",
  account_id: "",
  category_id: "",
  transaction_date: today(),
  notes: "",
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const formatDate = (dateString) => {
  if (!dateString) return "-";

  return new Date(`${dateString}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const [filters, setFilters] = useState({
    transaction_type: "",
    account_id: "",
    category_id: "",
    from_date: "",
    to_date: "",
    search: "",
  });

  const loadPageData = async () => {
    setLoading(true);
    setError("");

    try {
      const [transactionData, accountData, categoryData] =
        await Promise.all([
          getTransactions(),
          getAccounts(),
          getTransactionCategories(),
        ]);

      setTransactions(transactionData);
      setAccounts(accountData);
      setCategories(categoryData);
    } catch (err) {
      setError(err.message || "Unable to load transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, []);

  const availableCategories = categories.filter(
    (category) =>
      category.category_type === formData.transaction_type
  );

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesType =
        !filters.transaction_type ||
        transaction.transaction_type === filters.transaction_type;

      const matchesAccount =
        !filters.account_id ||
        String(transaction.account_id) === String(filters.account_id);

      const matchesCategory =
        !filters.category_id ||
        String(transaction.category_id) === String(filters.category_id);

      const matchesFromDate =
        !filters.from_date ||
        transaction.transaction_date >= filters.from_date;

      const matchesToDate =
        !filters.to_date ||
        transaction.transaction_date <= filters.to_date;

      const searchText = filters.search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        transaction.title.toLowerCase().includes(searchText) ||
        (transaction.notes || "").toLowerCase().includes(searchText);

      return (
        matchesType &&
        matchesAccount &&
        matchesCategory &&
        matchesFromDate &&
        matchesToDate &&
        matchesSearch
      );
    });
  }, [transactions, filters]);

  const totalIncome = filteredTransactions
    .filter((item) => item.transaction_type === "income")
    .reduce((total, item) => total + Number(item.amount), 0);

  const totalExpense = filteredTransactions
    .filter((item) => item.transaction_type === "expense")
    .reduce((total, item) => total + Number(item.amount), 0);

  const filteredBalance = totalIncome - totalExpense;

  const getAccountName = (accountId) => {
    const account = accounts.find(
      (item) => item.id === accountId
    );

    return account?.account_name || "Unknown account";
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(
      (item) => item.id === categoryId
    );

    return category?.name || "Uncategorized";
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (transaction) => {
    setEditingId(transaction.id);

    setFormData({
      title: transaction.title,
      amount: String(transaction.amount),
      transaction_type: transaction.transaction_type,
      account_id: String(transaction.account_id),
      category_id: String(transaction.category_id),
      transaction_date: transaction.transaction_date,
      notes: transaction.notes || "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => {
      const updated = {
        ...previous,
        [name]: value,
      };

      if (name === "transaction_type") {
        updated.category_id = "";
      }

      return updated;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!accounts.some(
      (account) =>
        account.id === Number(formData.account_id) &&
        account.is_active
    )) {
      setError("Please select an active account.");
      return;
    }

    if (!categories.some(
      (category) =>
        category.id === Number(formData.category_id) &&
        category.category_type === formData.transaction_type
    )) {
      setError("Please select a valid category.");
      return;
    }

    const payload = {
      title: formData.title.trim(),
      amount: Number(formData.amount).toFixed(2),
      transaction_type: formData.transaction_type,
      account_id: Number(formData.account_id),
      category_id: Number(formData.category_id),
      transaction_date: formData.transaction_date,
      notes: formData.notes.trim() || null,
    };

    setSaving(true);

    try {
      if (editingId) {
        await updateTransaction(editingId, payload);
        setSuccess("Transaction updated successfully.");
      } else {
        await createTransaction(payload);
        setSuccess("Transaction added successfully.");
      }

      closeForm();
      await loadPageData();
    } catch (err) {
      setError(err.message || "Unable to save transaction.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (transaction) => {
    const confirmed = window.confirm(
      `Delete "${transaction.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await deleteTransaction(transaction.id);
      setSuccess("Transaction deleted successfully.");
      await loadPageData();
    } catch (err) {
      setError(err.message || "Unable to delete transaction.");
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      transaction_type: "",
      account_id: "",
      category_id: "",
      from_date: "",
      to_date: "",
      search: "",
    });
  };

  const filterCategories = categories.filter((category) => {
    if (!filters.transaction_type) return true;

    return category.category_type === filters.transaction_type;
  });

  const activeAccounts = accounts.filter(
    (account) => account.is_active
  );

  return (
    <div className="transactions-page">
      <div className="transactions-header">
        <div>
          <h1>Transactions</h1>
          <p>Track and manage your income and expenses.</p>
        </div>

        <div className="transactions-header-actions">
          <button
            className="transaction-refresh-btn"
            onClick={loadPageData}
            disabled={loading}
            title="Refresh transactions"
          >
            <RefreshCw size={17} />
          </button>

          <button
            className="transaction-add-btn"
            onClick={openAddForm}
          >
            <Plus size={18} />
            Add Transaction
          </button>
        </div>
      </div>

      {error && !showForm && (
        <div className="transaction-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="transaction-alert success">
          {success}
        </div>
      )}

      <div className="transaction-summary-grid">
        <div className="transaction-summary-card income-card">
          <div className="transaction-summary-icon">
            <ArrowDownLeft size={21} />
          </div>
          <div>
            <span>Total Income</span>
            <h2>{formatCurrency(totalIncome)}</h2>
          </div>
        </div>

        <div className="transaction-summary-card expense-card">
          <div className="transaction-summary-icon">
            <ArrowUpRight size={21} />
          </div>
          <div>
            <span>Total Expenses</span>
            <h2>{formatCurrency(totalExpense)}</h2>
          </div>
        </div>

        <div className="transaction-summary-card balance-card">
          <div className="transaction-summary-icon">
            <Wallet size={21} />
          </div>
          <div>
            <span>Net Transactions</span>
            <h2 className={filteredBalance < 0 ? "negative" : ""}>
              {formatCurrency(filteredBalance)}
            </h2>
          </div>
        </div>
      </div>

      <section className="transaction-panel">
        <div className="transaction-panel-heading">
          <div>
            <h2>Transaction History</h2>
            <p>
              {filteredTransactions.length} transaction
              {filteredTransactions.length === 1 ? "" : "s"} found
            </p>
          </div>
        </div>

        <div className="transaction-filters">
          <div className="transaction-search">
            <Search size={17} />
            <input
              type="text"
              name="search"
              placeholder="Search transactions..."
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>

          <select
            name="transaction_type"
            value={filters.transaction_type}
            onChange={(event) => {
              handleFilterChange(event);
              setFilters((previous) => ({
                ...previous,
                category_id: "",
              }));
            }}
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <select
            name="account_id"
            value={filters.account_id}
            onChange={handleFilterChange}
          >
            <option value="">All Accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.account_name}
              </option>
            ))}
          </select>

          <select
            name="category_id"
            value={filters.category_id}
            onChange={handleFilterChange}
          >
            <option value="">All Categories</option>
            {filterCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <div className="transaction-date-filter">
            <CalendarDays size={16} />
            <input
              type="date"
              name="from_date"
              aria-label="From date"
              value={filters.from_date}
              onChange={handleFilterChange}
            />
          </div>

          <div className="transaction-date-filter">
            <CalendarDays size={16} />
            <input
              type="date"
              name="to_date"
              aria-label="To date"
              min={filters.from_date || undefined}
              value={filters.to_date}
              onChange={handleFilterChange}
            />
          </div>

          <button
            className="transaction-clear-filters"
            onClick={resetFilters}
          >
            Clear
          </button>
        </div>

        {loading ? (
          <div className="transaction-loading">
            <RefreshCw className="transaction-loading-icon" size={22} />
            <span>Loading transactions...</span>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="transaction-empty">
            <div className="transaction-empty-icon">
              <ReceiptText size={30} />
            </div>
            <h3>No transactions found</h3>
            <p>
              Add your first income or expense transaction to get started.
            </p>
            <button
              className="transaction-add-btn"
              onClick={openAddForm}
            >
              <Plus size={17} />
              Add Transaction
            </button>
          </div>
        ) : (
          <div className="transaction-table-wrapper">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Category</th>
                  <th>Account</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      <div className="transaction-title-cell">
                        <div
                          className={`transaction-type-icon ${transaction.transaction_type}`}
                        >
                          {transaction.transaction_type === "income" ? (
                            <ArrowDownLeft size={17} />
                          ) : (
                            <ArrowUpRight size={17} />
                          )}
                        </div>

                        <div>
                          <strong>{transaction.title}</strong>
                          {transaction.notes && (
                            <small>{transaction.notes}</small>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>{getCategoryName(transaction.category_id)}</td>

                    <td>{getAccountName(transaction.account_id)}</td>

                    <td>{formatDate(transaction.transaction_date)}</td>

                    <td>
                      <strong
                        className={`transaction-amount ${transaction.transaction_type}`}
                      >
                        {transaction.transaction_type === "income"
                          ? "+"
                          : "-"}
                        {formatCurrency(transaction.amount)}
                      </strong>
                    </td>

                    <td>
                      <div className="transaction-row-actions">
                        <button
                          title="Edit transaction"
                          onClick={() => openEditForm(transaction)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          className="delete-action"
                          title="Delete transaction"
                          onClick={() => handleDelete(transaction)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (
        <div
          className="transaction-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              closeForm();
            }
          }}
        >
          <div className="transaction-modal">
            <div className="transaction-modal-header">
              <div>
                <h2>
                  {editingId ? "Edit Transaction" : "Add Transaction"}
                </h2>
                <p>
                  Enter the details of your financial transaction.
                </p>
              </div>

              <button
                className="transaction-modal-close"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="transaction-alert error">
                  {error}
                </div>
              )}

              <div className="transaction-type-selector">
                <button
                  type="button"
                  className={
                    formData.transaction_type === "expense"
                      ? "selected expense"
                      : ""
                  }
                  onClick={() =>
                    setFormData((previous) => ({
                      ...previous,
                      transaction_type: "expense",
                      category_id: "",
                    }))
                  }
                >
                  <ArrowUpRight size={18} />
                  Expense
                </button>

                <button
                  type="button"
                  className={
                    formData.transaction_type === "income"
                      ? "selected income"
                      : ""
                  }
                  onClick={() =>
                    setFormData((previous) => ({
                      ...previous,
                      transaction_type: "income",
                      category_id: "",
                    }))
                  }
                >
                  <ArrowDownLeft size={18} />
                  Income
                </button>
              </div>

              <div className="transaction-form-grid">
                <div className="transaction-form-field full-width">
                  <label htmlFor="transaction-title">
                    Description *
                  </label>
                  <input
                    id="transaction-title"
                    name="title"
                    type="text"
                    placeholder="e.g. Monthly salary, Grocery shopping"
                    value={formData.title}
                    onChange={handleFormChange}
                    minLength={2}
                    maxLength={150}
                    required
                  />
                </div>

                <div className="transaction-form-field">
                  <label htmlFor="transaction-amount">
                    Amount (₹) *
                  </label>
                  <input
                    id="transaction-amount"
                    name="amount"
                    type="number"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={handleFormChange}
                    min="0.01"
                    max="9999999999999.99"
                    step="0.01"
                    required
                  />
                </div>

                <div className="transaction-form-field">
                  <label htmlFor="transaction-date">
                    Date *
                  </label>
                  <input
                    id="transaction-date"
                    name="transaction_date"
                    type="date"
                    value={formData.transaction_date}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="transaction-form-field">
                  <label htmlFor="transaction-account">
                    Account *
                  </label>
                  <select
                    id="transaction-account"
                    name="account_id"
                    value={formData.account_id}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select account</option>
                    {activeAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.account_name}
                        {account.institution_name
                          ? ` - ${account.institution_name}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="transaction-form-field">
                  <label htmlFor="transaction-category">
                    Category *
                  </label>
                  <select
                    id="transaction-category"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select category</option>
                    {availableCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="transaction-form-field full-width">
                  <label htmlFor="transaction-notes">
                    Notes (Optional)
                  </label>
                  <textarea
                    id="transaction-notes"
                    name="notes"
                    placeholder="Add any additional details..."
                    value={formData.notes}
                    onChange={handleFormChange}
                    rows={3}
                  />
                </div>
              </div>

              <div className="transaction-modal-footer">
                <button
                  type="button"
                  className="transaction-cancel-btn"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="transaction-add-btn"
                  disabled={saving || accounts.length === 0}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Transaction"
                      : "Save Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionsPage;
