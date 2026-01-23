// Main Application Logic for Alex's Expense Tracker

let payments = [];

// DOM Elements
const expensesContainer = document.getElementById('expenses-container');
const paymentHistory = document.getElementById('payment-history');
const monthlyTotalEl = document.getElementById('monthly-total');
const nextDueEl = document.getElementById('next-due');
const paymentModal = document.getElementById('payment-modal');
const paymentForm = document.getElementById('payment-form');
const closeModalBtn = document.getElementById('close-modal');
const loadingOverlay = document.getElementById('loading');

// Bulk Payment DOM Elements (initialized after DOM ready)
let bulkPaymentBtn;
let bulkPaymentModal;
let bulkPaymentForm;
let closeBulkModalBtn;
let expenseCheckboxList;

// Initialize theme from localStorage or default to dark
function initTheme() {
    const savedTheme = localStorage.getItem('alex_expense_theme');
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');

    // Default to dark mode if no preference saved
    if (savedTheme === 'light') {
        body.classList.remove('dark-mode');
        themeToggle.textContent = '☀️';
    } else {
        body.classList.add('dark-mode');
        themeToggle.textContent = '🌙';
    }
}

// Toggle theme between light and dark
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');

    if (body.classList.contains('dark-mode')) {
        body.classList.remove('dark-mode');
        themeToggle.textContent = '☀️';
        localStorage.setItem('alex_expense_theme', 'light');
    } else {
        body.classList.add('dark-mode');
        themeToggle.textContent = '🌙';
        localStorage.setItem('alex_expense_theme', 'dark');
    }
}

// Initialize the app
async function init() {
    showLoading(true);

    // Initialize theme
    initTheme();

    // Display version
    document.getElementById('version-tag').textContent = 'v' + APP_VERSION;

    try {
        // Load payments from storage
        payments = await SheetsAPI.getPayments();

        // Render the UI
        renderExpenseCards();
        renderPaymentHistory();
        updateSummary();
    } catch (error) {
        console.error('Error initializing app:', error);
    } finally {
        showLoading(false);
    }
}

// Show/hide loading overlay
function showLoading(show) {
    loadingOverlay.classList.toggle('active', show);
}

// Get the current month and year
function getCurrentMonthYear() {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
}

// Parse date string as local date (fixes timezone issue with "YYYY-MM-DD" format)
function parseLocalDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}

