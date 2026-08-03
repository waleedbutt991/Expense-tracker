const API_URL = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost" 
  ? "http://127.0.0.1:8000" 
  : "/api";
const token = localStorage.getItem('token');

// Redirect to Login if token is missing
if (!token) {
  window.location.href = 'login.html';
}

// Global Auth Header
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
  fetchDashboardSummary();
  fetchAutoSuggestItems();
});

// Logout Handler
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
});

// Fetch Dashboard & Summary (With Optional Date Filters)
async function fetchDashboardSummary(startDate = '', endDate = '') {
  let url = `${API_URL}/dashboard-summary`;
  const params = new URLSearchParams();
  
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  try {
    const res = await fetch(url, { headers });
    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = 'login.html';
      return;
    }
    const data = await res.json();

    // Update Header & Cards
    document.getElementById('userDisplay').innerText = `User: ${data.user_email.split('@')[0]}`;
    document.getElementById('totalIncome').innerText = `Rs. ${data.total_income.toLocaleString()}`;
    document.getElementById('totalExpense').innerText = `Rs. ${data.total_expense.toLocaleString()}`;
    document.getElementById('remainingBalance').innerText = `Rs. ${data.remaining_balance.toLocaleString()}`;

    // Render History
    renderHistory(data.incomes_list, data.expenses_list);
  } catch (err) {
    console.error("Error fetching summary:", err);
  }
}

// Fetch Items for Dropdown Auto-Suggest
async function fetchAutoSuggestItems() {
  try {
    const res = await fetch(`${API_URL}/items`, { headers });
    const items = await res.json();
    const datalist = document.getElementById('itemsDatalist');
    datalist.innerHTML = '';
    
    items.forEach(item => {
      const option = document.createElement('option');
      option.value = item;
      datalist.appendChild(option);
    });
  } catch (err) {
    console.error("Error fetching items:", err);
  }
}

// Render History
function renderHistory(incomes, expenses) {
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = '';

  const allRecords = [
    ...incomes.map(i => ({ ...i, type: 'income', title: i.head })),
    ...expenses.map(e => ({ ...e, type: 'expense', title: e.item }))
  ];

  // Sort by date descending
  allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (allRecords.length === 0) {
    historyList.innerHTML = `<p style="text-align: center; color: #6b7280;">No records found for selected period.</p>`;
    return;
  }

  allRecords.forEach(record => {
    const div = document.createElement('div');
    div.className = 'record-item';
    const isIncome = record.type === 'income';
    div.innerHTML = `
      <div>
        <strong>${record.title}</strong>
        <br><small style="color:#6b7280;">${record.date}</small>
      </div>
      <div style="font-weight: bold;" class="${isIncome ? 'text-green' : 'text-red'}">
        ${isIncome ? '+' : '-'} Rs. ${record.amount.toLocaleString()}
      </div>
    `;
    historyList.appendChild(div);
  });
}

// Save Income
document.getElementById('incomeForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const head_name = document.getElementById('incomeHead').value;
  const amount = parseFloat(document.getElementById('incomeAmount').value);

  const res = await fetch(`${API_URL}/add-income`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ head_name, amount })
  });

  if (res.ok) {
    document.getElementById('incomeForm').reset();
    fetchDashboardSummary();
  }
});

// Save Expense
document.getElementById('expenseForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const item_name = document.getElementById('expenseItem').value;
  const amount = parseFloat(document.getElementById('expenseAmount').value);

  const res = await fetch(`${API_URL}/add-expense`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ item_name, amount })
  });

  if (res.ok) {
    document.getElementById('expenseForm').reset();
    fetchDashboardSummary();
    fetchAutoSuggestItems(); // Refresh auto-suggestions
  }
});

// Filter Buttons Handler
document.getElementById('applyFilterBtn').addEventListener('click', () => {
  const start = document.getElementById('startDate').value;
  const end = document.getElementById('endDate').value;
  fetchDashboardSummary(start, end);
});

document.getElementById('resetFilterBtn').addEventListener('click', () => {
  document.getElementById('startDate').value = '';
  document.getElementById('endDate').value = '';
  fetchDashboardSummary();
});