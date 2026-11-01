
import { useEffect, useMemo, useState } from "react";

import {
  Plus,
  Search,
  RefreshCw,
  Eye,
  Pencil,
  X,
  Wallet,
  CalendarDays,
  Trophy,
  HandCoins,
  Loader2,
  History,
} from "lucide-react";

import {
  getChitFunds,
  getChitFundSummary,
  createChitFund,
  updateChitFund,
  getChitFund,
  updateChitInstallment,
  getChitPayments,
  createChitPayment,
} from "../../services/chitFundService";

import "./ChitFundsPage.css";


const today = () =>
  new Date().toISOString().slice(0, 10);


const initialFund = {
  name: "",
  organizer_name: "",
  organizer_phone: "",
  chit_value: "",
  monthly_contribution: "",
  total_installments: "",
  start_date: today(),
  due_day: 10,
  notes: "",
};


const initialPayment = {
  installment_id: "",
  payment_type: "contribution",
  amount: "",
  payment_date: today(),
  notes: "",
};


const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));


const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";


function Modal({ title, onClose, children }) {
  return (
    <div
      className="chit-overlay"
      onMouseDown={onClose}
    >
      <div
        className="chit-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <h2>{title}</h2>

          <button
            className="chit-icon-btn"
            onClick={onClose}
            type="button"
          >
            <X size={19} />
          </button>
        </header>

        <div className="chit-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}


export default function ChitFundsPage() {

  const [funds, setFunds] = useState([]);
  const [summary, setSummary] = useState({});

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const [fundModal, setFundModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [fundForm, setFundForm] = useState(initialFund);

  const [activeFund, setActiveFund] = useState(null);
  const [detail, setDetail] = useState(null);
  const [payments, setPayments] = useState([]);

  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState(initialPayment);

  const [auctionModal, setAuctionModal] = useState(false);
  const [auctionInstallment, setAuctionInstallment] = useState(null);

  const [auctionForm, setAuctionForm] = useState({
    auction_date: today(),
    bid_amount: "",
    dividend_amount: "",
    prize_amount: "",
    prize_received: false,
    notes: "",
  });


  // Load schemes and summary
  async function load() {

    setLoading(true);
    setError("");

    try {

      const [fundData, summaryData] =
        await Promise.all([
          getChitFunds(),
          getChitFundSummary(),
        ]);

      setFunds(Array.isArray(fundData) ? fundData : []);
      setSummary(summaryData || {});

    } catch (err) {

      setError(err.message);

    } finally {

      setLoading(false);

    }
  }


  useEffect(() => {
    load();
  }, []);


  // Open scheme details
  async function openDetails(fund) {

    setActiveFund(fund);
    setDetail(null);
    setError("");

    try {

      const [fundData, paymentData] =
        await Promise.all([
          getChitFund(fund.id),
          getChitPayments(fund.id),
        ]);

      setDetail(fundData);

      setPayments(
        Array.isArray(paymentData)
          ? paymentData
          : []
      );

    } catch (err) {

      setError(err.message);

    }
  }


  // Open edit form
  function startEdit(fund) {

    setEditing(fund);

    setFundForm({
      name: fund.name,
      organizer_name: fund.organizer_name,
      organizer_phone: fund.organizer_phone || "",
      chit_value: fund.chit_value,
      monthly_contribution: fund.monthly_contribution,
      total_installments: fund.total_installments,
      start_date: fund.start_date,
      due_day: fund.due_day,
      notes: fund.notes || "",
      status: fund.status,
    });

    setFundModal(true);
  }


  // Create or update scheme
  async function saveFund(event) {

    event.preventDefault();

    setBusy(true);
    setError("");
    setNotice("");

    const payload = {
      ...fundForm,
      chit_value: Number(fundForm.chit_value),
      monthly_contribution: Number(
        fundForm.monthly_contribution
      ),
      total_installments: Number(
        fundForm.total_installments
      ),
      due_day: Number(fundForm.due_day),
    };

    try {

      if (editing) {

        await updateChitFund(editing.id, payload);

      } else {

        await createChitFund(payload);

      }

      setFundModal(false);
      setEditing(null);
      setFundForm(initialFund);

      setNotice(
        editing
          ? "Chit fund updated."
          : "Chit fund created."
      );

      await load();

    } catch (err) {

      setError(err.message);

    } finally {

      setBusy(false);

    }
  }


  // Record a payment
  async function savePayment(event) {

    event.preventDefault();

    setBusy(true);
    setError("");

    try {

      await createChitPayment(
        activeFund.id,
        {
          ...paymentForm,
          installment_id: Number(
            paymentForm.installment_id
          ),
          amount: Number(paymentForm.amount),
        }
      );

      setPaymentModal(false);
      setPaymentForm(initialPayment);

      setNotice("Payment recorded.");

      await openDetails(activeFund);
      await load();

    } catch (err) {

      setError(err.message);

    } finally {

      setBusy(false);

    }
  }


  // Save auction information
  async function saveAuction(event) {

    event.preventDefault();

    setBusy(true);
    setError("");

    try {

      const payload = {
        ...auctionForm,

        bid_amount:
          auctionForm.bid_amount === ""
            ? null
            : Number(auctionForm.bid_amount),

        dividend_amount:
          auctionForm.dividend_amount === ""
            ? null
            : Number(auctionForm.dividend_amount),

        prize_amount:
          auctionForm.prize_amount === ""
            ? null
            : Number(auctionForm.prize_amount),
      };

      await updateChitInstallment(
        activeFund.id,
        auctionInstallment.id,
        payload
      );

      setAuctionModal(false);

      await openDetails(activeFund);
      await load();

      setNotice("Auction details saved.");

    } catch (err) {

      setError(err.message);

    } finally {

      setBusy(false);

    }
  }


  // Search and filter
  const filtered = useMemo(() => {

    return funds.filter((fund) => {

      const matchesSearch =
        `${fund.name} ${fund.organizer_name}`
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchesStatus =
        filter === "all" ||
        fund.status === filter;

      return matchesSearch && matchesStatus;

    });

  }, [funds, query, filter]);


  function field(label, name, type = "text", required = false) {

    return (
      <label className="chit-field" key={name}>
        <span>
          {label}
          {required ? " *" : ""}
        </span>

        <input
          type={type}
          name={name}
          value={fundForm[name] ?? ""}
          onChange={(event) =>
            setFundForm({
              ...fundForm,
              [name]: event.target.value,
            })
          }
          required={required}
          min={type === "number" ? "0" : undefined}
          step={type === "number" ? "0.01" : undefined}
        />
      </label>
    );
  }


  // Detail screen
  if (activeFund) {

    return (
      <main className="chit-page">

        <div className="chit-heading">

          <div>
            <button
              className="chit-back"
              onClick={() => {
                setActiveFund(null);
                setDetail(null);
              }}
            >
              ← Back to Chit Funds
            </button>

            <h1>{detail?.name || activeFund.name}</h1>

            <p>
              Installments, auction information and payment history.
            </p>
          </div>

          <div className="chit-actions">

            <button
              className="chit-btn secondary"
              onClick={() => startEdit(detail || activeFund)}
            >
              <Pencil size={16} />
              Edit
            </button>

            <button
              className="chit-btn primary"
              onClick={() => {
                setPaymentForm({
                  ...initialPayment,
                  payment_date: today(),
                });
                setPaymentModal(true);
              }}
            >
              <Plus size={16} />
              Record Payment
            </button>

          </div>

        </div>


        {error && (
          <div className="chit-alert error">
            {error}
          </div>
        )}

        {notice && (
          <div className="chit-alert success">
            {notice}
          </div>
        )}


        {!detail ? (

          <div className="chit-loading">
            <Loader2 className="spin" />
            Loading details...
          </div>

        ) : (

          <>

            <div className="chit-detail-cards">

              <div>
                <span>Chit Value</span>
                <strong>{money(detail.chit_value)}</strong>
              </div>

              <div>
                <span>Monthly Contribution</span>
                <strong>
                  {money(detail.monthly_contribution)}
                </strong>
              </div>

              <div>
                <span>Total Contributed</span>
                <strong>
                  {money(detail.total_contributed)}
                </strong>
              </div>

              <div>
                <span>Outstanding Contributions</span>
                <strong>
                  {money(detail.outstanding_contributions)}
                </strong>
              </div>

            </div>


            <section className="chit-panel">

              <div className="chit-panel-head">
                <div>
                  <h2>Installment Schedule</h2>
                  <p>
                    Track monthly contributions and auction outcomes.
                  </p>
                </div>
              </div>


              <div className="chit-table-wrap">

                <table className="chit-table">

                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Due Date</th>
                      <th>Contribution</th>
                      <th>Paid</th>
                      <th>Outstanding</th>
                      <th>Status</th>
                      <th>Auction / Prize</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>

                    {(detail.installments || []).map((item) => (

                      <tr key={item.id}>

                        <td>{item.installment_number}</td>

                        <td>{formatDate(item.due_date)}</td>

                        <td>
                          {money(item.contribution_amount)}
                        </td>

                        <td>{money(item.amount_paid)}</td>

                        <td>
                          {money(item.outstanding_amount)}
                        </td>

                        <td>
                          <span
                            className={`chit-status ${item.status}`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td>
                          {item.auction_date
                            ? `${formatDate(item.auction_date)} · Bid ${money(item.bid_amount)}`
                            : "Not recorded"}

                          <small>
                            {item.prize_received
                              ? "Prize received"
                              : item.prize_amount
                                ? `Prize ${money(item.prize_amount)} pending`
                                : ""}
                          </small>
                        </td>

                        <td>
                          <button
                            className="chit-small-btn"
                            onClick={() => {

                              setAuctionInstallment(item);

                              setAuctionForm({
                                auction_date:
                                  item.auction_date || today(),

                                bid_amount:
                                  item.bid_amount ?? "",

                                dividend_amount:
                                  item.dividend_amount ?? "",

                                prize_amount:
                                  item.prize_amount ?? "",

                                prize_received:
                                  item.prize_received,

                                notes: item.notes || "",
                              });

                              setAuctionModal(true);

                            }}
                          >
                            Auction
                          </button>
                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </section>


            <section className="chit-panel">

              <div className="chit-panel-head">
                <div>
                  <h2>
                    <History size={17} />
                    Payment History
                  </h2>
                </div>
              </div>

              {payments.length ? (

                <div className="chit-table-wrap">

                  <table className="chit-table">

                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Installment</th>
                        <th>Amount</th>
                        <th>Notes</th>
                      </tr>
                    </thead>

                    <tbody>

                      {payments.map((payment) => (

                        <tr key={payment.id}>

                          <td>
                            {formatDate(payment.payment_date)}
                          </td>

                          <td>
                            {payment.payment_type.replace("_", " ")}
                          </td>

                          <td>
                            {detail.installments?.find(
                              item =>
                                item.id === payment.installment_id
                            )?.installment_number || "—"}
                          </td>

                          <td>{money(payment.amount)}</td>

                          <td>{payment.notes || "—"}</td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              ) : (

                <p className="chit-empty">
                  No payments recorded yet.
                </p>

              )}

            </section>

          </>

        )}


        {/* Payment modal */}
        {paymentModal && (

          <Modal
            title="Record Chit Payment"
            onClose={() => setPaymentModal(false)}
          >

            <form
              className="chit-form"
              onSubmit={savePayment}
            >

              <label className="chit-field">
                <span>Payment Type *</span>

                <select
                  value={paymentForm.payment_type}
                  onChange={(event) =>
                    setPaymentForm({
                      ...paymentForm,
                      payment_type: event.target.value,
                    })
                  }
                >
                  <option value="contribution">
                    Monthly contribution
                  </option>

                  <option value="prize_received">
                    Prize money received
                  </option>
                </select>
              </label>


              <label className="chit-field">
                <span>Installment *</span>

                <select
                  required
                  value={paymentForm.installment_id}
                  onChange={(event) =>
                    setPaymentForm({
                      ...paymentForm,
                      installment_id: event.target.value,
                    })
                  }
                >
                  <option value="">
                    Select installment
                  </option>

                  {detail?.installments?.map((item) => (

                    <option
                      key={item.id}
                      value={item.id}
                    >
                      Installment {item.installment_number}
                      {" — "}
                      {formatDate(item.due_date)}
                    </option>

                  ))}

                </select>
              </label>


              <label className="chit-field">
                <span>Amount (₹) *</span>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={paymentForm.amount}
                  onChange={(event) =>
                    setPaymentForm({
                      ...paymentForm,
                      amount: event.target.value,
                    })
                  }
                />
              </label>


              <label className="chit-field">
                <span>Payment Date *</span>

                <input
                  type="date"
                  required
                  value={paymentForm.payment_date}
                  onChange={(event) =>
                    setPaymentForm({
                      ...paymentForm,
                      payment_date: event.target.value,
                    })
                  }
                />
              </label>


              <label className="chit-field full">
                <span>Notes</span>

                <textarea
                  value={paymentForm.notes}
                  onChange={(event) =>
                    setPaymentForm({
                      ...paymentForm,
                      notes: event.target.value,
                    })
                  }
                />
              </label>


              <div className="chit-form-actions">

                <button
                  type="button"
                  className="chit-btn secondary"
                  onClick={() => setPaymentModal(false)}
                >
                  Cancel
                </button>

                <button
                  className="chit-btn primary"
                  disabled={busy}
                >
                  {busy ? "Saving..." : "Save Payment"}
                </button>

              </div>

            </form>

          </Modal>

        )}


        {/* Auction modal */}
        {auctionModal && (

          <Modal
            title={`Auction · Installment ${auctionInstallment.installment_number}`}
            onClose={() => setAuctionModal(false)}
          >

            <form
              className="chit-form"
              onSubmit={saveAuction}
            >

              <label className="chit-field">
                <span>Auction Date</span>

                <input
                  type="date"
                  value={auctionForm.auction_date}
                  onChange={(event) =>
                    setAuctionForm({
                      ...auctionForm,
                      auction_date: event.target.value,
                    })
                  }
                />
              </label>


              <label className="chit-field">
                <span>Bid Amount (₹)</span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={auctionForm.bid_amount}
                  onChange={(event) =>
                    setAuctionForm({
                      ...auctionForm,
                      bid_amount: event.target.value,
                    })
                  }
                />
              </label>


              <label className="chit-field">
                <span>Dividend per Member (₹)</span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={auctionForm.dividend_amount}
                  onChange={(event) =>
                    setAuctionForm({
                      ...auctionForm,
                      dividend_amount: event.target.value,
                    })
                  }
                />
              </label>


              <label className="chit-field">
                <span>Prize Amount (₹)</span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={auctionForm.prize_amount}
                  onChange={(event) =>
                    setAuctionForm({
                      ...auctionForm,
                      prize_amount: event.target.value,
                    })
                  }
                />
              </label>


              <label className="chit-check">
                <input
                  type="checkbox"
                  checked={auctionForm.prize_received}
                  onChange={(event) =>
                    setAuctionForm({
                      ...auctionForm,
                      prize_received: event.target.checked,
                    })
                  }
                />

                Prize money received
              </label>


              <label className="chit-field full">
                <span>Notes</span>

                <textarea
                  value={auctionForm.notes}
                  onChange={(event) =>
                    setAuctionForm({
                      ...auctionForm,
                      notes: event.target.value,
                    })
                  }
                />
              </label>


              <div className="chit-form-actions">

                <button
                  type="button"
                  className="chit-btn secondary"
                  onClick={() => setAuctionModal(false)}
                >
                  Cancel
                </button>

                <button
                  className="chit-btn primary"
                  disabled={busy}
                >
                  {busy ? "Saving..." : "Save Auction"}
                </button>

              </div>

            </form>

          </Modal>

        )}

      </main>
    );
  }


  // Main Chit Funds screen
  return (

    <main className="chit-page">

      <div className="chit-heading">

        <div>
          <h1>Chit Funds</h1>

          <p>
            Manage your chit schemes, monthly installments,
            auctions and payouts.
          </p>
        </div>

        <button
          className="chit-btn primary"
          onClick={() => {
            setEditing(null);
            setFundForm(initialFund);
            setFundModal(true);
          }}
        >
          <Plus size={17} />
          Add Chit Fund
        </button>

      </div>


      {error && (
        <div className="chit-alert error">
          {error}
        </div>
      )}

      {notice && (
        <div className="chit-alert success">
          {notice}
        </div>
      )}


      {/* Summary cards */}
      <div className="chit-summary">

        <div>
          <span>
            <Wallet size={18} />
            Total Chit Value
          </span>

          <strong>
            {money(summary.total_chit_value)}
          </strong>
        </div>


        <div>
          <span>
            <CalendarDays size={18} />
            Monthly Commitment
          </span>

          <strong>
            {money(summary.monthly_commitment)}
          </strong>
        </div>


        <div>
          <span>
            <HandCoins size={18} />
            Total Contributed
          </span>

          <strong>
            {money(summary.total_contributed)}
          </strong>
        </div>


        <div>
          <span>
            <Trophy size={18} />
            Prize Money Received
          </span>

          <strong>
            {money(summary.total_prize_received)}
          </strong>
        </div>

      </div>


      {/* Scheme list */}
      <section className="chit-panel">

        <div className="chit-panel-head">

          <div>
            <h2>Your Chit Schemes</h2>

            <p>
              {summary.active_funds || 0} active
              {" · "}
              {summary.total_funds || 0} total schemes
            </p>
          </div>

          <button
            className="chit-refresh"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw size={15} />
            Refresh
          </button>

        </div>


        <div className="chit-toolbar">

          <div className="chit-search">
            <Search size={16} />

            <input
              placeholder="Search chit name or organizer..."
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
            />
          </div>


          <select
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value)
            }
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>

        </div>


        {loading ? (

          <div className="chit-loading">
            <Loader2 className="spin" />
            Loading chit funds...
          </div>

        ) : filtered.length === 0 ? (

          <div className="chit-empty">
            <h3>No chit funds found</h3>

            <p>
              Add a scheme to start tracking contributions and payouts.
            </p>
          </div>

        ) : (

          <div className="chit-cards">

            {filtered.map((fund) => (

              <article
                className="chit-fund-card"
                key={fund.id}
              >

                <div className="chit-fund-top">

                  <div className="chit-fund-icon">
                    <Wallet />
                  </div>

                  <span
                    className={`chit-status ${fund.status}`}
                  >
                    {fund.status}
                  </span>

                </div>


                <h3>{fund.name}</h3>

                <p className="chit-organizer">
                  Organizer: {fund.organizer_name}
                </p>


                <div className="chit-fund-value">
                  <span>Chit value</span>
                  <strong>{money(fund.chit_value)}</strong>
                </div>


                <div className="chit-card-metrics">

                  <div>
                    <span>Monthly</span>
                    <b>
                      {money(fund.monthly_contribution)}
                    </b>
                  </div>

                  <div>
                    <span>Contributed</span>
                    <b>{money(fund.total_contributed)}</b>
                  </div>

                  <div>
                    <span>Outstanding</span>
                    <b>
                      {money(fund.outstanding_contributions)}
                    </b>
                  </div>

                </div>


                <div className="chit-progress">
                  <div
                    style={{
                      width: `${
                        fund.chit_value
                          ? Math.min(
                              100,
                              Number(fund.total_contributed) /
                                Number(fund.chit_value) *
                                100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>


                <div className="chit-card-footer">

                  <span>
                    {fund.installments_paid}/
                    {fund.total_installments}
                    {" installments fully paid"}
                  </span>

                  <button
                    className="chit-small-btn"
                    onClick={() => openDetails(fund)}
                  >
                    <Eye size={14} />
                    View details
                  </button>

                  <button
                    className="chit-small-btn"
                    onClick={() => startEdit(fund)}
                  >
                    <Pencil size={14} />
                    Edit
                  </button>

                </div>

              </article>

            ))}

          </div>

        )}

      </section>


      {/* Add / edit fund modal */}
      {fundModal && (

        <Modal
          title={editing ? "Edit Chit Fund" : "Add Chit Fund"}
          onClose={() => setFundModal(false)}
        >

          <form
            className="chit-form"
            onSubmit={saveFund}
          >

            {field("Chit Name", "name", "text", true)}

            {field(
              "Organizer Name",
              "organizer_name",
              "text",
              true
            )}

            {field(
              "Organizer Phone",
              "organizer_phone"
            )}

            {field(
              "Total Chit Value (₹)",
              "chit_value",
              "number",
              true
            )}

            {field(
              "Monthly Contribution (₹)",
              "monthly_contribution",
              "number",
              true
            )}

            {field(
              "Number of Installments",
              "total_installments",
              "number",
              true
            )}

            {field(
              "Start Date",
              "start_date",
              "date",
              true
            )}

            {field(
              "Monthly Due Day (1–28)",
              "due_day",
              "number",
              true
            )}


            {editing && (

              <label className="chit-field">
                <span>Status</span>

                <select
                  value={fundForm.status}
                  onChange={(event) =>
                    setFundForm({
                      ...fundForm,
                      status: event.target.value,
                    })
                  }
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </label>

            )}


            <label className="chit-field full">
              <span>Notes</span>

              <textarea
                value={fundForm.notes}
                onChange={(event) =>
                  setFundForm({
                    ...fundForm,
                    notes: event.target.value,
                  })
                }
              />
            </label>


            <div className="chit-form-actions">

              <button
                type="button"
                className="chit-btn secondary"
                onClick={() => setFundModal(false)}
              >
                Cancel
              </button>

              <button
                className="chit-btn primary"
                disabled={busy}
              >
                {busy
                  ? "Saving..."
                  : editing
                    ? "Update Fund"
                    : "Create Fund"}
              </button>

            </div>

          </form>

        </Modal>

      )}

    </main>

  );
}
