// AccountPage.jsx
import { useEffect, useState } from "react";

import {
    Plus,
    Wallet,
    Landmark,
    Smartphone,
    CreditCard,
    MoreVertical,
    Pencil,
    Trash2,
    X,
    RefreshCw,
    ArrowLeftRight
} from "lucide-react";

import {
    getAccounts,
    getAccountSummary,
    createAccount,
    updateAccount,
    deleteAccount,
    getTransfers,
    createTransfer
} from "../../services/accountService";

import "./AccountPage.css";


const initialForm = {
    account_name: "",
    account_type: "bank",
    institution_name: "",
    opening_balance: "",
    currency: "INR"
};


const accountIcons = {
    bank: Landmark,
    cash: Wallet,
    wallet: Smartphone,
    other: CreditCard
};


function AccountPage() {

    const [accounts, setAccounts] = useState([]);

    const [summary, setSummary] = useState({
        total_accounts: 0,
        active_accounts: 0,
        total_opening_balance: 0,
        total_current_balance: 0
    });

    const [form, setForm] = useState(initialForm);

    const [editingId, setEditingId] = useState(null);

    const [modalOpen, setModalOpen] = useState(false);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");

    const [menuAccountId, setMenuAccountId] = useState(null);

    const [transfers, setTransfers] = useState([]);

    const [transferModalOpen, setTransferModalOpen] = useState(false);

    const [transferSaving, setTransferSaving] = useState(false);

    const [transferForm, setTransferForm] = useState({
        from_account_id: "",
        to_account_id: "",
        amount: "",
        transfer_date: new Date().toLocaleDateString("en-CA"),
        notes: ""
    });


    async function loadAccounts() {

        setLoading(true);
        setError("");

        try {

            const [accountData, summaryData, transferData] =
                await Promise.all([
                    getAccounts(),
                    getAccountSummary(),
                    getTransfers()
                ]);

            setAccounts(accountData);
            setSummary(summaryData);
            setTransfers(transferData);

        } catch (err) {

            setError(err.message);

        } finally {

            setLoading(false);

        }

    }


    useEffect(() => {

        loadAccounts();

    }, []);


    function formatAmount(amount, currency = "INR") {

        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency,
            minimumFractionDigits: 2
        }).format(Number(amount));

    }


    function openAddModal() {

        setForm(initialForm);
        setEditingId(null);
        setError("");
        setSuccess("");
        setModalOpen(true);

    }


    function openEditModal(account) {

        setForm({
            account_name: account.account_name,
            account_type: account.account_type,
            institution_name: account.institution_name || "",
            opening_balance: account.opening_balance,
            currency: account.currency
        });

        setEditingId(account.id);
        setError("");
        setSuccess("");
        setModalOpen(true);
        setMenuAccountId(null);

    }


    function handleChange(event) {

        const { name, value } = event.target;

        setForm(previous => ({
            ...previous,
            [name]: value
        }));

    }


    async function handleSubmit(event) {

        event.preventDefault();

        setSaving(true);
        setError("");
        setSuccess("");

        try {

            const payload = {
                ...form,
                account_name: form.account_name.trim(),
                institution_name:
                    form.institution_name.trim() || null,
                opening_balance: Number(form.opening_balance || 0)
            };

            if (editingId) {

                await updateAccount(editingId, payload);

                setSuccess("Account updated successfully");

            } else {

                await createAccount(payload);

                setSuccess("Account created successfully");

            }

            setModalOpen(false);
            setForm(initialForm);
            setEditingId(null);

            await loadAccounts();

        } catch (err) {

            setError(err.message);

        } finally {

            setSaving(false);

        }

    }


    async function handleDelete(account) {

        const confirmed = window.confirm(
            `Are you sure you want to delete ${account.account_name}?`
        );

        if (!confirmed) return;

        try {

            await deleteAccount(account.id);

            setSuccess("Account deleted successfully");

            await loadAccounts();

        } catch (err) {

            setError(err.message);

        }

        setMenuAccountId(null);

    }

    function openTransferModal() {

    const activeAccounts = accounts.filter(
        account => account.is_active
    );

    setTransferForm({
        from_account_id: activeAccounts[0]?.id || "",
        to_account_id: activeAccounts[1]?.id || "",
        amount: "",
        transfer_date: new Date().toLocaleDateString("en-CA"),
        notes: ""
    });

    setError("");
    setSuccess("");
    setTransferModalOpen(true);

}


