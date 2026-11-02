import { useEffect, useState } from "react";
import { CreditCard, Plus, RefreshCw, Pencil, History, X } from "lucide-react";
import { getCreditCards, createCreditCard, updateCreditCard, getCreditCardTransactions, createCreditCardTransaction } from "../../services/creditCardService";
import { getAccounts } from "../../services/accountService";
import "./CreditCardsSection.css";

const today = () => new Date().toISOString().slice(0, 10);
const emptyCard = { card_name: "", issuer: "", last_four: "", credit_limit: "", statement_day: "1", due_day: "15" };
const emptyEntry = { transaction_type: "purchase", title: "", amount: "", transaction_date: today(), account_id: "", notes: "" };
const money = (v) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(v || 0));

export default function CreditCardsSection() {
  const [cards, setCards] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(emptyCard);
  const [editing, setEditing] = useState(null);
  const [entry, setEntry] = useState(emptyEntry);
  const [target, setTarget] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyCard, setHistoryCard] = useState(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const [cardData, accountData] = await Promise.all([getCreditCards(), getAccounts()]);
      setCards(Array.isArray(cardData) ? cardData : []);
      setAccounts(Array.isArray(accountData) ? accountData.filter(a => a.is_active) : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm(emptyCard); setShowCardForm(true); }
  function openEdit(card) {
    setEditing(card);
    setForm({ card_name: card.card_name, issuer: card.issuer, last_four: card.last_four, credit_limit: card.credit_limit, statement_day: card.statement_day, due_day: card.due_day });
    setShowCardForm(true);
  }
  async function saveCard(e) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const payload = { ...form, credit_limit: Number(form.credit_limit), statement_day: Number(form.statement_day), due_day: Number(form.due_day) };
      if (editing) await updateCreditCard(editing.id, payload);
      else await createCreditCard(payload);
      setShowCardForm(false); await load();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  function openEntry(card) { setTarget(card); setEntry(emptyEntry); setShowEntryForm(true); }
  async function saveEntry(e) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const payload = { ...entry, amount: Number(entry.amount), account_id: entry.transaction_type === "payment" ? Number(entry.account_id) : null };
      await createCreditCardTransaction(target.id, payload);
      setShowEntryForm(false); await load();
      if (historyCard?.id === target.id) setHistory(await getCreditCardTransactions(target.id));
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function showHistory(card) {
    setHistoryCard(card);
    try { setHistory(await getCreditCardTransactions(card.id)); }
    catch (e) { setError(e.message); }
  }
  async function toggleActive(card) {
    try { await updateCreditCard(card.id, { is_active: !card.is_active }); await load(); }
    catch (e) { setError(e.message); }
  }

  return <section className="cc-section">
    <div className="cc-heading">
      <div><h2><CreditCard size={21} /> Credit Cards</h2><p>Track card spending, repayments and outstanding balances.</p></div>
      <div className="cc-heading-actions"><button className="cc-light-btn" onClick={load} disabled={loading}><RefreshCw size={15} /> Refresh</button><button className="cc-primary-btn" onClick={openAdd}><Plus size={16} /> Add Card</button></div>
    </div>
    {error && <div className="cc-error">{error}<button onClick={() => setError("")}>Dismiss</button></div>}
    {loading ? <p className="cc-muted">Loading credit cards...</p> : cards.length === 0 ? <div className="cc-empty"><CreditCard size={30}/><strong>No credit cards added</strong><span>Add a card to start tracking its outstanding balance.</span></div> :
      <div className="cc-grid">{cards.map(card => <article className={`cc-card ${!card.is_active ? "cc-inactive" : ""}`} key={card.id}>
        <div className="cc-card-top"><span>{card.issuer}</span><CreditCard size={22}/></div>
        <h3>{card.card_name}</h3><p className="cc-number">•••• •••• •••• {card.last_four}</p>
        <div className="cc-balance"><div><small>Outstanding</small><strong>{money(card.outstanding_balance)}</strong></div><div><small>Available credit</small><strong>{money(card.available_credit)}</strong></div></div>
        <div className="cc-limit"><span>Credit limit</span><b>{money(card.credit_limit)}</b></div>
        <div className="cc-progress"><i style={{ width: `${Math.min(100, Math.max(0, Number(card.outstanding_balance) / Number(card.credit_limit) * 100))}%` }}/></div>
        <p className="cc-dates">Statement: {card.statement_day}th · Due: {card.due_day}th</p>
        <div className="cc-actions"><button onClick={() => openEntry(card)} disabled={!card.is_active}><Plus size={14}/> Add activity</button><button onClick={() => showHistory(card)}><History size={14}/> History</button><button onClick={() => openEdit(card)}><Pencil size={14}/> Edit</button><button onClick={() => toggleActive(card)}>{card.is_active ? "Deactivate" : "Activate"}</button></div>
      </article>)}</div>}
    {historyCard && <div className="cc-history"><div className="cc-history-head"><h3>{historyCard.card_name} activity</h3><button onClick={() => setHistoryCard(null)}><X size={17}/></button></div>
      {history.length === 0 ? <p className="cc-muted">No activity recorded yet.</p> : <div className="cc-history-list">{history.map(row => <div key={row.id}><div><b>{row.title}</b><small>{row.transaction_type} · {row.transaction_date}</small></div><strong>{money(row.amount)}</strong></div>)}</div>}
    </div>}
    {showCardForm && <div className="cc-overlay"><form className="cc-modal" onSubmit={saveCard}><div className="cc-modal-head"><h3>{editing ? "Edit Credit Card" : "Add Credit Card"}</h3><button type="button" onClick={() => setShowCardForm(false)}><X/></button></div>
      <div className="cc-form-grid"><label>Card name<input required minLength="2" value={form.card_name} onChange={e=>setForm({...form,card_name:e.target.value})} placeholder="e.g. Amazon Pay ICICI"/></label><label>Issuer / Bank<input required value={form.issuer} onChange={e=>setForm({...form,issuer:e.target.value})} placeholder="e.g. ICICI Bank"/></label>
      <label>Last 4 digits<input required maxLength="4" pattern="[0-9]{4}" value={form.last_four} disabled={!!editing} onChange={e=>setForm({...form,last_four:e.target.value.replace(/\D/g,"").slice(0,4)})} placeholder="1234"/></label><label>Credit limit<input required type="number" min="1" step="0.01" value={form.credit_limit} onChange={e=>setForm({...form,credit_limit:e.target.value})}/></label>
      <label>Statement date (day)<input required type="number" min="1" max="31" value={form.statement_day} onChange={e=>setForm({...form,statement_day:e.target.value})}/></label><label>Payment due date (day)<input required type="number" min="1" max="31" value={form.due_day} onChange={e=>setForm({...form,due_day:e.target.value})}/></label></div>
      <p className="cc-security-note">Only the last four digits are stored. Do not enter your full card number, CVV or PIN.</p><div className="cc-modal-actions"><button type="button" onClick={()=>setShowCardForm(false)}>Cancel</button><button type="submit" disabled={busy}>{busy ? "Saving..." : "Save Card"}</button></div></form></div>}
    {showEntryForm && <div className="cc-overlay"><form className="cc-modal" onSubmit={saveEntry}><div className="cc-modal-head"><h3>Add activity · {target?.card_name}</h3><button type="button" onClick={()=>setShowEntryForm(false)}><X/></button></div>
      <div className="cc-form-grid"><label>Activity type<select value={entry.transaction_type} onChange={e=>setEntry({...entry,transaction_type:e.target.value,account_id:""})}><option value="purchase">Purchase</option><option value="payment">Payment</option><option value="refund">Refund</option><option value="interest">Interest</option><option value="fee">Fee / Charge</option></select></label><label>Description<input required value={entry.title} onChange={e=>setEntry({...entry,title:e.target.value})} placeholder="e.g. Grocery shopping"/></label>
      <label>Amount<input required type="number" min="0.01" step="0.01" value={entry.amount} onChange={e=>setEntry({...entry,amount:e.target.value})}/></label><label>Date<input required type="date" value={entry.transaction_date} onChange={e=>setEntry({...entry,transaction_date:e.target.value})}/></label>
      {entry.transaction_type === "payment" && <label className="cc-full">Paid from account<select required value={entry.account_id} onChange={e=>setEntry({...entry,account_id:e.target.value})}><option value="">Select account</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.account_name} · {a.institution_name || a.account_type}</option>)}</select></label>}
      <label className="cc-full">Notes (optional)<input value={entry.notes} onChange={e=>setEntry({...entry,notes:e.target.value})}/></label></div>
      <p className="cc-security-note">Payments reduce your selected account balance but are not counted as a second expense.</p><div className="cc-modal-actions"><button type="button" onClick={()=>setShowEntryForm(false)}>Cancel</button><button type="submit" disabled={busy}>{busy ? "Saving..." : "Save Activity"}</button></div></form></div>}
  </section>;
}
