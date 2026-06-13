const STORAGE_KEY = 'expense_visualizer_transactions';
const THEME_KEY   = 'expense_visualizer_theme';

const state = {
  transactions: [],
  sortDirection: 'none',
  theme: 'light',
  summaryVisible: false
};

/** Maps each spending category to its chart colour. */
const CATEGORY_COLORS = {
  Food:      '#22c55e',
  Transport: '#3b82f6',
  Fun:       '#f97316'
};

/** Holds the active Chart.js instance; null when no chart is rendered. */
let chartInstance = null;

// ─── Formatting helpers ───────────────────────────────────────────────────────

/**
 * Formats a number as Indonesian Rupiah, e.g. 15000 -> "Rp15.000"
 * @param {number} amount
 * @returns {string}
 */
function formatIDR(amount) {
  return 'Rp' + Math.round(amount).toLocaleString('id-ID');
}

// ─── Banner helpers ───────────────────────────────────────────────────────────

function showBanner(message, type = 'info') {
  const banner = document.getElementById('app-banner');
  if (!banner) return;
  banner.textContent = message;
  banner.className = `banner-${type}`;
  banner.hidden = false;
}

function hideBanner() {
  const banner = document.getElementById('app-banner');
  if (!banner) return;
  banner.hidden = true;
}

// ─── LocalStorage Adapter ─────────────────────────────────────────────────────

function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load transactions from localStorage:', e);
    showBanner('Could not load saved data. Starting with an empty list.', 'info');
    return [];
  }
}

function saveTransactions(transactions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    return true;
  } catch (e) {
    console.error('Failed to save transactions to localStorage:', e);
    showBanner('Changes could not be saved. Storage may be full or unavailable.', 'warning');
    return false;
  }
}

function loadTheme() {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (!raw) return 'light';
    const parsed = JSON.parse(raw);
    return parsed === 'dark' ? 'dark' : 'light';
  } catch (e) {
    console.error('Failed to load theme from localStorage:', e);
    return 'light';
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, JSON.stringify(theme));
  } catch (e) {
    console.error('Failed to save theme to localStorage:', e);
  }
}

// ─── Render helpers ───────────────────────────────────────────────────────────

function sortTransactions(transactions, direction) {
  const copy = [...transactions];
  if (direction === 'asc') {
    copy.sort((a, b) => a.amount - b.amount);
  } else if (direction === 'desc') {
    copy.sort((a, b) => b.amount - a.amount);
  }
  return copy;
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(state.theme);
  saveTheme(state.theme);
}

// ─── Render functions ─────────────────────────────────────────────────────────

function renderTransactionList(transactions) {
  const list = document.getElementById('transaction-list');
  if (!list) return;

  list.innerHTML = '';

  transactions.forEach(transaction => {
    const li = document.createElement('li');
    li.dataset.id = transaction.id;
    li.dataset.category = transaction.category;
    li.className = 'transaction-item';

    const info = document.createElement('div');
    info.className = 'tx-info';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'tx-name';
    nameSpan.textContent = transaction.name;

    const categorySpan = document.createElement('span');
    categorySpan.className = 'tx-category';
    categorySpan.textContent = transaction.category;

    info.appendChild(nameSpan);
    info.appendChild(categorySpan);

    const amountSpan = document.createElement('span');
    amountSpan.className = 'tx-amount';
    amountSpan.textContent = formatIDR(transaction.amount);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.setAttribute('aria-label', 'Delete transaction');
    deleteBtn.textContent = '×';

    li.appendChild(info);
    li.appendChild(amountSpan);
    li.appendChild(deleteBtn);

    list.appendChild(li);
  });
}

function calculateTotal(transactions) {
  return transactions.reduce((sum, tx) => sum + tx.amount, 0);
}

function renderBalance(transactions) {
  const total = calculateTotal(transactions);
  document.getElementById('balance-amount').textContent = formatIDR(total);
}

function aggregateByCategory(transactions) {
  const totals = { Food: 0, Transport: 0, Fun: 0 };
  transactions.forEach(tx => {
    if (totals.hasOwnProperty(tx.category)) {
      totals[tx.category] += tx.amount;
    }
  });
  return totals;
}

function buildMonthlySummary(transactions) {
  const summary = {};
  transactions.forEach(tx => {
    const month = tx.date.slice(0, 7); // 'YYYY-MM'
    if (!summary[month]) {
      summary[month] = { Food: 0, Transport: 0, Fun: 0, total: 0 };
    }
    if (summary[month].hasOwnProperty(tx.category)) {
      summary[month][tx.category] += tx.amount;
    }
    summary[month].total += tx.amount;
  });
  return summary;
}

function renderChart(transactions) {
  if (typeof Chart === 'undefined') {
    document.getElementById('chart-container').textContent =
      'Chart unavailable. Please check your internet connection.';
    return;
  }

  const totals  = aggregateByCategory(transactions);
  const hasData = Object.values(totals).some(v => v > 0);

  document.getElementById('chart-empty-msg').hidden = hasData;

  const labels = Object.keys(totals).filter(k => totals[k] > 0);
  const data   = labels.map(k => totals[k]);
  const colors = labels.map(k => CATEGORY_COLORS[k]);

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  if (!hasData) return;

  chartInstance = new Chart(
    document.getElementById('spending-chart'),
    {
      type: 'pie',
      data: {
        labels,
        datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#ffffff' }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: ${formatIDR(ctx.parsed)}`
            }
          }
        }
      }
    }
  );
}

