//LoansGivenPage.jsx
import { useEffect, useState } from "react";

import {
  Plus,
  Search,
  RefreshCw,
  Wallet,
  HandCoins,
  TrendingUp,
  CircleDollarSign,
  Eye,
  CreditCard,
  X,
  CalendarDays,
  UserRound,
  Phone,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
    ArrowDownLeft,
    Pencil,

} from "lucide-react";

import {
  getLoans,
  getLoanSummary,
  createLoan,
  updateLoan,
  getLoanDetails,
  recordLoanPayment,
  generateLoanInterest,
} from "../../services/loanGivenService";

import "./LoansGivenPage.css";


const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};


const formatDate = (value) => {
  if (!value) return "—";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};


const initialLoanForm = {
  borrower_name: "",
  borrower_phone: "",
  principal_amount: "",
  monthly_interest_rate: "",
  start_date: today(),
  due_date: "",
  notes: "",
};


const initialPaymentForm = {
  payment_type: "principal",
  amount: "",
  payment_date: today(),
  interest_id: "",
  notes: "",
};


function getLoanStatus(loan) {
  if (Number(loan.outstanding_principal) <= 0) {
    return "Closed";
  }

  if (loan.due_date && loan.due_date < today()) {
    return "Overdue";
  }

  return "Active";
}


function LoansGivenPage() {
  const [loans, setLoans] = useState([]);
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [loanForm, setLoanForm] = useState(initialLoanForm);
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);

  const [selectedLoan, setSelectedLoan] = useState(null);
    const [loanDetails, setLoanDetails] = useState(null);
    
    const [isEditing, setIsEditing] = useState(false);
const [hasFinancialHistory, setHasFinancialHistory] = useState(false);

  useEffect(() => {
    loadPageData();
  }, []);


  const loadPageData = async () => {
    try {
      setLoading(true);
      setError("");

      const [loansData, summaryData] = await Promise.all([
        getLoans(),
        getLoanSummary(),
      ]);

      setLoans(loansData || []);
      setSummary(summaryData);
    } catch (err) {
      setError(err.message || "Unable to load loans.");
    } finally {
      setLoading(false);
    }
  };


  const showMessage = (message) => {
    setSuccess(message);
    setError("");

    window.setTimeout(() => {
      setSuccess("");
    }, 4000);
  };


  const handleLoanFormChange = (event) => {
    const { name, value } = event.target;

    setLoanForm((previous) => ({
      ...previous,
      [name]: value,
    }));
    };
    
    
const openEditLoan = async (loan) => {
  try {
    setError("");

    const details = await getLoanDetails(loan.id);

    const hasHistory =
      (details.payments?.length || 0) > 0 ||
      (details.interests?.length || 0) > 0;

    setSelectedLoan(loan);
    setHasFinancialHistory(hasHistory);
    setIsEditing(true);

    setLoanForm({
      borrower_name: details.borrower_name || "",
      borrower_phone: details.borrower_phone || "",
      principal_amount: details.principal_amount || "",
      monthly_interest_rate: details.monthly_interest_rate || "",
      start_date: details.start_date || today(),
      due_date: details.due_date || "",
      notes: details.notes || "",
    });

    setShowLoanModal(true);
  } catch (err) {
    setError(err.message || "Unable to load loan for editing.");
  }
};



  const handlePaymentFormChange = (event) => {
    const { name, value } = event.target;

    setPaymentForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };



