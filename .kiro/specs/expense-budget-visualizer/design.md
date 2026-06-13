# Design Document: Expense & Budget Visualizer

## Overview

The Expense & Budget Visualizer is a single-page, client-side web application built with vanilla HTML, CSS, and JavaScript. There is no backend, no build step, and no framework. All data is stored in the browser's `localStorage`. Chart.js is loaded from a CDN to render the spending pie chart.

The application allows users to:
- Add and delete transactions with a name, amount, and category
- View a scrollable history of all transactions
- See a live-updating balance total
- Visualize spending distribution by category in a pie chart
- Optionally: view a monthly summary, sort by amount, and toggle dark/light mode

The UI is designed mobile-first (minimum 320px viewport), scaling up naturally for tablet and desktop screens.

### Key Design Decisions

- **No framework**: Keeps the project dependency-free and maximally portable. DOM manipulation is straightforward for this scope.
- **Single JS file (`js/app.js`)**: All state management, event handling, rendering, and storage logic live in one file, organized by module-like function groupings.
- **Chart.js via CDN**: Avoids a build step while providing a robust, well-tested charting library.
- **LocalStorage as the sole persistence layer**: Suitable for a client-side personal tool with small data volumes.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                    index.html                           │  │
│  │  ┌──────────────┐  ┌────────────────────────────────┐  │  │
│  │  │  css/style.css│  │         js/app.js              │  │  │
│  │  │  (layout &   │  │  ┌──────────────────────────┐  │  │  │
│  │  │   theming)   │  │  │   State (in-memory array) │  │  │  │
│  │  └──────────────┘  │  └──────────┬───────────────┘  │  │  │
│  │                    │             │ read/write         │  │  │
│  │                    │  ┌──────────▼───────────────┐  │  │  │
│  │                    │  │   LocalStorage Adapter    │  │  │  │
│  │                    │  └──────────────────────────┘  │  │  │
│  │                    │                                  │  │  │
│  │                    │  ┌──────────────────────────┐  │  │  │
│  │                    │  │   Render Functions        │  │  │  │
│  │                    │  │  - renderTransactionList  │  │  │  │
│  │                    │  │  - renderBalance          │  │  │  │
│  │                    │  │  - renderChart            │  │  │  │
│  │                    │  │  - renderMonthlySummary   │  │  │  │
│  │                    │  └──────────────────────────┘  │  │  │
│  │                    └────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─────────────────┐   ┌────────────────────────────────┐   │
│  │  localStorage   │   │  Chart.js (CDN)                │   │
│  │  (persistence)  │   │  (pie chart rendering)         │   │
│  └─────────────────┘   └────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **On load**: `app.js` reads transactions from `localStorage` → populates in-memory `state.transactions` array → triggers all render functions.
2. **On add**: Form validation → create transaction object → push to `state.transactions` → write to `localStorage` → re-render list, balance, chart.
3. **On delete**: Remove from `state.transactions` by id → write to `localStorage` → re-render list, balance, chart.
4. **On sort / monthly summary / theme toggle**: Derived from `state.transactions` without mutating the stored data.

---

## Components and Interfaces

### 1. Input Form (`#transaction-form`)

**Responsibilities**: Collect user input, validate it, dispatch an "add transaction" action.

**DOM elements**:
- `#item-name` — `<input type="text">` for transaction name
- `#item-amount` — `<input type="number" min="0.01" step="0.01">` for amount
- `#item-category` — `<select>` with options: Food, Transport, Fun
- `#form-error` — `<p>` for inline validation messages (hidden by default)
- `#submit-btn` — `<button type="submit">`

**Validation rules** (all checked before adding):
- Name: non-empty after trim
- Amount: present, parseable as float, and `> 0`
- Category: must be one of the allowed values

**Interface (functions)**:
```js
// Reads form fields, validates, returns transaction object or null
function getFormValues(): { name, amount, category } | null

// Resets form to default empty state
function resetForm(): void

// Displays a validation error message in #form-error
function showFormError(message: string): void

// Clears any displayed error
function clearFormError(): void
```

---

### 2. Transaction List (`#transaction-list`)

**Responsibilities**: Display all transactions; handle delete actions.

**DOM element**: `<ul id="transaction-list">`

Each transaction renders as:
```html
<li data-id="{transaction.id}" class="transaction-item">
  <span class="tx-name">{name}</span>
  <span class="tx-category">{category}</span>
  <span class="tx-amount">${amount}</span>
  <button class="delete-btn" aria-label="Delete transaction">×</button>
</li>
```

