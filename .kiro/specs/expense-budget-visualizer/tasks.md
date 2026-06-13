# Implementation Plan: Expense & Budget Visualizer

## Overview

Build a single-page, client-side expense tracker using vanilla HTML, CSS, and JavaScript with no build tools or frameworks. All logic lives in `js/app.js`, all styles in `css/style.css`, and the entry point is `index.html`. Data is persisted in `localStorage`. Chart.js is loaded from a CDN.

The tasks below are ordered incrementally: each step integrates into the previous ones. No orphaned code is left unconnected after its parent task completes.

---

## Tasks

- [x] 1. Scaffold project files
  - Create `index.html` with the complete HTML structure defined in the design: `<header>`, `<main>`, all sections (`#form-section`, `#list-section`, `#chart-section`, `#summary-section`), the `#app-banner` element, and both `<script>` tags (Chart.js CDN and `js/app.js`)
  - Create `css/style.css` as an empty file with the CSS variable blocks for `light` and `dark` themes (`:root` and `[data-theme="dark"]`) defined in the design
  - Create `js/app.js` as an empty file with the top-level `state` object and the four storage constants (`STORAGE_KEY`, `THEME_KEY`) declared
  - _Requirements: 7.2_

- [x] 2. Implement the LocalStorage adapter
  - [x] 2.1 Implement `loadTransactions`, `saveTransactions`, `loadTheme`, and `saveTheme` in `js/app.js`
    - Wrap all reads/writes in `try/catch` as specified in the design
    - `loadTransactions` returns `[]` on any failure; `loadTheme` returns `'light'` on any failure
    - `saveTransactions` returns `true` on success and `false` on failure
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [-] 2.2 Write property test for LocalStorage round-trip (Property 7)
    - **Property 7: LocalStorage round-trip preserves the transaction dataset**
    - Generate arbitrary arrays of valid transaction objects; serialize via `saveTransactions` then deserialize via `loadTransactions`; assert deep equality of all fields (id, name, amount, category, date) in original order
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [-] 2.3 Write property test for theme round-trip (Property 10)
    - **Property 10: Theme round-trip restores saved preference**
    - For each of `'light'` and `'dark'`, call `saveTheme` then `loadTheme`; assert the returned value equals the input
    - **Validates: Requirements 11.3, 11.4**

- [x] 3. Implement state initialization and `renderAll`
  - [x] 3.1 Implement app initialization in `js/app.js`
    - On `DOMContentLoaded`: call `loadTransactions()` → assign to `state.transactions`; call `loadTheme()` → assign to `state.theme`; call `applyTheme(state.theme)`; call `renderAll()`
    - Implement the `renderAll()` function as described in the design: compute `displayed` via `sortTransactions`, then call `renderTransactionList`, `renderBalance`, `renderChart`, and conditionally `renderMonthlySummary`
    - Implement stub versions of all render functions (empty bodies) so the app loads without errors
    - _Requirements: 5.3, 3.4_

- [x] 4. Implement the Transaction Input Form
  - [x] 4.1 Implement form helper functions: `getFormValues`, `resetForm`, `showFormError`, `clearFormError`
    - `getFormValues` reads `#item-name`, `#item-amount`, `#item-category`; validates per design rules; returns `{ name, amount, category }` or `null`
    - `resetForm` resets all form fields to their default empty states
    - `showFormError` writes a message to `#form-error` and removes the `hidden` attribute; `clearFormError` re-adds `hidden`
    - _Requirements: 1.1, 1.3, 1.4_

  - [x] 4.2 Wire the form submit event handler
    - Attach a `submit` listener to `#transaction-form`
    - On submit: call `getFormValues()`; if `null`, stop (error already shown); otherwise create a transaction object with `crypto.randomUUID()`, today's ISO date, and the validated fields; push to `state.transactions`; call `saveTransactions`; call `resetForm()`; call `renderAll()`
    - Clear form error when the user starts typing in any form field
    - _Requirements: 1.2, 1.5, 5.1_

  - [-] 4.3 Write property tests for input validation (Properties 2 and 3)
    - **Property 2: Whitespace-only or empty names are rejected**
    - Generate strings composed entirely of whitespace; pass through `getFormValues` logic; assert `null` is returned and `state.transactions` is unchanged
    - **Property 3: Non-positive amounts are rejected**
    - Generate zero, negative, and NaN values for amount; assert `null` is returned and `state.transactions` is unchanged
    - **Validates: Requirements 1.3, 1.4**

