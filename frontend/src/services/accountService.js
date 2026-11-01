// accountService.js
const API_URL = "http://127.0.0.1:8000/api/v1/accounts";


export async function getAccounts() {

    const response = await fetch(`${API_URL}/`);

    if (!response.ok) {
        throw new Error("Failed to retrieve accounts");
    }

    return response.json();
}


export async function getAccountSummary() {

    const response = await fetch(`${API_URL}/summary`);

    if (!response.ok) {
        throw new Error("Failed to retrieve account summary");
    }

    return response.json();
}


export async function createAccount(accountData) {

    const response = await fetch(`${API_URL}/`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(accountData)

    });

    if (!response.ok) {

        const error = await response.json();

        throw new Error(
            error.detail || "Failed to create account"
        );

    }

    return response.json();
}


export async function updateAccount(id, accountData) {

    const response = await fetch(`${API_URL}/${id}`, {

        method: "PUT",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(accountData)

    });

    if (!response.ok) {

        const error = await response.json();

        throw new Error(
            error.detail || "Failed to update account"
        );

    }

    return response.json();
}


export async function deleteAccount(id) {

    const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE"
    });

    if (!response.ok) {

        const error = await response.json();

        throw new Error(
            error.detail || "Failed to delete account"
        );

    }

    return response.json();
}


const TRANSFER_API_URL = "http://127.0.0.1:8000/api/v1/transfers";


export async function getTransfers() {

    const response = await fetch(`${TRANSFER_API_URL}/`);

    if (!response.ok) {
        throw new Error("Failed to retrieve transfer history");
    }

    return response.json();
}


export async function createTransfer(transferData) {

    const response = await fetch(`${TRANSFER_API_URL}/`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(transferData)

    });

    if (!response.ok) {

        const error = await response.json();

        throw new Error(
            error.detail || "Failed to transfer money"
        );

    }

    return response.json();
}