**Interface**:
```js
// Re-renders the full list from state.transactions (or sorted/filtered view)
function renderTransactionList(transactions: Transaction[]): void
```

The list is scrollable via CSS (`overflow-y: auto; max-height: ...`) when transactions exceed the visible area.

---

### 3. Balance Display (`#balance-display`)

**Responsibilities**: Show the sum of all transaction amounts.

**DOM element**: `<span id="balance-amount">`

**Interface**:
```js
// Computes sum from transactions array and updates the DOM
function renderBalance(transactions: Transaction[]): void

// Pure helper: sums amounts
function calculateTotal(transactions: Transaction[]): number
```

---

### 4. Pie Chart (`#spending-chart`)

**Responsibilities**: Visualize category totals using Chart.js.

**DOM element**: `<canvas id="spending-chart">`

Chart.js instance is stored in a module-level variable (`let chartInstance = null`) and destroyed/recreated on each update to avoid "canvas already in use" errors.

**Interface**:
```js
// Aggregates amounts by category and updates (or creates) the Chart.js pie chart
function renderChart(transactions: Transaction[]): void

// Pure helper: returns { Food: 0, Transport: 0, Fun: 0 } totals
function aggregateByCategory(transactions: Transaction[]): CategoryTotals
```

**Empty state**: When `transactions` is empty, the chart displays a placeholder message ("No transactions yet") rendered via the Chart.js `plugins.emptyDoughnut` approach or a simple overlay `<div>`.

---

### 5. LocalStorage Adapter

**Responsibilities**: Abstract all `localStorage` reads and writes; handle errors gracefully.

```js
const STORAGE_KEY = 'expense_visualizer_transactions';
const THEME_KEY   = 'expense_visualizer_theme';

// Returns parsed array, or [] on any failure
function loadTransactions(): Transaction[]

// Serializes and saves; returns true on success, false on failure
function saveTransactions(transactions: Transaction[]): boolean

// Returns saved theme string or 'light'
function loadTheme(): 'dark' | 'light'

// Saves theme preference
function saveTheme(theme: 'dark' | 'light'): void
```

---

### 6. Optional Components

#### Monthly Summary (`#monthly-summary`)

A separate section (hidden by default, toggled by a button) that groups transactions by `YYYY-MM` key derived from `transaction.date`.

```js
// Returns { 'YYYY-MM': { Food: n, Transport: n, Fun: n, total: n } }
function buildMonthlySummary(transactions: Transaction[]): MonthlySummary

// Renders the summary table into #monthly-summary
function renderMonthlySummary(transactions: Transaction[]): void
```

#### Sort Control (`#sort-control`)

A `<select>` with options: Default, Amount ↑, Amount ↓. Sorting is applied to a copy of the array before rendering — the canonical `state.transactions` order is never mutated by sorting.

```js
// Returns a sorted copy, does not mutate the original
function sortTransactions(transactions: Transaction[], direction: 'asc' | 'desc' | 'none'): Transaction[]
```

#### Theme Toggle (`#theme-toggle`)

A `<button>` that toggles a `data-theme` attribute on `<html>`. CSS variables in `style.css` drive all color changes.

```js
function applyTheme(theme: 'dark' | 'light'): void
function toggleTheme(): void
```

---

## Data Models

### Transaction Object

```js
/**
 * @typedef {Object} Transaction
 * @property {string}  id        - UUID v4 generated with crypto.randomUUID()
 * @property {string}  name      - User-entered item name (trimmed, non-empty)
 * @property {number}  amount    - Positive float, stored as number
 * @property {string}  category  - One of: 'Food' | 'Transport' | 'Fun'
 * @property {string}  date      - ISO 8601 date string (YYYY-MM-DD), set at creation time
 */
```

**Example**:
```json
{
  "id": "b3e2c1d4-5f6a-7b8c-9d0e-1f2a3b4c5d6e",
  "name": "Coffee",
  "amount": 4.5,
  "category": "Food",
  "date": "2025-06-08"
}
```

### CategoryTotals

```js
/**
 * @typedef {Object} CategoryTotals
 * @property {number} Food
 * @property {number} Transport
 * @property {number} Fun
 */
```

### MonthlySummary (optional feature)