- [x] 5. Implement the Transaction List renderer and delete handler
  - [x] 5.1 Implement `renderTransactionList(transactions)`
    - Clear `#transaction-list`; for each transaction build and append an `<li>` with `data-id`, `.tx-name`, `.tx-category`, `.tx-amount`, and a `.delete-btn` button using the exact markup from the design
    - Render an empty list element (no items) when the array is empty
    - _Requirements: 2.1, 2.3, 2.5_

  - [x] 5.2 Wire the delete event handler using event delegation on `#transaction-list`
    - On click of `.delete-btn`: read `data-id` from the parent `<li>`; filter it out of `state.transactions`; call `saveTransactions`; call `renderAll()`
    - _Requirements: 2.4, 5.2_

  - [-] 5.3 Write property test for delete correctness (Property 6)
    - **Property 6: Delete removes exactly the target transaction**
    - Generate a list of valid transactions with a randomly selected target id; simulate the delete filter; assert the result contains all original transactions except the target, with all other transactions unchanged
    - **Validates: Requirements 2.4, 5.2**

- [x] 6. Implement Balance Display
  - [x] 6.1 Implement `calculateTotal(transactions)` and `renderBalance(transactions)`
    - `calculateTotal` sums `amount` fields; returns `0` for an empty array
    - `renderBalance` formats the total as `$X.XX` and writes it to `#balance-amount`
    - Replace the stub for `renderBalance` in `renderAll`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [-] 6.2 Write property test for balance accuracy (Property 4)
    - **Property 4: Balance equals sum of all transaction amounts**
    - Generate arbitrary arrays of valid transactions; assert `calculateTotal(transactions)` equals the manually computed sum of all `amount` fields
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 7. Checkpoint — core CRUD working
  - Ensure the app loads, transactions can be added and deleted, the list re-renders, the balance updates, and data survives a page reload. Ask the user if any questions arise before continuing.

- [x] 8. Implement the Pie Chart with Chart.js
  - [x] 8.1 Implement `aggregateByCategory(transactions)`
    - Return a `CategoryTotals` object `{ Food: 0, Transport: 0, Fun: 0 }` with amounts summed per category
    - _Requirements: 4.1, 4.2_

  - [-] 8.2 Write property test for category aggregation consistency (Property 5)
    - **Property 5: Category totals are consistent with the transaction dataset**
    - Generate arbitrary valid transaction arrays; assert that the sum of all values in `aggregateByCategory` equals `calculateTotal`, and that each category value equals the sum of amounts for transactions in that category
    - **Validates: Requirements 4.1, 4.2**

  - [x] 8.3 Implement `renderChart(transactions)`
    - Guard against `typeof Chart === 'undefined'`; if unavailable, display the fallback message in `#chart-container` and return
    - Implement the destroy-and-recreate pattern using the module-level `chartInstance` variable as specified in the design
    - Toggle `#chart-empty-msg` visibility based on whether any category has a non-zero total
    - Define `CATEGORY_COLORS` constant (`{ Food: '#4caf50', Transport: '#2196f3', Fun: '#ff9800' }`) at the top of `app.js`
    - Replace the stub for `renderChart` in `renderAll`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 9. Implement responsive CSS layout
  - [x] 9.1 Write mobile-first base styles in `css/style.css`
    - Apply CSS variables from `:root` and `[data-theme="dark"]` to all components
    - Single-column stacked layout for viewports 320px–599px: header, banner, form section, list section, chart section, summary section
    - Transaction list: `overflow-y: auto; max-height: 40vh`
    - Chart container: `width: 100%`
    - _Requirements: 7.1, 7.3_

  - [x] 9.2 Write tablet/desktop two-column layout using a CSS Grid or Flexbox media query at `min-width: 600px`
    - Left column: form section + list section; right column: chart section + summary section
    - Maintain legible typography and clear visual hierarchy at all breakpoints
    - _Requirements: 7.1, 7.3_

- [ ] 10. Implement Sort Transactions (optional)
  - [x] 10.1 Implement `sortTransactions(transactions, direction)`
    - Return a sorted copy of the array for `'asc'` and `'desc'`; return a copy unmodified for `'none'`
    - Never mutate the input array
    - _Requirements: 10.1, 10.2, 10.3_

  - [~] 10.2 Wire the `#sort-control` change event
    - On change: update `state.sortDirection` to the selected value; call `renderAll()`
    - When a new transaction is added while a sort order is active, `renderAll` already applies the current sort — no extra handling needed
    - _Requirements: 10.1, 10.2, 10.4_

  - [~] 10.3 Write property test for sort immutability (Property 8)
    - **Property 8: Sorting does not mutate the canonical transaction dataset**
    - Generate arbitrary transaction arrays and sort directions; assert the returned array is a permutation of the original and that the original array is unchanged
    - **Validates: Requirements 10.3**

