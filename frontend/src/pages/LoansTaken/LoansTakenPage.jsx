// LoansTakenPage.jsx
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  HandCoins,
  History,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  TrendingDown,
  Wallet,
  X,
} from "lucide-react";

import {
  getTakenLoans,
  getTakenLoanSummary,
  createTakenLoan,
  updateTakenLoan,
  getTakenLoanDetails,
  getTakenLoanInterests,
  getTakenLoanPayments,
  recordTakenLoanPayment,
  generateTakenLoanInterest,
} from "../../services/loanTakenService";

import "./LoansTakenPage.css";
import CreditCardsSection from "./CreditCardsSection";

const initialLoanForm = {
  lender_name: "",
  lender_phone: "",
  principal_amount: "",
  monthly_interest_rate: "",
  start_date: new Date().toISOString().split("T")[0],
  due_date: "",
  notes: "",
};

const initialPaymentForm = {
  payment_type: "principal",
  amount: "",
  payment_date: new Date().toISOString().split("T")[0],
  interest_id: "",
  notes: "",
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getToday = () => new Date().toISOString().split("T")[0];

function SummaryCard({ title, value, icon: Icon, description, className = "" }) {
  return (
    <div className={`taken-summary-card ${className}`}>
      <div className="taken-summary-card-top">
        <div className="taken-summary-icon">
          <Icon size={20} />
        </div>
      </div>

      <p className="taken-summary-title">{title}</p>
      <h2 className="taken-summary-value">{formatCurrency(value)}</h2>

      {description && (
        <p className="taken-summary-description">{description}</p>
      )}
    </div>
  );
}

function Modal({ title, subtitle, onClose, children, wide = false }) {
  return (
    <div className="taken-modal-overlay" onMouseDown={onClose}>
      <div
        className={`taken-modal ${wide ? "taken-modal-wide" : ""}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="taken-modal-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>

          <button
            type="button"
            className="taken-icon-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="taken-modal-content">{children}</div>
      </div>
    </div>
  );
}

export default function LoansTakenPage() {
  const [loans, setLoans] = useState([]);
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generatingInterest, setGeneratingInterest] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showLoanModal, setShowLoanModal] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [loanForm, setLoanForm] = useState(initialLoanForm);

  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loanDetails, setLoanDetails] = useState(null);
  const [interestHistory, setInterestHistory] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);

  const [paymentTargetLoan, setPaymentTargetLoan] = useState(null);

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    setLoading(true);
    setError("");

    try {
      const [loansResponse, summaryResponse] = await Promise.all([
        getTakenLoans(),
        getTakenLoanSummary(),
      ]);

      setLoans(Array.isArray(loansResponse) ? loansResponse : []);
      setSummary(summaryResponse || {});
    } catch (err) {
      setError(err.message || "Unable to load Loans Taken data.");
    } finally {
      setLoading(false);
    }
  };

  const loadLoanDetails = async (loanId) => {
    setDetailsLoading(true);
    setError("");

    try {
      const [details, interests, payments] = await Promise.all([
        getTakenLoanDetails(loanId),
        getTakenLoanInterests(loanId),
        getTakenLoanPayments(loanId),
      ]);

      setLoanDetails(details || null);
      setInterestHistory(Array.isArray(interests) ? interests : []);
      setPaymentHistory(Array.isArray(payments) ? payments : []);
      setSelectedLoan(details || loans.find((loan) => loan.id === loanId));
    } catch (err) {
      setError(err.message || "Unable to load loan details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingLoan(null);
    setLoanForm({
      ...initialLoanForm,
      start_date: getToday(),
    });
    setShowLoanModal(true);
  };

  const openEditModal = (loan) => {
    setEditingLoan(loan);

    setLoanForm({
      lender_name: loan.lender_name || "",
      lender_phone: loan.lender_phone || "",
      principal_amount: loan.principal_amount ?? "",
      monthly_interest_rate: loan.monthly_interest_rate ?? "",
      start_date: loan.start_date
        ? loan.start_date.split("T")[0]
        : getToday(),
      due_date: loan.due_date ? loan.due_date.split("T")[0] : "",
      notes: loan.notes || "",
    });

    setShowLoanModal(true);
  };

  const handleLoanFormChange = (event) => {
    const { name, value } = event.target;

    setLoanForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleLoanSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const payload = {
      lender_name: loanForm.lender_name.trim(),
      lender_phone: loanForm.lender_phone.trim() || null,
      principal_amount: Number(loanForm.principal_amount),
      monthly_interest_rate: Number(loanForm.monthly_interest_rate),
      start_date: loanForm.start_date,
      due_date: loanForm.due_date || null,
      notes: loanForm.notes.trim() || null,
    };

    try {
      if (editingLoan) {
        await updateTakenLoan(editingLoan.id, payload);
        setSuccess("Loan details updated successfully.");
      } else {
        await createTakenLoan(payload);
        setSuccess("Loan added successfully.");
      }

      setShowLoanModal(false);
      setEditingLoan(null);
      setLoanForm(initialLoanForm);

      await loadPageData();
    } catch (err) {
      setError(err.message || "Unable to save loan.");
    } finally {
      setSubmitting(false);
    }
  };

  const openPaymentModal = (loan) => {
    setPaymentTargetLoan(loan);
    setPaymentForm({
      ...initialPaymentForm,
      payment_date: getToday(),
    });
    setShowPaymentModal(true);
  };

  const handlePaymentFormChange = (event) => {
    const { name, value } = event.target;

    setPaymentForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePaymentSubmit = async (event) => {
    event.preventDefault();

    if (!paymentTargetLoan) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    const payload = {
      payment_type: paymentForm.payment_type,
      amount: Number(paymentForm.amount),
      payment_date: paymentForm.payment_date,
      interest_id:
        paymentForm.payment_type === "interest" && paymentForm.interest_id
          ? Number(paymentForm.interest_id)
          : null,
      notes: paymentForm.notes.trim() || null,
    };

    try {
      await recordTakenLoanPayment(paymentTargetLoan.id, payload);

      setShowPaymentModal(false);
      setPaymentTargetLoan(null);
      setPaymentForm(initialPaymentForm);

      setSuccess("Payment recorded successfully.");

      await loadPageData();

      if (selectedLoan?.id === paymentTargetLoan.id) {
        await loadLoanDetails(paymentTargetLoan.id);
      }
    } catch (err) {
      setError(err.message || "Unable to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateInterest = async () => {
    const confirmed = window.confirm(
      "Generate monthly interest for eligible active loans as of today?"
    );

    if (!confirmed) return;

    setGeneratingInterest(true);
    setError("");
    setSuccess("");

    try {
      const result = await generateTakenLoanInterest(getToday());

      const message =
        typeof result === "string"
          ? result
          : result?.message || "Interest generation completed.";

      setSuccess(message);

      await loadPageData();

      if (selectedLoan?.id) {
        await loadLoanDetails(selectedLoan.id);
      }
    } catch (err) {
      setError(err.message || "Unable to generate interest.");
    } finally {
      setGeneratingInterest(false);
    }
  };

  const closeDetails = () => {
    setSelectedLoan(null);
    setLoanDetails(null);
    setInterestHistory([]);
    setPaymentHistory([]);
  };

  const filteredLoans = loans.filter((loan) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      (loan.lender_name || "").toLowerCase().includes(search) ||
      (loan.lender_phone || "").toLowerCase().includes(search);

    const isActive = loan.is_active !== false;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && isActive) ||
      (statusFilter === "closed" && !isActive);

    return matchesSearch && matchesStatus;
  });

  const outstandingPrincipal = Number(summary?.outstanding_principal || 0);
  const outstandingInterest = Number(summary?.outstanding_interest || 0);

  const availableInterests = interestHistory.filter(
    (interest) =>
      Number(
        interest.outstanding_amount ??
          interest.remaining_amount ??
          interest.amount_due ??
          0
      ) > 0
  );

  const getInterestOutstanding = (interest) =>
    Number(
      interest.outstanding_amount ??
        interest.remaining_amount ??
        interest.amount_due ??
        0
    );

  if (selectedLoan) {
    return (
      <div className="loans-taken-page">
        <div className="taken-page-header">
          <div>
            <button
              type="button"
              className="taken-back-button"
              onClick={closeDetails}
            >
              <ArrowLeft size={17} />
              Back to Loans Taken
            </button>

            <h1>Loan Details</h1>
            <p>View loan information, interest and payment history.</p>
          </div>

          <div className="taken-header-actions">
            <button
              type="button"
              className="taken-secondary-button"
              onClick={() => openEditModal(selectedLoan)}
            >
              <Pencil size={16} />
              Edit Loan
            </button>

            <button
              type="button"
              className="taken-primary-button"
              onClick={() => openPaymentModal(selectedLoan)}
            >
              <Plus size={17} />
              Record Payment
            </button>
          </div>
        </div>

        {error && <div className="taken-alert taken-alert-error">{error}</div>}
        {success && (
          <div className="taken-alert taken-alert-success">{success}</div>
        )}

        {detailsLoading ? (
          <div className="taken-loading">
            <Loader2 className="taken-spinner" size={28} />
            Loading loan details...
          </div>
        ) : (
          <>
            <div className="taken-detail-heading">
              <div className="taken-lender-avatar">
                <Banknote size={25} />
              </div>

              <div>
                <h2>{loanDetails?.lender_name || selectedLoan.lender_name}</h2>
                <p>
                  {loanDetails?.lender_phone ||
                    selectedLoan.lender_phone ||
                    "No phone number provided"}
                </p>
              </div>

              <span
                className={`taken-status ${
                  selectedLoan.is_active === false ? "closed" : "active"
                }`}
              >
                {selectedLoan.is_active === false ? "Closed" : "Active"}
              </span>
            </div>

            <div className="taken-detail-grid">
              <div className="taken-detail-card">
                <span>Original Principal</span>
                <strong>
                  {formatCurrency(
                    loanDetails?.principal_amount ??
                      selectedLoan.principal_amount
                  )}
                </strong>
              </div>

              <div className="taken-detail-card">
                <span>Outstanding Principal</span>
                <strong>
                  {formatCurrency(
                    loanDetails?.outstanding_principal ??
                      selectedLoan.outstanding_principal
                  )}
                </strong>
              </div>

              <div className="taken-detail-card">
                <span>Monthly Interest Rate</span>
                <strong>
                  {Number(
                    loanDetails?.monthly_interest_rate ??
                      selectedLoan.monthly_interest_rate ??
                      0
                  )}
                  %
                </strong>
              </div>

              <div className="taken-detail-card">
                <span>Interest Outstanding</span>
                <strong>
                  {formatCurrency(
                    loanDetails?.outstanding_interest ??
                      loanDetails?.total_interest_outstanding ??
                      0
                  )}
                </strong>
              </div>
            </div>

            <div className="taken-info-panel">
              <div>
                <span>Loan Start Date</span>
                <strong>{formatDate(selectedLoan.start_date)}</strong>
              </div>

              <div>
                <span>Due Date</span>
                <strong>{formatDate(selectedLoan.due_date)}</strong>
              </div>

              <div>
                <span>Notes</span>
                <strong>{selectedLoan.notes || "No notes added"}</strong>
              </div>
            </div>

            <div className="taken-history-grid">
              <section className="taken-section-card">
                <div className="taken-section-heading">
                  <div>
                    <h3>
                      <CalendarDays size={18} />
                      Interest History
                    </h3>
                    <p>Monthly interest generated for this loan.</p>
                  </div>
                </div>

                {interestHistory.length === 0 ? (
                  <div className="taken-empty-small">
                    No interest entries found.
                  </div>
                ) : (
                  <div className="taken-table-wrapper">
                    <table className="taken-table">
                      <thead>
                        <tr>
                          <th>Period</th>
                          <th>Interest</th>
                          <th>Paid</th>
                          <th>Outstanding</th>
                        </tr>
                      </thead>

                      <tbody>
                        {interestHistory.map((interest) => (
                          <tr key={interest.id}>
                            <td>
                              {formatDate(
                                interest.interest_date ||
                                  interest.period_start ||
                                  interest.created_at
                              )}
                            </td>
                            <td>
                              {formatCurrency(
                                interest.interest_amount ?? interest.amount
                              )}
                            </td>
                            <td>
                              {formatCurrency(
                                interest.paid_amount ??
                                  interest.amount_paid ??
                                  0
                              )}
                            </td>
                            <td>
                              {formatCurrency(getInterestOutstanding(interest))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="taken-section-card">
                <div className="taken-section-heading">
                  <div>
                    <h3>
                      <History size={18} />
                      Payment History
                    </h3>
                    <p>Principal and interest payments recorded.</p>
                  </div>
                </div>

                {paymentHistory.length === 0 ? (
                  <div className="taken-empty-small">
                    No payments recorded yet.
                  </div>
                ) : (
                  <div className="taken-table-wrapper">
                    <table className="taken-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Notes</th>
                        </tr>
                      </thead>

                      <tbody>
                        {paymentHistory.map((payment) => (
                          <tr key={payment.id}>
                            <td>{formatDate(payment.payment_date)}</td>
                            <td>
                              <span
                                className={`taken-payment-type ${payment.payment_type}`}
                              >
                                {payment.payment_type}
                              </span>
                            </td>
                            <td>{formatCurrency(payment.amount)}</td>
                            <td>{payment.notes || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          </>
        )}

        {showLoanModal && (
          <Modal
            title="Edit Loan"
            subtitle="Update the lender and loan information."
            onClose={() => setShowLoanModal(false)}
          >
            {renderLoanForm()}
          </Modal>
        )}

        {showPaymentModal && (
          <Modal
            title="Record Payment"
            subtitle={`Record a payment to ${paymentTargetLoan?.lender_name || "your lender"}.`}
            onClose={() => setShowPaymentModal(false)}
          >
            {renderPaymentForm()}
          </Modal>
        )}
      </div>
    );
  }

  function renderLoanForm() {
    return (
      <form className="taken-form" onSubmit={handleLoanSubmit}>
        <div className="taken-form-grid">
          <label className="taken-form-field full-width">
            <span>Lender Name *</span>
            <input
              name="lender_name"
              value={loanForm.lender_name}
              onChange={handleLoanFormChange}
              placeholder="Enter lender name"
              required
            />
          </label>

          <label className="taken-form-field">
            <span>Lender Phone</span>
            <input
              name="lender_phone"
              value={loanForm.lender_phone}
              onChange={handleLoanFormChange}
              placeholder="Enter phone number"
            />
          </label>

          <label className="taken-form-field">
            <span>Principal Amount (₹) *</span>
            <input
              type="number"
              name="principal_amount"
              value={loanForm.principal_amount}
              onChange={handleLoanFormChange}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              required
            />
          </label>

          <label className="taken-form-field">
            <span>Monthly Interest Rate (%) *</span>
            <input
              type="number"
              name="monthly_interest_rate"
              value={loanForm.monthly_interest_rate}
              onChange={handleLoanFormChange}
              placeholder="Example: 2"
              min="0"
              step="0.01"
              required
            />
          </label>

          <label className="taken-form-field">
            <span>Start Date *</span>
            <input
              type="date"
              name="start_date"
              value={loanForm.start_date}
              onChange={handleLoanFormChange}
              required
            />
          </label>

          <label className="taken-form-field">
            <span>Due Date</span>
            <input
              type="date"
              name="due_date"
              value={loanForm.due_date}
              onChange={handleLoanFormChange}
            />
          </label>

          <label className="taken-form-field full-width">
            <span>Notes</span>
            <textarea
              name="notes"
              value={loanForm.notes}
              onChange={handleLoanFormChange}
              placeholder="Add any additional details..."
              rows="3"
            />
          </label>
        </div>

        <div className="taken-modal-actions">
          <button
            type="button"
            className="taken-secondary-button"
            onClick={() => setShowLoanModal(false)}
            disabled={submitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="taken-primary-button"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="taken-spinner" size={16} />
                Saving...
              </>
            ) : editingLoan ? (
              "Update Loan"
            ) : (
              "Add Loan"
            )}
          </button>
        </div>
      </form>
    );
  }

  function renderPaymentForm() {
    return (
      <form className="taken-form" onSubmit={handlePaymentSubmit}>
        <div className="taken-form-grid">
          <label className="taken-form-field full-width">
            <span>Payment Type *</span>
            <select
              name="payment_type"
              value={paymentForm.payment_type}
              onChange={handlePaymentFormChange}
              required
            >
              <option value="principal">Principal Payment</option>
              <option value="interest">Interest Payment</option>
            </select>
          </label>

          <label className="taken-form-field">
            <span>Amount (₹) *</span>
            <input
              type="number"
              name="amount"
              value={paymentForm.amount}
              onChange={handlePaymentFormChange}
              placeholder="Enter amount"
              min="0.01"
              step="0.01"
              required
            />
          </label>

          <label className="taken-form-field">
            <span>Payment Date *</span>
            <input
              type="date"
              name="payment_date"
              value={paymentForm.payment_date}
              onChange={handlePaymentFormChange}
              required
            />
          </label>

          {paymentForm.payment_type === "interest" && (
            <label className="taken-form-field full-width">
              <span>Interest Entry *</span>
              <select
                name="interest_id"
                value={paymentForm.interest_id}
                onChange={handlePaymentFormChange}
                required
              >
                <option value="">Select interest period</option>

                {availableInterests.map((interest) => (
                  <option key={interest.id} value={interest.id}>
                    {formatDate(
                      interest.interest_date ||
                        interest.period_start ||
                        interest.created_at
                    )}{" "}
                    — Outstanding:{" "}
                    {formatCurrency(getInterestOutstanding(interest))}
                  </option>
                ))}
              </select>

              {availableInterests.length === 0 && (
                <small className="taken-field-hint">
                  No outstanding interest entries are available for this loan.
                </small>
              )}
            </label>
          )}

          <label className="taken-form-field full-width">
            <span>Notes</span>
            <textarea
              name="notes"
              value={paymentForm.notes}
              onChange={handlePaymentFormChange}
              placeholder="Add payment notes..."
              rows="3"
            />
          </label>
        </div>

        <div className="taken-modal-actions">
          <button
            type="button"
            className="taken-secondary-button"
            onClick={() => setShowPaymentModal(false)}
            disabled={submitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="taken-primary-button"
            disabled={
              submitting ||
              (paymentForm.payment_type === "interest" &&
                (!paymentForm.interest_id || availableInterests.length === 0))
            }
          >
            {submitting ? (
              <>
                <Loader2 className="taken-spinner" size={16} />
                Recording...
              </>
            ) : (
              "Record Payment"
            )}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="loans-taken-page">
      <div className="taken-page-header">
        <div>
          <h1>Loans Taken</h1>
          <p>Track the money you have borrowed and manage repayments.</p>
        </div>

        <div className="taken-header-actions">
          <button
            type="button"
            className="taken-secondary-button"
            onClick={handleGenerateInterest}
            disabled={generatingInterest}
          >
            {generatingInterest ? (
              <Loader2 className="taken-spinner" size={16} />
            ) : (
              <RefreshCw size={16} />
            )}
            Generate Interest
          </button>

          <button
            type="button"
            className="taken-primary-button"
            onClick={openCreateModal}
          >
            <Plus size={17} />
            Add Loan
          </button>
        </div>
      </div>

      {error && <div className="taken-alert taken-alert-error">{error}</div>}
      {success && (
        <div className="taken-alert taken-alert-success">{success}</div>
      )}

      <div className="taken-summary-grid">
        <SummaryCard
          title="Total Borrowed"
          value={summary?.total_principal_borrowed}
          icon={HandCoins}
          description={`${summary?.total_loans || 0} total loans`}
        />

        <SummaryCard
          title="Outstanding Principal"
          value={summary?.outstanding_principal}
          icon={Wallet}
          description={`${summary?.active_loans || 0} active loans`}
          className="principal-card"
        />

        <SummaryCard
          title="Interest Generated"
          value={summary?.total_interest_generated}
          icon={TrendingDown}
          description="Total interest accumulated"
        />

        <SummaryCard
          title="Interest Paid"
          value={summary?.total_interest_paid}
          icon={CheckCircle}
          description="Interest repayments made"
        />

        <SummaryCard
          title="Interest Due"
          value={summary?.outstanding_interest}
          icon={Clock}
          description="Interest yet to be paid"
          className="interest-due-card"
        />
      </div>

      <CreditCardsSection />

      <section className="taken-section-card taken-loan-list-section">
        <div className="taken-list-heading">
          <div>
            <h2>Your Loans</h2>
            <p>View and manage all your borrowed loans.</p>
          </div>

          <button
            type="button"
            className="taken-refresh-button"
            onClick={loadPageData}
            disabled={loading}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        <div className="taken-list-toolbar">
          <div className="taken-search-box">
            <Search size={17} />
            <input
              type="text"
              placeholder="Search by lender name or phone..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <select
            className="taken-filter-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All Loans</option>
            <option value="active">Active Loans</option>
            <option value="closed">Closed Loans</option>
          </select>
        </div>

        {loading ? (
          <div className="taken-loading">
            <Loader2 className="taken-spinner" size={28} />
            Loading loans...
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="taken-empty-state">
            <div className="taken-empty-icon">
              <FileText size={28} />
            </div>

            <h3>{loans.length ? "No matching loans" : "No loans added yet"}</h3>

            <p>
              {loans.length
                ? "Try changing your search or status filter."
                : "Add your first borrowed loan to start tracking principal and interest."}
            </p>

            {loans.length === 0 && (
              <button
                type="button"
                className="taken-primary-button"
                onClick={openCreateModal}
              >
                <Plus size={17} />
                Add Your First Loan
              </button>
            )}
          </div>
        ) : (
          <div className="taken-table-wrapper">
            <table className="taken-table">
              <thead>
                <tr>
                  <th>Lender</th>
                  <th>Principal</th>
                  <th>Outstanding</th>
                  <th>Interest Rate</th>
                  <th>Start Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredLoans.map((loan) => (
                  <tr key={loan.id}>
                    <td>
                      <div className="taken-lender-cell">
                        <div className="taken-lender-avatar small">
                          <Banknote size={17} />
                        </div>

                        <div>
                          <strong>{loan.lender_name}</strong>
                          <small>{loan.lender_phone || "No phone number"}</small>
                        </div>
                      </div>
                    </td>

                    <td>{formatCurrency(loan.principal_amount)}</td>

                    <td className="taken-outstanding-cell">
                      {formatCurrency(loan.outstanding_principal)}
                    </td>

                    <td>{loan.monthly_interest_rate}% / month</td>
                    <td>{formatDate(loan.start_date)}</td>
                    <td>{formatDate(loan.due_date)}</td>

                    <td>
                      <span
                        className={`taken-status ${
                          loan.is_active === false ? "closed" : "active"
                        }`}
                      >
                        {loan.is_active === false ? "Closed" : "Active"}
                      </span>
                    </td>

                    <td>
                      <div className="taken-row-actions">
                        <button
                          type="button"
                          className="taken-row-action"
                          title="View details"
                          onClick={() => loadLoanDetails(loan.id)}
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          type="button"
                          className="taken-row-action"
                          title="Edit loan"
                          onClick={() => openEditModal(loan)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          className="taken-row-action"
                          title="Record payment"
                          onClick={() => openPaymentModal(loan)}
                          disabled={loan.is_active === false}
                        >
                          <Plus size={17} />
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

      {showLoanModal && (
        <Modal
          title={editingLoan ? "Edit Loan" : "Add New Loan"}
          subtitle={
            editingLoan
              ? "Update the lender and loan information."
              : "Enter the details of the money you have borrowed."
          }
          onClose={() => setShowLoanModal(false)}
        >
          {renderLoanForm()}
        </Modal>
      )}

      {showPaymentModal && (
        <Modal
          title="Record Payment"
          subtitle={`Record a repayment to ${paymentTargetLoan?.lender_name || "your lender"}.`}
          onClose={() => setShowPaymentModal(false)}
        >
          {renderPaymentForm()}
        </Modal>
      )}
    </div>
  );
}