```js
/**
 * @typedef {Object} MonthData
 * @property {number} Food
 * @property {number} Transport
 * @property {number} Fun
 * @property {number} total
 *
 * @typedef {Object.<string, MonthData>} MonthlySummary
 * Key is 'YYYY-MM' string derived from transaction.date
 */
```

### LocalStorage Schema

All transactions are stored as a single JSON-serialized array under one key:

| Key | Value type | Example value |
|-----|-----------|---------------|
| `expense_visualizer_transactions` | JSON string (array of Transaction) | `[{"id":"...","name":"Coffee","amount":4.5,"category":"Food","date":"2025-06-08"}]` |
| `expense_visualizer_theme` | JSON string (`'dark'` or `'light'`) | `"light"` |

**Read strategy**: On initialization, call `localStorage.getItem(STORAGE_KEY)`, parse with `JSON.parse()` inside a `try/catch`. If any error occurs (quota exceeded, corrupted data, `SecurityError`), log the error, fall back to `[]`, and show an informational banner to the user.

**Write strategy**: After every add or delete, call `JSON.stringify(state.transactions)` and `localStorage.setItem(STORAGE_KEY, ...)` inside a `try/catch`. On failure, display a non-blocking warning banner ("Changes could not be saved.") without interrupting the in-memory state or UI.

---

## Project File Structure

```
project-root/
├── index.html          # Single HTML page; all markup and CDN script tags
├── css/
│   └── style.css       # All styles: layout, components, theming, responsive
└── js/
    └── app.js          # All application logic: state, events, render, storage
```

### `index.html` structure

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Expense & Budget Visualizer</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <!-- Header: Balance Display + Theme Toggle -->
  <header id="app-header">
    <div id="balance-display">
      Total: <span id="balance-amount">$0.00</span>
    </div>
    <button id="theme-toggle" aria-label="Toggle theme">🌙</button>
  </header>

  <!-- Info/error banner (hidden by default) -->
  <div id="app-banner" role="alert" hidden></div>

  <!-- Main content -->
  <main id="app-main">
    <!-- Input Form -->
    <section id="form-section">
      <h2>Add Transaction</h2>
      <form id="transaction-form" novalidate>
        <input id="item-name" type="text" placeholder="Item name" autocomplete="off">
        <input id="item-amount" type="number" min="0.01" step="0.01" placeholder="Amount">
        <select id="item-category">
          <option value="">Select category</option>
          <option value="Food">Food</option>
          <option value="Transport">Transport</option>
          <option value="Fun">Fun</option>
        </select>
        <p id="form-error" role="alert" hidden></p>
        <button type="submit" id="submit-btn">Add</button>
      </form>
    </section>

    <!-- Transaction List + Sort Control -->
    <section id="list-section">
      <div id="list-header">
        <h2>Transactions</h2>
        <select id="sort-control" aria-label="Sort transactions">
          <option value="none">Sort: Default</option>
          <option value="asc">Amount ↑</option>
          <option value="desc">Amount ↓</option>
        </select>
      </div>
      <ul id="transaction-list" aria-live="polite"></ul>
    </section>

    <!-- Pie Chart -->
    <section id="chart-section">
      <h2>Spending by Category</h2>
      <div id="chart-container">
        <canvas id="spending-chart"></canvas>
        <p id="chart-empty-msg" hidden>No transactions yet.</p>
      </div>
    </section>

    <!-- Monthly Summary (optional, hidden by default) -->
    <section id="summary-section" hidden>
      <h2>Monthly Summary</h2>
      <div id="monthly-summary"></div>
    </section>
    <button id="toggle-summary-btn">Show Monthly Summary</button>
  </main>

  <!-- Chart.js CDN -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
  <!-- App logic -->
  <script src="js/app.js"></script>
</body>
</html>
```

---

## UI Layout Design

### Mobile-First Layout (320px–599px)

All sections stack vertically in a single column:

```
┌────────────────────────┐
│  Header (balance + 🌙) │
├────────────────────────┤
│  [Error/info banner]   │
├────────────────────────┤
│  Add Transaction form  │
├────────────────────────┤
│  Transaction list      │
│  (scrollable, 40vh max)│
├────────────────────────┤
│  Pie chart (100% wide) │
├────────────────────────┤
│  [Monthly Summary]     │
└────────────────────────┘
```

### Tablet/Desktop Layout (≥600px)

Two-column grid: left column holds the form and list; right column holds the chart and summary.

```
┌──────────────────────────────────────────────┐
│             Header (balance + 🌙)            │
├───────────────────────┬──────────────────────┤
│  Add Transaction form │   Pie chart          │
├───────────────────────┤                      │
│  Transaction list     ├──────────────────────┤
│  (sort control)       │   Monthly Summary    │
└───────────────────────┴──────────────────────┘
```

### CSS Variables for Theming

```css
:root {
  --bg-primary:   #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #1a1a1a;
  --text-muted:   #666666;
  --accent:       #4caf50;
  --danger:       #e53935;
  --border:       #dddddd;
}