/**
 * Renders the monthly summary section: one block per month with
 * category totals and the overall total.
 * @param {Transaction[]} transactions
 */
function renderMonthlySummary(transactions) {
  const container = document.getElementById('monthly-summary');
  if (!container) return;

  const summary = buildMonthlySummary(transactions);
  const months = Object.keys(summary).sort().reverse();

  container.innerHTML = '';

  if (months.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'No transactions yet.';
    container.appendChild(empty);
    return;
  }

  months.forEach(month => {
    const data = summary[month];

    const block = document.createElement('div');
    block.className = 'summary-month';

    const title = document.createElement('h3');
    title.textContent = month;
    block.appendChild(title);

    ['Food', 'Transport', 'Fun'].forEach(cat => {
      const row = document.createElement('div');
      row.className = 'summary-row';

      const label = document.createElement('span');
      label.textContent = cat;

      const value = document.createElement('span');
      value.textContent = formatIDR(data[cat]);

      row.appendChild(label);
      row.appendChild(value);
      block.appendChild(row);
    });

    const totalRow = document.createElement('div');
    totalRow.className = 'summary-row total';

    const totalLabel = document.createElement('span');
    totalLabel.textContent = 'Total';

    const totalValue = document.createElement('span');
    totalValue.textContent = formatIDR(data.total);

    totalRow.appendChild(totalLabel);
    totalRow.appendChild(totalValue);
    block.appendChild(totalRow);

    container.appendChild(block);
  });
}

// ─── Form helpers ─────────────────────────────────────────────────────────────

function getFormValues() {
  const name      = document.getElementById('item-name').value.trim();
  const amountRaw = document.getElementById('item-amount').value;
  const category  = document.getElementById('item-category').value;

  if (!name) {
    showFormError('Please enter an item name.');
    return null;
  }
  const amount = parseFloat(amountRaw);
  if (!amountRaw || isNaN(amount) || amount <= 0) {
    showFormError('Please enter a valid positive amount.');
    return null;
  }
  if (!['Food', 'Transport', 'Fun'].includes(category)) {
    showFormError('Please select a category.');
    return null;
  }
  clearFormError();
  return { name, amount, category };
}

function resetForm() {
  document.getElementById('item-name').value     = '';
  document.getElementById('item-amount').value   = '';
  document.getElementById('item-category').value = '';
  clearFormError();
}

function showFormError(message) {
  const el = document.getElementById('form-error');
  el.textContent = message;
  el.removeAttribute('hidden');
}

function clearFormError() {
  const el = document.getElementById('form-error');
  el.textContent = '';
  el.setAttribute('hidden', '');
}

// ─── renderAll — single re-render entry point ─────────────────────────────────

function renderAll() {
  const displayed = sortTransactions(state.transactions, state.sortDirection);
  renderTransactionList(displayed);
  renderBalance(state.transactions);
  renderChart(state.transactions);
  if (state.summaryVisible) renderMonthlySummary(state.transactions);
}

// ─── App initialization ───────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  state.transactions = loadTransactions();
  state.theme        = loadTheme();
  applyTheme(state.theme);
  renderAll();

  // Form submit handler
  document.getElementById('transaction-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const values = getFormValues();
    if (!values) return;

    const transaction = {
      id: crypto.randomUUID(),
      name: values.name,
      amount: values.amount,
      category: values.category,
      date: new Date().toISOString().split('T')[0]
    };

    state.transactions.push(transaction);
    saveTransactions(state.transactions);
    resetForm();
    renderAll();
  });

  // Clear error on input in any form field
  ['item-name', 'item-amount', 'item-category'].forEach(id => {
    document.getElementById(id).addEventListener('input', clearFormError);
  });

  // Theme toggle handler
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  // Delete handler — event delegation on #transaction-list
  document.getElementById('transaction-list').addEventListener('click', (e) => {
    if (!e.target.classList.contains('delete-btn')) return;
    const li = e.target.closest('li[data-id]');
    if (!li) return;
    const id = li.dataset.id;
    state.transactions = state.transactions.filter(tx => tx.id !== id);
    saveTransactions(state.transactions);
    renderAll();
  });

  // Sort control handler
  document.getElementById('sort-control').addEventListener('change', (e) => {
    state.sortDirection = e.target.value;
    renderAll();
  });

  // Monthly summary toggle handler
  const toggleBtn = document.getElementById('toggle-summary-btn');
  const summarySection = document.getElementById('summary-section');
  if (toggleBtn && summarySection) {
    toggleBtn.addEventListener('click', () => {
      state.summaryVisible = !state.summaryVisible;
      toggleBtn.textContent = state.summaryVisible ? 'Hide Monthly Summary' : 'Show Monthly Summary';
      summarySection.hidden = !state.summaryVisible;
      if (state.summaryVisible) {
        renderMonthlySummary(state.transactions);
      }
    });
  }
});
