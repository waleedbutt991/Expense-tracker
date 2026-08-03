document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const isLocal = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
    const API_BASE_URL = isLocal ? "http://127.0.0.1:8000" : "";

    window.logout = function() {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    };

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
                logout();
                return;
            }

            if (incomeRes.ok && expenseRes.ok) {
                const incomes = await incomeRes.json();
                const expenses = await expenseRes.json();
                
                const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
                const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
                const netBalance = totalIncome - totalExpense;

                document.getElementById('totalIncomeRs').innerText = `Rs. ${totalIncome.toFixed(2)}`;
                document.getElementById('totalExpenseRs').innerText = `Rs. ${totalExpense.toFixed(2)}`;
                document.getElementById('netBalanceRs').innerText = `Rs. ${netBalance.toFixed(2)}`;
            }
        } catch (err) {
            console.error("Dashboard Load Error:", err);
        }
    }

    // Redirect to report.html on Filter Apply
    window.applyFilter = function() {
        const fromDate = document.getElementById('fromDate').value;
        const toDate = document.getElementById('toDate').value;

        if (!fromDate && !toDate) {
            alert("Please select at least one date to filter!");
            return;
        }

        window.location.href = `report.html?from=${fromDate}&to=${toDate}`;
    };

    window.resetFilter = function() {
        document.getElementById('fromDate').value = '';
        document.getElementById('toDate').value = '';
    };

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
                body: JSON.stringify({ head_name: headName, amount: amount })
            });

            if (response.ok) {
                alert("Income Saved Successfully!");
                headInput.value = '';
                amountInput.value = '';
                fetchDashboardData();
            } else {
                alert("Error saving income!");
            }
        } catch (e) {
            console.error("Save Income Error:", e);
        }
    };

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
                body: JSON.stringify({ item_name: itemName, amount: amount })
            });

            if (response.ok) {
                alert("Expense Saved Successfully!");
                itemInput.value = '';
                amountInput.value = '';
                fetchDashboardData();
            } else {
                alert("Error saving expense!");
            }
        } catch (e) {
            console.error("Save Expense Error:", e);
        }
    };

    fetchDashboardData();
});