[data-theme="dark"] {
  --bg-primary:   #1e1e1e;
  --bg-secondary: #2a2a2a;
  --text-primary: #f0f0f0;
  --text-muted:   #aaaaaa;
  --accent:       #66bb6a;
  --danger:       #ef5350;
  --border:       #444444;
}
```

### Chart.js Category Colors

| Category  | Color        |
|-----------|-------------|
| Food      | `#4caf50`   |
| Transport | `#2196f3`   |
| Fun       | `#ff9800`   |

Colors are constants in `app.js` and consistent across light and dark modes.

---

## State Management

The application maintains a single source of truth: an in-memory `state` object in `app.js`.

```js
const state = {
  transactions: [],        // Array<Transaction> — canonical dataset
  sortDirection: 'none',   // 'none' | 'asc' | 'desc'
  theme: 'light',          // 'light' | 'dark'
  summaryVisible: false    // boolean
};
```

### Lifecycle

```
App Load:
  state.transactions = loadTransactions()  // from localStorage
  state.theme        = loadTheme()
  applyTheme(state.theme)
  renderAll()

Add Transaction:
  validate() → transaction object
  state.transactions.push(transaction)
  saveTransactions(state.transactions)
  resetForm()
  renderAll()

Delete Transaction:
  state.transactions = state.transactions.filter(tx => tx.id !== id)
  saveTransactions(state.transactions)
  renderAll()

renderAll():
  const displayed = sortTransactions(state.transactions, state.sortDirection)
  renderTransactionList(displayed)
  renderBalance(state.transactions)   // always uses canonical totals
  renderChart(state.transactions)     // always uses canonical totals
  if (state.summaryVisible) renderMonthlySummary(state.transactions)
```

`renderAll()` is the single re-render entry point — simple and predictable. Because the data volume is small (personal expense tracking), full re-renders are inexpensive and avoid stale-state bugs.

---

## Chart.js Integration

Chart.js 4 is loaded from the jsDelivr CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
```

The UMD build exposes `Chart` as a global, compatible with all target browsers without a module bundler.

### Chart Initialization and Update Pattern

```js
let chartInstance = null;

function renderChart(transactions) {
  const totals = aggregateByCategory(transactions);
  const hasData = Object.values(totals).some(v => v > 0);

  // Toggle empty-state message
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
        datasets: [{ data, backgroundColor: colors, borderWidth: 1 }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    }
  );
}
```

Destroying and recreating the chart on each update is simpler and more reliable than attempting data mutations on a live instance, at negligible cost given the small dataset size.

---

## Error Handling

### LocalStorage Read Failure

```js
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
```

### LocalStorage Write Failure

```js
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
```

### Form Validation Errors

Validation errors are displayed inline in `#form-error` — never via `alert()`. The element uses `role="alert"` so screen readers announce the message. Errors are cleared on the next successful submission or when the user begins typing in a field.

### Chart.js Unavailable

If the CDN script fails to load, `Chart` will be undefined. The `renderChart` function checks for this:

```js
function renderChart(transactions) {
  if (typeof Chart === 'undefined') {
    document.getElementById('chart-container').textContent =
      'Chart unavailable. Please check your internet connection.';
    return;
  }
  // ... rest of render logic
}
```

### Banner Helper

