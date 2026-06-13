# Requirements Document

## Introduction

The Expense & Budget Visualizer is a mobile-friendly, client-side web application that helps users track their daily spending. The application provides a transaction input form, a scrollable transaction history list, a running total balance, and a pie chart visualizing spending distribution by category. All data is persisted in the browser's Local Storage, requiring no backend server or complex setup. The application is built with HTML, CSS, and Vanilla JavaScript, and is compatible with modern browsers.

---

## Glossary

- **Application**: The Expense & Budget Visualizer web application.
- **Transaction**: A single spending entry composed of an item name, a monetary amount, and a category.
- **Transaction_List**: The scrollable UI component that displays all recorded transactions.
- **Input_Form**: The UI form through which the user enters a new transaction.
- **Balance_Display**: The UI component at the top of the page that shows the total calculated balance.
- **Category**: A classification for a transaction; one of: Food, Transport, or Fun.
- **Pie_Chart**: The Chart.js-rendered visual component showing spending distribution by category.
- **Local_Storage**: The browser's Web Storage API used to persist transaction data client-side.
- **Monthly_Summary**: An optional view that aggregates and displays transaction totals grouped by month.
- **Sort_Control**: An optional UI control that orders the Transaction_List by transaction amount.
- **Theme_Toggle**: An optional UI control that switches the Application between dark and light visual modes.

---

## Requirements

### Requirement 1: Transaction Input Form

**User Story:** As a user, I want to enter a new spending transaction through a form, so that I can record my daily expenses quickly and accurately.

#### Acceptance Criteria

1. THE Input_Form SHALL contain a text field for item name, a numeric field for amount, and a dropdown selector for category with options Food, Transport, and Fun.
2. WHEN the user submits the Input_Form with all fields populated and a valid positive amount, THE Application SHALL add the transaction to the Transaction_List and persist it to Local_Storage.
3. IF the user submits the Input_Form with any field empty, THEN THE Input_Form SHALL display a validation error message identifying the missing field and SHALL NOT add the transaction.
4. IF the user submits the Input_Form with an amount that is not a positive number, THEN THE Input_Form SHALL display a validation error message and SHALL NOT add the transaction.
5. WHEN a transaction is successfully added, THE Input_Form SHALL reset all fields to their default empty state.

---

### Requirement 2: Transaction List

**User Story:** As a user, I want to see all my recorded transactions in a list, so that I can review my spending history at a glance.

#### Acceptance Criteria

1. THE Transaction_List SHALL display each transaction's item name, amount, and category.
2. THE Transaction_List SHALL be scrollable when the number of transactions exceeds the visible area.
3. WHEN a transaction is added or deleted, THE Transaction_List SHALL update immediately to reflect the current set of transactions.
4. WHEN the user activates the delete control on a transaction entry, THE Application SHALL remove that transaction from the Transaction_List and from Local_Storage.
5. WHEN the Application loads, THE Transaction_List SHALL display all transactions previously persisted in Local_Storage.

---

### Requirement 3: Total Balance Display

**User Story:** As a user, I want to see my current total balance at the top of the page, so that I always know how much I have spent in aggregate.

#### Acceptance Criteria

1. THE Balance_Display SHALL show the sum of all transaction amounts currently stored in Local_Storage.
2. WHEN a transaction is added, THE Balance_Display SHALL update to reflect the new total within 100 milliseconds.
3. WHEN a transaction is deleted, THE Balance_Display SHALL update to reflect the new total within 100 milliseconds.
4. WHEN the Application loads with no stored transactions, THE Balance_Display SHALL show a value of zero.

---

### Requirement 4: Spending Distribution Pie Chart

**User Story:** As a user, I want to see a pie chart of my spending by category, so that I can understand where my money is going visually.

#### Acceptance Criteria

1. THE Pie_Chart SHALL display one segment per Category that has at least one associated transaction, sized proportionally to that category's total amount relative to all transactions.
2. WHEN a transaction is added or deleted, THE Pie_Chart SHALL update to reflect the current category totals within 100 milliseconds.
3. THE Pie_Chart SHALL be rendered using the Chart.js library.
4. WHEN the Application loads with no stored transactions, THE Pie_Chart SHALL display an empty or placeholder state.
5. THE Pie_Chart SHALL include a legend that identifies each category by name and color.

---

### Requirement 5: Data Persistence

**User Story:** As a user, I want my transactions to be saved between browser sessions, so that I do not lose my expense history when I close or refresh the page.