const handleSaveLoan = async (event) => {
  event.preventDefault();

  try {
    setSubmitting(true);
    setError("");

    const payload = {
      borrower_name: loanForm.borrower_name.trim(),
      borrower_phone: loanForm.borrower_phone.trim() || null,
      monthly_interest_rate: Number(
        loanForm.monthly_interest_rate || 0
      ).toFixed(3),
      due_date: loanForm.due_date || null,
      notes: loanForm.notes.trim() || null,
    };

    if (!isEditing || !hasFinancialHistory) {
      payload.principal_amount = Number(
        loanForm.principal_amount
      ).toFixed(2);

      payload.start_date = loanForm.start_date;
    }

    if (isEditing) {
      await updateLoan(selectedLoan.id, payload);
    } else {
      await createLoan({
        ...payload,
        principal_amount: Number(
          loanForm.principal_amount
        ).toFixed(2),
        start_date: loanForm.start_date,
      });
    }

    setShowLoanModal(false);
    setIsEditing(false);
    setHasFinancialHistory(false);
    setSelectedLoan(null);

    setLoanForm({
      ...initialLoanForm,
      start_date: today(),
    });

    await loadPageData();

    showMessage(
      isEditing
        ? "Loan details updated successfully."
        : "Loan added successfully."
    );
  } catch (err) {
    setError(err.message || "Unable to save loan.");
  } finally {
    setSubmitting(false);
  }
};



  const handleGenerateInterest = async () => {
    try {
      setSubmitting(true);
      setError("");

      const result = await generateLoanInterest(today());

      await loadPageData();

      showMessage(
        `${result.generated_count || 0} new interest record(s) generated.`
      );
    } catch (err) {
      setError(err.message || "Unable to generate interest.");
    } finally {
      setSubmitting(false);
    }
  };


  const openLoanDetails = async (loan) => {
    try {
      setError("");
      setSelectedLoan(loan);
      setLoanDetails(null);
      setShowDetailsModal(true);

      const details = await getLoanDetails(loan.id);
      setLoanDetails(details);
    } catch (err) {
      setShowDetailsModal(false);
      setError(err.message || "Unable to load loan details.");
    }
  };


  const openPaymentModal = async (loan) => {
    try {
      setError("");
      setSelectedLoan(loan);
      setLoanDetails(null);

      const details = await getLoanDetails(loan.id);
      setLoanDetails(details);

      setPaymentForm({
        ...initialPaymentForm,
        payment_date: today(),
      });

      setShowPaymentModal(true);
    } catch (err) {
      setError(err.message || "Unable to load loan information.");
    }
  };


  const handleRecordPayment = async (event) => {
    event.preventDefault();

    if (!selectedLoan) return;

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        payment_type: paymentForm.payment_type,
        amount: Number(paymentForm.amount).toFixed(2),
        payment_date: paymentForm.payment_date,
        interest_id:
          paymentForm.payment_type === "interest"
            ? Number(paymentForm.interest_id)
            : null,
        notes: paymentForm.notes.trim() || null,
      };

      await recordLoanPayment(selectedLoan.id, payload);

      setShowPaymentModal(false);
      await loadPageData();

      showMessage("Payment recorded successfully.");

      // Refresh the detail view if it was previously open.
      if (showDetailsModal) {
        const updatedDetails = await getLoanDetails(selectedLoan.id);
        setLoanDetails(updatedDetails);
      }
    } catch (err) {
      setError(err.message || "Unable to record payment.");
    } finally {
      setSubmitting(false);
    }
  };


  const filteredLoans = loans.filter((loan) => {
    const status = getLoanStatus(loan);

    const matchesSearch =
      loan.borrower_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      loan.borrower_phone?.includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" ||
      status.toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });


  const unpaidInterestRecords =
    loanDetails?.interests?.filter(
      (interest) =>
        Number(interest.interest_amount) >
        Number(interest.amount_paid)
    ) || [];


  const selectedInterest = unpaidInterestRecords.find(
    (interest) => String(interest.id) === paymentForm.interest_id
  );


  return (
    <div className="loans-page">

      {/* PAGE HEADER */}

      <div className="loans-page-header">
        <div>
          <h1>Loans Given</h1>
          <p>Manage money you've lent, interest and repayments.</p>
        </div>

        <div className="loans-header-actions">
          <button
            className="loans-secondary-btn"
            onClick={handleGenerateInterest}
            disabled={submitting}
          >
            <RefreshCw size={17} />
            Generate Interest
          </button>

          <button
  className="loans-primary-btn"
  onClick={() => {
    setIsEditing(false);
    setHasFinancialHistory(false);
    setSelectedLoan(null);
    setLoanForm({
      ...initialLoanForm,
      start_date: today(),
    });
    setShowLoanModal(true);
  }}
>
  <Plus size={18} />
  Add New Loan
</button>
        </div>
      </div>


      {/* ALERTS */}

      {error && (
        <div className="loans-alert loans-alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="loans-alert loans-alert-success">
          <CheckCircle2 size={18} />
          <span>{success}</span>
          <button onClick={() => setSuccess("")}>
            <X size={16} />
          </button>
        </div>
      )}


      {/* SUMMARY CARDS */}

      <div className="loans-summary-grid">

        <div className="loans-summary-card">
          <div className="loans-summary-icon blue">
            <HandCoins size={22} />
          </div>

          <div>
            <p>Total Principal Lent</p>
            <h2>
              {formatCurrency(summary?.total_principal_lent)}
            </h2>
            <span>{summary?.total_loans || 0} total loans</span>
          </div>
        </div>


        <div className="loans-summary-card">
          <div className="loans-summary-icon purple">
            <Wallet size={22} />
          </div>

          <div>
            <p>Outstanding Principal</p>
            <h2>
              {formatCurrency(summary?.outstanding_principal)}
            </h2>
            <span>Yet to be recovered</span>
          </div>
        </div>


        <div className="loans-summary-card">
          <div className="loans-summary-icon green">
            <TrendingUp size={22} />
          </div>

          <div>
            <p>Interest Received</p>
            <h2>
              {formatCurrency(summary?.total_interest_received)}
            </h2>
            <span>Interest collected</span>
          </div>
        </div>


        <div className="loans-summary-card">
          <div className="loans-summary-icon orange">
            <CircleDollarSign size={22} />
          </div>

          <div>
            <p>Interest Due</p>
            <h2>
              {formatCurrency(summary?.outstanding_interest)}
            </h2>
            <span>Yet to be collected</span>
          </div>
        </div>

      </div>


      {/* LOAN LIST */}

      <div className="loans-list-card">

        <div className="loans-list-header">
          <div>
            <h2>Your Borrowers</h2>
            <p>View and manage all your active and closed loans.</p>
          </div>

          <div className="loans-list-controls">

            <div className="loans-search-box">
              <Search size={17} />
              <input
                type="text"
                placeholder="Search borrower..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="loans-filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="overdue">Overdue</option>
              <option value="closed">Closed</option>
            </select>

          </div>
        </div>


        {loading ? (
          <div className="loans-loading">
            <RefreshCw size={22} className="loans-spin" />
            <p>Loading your loans...</p>
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="loans-empty">
            <div className="loans-empty-icon">
              <HandCoins size={30} />
            </div>

            <h3>No loans found</h3>
            <p>
              {loans.length === 0
                ? "Start by adding the money you have lent to someone."
                : "Try changing your search or status filter."}
            </p>

            {loans.length === 0 && (
              <button
                className="loans-primary-btn"
                onClick={() => {
                  setIsEditing(false);
                  setHasFinancialHistory(false);
                  setSelectedLoan(null);
                  setLoanForm({
                    ...initialLoanForm,
                    start_date: today(),
                  });
                  setShowLoanModal(true);
                }}
              >
                <Plus size={17} />
                Add Your First Loan
              </button>
            )}
          </div>
        ) : (
          <div className="loans-table-wrapper">
            <table className="loans-table">
              <thead>
                <tr>
                  <th>Borrower</th>
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
                {filteredLoans.map((loan) => {
                  const status = getLoanStatus(loan);

                  return (
                    <tr key={loan.id}>
                      <td>
                        <div className="loans-borrower-cell">
                          <div className="loans-avatar">
                            {loan.borrower_name
                              ?.charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>{loan.borrower_name}</strong>
                            <span>
                              {loan.borrower_phone || "No phone number"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        {formatCurrency(loan.principal_amount)}
                      </td>

                      <td className="loans-amount-strong">
                        {formatCurrency(loan.outstanding_principal)}
                      </td>

                      <td>
                        {Number(loan.monthly_interest_rate).toFixed(2)}%
                        <span className="loans-rate-label"> / month</span>
                      </td>

                      <td>{formatDate(loan.start_date)}</td>
                      <td>{formatDate(loan.due_date)}</td>

                      <td>
                        <span
                          className={`loans-status status-${status.toLowerCase()}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td>
                              <div className="loans-row-actions">
                                  <button
  title="Edit loan"
  onClick={() => openEditLoan(loan)}
>
  <Pencil size={17} />
</button>
                          <button
                            title="View details"
                            onClick={() => openLoanDetails(loan)}
                          >
                            <Eye size={17} />
                          </button>

                          {status !== "Closed" && (
                            <button
                              title="Record payment"
                              onClick={() => openPaymentModal(loan)}
                            >
                              <CreditCard size={17} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredLoans.length > 0 && (
          <div className="loans-table-footer">
            Showing {filteredLoans.length} of {loans.length} loans
          </div>
        )}

      </div>


      {/* ADD LOAN MODAL */}

      {showLoanModal && (
        <div className="loans-modal-overlay">
          <div className="loans-modal">

            <div className="loans-modal-header">
              <div>
                <h2>{isEditing ? "Edit Loan" : "Add New Loan"}</h2>
<p>
  {isEditing
    ? "Update the borrower and loan information."
    : "Enter the borrower and loan details."}
</p>
              </div>

              <button
                type="button"
                className="loans-modal-close"
                onClick={() => {
                  setShowLoanModal(false);
                  setIsEditing(false);
                  setHasFinancialHistory(false);
                  setSelectedLoan(null);
                }}
              >
                <X size={20} />
              </button>
            </div>


            <form onSubmit={handleSaveLoan}>

              <div className="loans-form-grid">

                {isEditing && hasFinancialHistory && (
                  <p className="loans-edit-warning">
                    Principal amount and start date are locked because this
                    loan already has payment or interest history.
                  </p>
                )}

                <div className="loans-form-group full-width">
                  <label>Borrower Name *</label>
                  <div className="loans-input-with-icon">
                    <UserRound size={17} />
                    <input
                      name="borrower_name"
                      value={loanForm.borrower_name}
                      onChange={handleLoanFormChange}
                      placeholder="Enter borrower name"
                      minLength={2}
                      maxLength={150}
                      required
                    />
                  </div>
                </div>


                <div className="loans-form-group full-width">
                  <label>Phone Number</label>
                  <div className="loans-input-with-icon">
                    <Phone size={17} />
                    <input
                      name="borrower_phone"
                      value={loanForm.borrower_phone}
                      onChange={handleLoanFormChange}
                      placeholder="Enter phone number"
                      maxLength={20}
                    />
                  </div>
                </div>


                <div className="loans-form-group">
                  <label>Principal Amount (₹) *</label>
                  <input
  type="number"
  name="principal_amount"
  value={loanForm.principal_amount}
  onChange={handleLoanFormChange}
  placeholder="e.g. 100000"
  min="0.01"
  step="0.01"
  required
  disabled={isEditing && hasFinancialHistory}
/>
                </div>


                <div className="loans-form-group">
                  <label>Monthly Interest Rate (%) *</label>
                  <input
                    type="number"
                    name="monthly_interest_rate"
                    value={loanForm.monthly_interest_rate}
                    onChange={handleLoanFormChange}
                    placeholder="e.g. 2"
                    min="0"
                    step="0.001"
                    required
                  />
                </div>


                <div className="loans-form-group">
                  <label>Loan Start Date *</label>
                  <input
  type="date"
  name="start_date"
  value={loanForm.start_date}
  onChange={handleLoanFormChange}
  required
  disabled={isEditing && hasFinancialHistory}
/>
                </div>


                <div className="loans-form-group">
                  <label>Loan Due Date</label>
                  <input
                    type="date"
                    name="due_date"
                    value={loanForm.due_date}
                    onChange={handleLoanFormChange}
                    min={loanForm.start_date}
                  />
                </div>


                <div className="loans-form-group full-width">
                  <label>Notes</label>
                  <textarea
                    name="notes"
                    value={loanForm.notes}
                    onChange={handleLoanFormChange}
                    placeholder="Add any additional details..."
                    rows={3}
                  />
                </div>

              </div>


              <div className="loans-modal-footer">
                <button
                  type="button"
                  className="loans-cancel-btn"
                  onClick={() => {
                    setShowLoanModal(false);
                    setIsEditing(false);
                    setHasFinancialHistory(false);
                    setSelectedLoan(null);
                  }}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
  type="submit"
  className="loans-primary-btn"
  disabled={submitting}
>
  {submitting
    ? "Saving..."
    : isEditing
      ? "Save Changes"
      : "Save Loan"}
</button>
              </div>

            </form>
          </div>
        </div>
      )}


      {/* LOAN DETAILS MODAL */}

      {showDetailsModal && (
        <div className="loans-modal-overlay">
          <div className="loans-modal loans-details-modal">

            <div className="loans-modal-header">
              <div>
                <h2>Loan Details</h2>
                <p>
                  {selectedLoan?.borrower_name || "Borrower information"}
                </p>
              </div>

              <button
                className="loans-modal-close"
                onClick={() => setShowDetailsModal(false)}
              >
                <X size={20} />
              </button>
            </div>


            {!loanDetails ? (
              <div className="loans-loading">
                <RefreshCw size={22} className="loans-spin" />
                <p>Loading loan details...</p>
              </div>
            ) : (
              <div className="loans-details-content">

                <div className="loans-detail-summary-grid">
                  <div>
                    <span>Original Principal</span>
                    <strong>
                      {formatCurrency(loanDetails.principal_amount)}
                    </strong>
                  </div>

                  <div>
                    <span>Outstanding Principal</span>
                    <strong>
                      {formatCurrency(loanDetails.outstanding_principal)}
                    </strong>
                  </div>

                  <div>
                    <span>Interest Generated</span>
                    <strong>
                      {formatCurrency(loanDetails.total_interest_generated)}
                    </strong>
                  </div>

                  <div>
                    <span>Interest Due</span>
                    <strong>
                      {formatCurrency(loanDetails.outstanding_interest)}
                    </strong>
                  </div>
                </div>


                <div className="loans-detail-information">
                  <div>
                    <span>Borrower</span>
                    <strong>{loanDetails.borrower_name}</strong>
                  </div>

                  <div>
                    <span>Phone</span>
                    <strong>{loanDetails.borrower_phone || "—"}</strong>
                  </div>

                  <div>
                    <span>Monthly Rate</span>
                    <strong>
                      {Number(loanDetails.monthly_interest_rate).toFixed(2)}%
                    </strong>
                  </div>

                  <div>
                    <span>Start Date</span>
                    <strong>{formatDate(loanDetails.start_date)}</strong>
                  </div>

                  <div>
                    <span>Due Date</span>
                    <strong>{formatDate(loanDetails.due_date)}</strong>
                  </div>
                </div>


                <div className="loans-history-section">
                  <h3>
                    <CalendarDays size={18} />
                    Monthly Interest History
                  </h3>

                  {loanDetails.interests?.length ? (
                    <div className="loans-history-table-wrapper">
                      <table className="loans-history-table">
                        <thead>
                          <tr>
                            <th>Period</th>
                            <th>Principal Basis</th>
                            <th>Interest</th>
                            <th>Paid</th>
                            <th>Balance</th>
                            <th>Status</th>
                          </tr>
                        </thead>

                        <tbody>
                          {loanDetails.interests.map((interest) => {
                            const balance =
                              Number(interest.interest_amount) -
                              Number(interest.amount_paid);

                            return (
                              <tr key={interest.id}>
                                <td>{formatDate(interest.period_month)}</td>
                                <td>
                                  {formatCurrency(interest.principal_basis)}
                                </td>
                                <td>
                                  {formatCurrency(interest.interest_amount)}
                                </td>
                                <td>
                                  {formatCurrency(interest.amount_paid)}
                                </td>
                                <td>{formatCurrency(balance)}</td>
                                <td>
                                  <span
                                    className={`loans-interest-status ${balance <= 0 ? "paid" : balance < Number(interest.interest_amount) ? "partial" : "pending"}`}
                                  >
                                    {balance <= 0
                                      ? "Paid"
                                      : balance < Number(interest.interest_amount)
                                        ? "Partial"
                                        : "Pending"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="loans-no-history">
                      No interest records generated yet.
                    </p>
                  )}
                </div>


                <div className="loans-history-section">
                  <h3>
                    <ArrowDownLeft size={18} />
                    Payment History
                  </h3>

                  {loanDetails.payments?.length ? (
                    <div className="loans-history-table-wrapper">
                      <table className="loans-history-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Payment Type</th>
                            <th>Amount</th>
                            <th>Notes</th>
                          </tr>
                        </thead>

                        <tbody>
                          {loanDetails.payments.map((payment) => (
                            <tr key={payment.id}>
                              <td>{formatDate(payment.payment_date)}</td>
                              <td>
                                <span
                                  className={`loans-payment-type ${payment.payment_type}`}
                                >
                                  {payment.payment_type === "principal"
                                    ? "Principal"
                                    : "Interest"}
                                </span>
                              </td>
                              <td>{formatCurrency(payment.amount)}</td>
                              <td>{payment.notes || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="loans-no-history">
                      No payments recorded yet.
                    </p>
                  )}
                </div>


                {loanDetails.notes && (
                  <div className="loans-notes">
                    <FileText size={17} />
                    <div>
                      <strong>Notes</strong>
                      <p>{loanDetails.notes}</p>
                    </div>
                  </div>
                )}

              </div>
            )}


            <div className="loans-modal-footer">
              <button
                className="loans-cancel-btn"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </button>

              {loanDetails &&
                Number(loanDetails.outstanding_principal) > 0 && (
                  <button
                    className="loans-primary-btn"
                    onClick={() => {
                      setShowDetailsModal(false);
                      openPaymentModal(selectedLoan);
                    }}
                  >
                    <CreditCard size={17} />
                    Record Payment
                  </button>
                )}
            </div>

          </div>
        </div>
      )}


      {/* PAYMENT MODAL */}

      {showPaymentModal && (
        <div className="loans-modal-overlay">
          <div className="loans-modal">

            <div className="loans-modal-header">
              <div>
                <h2>Record Payment</h2>
                <p>
                  Payment from {selectedLoan?.borrower_name}
                </p>
              </div>

              <button
                className="loans-modal-close"
                onClick={() => setShowPaymentModal(false)}
              >
                <X size={20} />
              </button>
            </div>


            <form onSubmit={handleRecordPayment}>

              <div className="loans-payment-balance">
                <div>
                  <span>Outstanding Principal</span>
                  <strong>
                    {formatCurrency(loanDetails?.outstanding_principal)}
                  </strong>
                </div>

                <div>
                  <span>Interest Due</span>
                  <strong>
                    {formatCurrency(loanDetails?.outstanding_interest)}
                  </strong>
                </div>
              </div>


              <div className="loans-form-grid">

                <div className="loans-form-group full-width">
                  <label>Payment Type *</label>
                  <select
                    name="payment_type"
                    value={paymentForm.payment_type}
                    onChange={(event) => {
                      const value = event.target.value;

                      setPaymentForm((previous) => ({
                        ...previous,
                        payment_type: value,
                        interest_id: "",
                        amount: "",
                      }));
                    }}
                  >
                    <option value="principal">Principal Repayment</option>
                    <option
                      value="interest"
                      disabled={unpaidInterestRecords.length === 0}
                    >
                      Interest Payment
                    </option>
                  </select>
                </div>


                {paymentForm.payment_type === "interest" && (
                  <div className="loans-form-group full-width">
                    <label>Interest Period *</label>

                    <select
                      name="interest_id"
                      value={paymentForm.interest_id}
                      onChange={handlePaymentFormChange}
                      required
                    >
                      <option value="">Select interest period</option>

                      {unpaidInterestRecords.map((interest) => {
                        const balance =
                          Number(interest.interest_amount) -
                          Number(interest.amount_paid);

                        return (
                          <option
                            key={interest.id}
                            value={interest.id}
                          >
                            {formatDate(interest.period_month)} — Due:{" "}
                            {formatCurrency(balance)}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}


                <div className="loans-form-group">
                  <label>Payment Amount (₹) *</label>
                  <input
                    type="number"
                    name="amount"
                    value={paymentForm.amount}
                    onChange={handlePaymentFormChange}
                    placeholder="Enter amount"
                    min="0.01"
                    max={
                      paymentForm.payment_type === "principal"
                        ? loanDetails?.outstanding_principal
                        : selectedInterest
                          ? Number(selectedInterest.interest_amount) -
                            Number(selectedInterest.amount_paid)
                          : undefined
                    }
                    step="0.01"
                    required
                  />

                  {paymentForm.payment_type === "interest" &&
                    selectedInterest && (
                      <small>
                        Maximum payable:{" "}
                        {formatCurrency(
                          Number(selectedInterest.interest_amount) -
                          Number(selectedInterest.amount_paid)
                        )}
                      </small>
                    )}

                  {paymentForm.payment_type === "principal" && (
                    <small>
                      Maximum payable:{" "}
                      {formatCurrency(loanDetails?.outstanding_principal)}
                    </small>
                  )}
                </div>


                <div className="loans-form-group">
                  <label>Payment Date *</label>
                  <input
                    type="date"
                    name="payment_date"
                    value={paymentForm.payment_date}
                    onChange={handlePaymentFormChange}
                    min={selectedLoan?.start_date}
                    required
                  />
                </div>


                <div className="loans-form-group full-width">
                  <label>Notes</label>
                  <textarea
                    name="notes"
                    value={paymentForm.notes}
                    onChange={handlePaymentFormChange}
                    placeholder="Add payment remarks..."
                    rows={3}
                  />
                </div>

              </div>


              <div className="loans-modal-footer">
                <button
                  type="button"
                  className="loans-cancel-btn"
                  onClick={() => setShowPaymentModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="loans-primary-btn"
                  disabled={
                    submitting ||
                    !paymentForm.amount ||
                    (paymentForm.payment_type === "interest" &&
                      !paymentForm.interest_id)
                  }
                >
                  {submitting ? "Saving..." : "Save Payment"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}


export default LoansGivenPage;
