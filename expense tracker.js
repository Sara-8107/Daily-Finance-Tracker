// -------------------- NAVIGATION & SPA --------------------
const links = document.querySelectorAll('.nav-link');
const contentArea = document.getElementById('content-area');

links.forEach(link => {
  link.addEventListener('click', async (e) => {
    e.preventDefault();

    links.forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    const page = link.dataset.page;

    if (page === "home") {
      showDashboard();
    } else {
      await loadPage(page);
    }
  });
});

// Show Dashboard in SPA
function showDashboard() {
  contentArea.innerHTML = `
    <div id="dashboard">
      <div class="finance-summary">
        <div class="card total-money">
          <span class="label">Total Money</span>
          <h2 class="amount" id="totalMoney">0.0</h2>
        </div>
        <div class="card used-money">
          <span class="label">Money Used</span>
          <h2 class="amount" id="usedMoney">0.0</h2>
        </div>
        <div class="card remaining-money">
          <span class="label">Remaining</span>
          <h2 class="amount" id="remainingMoney">0.0</h2>
        </div>
      </div>

      <div class="dashboard-grid">
        <a href="add-transaction.html" class="dash-btn">
          <div class="btn-icon">➕</div>
          <div class="btn-text">Add Transaction</div>
        </a>
        <a href="view_report.html" class="dash-btn">
          <div class="btn-icon">📄</div>
          <div class="btn-text">View Report</div>
        </a>
        <a href="charts.html" class="dash-btn">
          <div class="btn-icon">📈</div>
          <div class="btn-text">Graphical Viewing</div>
        </a>
      </div>
      </div>
  `;
  updateDashboard(); // We keep this to update the 3 cards at the top
  // DELETED: loadTransactions(); 
}

// Load About / Contact / Other Pages
async function loadPage(page) {
  contentArea.innerHTML = "<p>Loading...</p>";
  try {
    const res = await fetch(`${page}.html`);
    const html = await res.text();
    contentArea.innerHTML = html;

    // If the page has a feedback form, bind it
    const feedbackForm = document.querySelector('.contact-form');
    if (feedbackForm) {
      feedbackForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const feedbackData = {
          name: this.name.value,
          email: this.email.value,
          message: this.message.value
        };
        sendFeedback(feedbackData);
        this.reset();
      });
    }
  } catch {
    contentArea.innerHTML = "<p>Error loading page</p>";
  }
}

// -------------------- DASHBOARD / SUMMARY --------------------
async function updateDashboard() {
  try {
    const res = await fetch('http://127.0.0.1:5000/api/dashboard');
    const totals = await res.json();

    document.getElementById("totalMoney").textContent = `$${totals.total_income.toFixed(2)}`;
    document.getElementById("usedMoney").textContent = `$${totals.total_expense.toFixed(2)}`;

    const remainingEl = document.getElementById("remainingMoney");
    remainingEl.textContent = `$${totals.remaining.toFixed(2)}`;
    remainingEl.style.color = totals.remaining < 0 ? 'red' : 'green';
  } catch (error) {
    console.error('Error fetching dashboard:', error);
  }
}

// -------------------- TRANSACTIONS --------------------
async function addTransaction(transaction) {
  try {
    const response = await fetch('http://127.0.0.1:5000/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction)
    });
    const data = await response.json();
    alert(data.message);
    showDashboard(); // refresh dashboard after add
  } catch (error) {
    console.error('Error adding transaction:', error);
  }
}

// Fetch & render all transactions
async function loadTransactions() {
  try {
    const res = await fetch('http://127.0.0.1:5000/api/transactions');
    const transactions = await res.json();

    const container = document.getElementById('transaction-list');
    if (!container) return;

    container.innerHTML = '';
    transactions.forEach(t => {
      container.innerHTML += `
        <div class="transaction-card">
          <p>${t.transaction_date} - ${t.category_name} - ${t.type} - $${t.amount}</p>
          <button onclick="editTransaction(${t.transaction_id})">Edit</button>
          <button onclick="deleteTransaction(${t.transaction_id})">Delete</button>
        </div>
      `;
    });
  } catch (error) {
    console.error('Error loading transactions:', error);
  }
}

// Edit Transaction
async function editTransaction(transaction_id) {
  const newAmount = prompt("Enter new amount:");
  const newType = prompt("Enter new type (Income/Expense):");
  const newCategory = prompt("Enter new category ID:");
  const newDesc = prompt("Enter new description:");
  const newDate = prompt("Enter new date (YYYY-MM-DD):");

  const updatedData = {
    amount: Number(newAmount),
    type: newType,
    category_id: Number(newCategory),
    description: newDesc,
    transaction_date: newDate
  };

  try {
    const res = await fetch(`http://127.0.0.1:5000/api/transactions${transaction_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });
    const data = await res.json();
    alert(data.message);
    showDashboard();
  } catch (error) {
    console.error('Error updating transaction:', error);
  }
}

// Delete Transaction
async function deleteTransaction(transaction_id) {
  if (!confirm("Are you sure you want to delete this transaction?")) return;

  try {
    const res = await fetch(`http://127.0.0.1:5000/api/transactions${transaction_id}`, { method: 'DELETE' });
    const data = await res.json();
    alert(data.message);
    showDashboard();
  } catch (error) {
    console.error('Error deleting transaction:', error);
  }
}

// -------------------- CATEGORY --------------------
async function addCategory(category) {
  try {
    const res = await fetch('/api/add-category', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    });
    const data = await res.json();
    alert(data.message);
    loadCategories(); // optional
  } catch (error) {
    console.error('Error adding category:', error);
  }
}

// -------------------- FEEDBACK --------------------
async function sendFeedback(feedback) {
  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback)
    });
    const data = await res.json();
    alert(data.message);
  } catch (error) {
    console.error('Error sending feedback:', error);
  }
}

// -------------------- FORM BINDINGS --------------------

// Transaction form
const transactionForm = document.getElementById('transaction-form');
if (transactionForm) {
  transactionForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const transaction = {
      amount: Number(this.amount.value),
      type: this.type.value,
      category_id: Number(this.category.value),
      description: this.description.value,
      transaction_date: this.date.value
    };

    addTransaction(transaction);
    this.reset();
  });
}

// Call dashboard on page load
window.onload = showDashboard;
