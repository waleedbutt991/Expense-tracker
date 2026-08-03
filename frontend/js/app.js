document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const isLocal = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
    const API_BASE_URL = isLocal ? "http://127.0.0.1:8000" : "";

    let allIncomes = [];
    let allExpenses = [];

    // Global Logout Function
    window.logout = function() {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    };

    // Load Initial Data
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
                allIncomes = await incomeRes.json();
                allExpenses = await expenseRes.json();
                renderDashboard(allIncomes, allExpenses);
            }
        } catch (err) {
            console.error("Dashboard Load Error:", err);
        }
    }

    function renderDashboard(incomes, expenses) {
        // Calculate Totals
        const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
        const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
        const netBalance = totalIncome - totalExpense;

        // Update DOM Cards
        document.getElementById('totalIncomeRs').innerText = `Rs. ${totalIncome.toFixed(2)}`;
        document.getElementById('totalExpenseRs').innerText = `Rs. ${totalExpense.toFixed(2)}`;
        document.getElementById('netBalanceRs').innerText = `Rs. ${netBalance.toFixed(2)}`;

        // Merge & Sort Recent Transactions
        const mergedList = [
            ...incomes.map(i => ({ type: 'Income', name: i.head_name, amount: i.amount, date: i.created_at })),
            ...expenses.map(e => ({ type: 'Expense', name: e.item_name, amount: e.amount, date: e.created_at }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        const tbody = document.getElementById('transactionsTableBody');
        if (mergedList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No transactions recorded yet.</td></tr>';
            return;
        }

        tbody.innerHTML = mergedList.map(item => `
            <tr>
                <td><strong style="color: ${item.type === 'Income' ? '#28a745' : '#dc3545'}">${item.type}</strong></td>
                <td>${item.name}</td>
                <td>Rs. ${item.amount.toFixed(2)}</td>
                <td>${new Date(item.date).toLocaleDateString()}</td>
            </tr>
        `).join('');
    }

    // Filter Logic
    window.applyFilter = function() {
        const fromDateStr = document.getElementById('fromDate').value;
        const toDateStr = document.getElementById('toDate').value;

        if (!fromDateStr && !toDateStr) return;

        const fromDate = fromDateStr ? new Date(fromDateStr) : new Date('1970-01-01');
        const toDate = toDateStr ? new Date(toDateStr) : new Date('2099-12-31');
        toDate.setHours(23, 59, 59);

        const filteredIncomes = allIncomes.filter(item => {
            const d = new Date(item.created_at);
            return d >= fromDate && d <= toDate;
        });

        const filteredExpenses = allExpenses.filter(item => {
            const d = new Date(item.created_at);
            return d >= fromDate && d <= toDate;
        });

        renderDashboard(filteredIncomes, filteredExpenses);
    };

    window.resetFilter = function() {
        document.getElementById('fromDate').value = '';
        document.getElementById('toDate').value = '';
        renderDashboard(allIncomes, allExpenses);
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