function handleTransferChange(event) {

    const { name, value } = event.target;

    setTransferForm(previous => {

        const updatedForm = {
            ...previous,
            [name]: value
        };

        // If the source account changes,
        // ensure the destination is different.
        if (name === "from_account_id") {

            if (
                Number(updatedForm.from_account_id) ===
                Number(previous.to_account_id)
            ) {

                const anotherAccount = accounts.find(
                    account =>
                        account.is_active &&
                        account.id !== Number(value)
                );

                updatedForm.to_account_id =
                    anotherAccount
                        ? String(anotherAccount.id)
                        : "";

            }

        }

        return updatedForm;

    });

}


async function handleTransferSubmit(event) {

    event.preventDefault();

    setTransferSaving(true);
    setError("");
    setSuccess("");

    try {

        const fromAccountId = Number(
    transferForm.from_account_id
);

const toAccountId = Number(
    transferForm.to_account_id
);

if (!fromAccountId || !toAccountId) {
    throw new Error("Please select both accounts");
}

if (fromAccountId === toAccountId) {
    throw new Error(
        "Please select two different accounts"
    );
}

        const payload = {
            from_account_id: Number(
                transferForm.from_account_id
            ),
            to_account_id: Number(
                transferForm.to_account_id
            ),
            amount: Number(transferForm.amount),
            transfer_date: transferForm.transfer_date,
            notes: transferForm.notes.trim() || null
        };

        await createTransfer(payload);

        setTransferModalOpen(false);

        setSuccess("Money transferred successfully");

        await loadAccounts();

    } catch (err) {

        setError(err.message);

    } finally {

        setTransferSaving(false);

    }

}


    function getAccountIcon(type) {

        return accountIcons[type] || CreditCard;

    }


    return (

        <div className="accounts-page">

            {/* Page header */}

            <div className="accounts-header">

                <div>
                    <h1>My Accounts</h1>

                    <p>
                        Manage your bank accounts, cash and digital wallets.
                    </p>
                </div>

                <div className="accounts-header-actions">

    <button
        className="account-transfer-btn"
        onClick={openTransferModal}
        disabled={accounts.filter(a => a.is_active).length < 2}
    >
        <ArrowLeftRight size={17} />
        Transfer Money
    </button>

    <button
        className="account-primary-btn"
        onClick={openAddModal}
    >
        <Plus size={18} />
        Add Account
    </button>

</div>

            </div>


            {/* Notifications */}

            {error && (
                <div className="account-alert error">
                    {error}
                </div>
            )}

            {success && (
                <div className="account-alert success">
                    {success}
                </div>
            )}


            {/* Summary cards */}

            <div className="account-summary-grid">

                <div className="account-summary-card">

                    <div className="summary-icon blue">
                        <Wallet size={21} />
                    </div>

                    <p>Total Accounts</p>

                    <h2>{summary.total_accounts}</h2>

                    <span>All registered accounts</span>

                </div>


                <div className="account-summary-card">

                    <div className="summary-icon green">
                        <Landmark size={21} />
                    </div>

                    <p>Active Accounts</p>

                    <h2>{summary.active_accounts}</h2>

                    <span>Currently active</span>

                </div>


                <div className="account-summary-card">

                    <div className="summary-icon purple">
                        <CreditCard size={21} />
                    </div>

                    <p>Total Available Balance</p>

                    <h2>
                        {formatAmount(
                            summary.total_current_balance
                        )}
                    </h2>

                    <span>Balances after income and expenses</span>

                </div>

            </div>


            {/* Accounts section */}

            <div className="accounts-section-header">

                <div>
                    <h2>Your Accounts</h2>

                    <p>
                        All the accounts you have registered.
                    </p>
                </div>

                <button
                    className="refresh-btn"
                    onClick={loadAccounts}
                    disabled={loading}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>

            </div>


            {loading ? (

                <div className="accounts-empty">
                    Loading accounts...
                </div>

            ) : accounts.length === 0 ? (

                <div className="accounts-empty">

                    <Wallet size={38} />

                    <h3>No accounts added yet</h3>

                    <p>
                        Start by adding your bank account, cash or wallet.
                    </p>

                    <button
                        className="account-primary-btn"
                        onClick={openAddModal}
                    >
                        <Plus size={17} />
                        Add Your First Account
                    </button>

                </div>

            ) : (

                <div className="accounts-grid">

                    {accounts.map(account => {

                        const Icon = getAccountIcon(
                            account.account_type
                        );

                        return (

                            <div
                                className="account-card"
                                key={account.id}
                            >

                                <div className="account-card-top">

                                    <div className="account-card-icon">
                                        <Icon size={22} />
                                    </div>

                                    <div className="account-menu-wrapper">

                                        <button
                                            className="account-menu-btn"
                                            onClick={() =>
                                                setMenuAccountId(
                                                    menuAccountId === account.id
                                                        ? null
                                                        : account.id
                                                )
                                            }
                                        >
                                            <MoreVertical size={19} />
                                        </button>

                                        {menuAccountId === account.id && (

                                            <div className="account-dropdown">

                                                <button
                                                    onClick={() =>
                                                        openEditModal(account)
                                                    }
                                                >
                                                    <Pencil size={15} />
                                                    Edit
                                                </button>

                                                <button
                                                    className="delete-option"
                                                    onClick={() =>
                                                        handleDelete(account)
                                                    }
                                                >
                                                    <Trash2 size={15} />
                                                    Delete
                                                </button>

                                            </div>

                                        )}

                                    </div>

                                </div>


                                <div className="account-card-details">

                                    <h3>{account.account_name}</h3>

                                    <p>
                                        {account.institution_name ||
                                            account.account_type}
                                    </p>

                                </div>


                                <div className="account-card-bottom">

                                    <div>
                                        <span>Current Balance</span>

                                        <h2>
                                            {formatAmount(
                                                account.current_balance,
                                                account.currency
                                            )}
                                        </h2>

                                        <small>
                                            Opening: {formatAmount(
                                                account.opening_balance,
                                                account.currency
                                            )}
                                        </small>
                                    </div>

                                    <span className={
                                        account.is_active
                                            ? "account-status active"
                                            : "account-status inactive"
                                    }>
                                        {account.is_active
                                            ? "Active"
                                            : "Inactive"}
                                    </span>

                                </div>

                            </div>

                        );

                    })}

                        </div>
                        
                        

            )}

            <div className="transfers-section">

    <div className="accounts-section-header">

        <div>
            <h2>Transfer History</h2>
            <p>Money moved between your accounts.</p>
        </div>

    </div>

    {transfers.length === 0 ? (

        <div className="accounts-empty">
            <ArrowLeftRight size={35} />
            <h3>No transfers yet</h3>
            <p>Your account transfers will appear here.</p>
        </div>

    ) : (

        <div className="transfer-history-list">

            {transfers.map(transfer => (

                <div
                    className="transfer-history-item"
                    key={transfer.id}
                >

                    <div className="transfer-history-icon">
                        <ArrowLeftRight size={19} />
                    </div>

                    <div className="transfer-history-details">

                        <strong>
                            {transfer.from_account_name}
                            {" → "}
                            {transfer.to_account_name}
                        </strong>

                        <span>
                            {new Date(
                                `${transfer.transfer_date}T00:00:00`
                            ).toLocaleDateString("en-IN")}

                            {transfer.notes
                                ? ` · ${transfer.notes}`
                                : ""}
                        </span>

                    </div>

                    <div className="transfer-history-amount">
                        {formatAmount(transfer.amount)}
                    </div>

                </div>

            ))}

        </div>

    )}

</div>

            {/* Add / Edit modal */}

            {modalOpen && (

                <div
                    className="account-modal-overlay"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setModalOpen(false);
                        }
                    }}
                >

                    <div className="account-modal">

                        <div className="account-modal-header">

                            <div>
                                <h2>
                                    {editingId
                                        ? "Edit Account"
                                        : "Add New Account"}
                                </h2>

                                <p>
                                    Enter your account information below.
                                </p>
                            </div>

                            <button
                                className="modal-close"
                                onClick={() => setModalOpen(false)}
                            >
                                <X size={20} />
                            </button>

                        </div>


                        <form onSubmit={handleSubmit}>

                            <div className="account-form-group">

                                <label>Account Name *</label>

                                <input
                                    name="account_name"
                                    value={form.account_name}
                                    onChange={handleChange}
                                    placeholder="e.g. SBI Salary Account"
                                    required
                                    minLength={2}
                                    maxLength={100}
                                />

                            </div>


                            <div className="account-form-group">

                                <label>Account Type *</label>

                                <select
                                    name="account_type"
                                    value={form.account_type}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="bank">Bank Account</option>
                                    <option value="cash">Cash</option>
                                    <option value="wallet">UPI / Wallet</option>
                                    <option value="other">Other</option>
                                </select>

                            </div>


                            <div className="account-form-group">

                                <label>
                                    Bank / Institution / Provider
                                </label>

                                <input
                                    name="institution_name"
                                    value={form.institution_name}
                                    onChange={handleChange}
                                    placeholder="e.g. SBI, HDFC, Google Pay"
                                    maxLength={150}
                                />

                            </div>


                            <div className="account-form-group">

                                <label>Opening Balance (₹) *</label>

                                <input
                                    type="number"
                                    name="opening_balance"
                                    value={form.opening_balance}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    required
                                />

                            </div>


                            <div className="account-modal-actions">

                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => setModalOpen(false)}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="account-primary-btn"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingId
                                            ? "Update Account"
                                            : "Create Account"}
                                </button>

                            </div>

                        </form>

                    </div>
                    

                </div>

            )}

            {transferModalOpen && (

    <div
        className="account-modal-overlay"
        onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
                setTransferModalOpen(false);
            }
        }}
    >

        <div className="account-modal">

            <div className="account-modal-header">

                <div>
                    <h2>Transfer Money</h2>
                    <p>Move money between your accounts.</p>
                </div>

                <button
                    className="modal-close"
                    onClick={() => setTransferModalOpen(false)}
                >
                    <X size={20} />
                </button>

            </div>

            <form onSubmit={handleTransferSubmit}>

                <div className="account-form-group">

                    <label>From Account *</label>

                    <select
                        name="from_account_id"
                        value={transferForm.from_account_id}
                        onChange={handleTransferChange}
                        required
                    >

                        {accounts
                            .filter(account => account.is_active)
                            .map(account => (

                                <option
                                    key={account.id}
                                    value={account.id}
                                >
                                    {account.account_name}
                                    {" - "}
                                    {formatAmount(
                                        account.current_balance,
                                        account.currency
                                    )}
                                </option>

                            ))}

                    </select>

                </div>

                <div className="account-form-group">

                    <label>To Account *</label>

                    <select
                        name="to_account_id"
                        value={transferForm.to_account_id}
                        onChange={handleTransferChange}
                        required
                    >

                        {accounts
                            .filter(account =>
                                account.is_active &&
                                account.id !== Number(
                                    transferForm.from_account_id
                                )
                            )
                            .map(account => (

                                <option
                                    key={account.id}
                                    value={account.id}
                                >
                                    {account.account_name}
                                </option>

                            ))}

                    </select>

                </div>

                <div className="account-form-group">

                    <label>Transfer Amount *</label>

                    <input
                        type="number"
                        name="amount"
                        value={transferForm.amount}
                        onChange={handleTransferChange}
                        placeholder="Enter amount"
                        min="0.01"
                        step="0.01"
                        required
                    />

                </div>

                <div className="account-form-group">

                    <label>Transfer Date *</label>

                    <input
                        type="date"
                        name="transfer_date"
                        value={transferForm.transfer_date}
                        onChange={handleTransferChange}
                        required
                    />

                </div>

                <div className="account-form-group">

                    <label>Notes</label>

                    <input
                        type="text"
                        name="notes"
                        value={transferForm.notes}
                        onChange={handleTransferChange}
                        placeholder="Optional notes"
                        maxLength={500}
                    />

                </div>

                <div className="account-modal-actions">

                    <button
                        type="button"
                        className="cancel-btn"
                        onClick={() => setTransferModalOpen(false)}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="account-primary-btn"
                        disabled={transferSaving}
                    >
                        {transferSaving
                            ? "Transferring..."
                            : "Confirm Transfer"}
                    </button>

                </div>

            </form>

        </div>

    </div>

)}

        </div>

    );

}

export default AccountPage;