#### Acceptance Criteria

1. WHEN a transaction is added, THE Application SHALL write the complete current transaction dataset to Local_Storage before the operation is considered complete.
2. WHEN a transaction is deleted, THE Application SHALL write the updated transaction dataset to Local_Storage before the operation is considered complete.
3. WHEN the Application initializes, THE Application SHALL read all transactions from Local_Storage and render them in the Transaction_List, Balance_Display, and Pie_Chart.
4. IF Local_Storage is unavailable or returns a parse error on initialization, THEN THE Application SHALL initialize with an empty transaction dataset and display an informational message to the user.

---

### Requirement 6: Browser Compatibility

**User Story:** As a user, I want the Application to work correctly in any modern browser, so that I am not restricted to a specific browser.

#### Acceptance Criteria

1. THE Application SHALL render and function correctly in the latest stable release of Chrome, Firefox, Edge, and Safari.
2. THE Application SHALL function as a standalone web page opened directly in a browser without requiring a backend server.

---

### Requirement 7: Responsive and Mobile-Friendly Layout

**User Story:** As a user, I want the Application to be usable on my mobile device, so that I can log expenses on the go.

#### Acceptance Criteria

1. THE Application SHALL adapt its layout to viewports with a minimum width of 320 pixels without horizontal scrolling.
2. THE Application SHALL use a single CSS file located at `css/style.css` and a single JavaScript file located at `js/app.js`.
3. THE Application SHALL maintain legible typography and a clear visual hierarchy across all supported viewport sizes.

---

### Requirement 8: Performance

**User Story:** As a user, I want the Application to load and respond quickly, so that logging expenses is not a frustrating experience.

#### Acceptance Criteria

1. THE Application SHALL complete initial page load and render stored transactions within 2 seconds on a standard broadband connection.
2. WHEN the user interacts with the Input_Form, Transaction_List, Balance_Display, or Pie_Chart, THE Application SHALL respond with a visible UI update within 100 milliseconds.

---

## Optional Feature Requirements

### Requirement 9: Monthly Summary View

**User Story:** As a user, I want to view a summary of my spending grouped by month, so that I can track my budget trends over time.

#### Acceptance Criteria

1. WHERE the Monthly Summary feature is enabled, THE Application SHALL provide a Monthly_Summary view that groups and displays transaction totals by calendar month and year.
2. WHERE the Monthly Summary feature is enabled, THE Monthly_Summary SHALL display the total amount spent per category within each month.
3. WHERE the Monthly Summary feature is enabled, WHEN the user navigates to the Monthly_Summary view, THE Application SHALL display data derived from all transactions currently in Local_Storage.
4. WHERE the Monthly Summary feature is enabled, WHEN a transaction is added or deleted, THE Monthly_Summary SHALL reflect the updated totals the next time the view is rendered.

---

### Requirement 10: Sort Transactions by Amount

**User Story:** As a user, I want to sort my transaction list by amount, so that I can quickly identify my largest or smallest expenses.

#### Acceptance Criteria

1. WHERE the Sort feature is enabled, THE Application SHALL provide a Sort_Control that allows the user to sort the Transaction_List in ascending or descending order by transaction amount.
2. WHERE the Sort feature is enabled, WHEN the user activates the Sort_Control, THE Transaction_List SHALL reorder immediately to reflect the selected sort direction.
3. WHERE the Sort feature is enabled, THE Application SHALL preserve the underlying transaction data and Local_Storage records unchanged when sorting is applied.
4. WHERE the Sort feature is enabled, WHEN a new transaction is added while a sort order is active, THE Transaction_List SHALL display the new transaction in the correct position according to the active sort order.

---

### Requirement 11: Dark/Light Mode Toggle

**User Story:** As a user, I want to switch between dark and light visual modes, so that I can use the Application comfortably in different lighting conditions.

#### Acceptance Criteria

1. WHERE the Theme Toggle feature is enabled, THE Application SHALL provide a Theme_Toggle control that switches the visual theme between dark mode and light mode.
2. WHERE the Theme Toggle feature is enabled, WHEN the user activates the Theme_Toggle, THE Application SHALL apply the selected theme to all UI components immediately without a page reload.
3. WHERE the Theme Toggle feature is enabled, THE Application SHALL persist the user's theme preference in Local_Storage and restore it on the next Application load.
4. WHERE the Theme Toggle feature is enabled, THE Application SHALL default to light mode when no theme preference is stored in Local_Storage.