// Format currency with comma separators
function formatCurrency(amount, decimals = 2) {
    return amount.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// Check if a payment exists for an expense in a given month
function hasPaymentForMonth(expenseId, month, year) {
    return payments.some(payment => {
        const paymentDate = parseLocalDate(payment.date);
        return payment.category === expenseId &&
               paymentDate.getMonth() === month &&
               paymentDate.getFullYear() === year;
    });
}

// Get total payments for a category (for loans and goals)
function getTotalPaymentsForCategory(expenseId) {
    return payments
        .filter(p => p.category === expenseId)
        .reduce((sum, p) => sum + p.amount, 0);
}

// Get payment count for a category (for loans)
function getPaymentCountForCategory(expenseId) {
    return payments.filter(p => p.category === expenseId).length;
}

// Calculate status for an expense
function getExpenseStatus(expense) {
    const { month, year } = getCurrentMonthYear();
    const today = new Date();
    const currentDay = today.getDate();

    if (expense.type === 'goal') {
        // For goals, check progress
        const totalSaved = getTotalPaymentsForCategory(expense.id);
        if (totalSaved >= expense.amount) {
            return { status: 'paid', label: 'Goal Reached!' };
        }
        const daysUntilDue = Math.ceil((expense.dueDate - today) / (1000 * 60 * 60 * 24));
        if (daysUntilDue < 0) {
            return { status: 'overdue', label: 'Past Due' };
        }
        if (daysUntilDue <= 30) {
            return { status: 'due-soon', label: `${daysUntilDue} days left` };
        }
        return { status: 'pending', label: `${daysUntilDue} days left` };
    }

    if (expense.type === 'loan') {
        // For loans, check if paid this month
        const paymentCount = getPaymentCountForCategory(expense.id);
        if (paymentCount >= expense.totalPayments) {
            return { status: 'paid', label: 'Paid Off!' };
        }
        if (hasPaymentForMonth(expense.id, month, year)) {
            return { status: 'paid', label: 'Paid this month' };
        }
    } else {
        // For recurring expenses
        if (hasPaymentForMonth(expense.id, month, year)) {
            return { status: 'paid', label: 'Paid this month' };
        }
    }

    // Check if due soon or overdue
    const dueDay = expense.dueDay;
    const daysUntilDue = dueDay - currentDay;

    if (daysUntilDue < 0) {
        return { status: 'overdue', label: 'Overdue!' };
    }
    if (daysUntilDue <= 7) {
        return { status: 'due-soon', label: `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}` };
    }
    return { status: 'pending', label: `Due on the ${dueDay}${getOrdinalSuffix(dueDay)}` };
}

// Get ordinal suffix for a number
function getOrdinalSuffix(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}

// Sort expenses by: paid status (unpaid first), due date (soonest first), amount (highest first)
function getSortedExpenses() {
    const today = new Date();
    const currentDay = today.getDate();

    return [...EXPENSES].sort((a, b) => {
        // Get paid status for each expense
        const statusA = getExpenseStatus(a);
        const statusB = getExpenseStatus(b);
        const isPaidA = statusA.status === 'paid';
        const isPaidB = statusB.status === 'paid';

        // Paid expenses go to the bottom
        if (isPaidA !== isPaidB) {
            return isPaidA ? 1 : -1;
        }

        // Calculate days until due for each expense
        const getDaysUntilDue = (expense) => {
            if (expense.type === 'goal') {
                return Math.ceil((expense.dueDate - today) / (1000 * 60 * 60 * 24));
            }
            const daysUntil = expense.dueDay - currentDay;
            // If already past due this month, treat as most urgent (negative)
            return daysUntil;
        };

        const daysA = getDaysUntilDue(a);
        const daysB = getDaysUntilDue(b);

        // Sort by days until due (soonest first, overdue at top)
        if (daysA !== daysB) {
            return daysA - daysB;
        }

        // If same due date, sort by amount (highest first)
        return b.amount - a.amount;
    });
}

// Render all expense cards
function renderExpenseCards() {
    expensesContainer.innerHTML = '';

    getSortedExpenses().forEach(expense => {
        const card = createExpenseCard(expense);
        expensesContainer.appendChild(card);
    });
}

// Create an expense card element
function createExpenseCard(expense) {
    const { status, label } = getExpenseStatus(expense);
    const card = document.createElement('div');
    card.className = `expense-card status-${status}`;

    let progressHTML = '';
    let actionButton = '';

    if (expense.type === 'loan') {
        const paymentCount = getPaymentCountForCategory(expense.id);
        const percentage = Math.round((paymentCount / expense.totalPayments) * 100);
        progressHTML = `
            <div class="progress-section">
                <div class="progress-label">
                    <span>${paymentCount} of ${expense.totalPayments} payments</span>
                    <span>${percentage}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
        if (paymentCount < expense.totalPayments) {
            actionButton = `<button class="btn btn-primary" onclick="openPaymentModal('${expense.id}', ${expense.amount})">Mark as Paid</button>`;
        }
    } else if (expense.type === 'goal') {
        const totalSaved = getTotalPaymentsForCategory(expense.id);
        const remainingBalance = expense.amount - totalSaved;
        const percentage = Math.min(100, Math.round((totalSaved / expense.amount) * 100));

        // Calculate paychecks remaining (every 2 weeks starting 1/22/2026)
        const paycheckStart = new Date(2026, 0, 22); // Jan 22, 2026
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day
        const dueDate = new Date(expense.dueDate);
        dueDate.setHours(23, 59, 59, 999); // Include the due date fully

        let paychecksRemaining = 0;
        let currentPaycheck = new Date(paycheckStart);

        // Find the next paycheck on or after today
        while (currentPaycheck < today) {
            currentPaycheck.setDate(currentPaycheck.getDate() + 14);
        }

        // Count paychecks from current through due date (inclusive)
        while (currentPaycheck <= dueDate) {
            paychecksRemaining++;
            currentPaycheck.setDate(currentPaycheck.getDate() + 14);
        }

        const perPaycheck = paychecksRemaining > 0 ? remainingBalance / paychecksRemaining : remainingBalance;

        let paycheckBreakdown = '';
        if (remainingBalance > 0 && paychecksRemaining > 0) {
            paycheckBreakdown = `<div class="paycheck-breakdown">${paychecksRemaining} paychecks left · $${formatCurrency(perPaycheck)}/paycheck</div>`;
        }

        progressHTML = `
            <div class="progress-section">
                <div class="progress-label">
                    <span>$${formatCurrency(totalSaved, 0)} of $${formatCurrency(expense.amount)}</span>
                    <span>${percentage}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
                ${paycheckBreakdown}
            </div>
        `;
        if (totalSaved < expense.amount) {
            actionButton = `<button class="btn btn-success" onclick="openPaymentModal('${expense.id}', null, true)">Add to Savings</button>`;
        }
    } else {
        // Recurring expense
        if (status !== 'paid') {
            actionButton = `<button class="btn btn-primary" onclick="openPaymentModal('${expense.id}', ${expense.amount})">Mark as Paid</button>`;
        }
    }

    const dueText = expense.type === 'goal'
        ? `Due: ${expense.dueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
        : `Due: ${expense.dueDay}${getOrdinalSuffix(expense.dueDay)} of month`;

    const amountText = expense.type === 'goal'
        ? `$${formatCurrency(expense.amount)} total`
        : `$${formatCurrency(expense.amount)}/month`;

    card.innerHTML = `
        <div class="expense-header">
            <div class="expense-title">
                <span class="expense-icon">${expense.icon}</span>
                <span class="expense-name">${expense.name}</span>
            </div>
            <span class="expense-amount">${amountText}</span>
        </div>
        <div class="expense-details">
            <div class="expense-due">${dueText}</div>
            <span class="expense-status">${label}</span>
        </div>
        ${progressHTML}
        <div class="expense-actions">
            ${actionButton}
        </div>
    `;

    return card;
}

// Render payment history
function renderPaymentHistory() {
    paymentHistory.innerHTML = '';

    if (payments.length === 0) {
        paymentHistory.innerHTML = '<li class="no-payments">No payments recorded yet</li>';
        return;
    }

    // Show last 10 payments
    const recentPayments = payments.slice(0, 10);

    recentPayments.forEach(payment => {
        const expense = EXPENSES.find(e => e.id === payment.category);
        const li = document.createElement('li');
        li.className = 'payment-item';

        const date = parseLocalDate(payment.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        li.innerHTML = `
            <div class="payment-info">
                <span class="payment-category">${expense ? expense.icon : ''} ${expense ? expense.name : payment.category}</span>
                <span class="payment-date">${formattedDate}${payment.notes ? ' - ' + payment.notes : ''}</span>
            </div>
            <div class="payment-actions">
                <span class="payment-amount">$${formatCurrency(payment.amount)}</span>
                <button class="btn-delete" onclick="handleDeletePayment('${payment.id}')" title="Delete payment">&times;</button>
            </div>
        `;

        paymentHistory.appendChild(li);
    });
}

// Update summary section
function updateSummary() {
    const today = new Date();
    const currentDay = today.getDate();
    const { month, year } = getCurrentMonthYear();

    // Calculate remaining amount to pay this month
    let remainingAmount = 0;
    EXPENSES.forEach(expense => {
        // Skip goals
        if (expense.type === 'goal') return;

        // Skip if already paid this month
        if (hasPaymentForMonth(expense.id, month, year)) return;

        // For loans, skip if fully paid
        if (expense.type === 'loan') {
            const paymentCount = getPaymentCountForCategory(expense.id);
            if (paymentCount >= expense.totalPayments) return;
        }

        remainingAmount += expense.amount;
    });

    monthlyTotalEl.textContent = `$${formatCurrency(remainingAmount)}`;

    // Find next due expense

    let nextDue = null;
    let minDaysUntil = Infinity;

    EXPENSES.forEach(expense => {
        if (expense.type === 'goal') return;

        // Skip if already paid this month
        if (hasPaymentForMonth(expense.id, month, year)) return;

        // For loans, skip if fully paid
        if (expense.type === 'loan') {
            const paymentCount = getPaymentCountForCategory(expense.id);
            if (paymentCount >= expense.totalPayments) return;
        }

        let daysUntil = expense.dueDay - currentDay;
        if (daysUntil < 0) {
            // Already past due this month, consider it urgent
            daysUntil = -1;
        }

        if (daysUntil < minDaysUntil) {
            minDaysUntil = daysUntil;
            nextDue = expense;
        }
    });

    if (nextDue) {
        if (minDaysUntil < 0) {
            nextDueEl.textContent = `${nextDue.name} (Overdue!)`;
            nextDueEl.style.color = '#e74c3c';
        } else if (minDaysUntil === 0) {
            nextDueEl.textContent = `${nextDue.name} (Today!)`;
            nextDueEl.style.color = '#f39c12';
        } else {
            nextDueEl.textContent = `${nextDue.name} (in ${minDaysUntil} day${minDaysUntil !== 1 ? 's' : ''})`;
            nextDueEl.style.color = '';
        }
    } else {
        nextDueEl.textContent = 'All paid!';
        nextDueEl.style.color = '#27ae60';
    }
}

// Open payment modal
function openPaymentModal(categoryId, defaultAmount = null, isSavings = false) {
    const expense = EXPENSES.find(e => e.id === categoryId);
    if (!expense) return;

    document.getElementById('modal-title').textContent = isSavings
        ? `Add to ${expense.name} Savings`
        : `Record ${expense.name} Payment`;

    document.getElementById('payment-category').value = categoryId;

    // For goals/savings, calculate suggested per-paycheck amount
    let suggestedAmount = defaultAmount;
    if (isSavings && expense.type === 'goal') {
        const totalSaved = getTotalPaymentsForCategory(expense.id);
        const remainingBalance = expense.amount - totalSaved;

        // Calculate paychecks remaining
        const paycheckStart = new Date(2026, 0, 22);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(expense.dueDate);
        dueDate.setHours(23, 59, 59, 999);

        let paychecksRemaining = 0;
        let currentPaycheck = new Date(paycheckStart);
        while (currentPaycheck < today) {
            currentPaycheck.setDate(currentPaycheck.getDate() + 14);
        }
        while (currentPaycheck <= dueDate) {
            paychecksRemaining++;
            currentPaycheck.setDate(currentPaycheck.getDate() + 14);
        }

        if (paychecksRemaining > 0 && remainingBalance > 0) {
            suggestedAmount = (remainingBalance / paychecksRemaining).toFixed(2);
        }
    }

    document.getElementById('payment-amount').value = suggestedAmount || '';
    document.getElementById('payment-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('payment-notes').value = '';

    paymentModal.classList.add('active');
}

// Close payment modal
function closePaymentModal() {
    paymentModal.classList.remove('active');
}

// Handle payment form submission
async function handlePaymentSubmit(e) {
    e.preventDefault();

    const payment = {
        category: document.getElementById('payment-category').value,
        amount: parseFloat(document.getElementById('payment-amount').value),
        date: document.getElementById('payment-date').value,
        notes: document.getElementById('payment-notes').value
    };

    if (!payment.amount || payment.amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    showLoading(true);

    try {
        await SheetsAPI.savePayment(payment);
        payments = await SheetsAPI.getPayments();

        renderExpenseCards();
        renderPaymentHistory();
        updateSummary();

        closePaymentModal();
    } catch (error) {
        console.error('Error saving payment:', error);
        alert('Failed to save payment. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Handle payment deletion
async function handleDeletePayment(paymentId) {
    if (!confirm('Are you sure you want to delete this payment?')) {
        return;
    }

    showLoading(true);

    try {
        await SheetsAPI.deletePayment(paymentId);
        payments = await SheetsAPI.getPayments();

        renderExpenseCards();
        renderPaymentHistory();
        updateSummary();
    } catch (error) {
        console.error('Error deleting payment:', error);
        alert('Failed to delete payment. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Open bulk payment modal
function openBulkPaymentModal() {
    const { month, year } = getCurrentMonthYear();

    // Set date to today
    document.getElementById('bulk-payment-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('bulk-payment-notes').value = '';

    // Build checkbox list of unpaid recurring/loan expenses
    expenseCheckboxList.innerHTML = '';

    getSortedExpenses().forEach(expense => {
        // Skip goals - they have variable amounts
        if (expense.type === 'goal') return;

        // Skip if already paid this month
        if (hasPaymentForMonth(expense.id, month, year)) return;

        // For loans, skip if fully paid
        if (expense.type === 'loan') {
            const paymentCount = getPaymentCountForCategory(expense.id);
            if (paymentCount >= expense.totalPayments) return;
        }

        const checkItem = document.createElement('label');
        checkItem.className = 'expense-check-item';
        checkItem.innerHTML = `<input type="checkbox" name="expense" value="${expense.id}" data-amount="${expense.amount}"><span class="expense-check-icon">${expense.icon}</span><span class="expense-check-name">${expense.name}</span><span class="expense-check-amount">$${formatCurrency(expense.amount)}</span>`;
        expenseCheckboxList.appendChild(checkItem);
    });

    // Show message if no unpaid expenses
    if (expenseCheckboxList.children.length === 0) {
        expenseCheckboxList.innerHTML = '<p class="no-expenses">All expenses are paid for this month!</p>';
    }

    bulkPaymentModal.classList.add('active');
}

// Close bulk payment modal
function closeBulkPaymentModal() {
    bulkPaymentModal.classList.remove('active');
}

// Handle bulk payment form submission
async function handleBulkPaymentSubmit(e) {
    e.preventDefault();

    const date = document.getElementById('bulk-payment-date').value;
    const notes = document.getElementById('bulk-payment-notes').value;
    const checkboxes = expenseCheckboxList.querySelectorAll('input[type="checkbox"]:checked');

    if (checkboxes.length === 0) {
        alert('Please select at least one expense to pay');
        return;
    }

    showLoading(true);

    try {
        // Save each selected payment
        for (const checkbox of checkboxes) {
            const payment = {
                category: checkbox.value,
                amount: parseFloat(checkbox.dataset.amount),
                date: date,
                notes: notes
            };
            await SheetsAPI.savePayment(payment);
        }

        // Refresh payments data
        payments = await SheetsAPI.getPayments();

        renderExpenseCards();
        renderPaymentHistory();
        updateSummary();

        closeBulkPaymentModal();
    } catch (error) {
        console.error('Error saving bulk payments:', error);
        alert('Failed to save payments. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Event Listeners
closeModalBtn.addEventListener('click', closePaymentModal);
paymentModal.addEventListener('click', (e) => {
    if (e.target === paymentModal) {
        closePaymentModal();
    }
});
paymentForm.addEventListener('submit', handlePaymentSubmit);

// Keyboard shortcut to close modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePaymentModal();
        if (bulkPaymentModal) closeBulkPaymentModal();
    }
});

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Theme toggle event listener
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

    // Initialize bulk payment DOM elements
    bulkPaymentBtn = document.getElementById('bulk-payment-btn');
    bulkPaymentModal = document.getElementById('bulk-payment-modal');
    bulkPaymentForm = document.getElementById('bulk-payment-form');
    closeBulkModalBtn = document.getElementById('close-bulk-modal');
    expenseCheckboxList = document.getElementById('expense-checkbox-list');

    // Set up bulk payment event listeners
    if (bulkPaymentBtn) {
        bulkPaymentBtn.addEventListener('click', openBulkPaymentModal);
    }
    if (closeBulkModalBtn) {
        closeBulkModalBtn.addEventListener('click', closeBulkPaymentModal);
    }
    if (bulkPaymentModal) {
        bulkPaymentModal.addEventListener('click', (e) => {
            if (e.target === bulkPaymentModal) {
                closeBulkPaymentModal();
            }
        });
    }
    if (bulkPaymentForm) {
        bulkPaymentForm.addEventListener('submit', handleBulkPaymentSubmit);
    }

    // Initialize the app
    init();
});
