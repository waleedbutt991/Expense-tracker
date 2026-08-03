document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const isLocal = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
    const API_BASE_URL = isLocal ? "http://127.0.0.1:8000" : "";

    // URL parameters se dates get karein
    const urlParams = new URLSearchParams(window.location.search);
    const fromDateStr = urlParams.get('from');
    const toDateStr = urlParams.get('to');

    document.getElementById('reportDateRange').innerText = 
        `Showing report from: ${fromDateStr || 'Start'} to ${toDateStr || 'Today'}`;

    try {
        const [incomeRes, expenseRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/incomes`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_BASE_URL}/api/expenses`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (incomeRes.ok && expenseRes.ok) {
            const allIncomes = await incomeRes.json();
            const allExpenses = await expenseRes.json();

            // Filter logic
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

            renderReport(filteredIncomes, filteredExpenses);
        }
    } catch (err) {
        console.error("Report Fetch Error:", err);
    }

    function renderReport(incomes, expenses) {
        // --- 1. Head-Wise Grouping Logic ---
        const headMap = {};

        incomes.forEach(i => {
            const key = `Income_${i.head_name.toLowerCase().trim()}`;
            if (!headMap[key]) {
                headMap[key] = { type: 'Income', name: i.head_name, amount: 0 };
            }
            headMap[key].amount += i.amount;
        });

        expenses.forEach(e => {
            const key = `Expense_${e.item_name.toLowerCase().trim()}`;
            if (!headMap[key]) {
                headMap[key] = { type: 'Expense', name: e.item_name, amount: 0 };
            }
            headMap[key].amount += e.amount;
        });

        const headwiseBody = document.getElementById('headwiseTableBody');
        const headKeys = Object.keys(headMap);

        if (headKeys.length === 0) {
            headwiseBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No records found for selected period.</td></tr>';
        } else {
            headwiseBody.innerHTML = headKeys.map(k => {
                const item = headMap[k];
                return `
                    <tr>
                        <td class="${item.type === 'Income' ? 'badge-income' : 'badge-expense'}">${item.type}</td>
                        <td>${item.name}</td>
                        <td>Rs. ${item.amount.toFixed(2)}</td>
                    </tr>
                `;
            }).join('');
        }

        // --- 2. Detailed Transactions ---
        const mergedList = [
            ...incomes.map(i => ({ type: 'Income', name: i.head_name, amount: i.amount, date: i.created_at })),
            ...expenses.map(e => ({ type: 'Expense', name: e.item_name, amount: e.amount, date: e.created_at }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        const detailedBody = document.getElementById('detailedTableBody');
        if (mergedList.length === 0) {
            detailedBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No transactions found.</td></tr>';
        } else {
            detailedBody.innerHTML = mergedList.map(item => `
                <tr>
                    <td class="${item.type === 'Income' ? 'badge-income' : 'badge-expense'}">${item.type}</td>
                    <td>${item.name}</td>
                    <td>Rs. ${item.amount.toFixed(2)}</td>
                    <td>${new Date(item.date).toLocaleDateString()}</td>
                </tr>
            `).join('');
        }

        // --- 3. Final End Totals ---
        const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
        const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
        const netBalance = totalIncome - totalExpense;

        document.getElementById('filterIncomeRs').innerText = `Rs. ${totalIncome.toFixed(2)}`;
        document.getElementById('filterExpenseRs').innerText = `Rs. ${totalExpense.toFixed(2)}`;
        document.getElementById('filterBalanceRs').innerText = `Rs. ${netBalance.toFixed(2)}`;
    }
});