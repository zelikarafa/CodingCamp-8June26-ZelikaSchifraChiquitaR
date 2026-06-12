// ==========================================================
// Expense & Budget Visualizer - app.js
// Handles: transactions, total balance, chart, local storage,
// custom categories, sorting, spending limit, dark mode,
// monthly summary
// ==========================================================

const STORAGE_KEY = "ebv_transactions";
const CATEGORY_KEY = "ebv_categories";
const THEME_KEY = "ebv_theme";
const LIMIT_KEY = "ebv_limit";

const defaultCategories = ["Food", "Transport", "Fun"];
const categoryColors = {
  Food: "#22c55e",
  Transport: "#3b82f6",
  Fun: "#f97316",
};
const fallbackColors = ["#a855f7", "#ec4899", "#14b8a6", "#eab308", "#6366f1"];

// ----------------------------------------------------------
// State
// ----------------------------------------------------------
let transactions = loadTransactions();
let categories = loadCategories();
let spendingLimit = loadLimit();
let chart = null;

// ----------------------------------------------------------
// DOM References
// ----------------------------------------------------------
const form = document.getElementById("transactionForm");
const itemNameInput = document.getElementById("itemName");
const amountInput = document.getElementById("amount");
const categorySelect = document.getElementById("category");
const newCategoryInput = document.getElementById("newCategory");
const addCategoryBtn = document.getElementById("addCategoryBtn");
const formError = document.getElementById("formError");
const transactionListEl = document.getElementById("transactionList");
const totalBalanceEl = document.getElementById("totalBalance");
const sortSelect = document.getElementById("sortSelect");
const themeToggle = document.getElementById("themeToggle");
const spendingLimitInput = document.getElementById("spendingLimit");
const limitWarning = document.getElementById("limitWarning");
const monthlySummaryEl = document.getElementById("monthlySummary");
const ctx = document.getElementById("spendingChart");

// ----------------------------------------------------------
// Storage helpers
// ----------------------------------------------------------
function loadTransactions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function loadCategories() {
  try {
    const saved = JSON.parse(localStorage.getItem(CATEGORY_KEY));
    return saved && saved.length ? saved : [...defaultCategories];
  } catch (e) {
    return [...defaultCategories];
  }
}

function saveCategories() {
  localStorage.setItem(CATEGORY_KEY, JSON.stringify(categories));
}

function loadLimit() {
  const val = localStorage.getItem(LIMIT_KEY);
  return val ? parseFloat(val) : null;
}

function saveLimit() {
  if (spendingLimit !== null && !isNaN(spendingLimit)) {
    localStorage.setItem(LIMIT_KEY, spendingLimit);
  } else {
    localStorage.removeItem(LIMIT_KEY);
  }
}

function loadTheme() {
  return localStorage.getItem(THEME_KEY) || "light";
}

function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

// ----------------------------------------------------------
// Init
// ----------------------------------------------------------
function init() {
  // Theme
  const theme = loadTheme();
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    themeToggle.textContent = "☀️";
  }

  // Spending limit input
  if (spendingLimit !== null) {
    spendingLimitInput.value = spendingLimit;
  }

  populateCategoryOptions();
  renderAll();
}

// ----------------------------------------------------------
// Category options
// ----------------------------------------------------------
function populateCategoryOptions() {
  // Keep the placeholder option, rebuild the rest
  categorySelect.innerHTML = '<option value="">-- Select Category --</option>';
  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
}

addCategoryBtn.addEventListener("click", () => {
  const newCat = newCategoryInput.value.trim();
  if (!newCat) return;
  if (!categories.includes(newCat)) {
    categories.push(newCat);
    saveCategories();
    populateCategoryOptions();
  }
  categorySelect.value = newCat;
  newCategoryInput.value = "";
});

// ----------------------------------------------------------
// Form submission
// ----------------------------------------------------------
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = itemNameInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const category = categorySelect.value;

  if (!name || isNaN(amount) || amount <= 0 || !category) {
    formError.classList.remove("hidden");
    return;
  }
  formError.classList.add("hidden");

  const transaction = {
    id: Date.now().toString(),
    name,
    amount,
    category,
    date: new Date().toISOString(),
  };

  transactions.push(transaction);
  saveTransactions();

  form.reset();
  renderAll();
});

// ----------------------------------------------------------
// Spending limit
// ----------------------------------------------------------
spendingLimitInput.addEventListener("input", () => {
  const val = parseFloat(spendingLimitInput.value);
  spendingLimit = isNaN(val) ? null : val;
  saveLimit();
  renderAll();
});

// ----------------------------------------------------------
// Sort
// ----------------------------------------------------------
sortSelect.addEventListener("change", renderAll);

function getSortedTransactions() {
  const sorted = [...transactions];
  const mode = sortSelect.value;

  if (mode === "amountDesc") {
    sorted.sort((a, b) => b.amount - a.amount);
  } else if (mode === "amountAsc") {
    sorted.sort((a, b) => a.amount - b.amount);
  } else if (mode === "category") {
    sorted.sort((a, b) => a.category.localeCompare(b.category));
  }
  // default = insertion order
  return sorted;
}

