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
                fetch(`${API_BASE_URL}/api/incomes`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/api/expenses`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (incomeRes.status === 401 || expenseRes.status === 401) {
                logout();
                return;
            }

            if (incomeRes.ok && expenseRes.ok) {
                const incomes = await incomeRes.json();
                const expenses = await expenseRes.json();

                // Totals
                const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
                const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
                const netBalance = totalIncome - totalExpense;

                document.getElementById('totalIncomeRs').innerText = `Rs. ${totalIncome.toFixed(2)}`;
                document.getElementById('totalExpenseRs').innerText = `Rs. ${totalExpense.toFixed(2)}`;
                document.getElementById('netBalanceRs').innerText = `Rs. ${netBalance.toFixed(2)}`;

                // Auto-Suggest List Generation (Case-Insensitive Deduplication)
                populateSuggestions('incomeSuggestions', incomes.map(i => i.head_name));
                populateSuggestions('expenseSuggestions', expenses.map(e => e.item_name));
            }
        } catch (err) {
            console.error("Dashboard Load Error:", err);
        }
    }

    function populateSuggestions(datalistId, items) {
        const datalist = document.getElementById(datalistId);
        if (!datalist) return;

        // Unique & Case-Insensitive set
        const uniqueNames = [];
        const seen = new Set();

        items.forEach(item => {
            if (item) {
                const lower = item.trim().toLowerCase();
                if (!seen.has(lower)) {
                    seen.add(lower);
                    uniqueNames.push(item.trim());
                }
            }
        });

        datalist.innerHTML = uniqueNames.map(name => `<option value="${name}">`).join('');
    }

    window.applyFilter = function() {
        const fromDate = document.getElementById('fromDate').value;
        const toDate = document.getElementById('toDate').value;

        if (!fromDate && !toDate) {
            alert("Please select at least one date!");
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
        const modeInput = document.getElementById('incomeMode');

        const headName = headInput ? headInput.value.trim() : '';
        const amount = amountInput ? parseFloat(amountInput.value) : NaN;
        const mode = modeInput ? modeInput.value : 'cash';

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
                body: JSON.stringify({ head_name: headName, amount: amount, payment_mode: mode })
            });

            if (response.ok) {
                alert("Income Saved Successfully!");
                headInput.value = '';
                amountInput.value = '';
                fetchDashboardData();
            }
        } catch (e) {
            console.error("Save Income Error:", e);
        }
    };

    window.saveExpense = async function(event) {
        if (event) event.preventDefault();

        const itemInput = document.getElementById('expenseItem');
        const amountInput = document.getElementById('expenseAmount');
        const modeInput = document.getElementById('expenseMode');

        const itemName = itemInput ? itemInput.value.trim() : '';
        const amount = amountInput ? parseFloat(amountInput.value) : NaN;
        const mode = modeInput ? modeInput.value : 'cash';

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
                body: JSON.stringify({ item_name: itemName, amount: amount, payment_mode: mode })
            });

            if (response.ok) {
                alert("Expense Saved Successfully!");
                itemInput.value = '';
                amountInput.value = '';
                fetchDashboardData();
            }
        } catch (e) {
            console.error("Save Expense Error:", e);
        }
    };

    fetchDashboardData();
});