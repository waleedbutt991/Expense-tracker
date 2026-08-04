document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const isLocal = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
    const API_BASE_URL = isLocal ? "http://127.0.0.1:8000" : "";

    async function fetchLoans() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/loans`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const loans = await res.json();
                renderLoans(loans);
            }
        } catch (err) {
            console.error("Loan fetch error:", err);
        }
    }

    function renderLoans(loans) {
        let totalGiven = 0;
        let totalTaken = 0;

        loans.forEach(l => {
            if (l.status === 'pending') {
                if (l.loan_type === 'given') totalGiven += l.amount;
                if (l.loan_type === 'taken') totalTaken += l.amount;
            }
        });

        document.getElementById('totalGivenRs').innerText = `Rs. ${totalGiven.toFixed(2)}`;
        document.getElementById('totalTakenRs').innerText = `Rs. ${totalTaken.toFixed(2)}`;

        const tbody = document.getElementById('loansTableBody');
        if (loans.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No loan records found.</td></tr>';
            return;
        }

        tbody.innerHTML = loans.map(l => `
            <tr>
                <td><strong>${l.person_name}</strong></td>
                <td style="color: ${l.loan_type === 'given' ? '#28a745' : '#dc3545'}; font-weight:bold;">
                    ${l.loan_type === 'given' ? 'Loan Given (Diya)' : 'Loan Taken (Liya)'}
                </td>
                <td>Rs. ${l.amount.toFixed(2)}</td>
                <td class="${l.status === 'pending' ? 'badge-pending' : 'badge-settled'}">
                    ${l.status.toUpperCase()}
                </td>
                <td>
                    ${l.status === 'pending' 
                        ? `<button class="btn-settle" onclick="settleLoan(${l.id})">Mark Settled / Paid</button>` 
                        : '✅ Settled'}
                </td>
            </tr>
        `).join('');
    }

    window.saveLoan = async function(e) {
        if (e) e.preventDefault();

        const personName = document.getElementById('personName').value.trim();
        const amount = parseFloat(document.getElementById('loanAmount').value);
        const loanType = document.getElementById('loanType').value;

        if (!personName || isNaN(amount)) {
            alert("Please enter person name and valid amount!");
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/loans`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ person_name: personName, amount: amount, loan_type: loanType })
            });

            if (res.ok) {
                alert("Loan Entry Saved!");
                document.getElementById('personName').value = '';
                document.getElementById('loanAmount').value = '';
                fetchLoans();
            }
        } catch (e) {
            console.error("Save Loan Error:", e);
        }
    };

    window.settleLoan = async function(loanId) {
        if (!confirm("Are you sure you want to mark this loan as cleared/settled?")) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/loans/${loanId}/settle`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                fetchLoans();
            }
        } catch (e) {
            console.error("Settle loan error:", e);
        }
    };

    fetchLoans();
});