// ----------------------------------------------------------
// Theme toggle
// ----------------------------------------------------------
themeToggle.addEventListener("click", () => {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  if (isDark) {
    document.documentElement.removeAttribute("data-theme");
    themeToggle.textContent = "🌙";
    saveTheme("light");
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
    themeToggle.textContent = "☀️";
    saveTheme("dark");
  }
});

// ----------------------------------------------------------
// Delete transaction
// ----------------------------------------------------------
function deleteTransaction(id) {
  transactions = transactions.filter((t) => t.id !== id);
  saveTransactions();
  renderAll();
}

// ----------------------------------------------------------
// Render: Transaction List
// ----------------------------------------------------------
function renderTransactionList() {
  transactionListEl.innerHTML = "";

  const sorted = getSortedTransactions();

  if (sorted.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "No transactions yet. Add one above!";
    transactionListEl.appendChild(empty);
    return;
  }

  sorted.forEach((t) => {
    const li = document.createElement("li");
    li.className = "transaction-item";

    if (spendingLimit !== null && !isNaN(spendingLimit) && t.amount > spendingLimit) {
      li.classList.add("over-limit");
    }

    const info = document.createElement("div");
    info.className = "transaction-info";

    const name = document.createElement("span");
    name.className = "transaction-name";
    name.textContent = t.name;

    const amount = document.createElement("span");
    amount.className = "transaction-amount";
    amount.textContent = `$${t.amount.toFixed(2)}`;

    const category = document.createElement("span");
    category.className = "transaction-category";
    category.textContent = t.category;

    info.appendChild(name);
    info.appendChild(amount);
    info.appendChild(category);

    const delBtn = document.createElement("button");
    delBtn.className = "delete-btn";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => deleteTransaction(t.id));

    li.appendChild(info);
    li.appendChild(delBtn);
    transactionListEl.appendChild(li);
  });
}

// ----------------------------------------------------------
// Render: Total Balance
// ----------------------------------------------------------
function renderTotalBalance() {
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  totalBalanceEl.textContent = `$${total.toFixed(2)}`;
}

// ----------------------------------------------------------
// Render: Spending Limit Warning
// ----------------------------------------------------------
function renderLimitWarning() {
  if (spendingLimit === null || isNaN(spendingLimit) || spendingLimit <= 0) {
    limitWarning.classList.add("hidden");
    return;
  }
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  if (total > spendingLimit) {
    limitWarning.classList.remove("hidden");
  } else {
    limitWarning.classList.add("hidden");
  }
}

// ----------------------------------------------------------
// Render: Chart
// ----------------------------------------------------------
function getColorForCategory(cat, index) {
  if (categoryColors[cat]) return categoryColors[cat];
  return fallbackColors[index % fallbackColors.length];
}

function renderChart() {
  const totalsByCategory = {};
  transactions.forEach((t) => {
    totalsByCategory[t.category] = (totalsByCategory[t.category] || 0) + t.amount;
  });

  const labels = Object.keys(totalsByCategory);
  const data = Object.values(totalsByCategory);
  const colors = labels.map((cat, i) => getColorForCategory(cat, i));

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.data.datasets[0].backgroundColor = colors;
    chart.update();
    return;
  }

  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: colors,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

// ----------------------------------------------------------
// Render: Monthly Summary
// ----------------------------------------------------------
function renderMonthlySummary() {
  monthlySummaryEl.innerHTML = "";

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const total = monthlyTx.reduce((sum, t) => sum + t.amount, 0);
  const count = monthlyTx.length;
  const avg = count > 0 ? total / count : 0;

  const totalsByCategory = {};
  monthlyTx.forEach((t) => {
    totalsByCategory[t.category] = (totalsByCategory[t.category] || 0) + t.amount;
  });

  let topCategory = "-";
  let topAmount = 0;
  Object.entries(totalsByCategory).forEach(([cat, amt]) => {
    if (amt > topAmount) {
      topAmount = amt;
      topCategory = cat;
    }
  });

  const items = [
    { label: "This Month Total", value: `$${total.toFixed(2)}` },
    { label: "Transactions", value: count.toString() },
    { label: "Average / Item", value: `$${avg.toFixed(2)}` },
    { label: "Top Category", value: topCategory },
  ];

  items.forEach((item) => {
    const div = document.createElement("div");
    div.className = "summary-item";

    const label = document.createElement("p");
    label.className = "summary-label";
    label.textContent = item.label;

    const value = document.createElement("p");
    value.className = "summary-value";
    value.textContent = item.value;

    div.appendChild(label);
    div.appendChild(value);
    monthlySummaryEl.appendChild(div);
  });
}

// ----------------------------------------------------------
// Render All
// ----------------------------------------------------------
function renderAll() {
  renderTransactionList();
  renderTotalBalance();
  renderLimitWarning();
  renderChart();
  renderMonthlySummary();
}

// ----------------------------------------------------------
// Start
// ----------------------------------------------------------
init();
