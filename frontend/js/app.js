// Auth token check
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'login.html';
}

// Dynamic Base API URL Detection
const isLocal = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
const API_BASE_URL = isLocal ? "http://127.0.0.1:8000" : "";

// Save Income Function
async function saveIncome(event) {
    if (event) event.preventDefault();
    
    const headName = document.getElementById('incomeHead') ? document.getElementById('incomeHead').value : '';
    const amount = document.getElementById('incomeAmount') ? document.getElementById('incomeAmount').value : '';

    try {
        const response = await fetch(`${API_BASE_URL}/api/incomes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                head_name: headName,
                amount: parseFloat(amount)
            })
        });

        if (response.ok) {
            alert('Income saved successfully!');
            loadDashboardData(); // Dashboard UI updates
        } else {
            const err = await response.json();
            alert(err.detail || 'Failed to save income');
        }
    } catch (error) {
        console.error('Error saving income:', error);
        alert('Connection error while saving income.');
    }
}

// Save Expense Function
async function saveExpense(event) {
    if (event) event.preventDefault();
    
    const itemName = document.getElementById('expenseItem') ? document.getElementById('expenseItem').value : '';
    const amount = document.getElementById('expenseAmount') ? document.getElementById('expenseAmount').value : '';

    try {
        const response = await fetch(`${API_BASE_URL}/api/expenses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                item_name: itemName,
                amount: parseFloat(amount)
            })
        });

        if (response.ok) {
            alert('Expense saved successfully!');
            loadDashboardData(); // Dashboard UI updates
        } else {
            const err = await response.json();
            alert(err.detail || 'Failed to save expense');
        }
    } catch (error) {
        console.error('Error saving expense:', error);
        alert('Connection error while saving expense.');
    }
}

// Initial Data Load on Page Ready
async function loadDashboardData() {
    try {
        const [incRes, expRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/incomes`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_BASE_URL}/api/expenses`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (incRes.ok && expRes.ok) {
            const incomes = await incRes.json();
            const expenses = await expRes.json();
            
            // Calculate and display totals on dashboard UI
            console.log("Fetched Incomes:", incomes);
            console.log("Fetched Expenses:", expenses);
            
            // Yahan aap apne UI elements update kar sakte hain
        }
    } catch (err) {
        console.error("Dashboard fetch error:", err);
    }
}

// Initial call
loadDashboardData();