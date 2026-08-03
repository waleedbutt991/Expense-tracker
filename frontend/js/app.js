document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');

    // Auth Guard: Token check
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Dynamic Base API URL Detection
    const isLocal = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
    const API_BASE_URL = isLocal ? "http://127.0.0.1:8000" : "";

    // Fetch and Load Initial Dashboard Data
    async function fetchDashboardData() {
        try {
            const [incomeRes, expenseRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/incomes`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}/api/expenses`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (incomeRes.status === 401 || expenseRes.status === 401) {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                return;
            }

            if (incomeRes.ok && expenseRes.ok) {
                const incomes = await incomeRes.json();
                const expenses = await expenseRes.json();
                console.log("Fetched Incomes:", incomes);
                console.log("Fetched Expenses:", expenses);
            } else {
                console.warn("Failed to fetch dashboard data. Status:", incomeRes.status, expenseRes.status);
            }
        } catch (err) {
            console.error("Dashboard Load Error:", err);
        }
    }

    // Global Save Income Function
    window.saveIncome = async function(event) {
        if (event) event.preventDefault();

        const headInput = document.getElementById('incomeHead');
        const amountInput = document.getElementById('incomeAmount');

        const headName = headInput ? headInput.value.trim() : '';
        const amount = amountInput ? parseFloat(amountInput.value) : NaN;

        if (!headName || isNaN(amount)) {
            alert("Please enter both Income Head Name and valid Amount!");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/incomes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    head_name: headName,
                    amount: amount
                })
            });

            if (response.ok) {
                alert("Income Saved Successfully!");
                headInput.value = '';
                amountInput.value = '';
                fetchDashboardData();
            } else {
                let errorMsg = "Could not save income";
                try {
                    // Safe JSON parsing to prevent "Unexpected token 'A'" crash
                    const err = await response.json();
                    errorMsg = err.detail || errorMsg;
                } catch(e) {
                    errorMsg = `Server Error (${response.status}). Check Vercel Logs.`;
                }
                alert("Error: " + errorMsg);
            }
        } catch (e) {
            console.error("Save Income Error:", e);
            alert("Connection error while saving income.");
        }
    };

    // Global Save Expense Function
    window.saveExpense = async function(event) {
        if (event) event.preventDefault();

        const itemInput = document.getElementById('expenseItem');
        const amountInput = document.getElementById('expenseAmount');

        const itemName = itemInput ? itemInput.value.trim() : '';
        const amount = amountInput ? parseFloat(amountInput.value) : NaN;

        if (!itemName || isNaN(amount)) {
            alert("Please enter both Expense Item Name and valid Amount!");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/expenses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    item_name: itemName,
                    amount: amount
                })
            });

            if (response.ok) {
                alert("Expense Saved Successfully!");
                itemInput.value = '';
                amountInput.value = '';
                fetchDashboardData();
            } else {
                let errorMsg = "Could not save expense";
                try {
                    // Safe JSON parsing to prevent "Unexpected token 'A'" crash
                    const err = await response.json();
                    errorMsg = err.detail || errorMsg;
                } catch(e) {
                    errorMsg = `Server Error (${response.status}). Check Vercel Logs.`;
                }
                alert("Error: " + errorMsg);
            }
        } catch (e) {
            console.error("Save Expense Error:", e);
            alert("Connection error while saving expense.");
        }
    };

    // Initial Fetch on Startup
    fetchDashboardData();
});