- [ ] 11. Implement Monthly Summary View (optional)
  - [x] 11.1 Implement `buildMonthlySummary(transactions)`
    - Group transactions by `YYYY-MM` derived from `transaction.date`; compute per-category totals and an overall `total` for each month; return a `MonthlySummary` object keyed by `'YYYY-MM'` strings
    - _Requirements: 9.1, 9.2, 9.3_

  - [~] 11.2 Write property test for monthly summary consistency (Property 9)
    - **Property 9: Monthly summary totals are consistent with transaction data**
    - Generate arbitrary valid transaction arrays; assert that the sum of all monthly `total` values equals `calculateTotal`, and that each month's category breakdown matches the transactions with that month prefix in their date
    - **Validates: Requirements 9.1, 9.2**

  - [~] 11.3 Implement `renderMonthlySummary(transactions)` and wire the toggle button
    - Render a summary table (or definition list) into `#monthly-summary` using data from `buildMonthlySummary`
    - Wire `#toggle-summary-btn`: toggle `state.summaryVisible`; update button text (`'Show Monthly Summary'` / `'Hide Monthly Summary'`); toggle the `hidden` attribute on `#summary-section`; if now visible, call `renderMonthlySummary`
    - Update `renderAll` to call `renderMonthlySummary` when `state.summaryVisible` is `true`
    - _Requirements: 9.1, 9.3, 9.4_

- [x] 12. Implement Dark/Light Mode Toggle (optional)
  - [x] 12.1 Implement `applyTheme(theme)` and `toggleTheme()`
    - `applyTheme` sets `data-theme` attribute on `<html>` and updates the `#theme-toggle` button icon (`🌙` for light, `☀️` for dark)
    - `toggleTheme` flips `state.theme`, calls `applyTheme`, calls `saveTheme`
    - Wire `#theme-toggle` click event to `toggleTheme`
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 13. Implement error handling and the banner system
  - [x] 13.1 Implement `showBanner(message, type)` and `hideBanner()` in `js/app.js`
    - `showBanner` sets `textContent`, assigns `className = 'banner-<type>'`, and removes `hidden` from `#app-banner`
    - `hideBanner` re-adds `hidden`
    - Integrate `showBanner` calls into `loadTransactions` (on parse/security error → `'info'`), `saveTransactions` (on write failure → `'warning'`), and `renderChart` (when Chart.js is undefined → message in `#chart-container`)
    - Add CSS rules for `.banner-info`, `.banner-warning`, and `.banner-error` classes in `css/style.css`
    - _Requirements: 5.4, 4.3_

  - [~] 13.2 Write property test for add-transaction correctness (Property 1)
    - **Property 1: Adding a transaction increases the list count by exactly one**
    - Generate an existing list of arbitrary length and a valid transaction object; simulate a push; assert `newList.length === originalList.length + 1`
    - **Validates: Requirements 1.2, 2.3**

- [~] 14. Checkpoint — full feature integration
  - Verify: all CRUD operations persist across page reload, chart renders correctly, responsive layout works at 320px and ≥600px, optional features (sort, monthly summary, theme toggle) behave as specified, and error banners appear for storage failures. Ensure all non-optional tests pass. Ask the user if questions arise.

- [ ] 15. Cross-browser smoke test
  - [~] 15.1 Open `index.html` directly in Chrome, Firefox, Edge, and Safari (no server required)
    - Confirm page loads and renders within 2 seconds on a standard broadband connection
    - Add a transaction, verify it appears in the list, balance, and chart
    - Delete a transaction, verify all three views update
    - Reload the page and verify transactions persist
    - Confirm layout is usable at 320px viewport width (mobile emulation)
    - _Requirements: 6.1, 6.2, 8.1, 8.2_

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP build
- All optional feature tasks (10, 11, 12) can be implemented in any order after Task 9, as they do not depend on one another
- Each task references specific requirements for traceability
- Checkpoints (Tasks 7 and 14) ensure incremental validation before moving to the next layer
- Property tests validate universal correctness properties across random inputs
- Unit tests validate specific examples and edge cases
- `renderAll()` is the single re-render entry point — all mutations must call it after updating `state`

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "3.1"] },
    { "id": 1, "tasks": ["4.1", "5.1", "6.1"] },
    { "id": 2, "tasks": ["4.2", "5.2", "8.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "4.3", "5.3", "6.2", "8.2", "8.3", "9.1"] },
    { "id": 4, "tasks": ["9.2", "10.1", "11.1", "13.1"] },
    { "id": 5, "tasks": ["10.2", "11.3", "12.1", "13.2"] },
    { "id": 6, "tasks": ["10.3", "11.2", "15.1"] }
  ]
}
```