```js
// type: 'info' | 'warning' | 'error'
function showBanner(message, type = 'info') {
  const banner = document.getElementById('app-banner');
  banner.textContent = message;
  banner.className = `banner-${type}`;
  banner.hidden = false;
}

function hideBanner() {
  document.getElementById('app-banner').hidden = true;
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Adding a transaction increases the list count by exactly one

*For any* existing list of transactions and any valid transaction object (non-empty name, positive amount, valid category), adding that transaction to the list SHALL result in the list length increasing by exactly one.

**Validates: Requirements 1.2, 2.3**

---

### Property 2: Whitespace-only or empty names are rejected

*For any* input where the item name is composed entirely of whitespace characters (including the empty string), the application SHALL reject the submission and leave the transaction list unchanged.

**Validates: Requirements 1.3**

---

### Property 3: Non-positive amounts are rejected

*For any* input where the amount is zero, negative, or non-numeric, the application SHALL reject the submission and leave the transaction list unchanged.

**Validates: Requirements 1.4**

---

### Property 4: Balance equals sum of all transaction amounts

*For any* collection of transactions, the value displayed in Balance_Display SHALL equal the arithmetic sum of all transaction amounts in that collection.

**Validates: Requirements 3.1, 3.2, 3.3**

---

### Property 5: Category totals are consistent with the transaction dataset

*For any* collection of transactions, the sum of all per-category totals in aggregateByCategory SHALL equal the total balance, and each category total SHALL equal the sum of amounts of all transactions in that category.

**Validates: Requirements 4.1, 4.2**

---

### Property 6: Delete removes exactly the target transaction

*For any* list of transactions and any transaction id present in that list, deleting by that id SHALL result in a list that contains every original transaction except the one with the matching id, with all other transactions unchanged.

**Validates: Requirements 2.4, 5.2**

---

### Property 7: LocalStorage round-trip preserves the transaction dataset

*For any* array of valid transaction objects, serializing to LocalStorage and deserializing SHALL produce an array deeply equal to the original (same ids, names, amounts, categories, and dates in the same order).

**Validates: Requirements 5.1, 5.2, 5.3**

---

### Property 8: Sorting does not mutate the canonical transaction dataset

*For any* list of transactions and any sort direction, applying sortTransactions SHALL return a new array containing exactly the same transactions in a (possibly different) order, with the original array unchanged.

**Validates: Requirements 10.3**

---

### Property 9: Monthly summary totals are consistent with transaction data

*For any* collection of transactions, the sum of all monthly totals in buildMonthlySummary SHALL equal the total balance, and each month's category breakdown SHALL match the transactions grouped by their date's year-month.

**Validates: Requirements 9.1, 9.2**

---

### Property 10: Theme round-trip restores saved preference

*For any* theme value ('light' or 'dark'), saving it to LocalStorage and loading it back SHALL return the same theme value.

**Validates: Requirements 11.3, 11.4**

---

## Testing Strategy

### Unit Tests

Unit tests cover specific behaviors and edge cases:

- Form validation: empty name, whitespace-only name, zero amount, negative amount, missing category, all fields valid
- `calculateTotal`: empty array returns 0; single transaction; multiple transactions
- `aggregateByCategory`: empty array; all same category; all different categories
- `buildMonthlySummary`: transactions spanning one month, multiple months, year boundaries
- `sortTransactions`: already-sorted array, reverse-sorted, ties in amount, empty array
- `loadTransactions`: returns empty array on empty storage, on `JSON.parse` error, on `SecurityError`
- Delete: removes correct item by id, does nothing for unknown id

### Property-Based Tests

Property-based tests use [fast-check](https://github.com/dubzzz/fast-check) (loaded via CDN for testing, or used in a Node test harness). Each test runs a minimum of **100 iterations**.

Each test is tagged with:
> **Feature: expense-budget-visualizer, Property {N}: {property text}**

| Property | Test description |
|----------|-----------------|
| P1 | Generate random valid transaction + any existing list → assert list grows by 1 |
| P2 | Generate strings composed of only whitespace → assert rejection and list unchanged |
| P3 | Generate zero, negative, NaN amounts → assert rejection and list unchanged |
| P4 | Generate arbitrary valid transaction lists → assert `calculateTotal` equals sum |
| P5 | Generate arbitrary valid transaction lists → assert `aggregateByCategory` sums are consistent |
| P6 | Generate transaction list with a random target → assert delete removes only that target |
| P7 | Generate arbitrary valid transaction lists → assert localStorage round-trip equality |
| P8 | Generate transaction list + sort direction → assert sorted array is permutation of original |
| P9 | Generate arbitrary valid transaction lists → assert monthly summary totals equal overall total |
| P10 | For 'light' and 'dark' → assert theme round-trip equality |

### Integration / Smoke Tests

- Page loads from `index.html` opened directly in each target browser (Chrome, Firefox, Edge, Safari)
- Transactions persist across page reload
- Chart renders when transactions are present; shows empty message when none
- All UI updates occur within 100ms (manual stopwatch check or browser DevTools performance trace)
