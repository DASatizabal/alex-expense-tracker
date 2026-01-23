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

// Toast notification system
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');

    const bgColor = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-600' : 'bg-violet-600';
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info';

    toast.className = `flex items-center gap-3 px-4 py-3 ${bgColor} text-white rounded-xl shadow-lg backdrop-blur-sm toast-enter`;
    toast.innerHTML = `
        <i data-lucide="${icon}" class="w-5 h-5"></i>
        <span class="font-medium">${message}</span>
    `;

    container.appendChild(toast);
    lucide.createIcons({ nodes: [toast] });

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Initialize Lucide icons
function initLucideIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Initialize theme from localStorage or default to dark
function initTheme() {
    const savedTheme = localStorage.getItem('alex_expense_theme');
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');

    // Default to dark mode if no preference saved
    if (savedTheme === 'light') {
        body.classList.remove('dark');
        themeToggle.innerHTML = '<i data-lucide="sun" class="w-5 h-5"></i>';
    } else {
        body.classList.add('dark');
        themeToggle.innerHTML = '<i data-lucide="moon" class="w-5 h-5"></i>';
    }
    initLucideIcons();
}

// Toggle theme between light and dark
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');

    if (body.classList.contains('dark')) {
        body.classList.remove('dark');
        themeToggle.innerHTML = '<i data-lucide="sun" class="w-5 h-5"></i>';
        localStorage.setItem('alex_expense_theme', 'light');
    } else {
        body.classList.add('dark');
        themeToggle.innerHTML = '<i data-lucide="moon" class="w-5 h-5"></i>';
        localStorage.setItem('alex_expense_theme', 'dark');
    }
    initLucideIcons();
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

        // Initialize Lucide icons for dynamically rendered content
        initLucideIcons();
    } catch (error) {
        console.error('Error initializing app:', error);
        showToast('Failed to load data', 'error');
    } finally {
        showLoading(false);
    }
}

// Show/hide loading overlay
function showLoading(show) {
    if (show) {
        loadingOverlay.classList.remove('hidden');
        loadingOverlay.classList.add('flex');
    } else {
        loadingOverlay.classList.add('hidden');
        loadingOverlay.classList.remove('flex');
    }
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

// Format currency with comma separators (hide .00 cents)
function formatCurrency(amount) {
    // Check if amount has cents
    const hasCents = amount % 1 !== 0;
    return amount.toLocaleString('en-US', {
        minimumFractionDigits: hasCents ? 2 : 0,
        maximumFractionDigits: hasCents ? 2 : 0
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

    initLucideIcons();
}

// Create an expense card element
function createExpenseCard(expense) {
    const { status, label } = getExpenseStatus(expense);
    const card = document.createElement('div');

    // Status-based border color class
    const borderColorClass = status === 'paid' ? 'expense-card-paid' :
                             status === 'due-soon' ? 'expense-card-due-soon' :
                             status === 'overdue' ? 'expense-card-overdue' : 'expense-card-pending';

    card.className = `group relative bg-black/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-5 border-l-4 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300 ${borderColorClass}`;

    let progressHTML = '';
    let actionButton = '';

    // Status badge colors (light/dark mode)
    const statusColors = {
        'paid': 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
        'due-soon': 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
        'overdue': 'bg-red-500/20 text-red-600 dark:text-red-400',
        'pending': 'bg-violet-500/20 text-violet-600 dark:text-violet-400'
    };

    if (expense.type === 'loan') {
        const paymentCount = getPaymentCountForCategory(expense.id);
        const percentage = Math.round((paymentCount / expense.totalPayments) * 100);
        progressHTML = `
            <div class="mt-4">
                <div class="flex justify-between text-sm text-slate-500 dark:text-slate-400 mb-2">
                    <span>${paymentCount} of ${expense.totalPayments} payments</span>
                    <span>${percentage}%</span>
                </div>
                <div class="h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div class="h-full progress-gradient rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
        if (paymentCount < expense.totalPayments) {
            actionButton = `<button class="w-full mt-4 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-medium rounded-xl transition-all duration-300" onclick="openPaymentModal('${expense.id}', ${expense.amount})">Mark as Paid</button>`;
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
            paycheckBreakdown = `<div class="text-xs text-slate-500 mt-2">${paychecksRemaining} paychecks left · $${formatCurrency(perPaycheck)}/paycheck</div>`;
        }

        progressHTML = `
            <div class="mt-4">
                <div class="flex justify-between text-sm text-slate-500 dark:text-slate-400 mb-2">
                    <span>$${formatCurrency(totalSaved)} of $${formatCurrency(expense.amount)}</span>
                    <span>${percentage}%</span>
                </div>
                <div class="h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div class="h-full progress-gradient rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
                </div>
                ${paycheckBreakdown}
            </div>
        `;
        if (totalSaved < expense.amount) {
            actionButton = `<button class="w-full mt-4 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-medium rounded-xl transition-all duration-300" onclick="openPaymentModal('${expense.id}', null, true)">Add to Savings</button>`;
        }
    } else {
        // Recurring expense
        if (status !== 'paid') {
            actionButton = `<button class="w-full mt-4 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-medium rounded-xl transition-all duration-300" onclick="openPaymentModal('${expense.id}', ${expense.amount})">Mark as Paid</button>`;
        }
    }

    const dueText = expense.type === 'goal'
        ? `Due: ${expense.dueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
        : `Due: ${expense.dueDay}${getOrdinalSuffix(expense.dueDay)} of month`;

    const amountText = expense.type === 'goal'
        ? `$${formatCurrency(expense.amount)} total`
        : `$${formatCurrency(expense.amount)}/month`;

    card.innerHTML = `
        <div class="flex justify-between items-start mb-3">
            <div class="flex items-center gap-3">
                <span class="text-2xl">${expense.icon}</span>
                <span class="font-semibold text-slate-900 dark:text-white">${expense.name}</span>
            </div>
            <span class="text-lg font-bold text-violet-600 dark:text-violet-400">${amountText}</span>
        </div>
        <div class="flex items-center gap-3">
            <span class="text-sm text-slate-500 dark:text-slate-400">${dueText}</span>
            <span class="px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[status]}">${label}</span>
        </div>
        ${progressHTML}
        ${actionButton}
    `;

    return card;
}

// Render payment history
function renderPaymentHistory() {
    paymentHistory.innerHTML = '';

    if (payments.length === 0) {
        paymentHistory.innerHTML = '<li class="px-6 py-8 text-center text-slate-500 dark:text-slate-500">No payments recorded yet</li>';
        return;
    }

    // Show last 10 payments
    const recentPayments = payments.slice(0, 10);

    recentPayments.forEach(payment => {
        const expense = EXPENSES.find(e => e.id === payment.category);
        const li = document.createElement('li');
        li.className = 'flex items-center justify-between px-6 py-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors';

        const date = parseLocalDate(payment.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        li.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-xl">${expense ? expense.icon : ''}</span>
                <div>
                    <div class="font-medium text-slate-900 dark:text-white">${expense ? expense.name : payment.category}</div>
                    <div class="text-sm text-slate-500">${formattedDate}${payment.notes ? ' · ' + payment.notes : ''}</div>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <span class="font-semibold text-emerald-600 dark:text-emerald-400">$${formatCurrency(payment.amount)}</span>
                <button class="p-2 hover:bg-red-500/20 rounded-lg transition-colors group" onclick="handleDeletePayment('${payment.id}')" title="Delete payment">
                    <i data-lucide="trash-2" class="w-4 h-4 text-slate-500 group-hover:text-red-400"></i>
                </button>
            </div>
        `;

        paymentHistory.appendChild(li);
    });

    initLucideIcons();
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
            nextDueEl.className = 'text-xl font-semibold text-red-600 dark:text-red-400 truncate';
        } else if (minDaysUntil === 0) {
            nextDueEl.textContent = `${nextDue.name} (Today!)`;
            nextDueEl.className = 'text-xl font-semibold text-yellow-600 dark:text-yellow-400 truncate';
        } else {
            nextDueEl.textContent = `${nextDue.name} (in ${minDaysUntil} day${minDaysUntil !== 1 ? 's' : ''})`;
            nextDueEl.className = 'text-xl font-semibold text-slate-900 dark:text-white truncate';
        }
    } else {
        nextDueEl.textContent = 'All paid!';
        nextDueEl.className = 'text-xl font-semibold text-emerald-600 dark:text-emerald-400 truncate';
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

    paymentModal.classList.remove('hidden');
    paymentModal.classList.add('flex');
}

// Close payment modal
function closePaymentModal() {
    paymentModal.classList.add('hidden');
    paymentModal.classList.remove('flex');
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
        showToast('Please enter a valid amount', 'error');
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
        showToast('Payment saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving payment:', error);
        showToast('Failed to save payment', 'error');
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
        showToast('Payment deleted', 'success');
    } catch (error) {
        console.error('Error deleting payment:', error);
        showToast('Failed to delete payment', 'error');
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
        checkItem.className = 'flex items-center gap-3 p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors';
        checkItem.innerHTML = `
            <input type="checkbox" name="expense" value="${expense.id}" data-amount="${expense.amount}" class="w-5 h-5 rounded border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/5 text-violet-600 focus:ring-violet-500 focus:ring-offset-0">
            <span class="text-lg">${expense.icon}</span>
            <span class="flex-1 text-slate-900 dark:text-white">${expense.name}</span>
            <span class="font-semibold text-violet-600 dark:text-violet-400">$${formatCurrency(expense.amount)}</span>
        `;
        expenseCheckboxList.appendChild(checkItem);
    });

    // Show message if no unpaid expenses
    if (expenseCheckboxList.children.length === 0) {
        expenseCheckboxList.innerHTML = '<p class="text-center text-slate-500 dark:text-slate-500 py-4">All expenses are paid for this month!</p>';
    }

    bulkPaymentModal.classList.remove('hidden');
    bulkPaymentModal.classList.add('flex');
}

// Close bulk payment modal
function closeBulkPaymentModal() {
    bulkPaymentModal.classList.add('hidden');
    bulkPaymentModal.classList.remove('flex');
}

// Handle bulk payment form submission
async function handleBulkPaymentSubmit(e) {
    e.preventDefault();

    const date = document.getElementById('bulk-payment-date').value;
    const notes = document.getElementById('bulk-payment-notes').value;
    const checkboxes = expenseCheckboxList.querySelectorAll('input[type="checkbox"]:checked');

    if (checkboxes.length === 0) {
        showToast('Please select at least one expense', 'error');
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
        showToast(`${checkboxes.length} payment${checkboxes.length > 1 ? 's' : ''} saved!`, 'success');
    } catch (error) {
        console.error('Error saving bulk payments:', error);
        showToast('Failed to save payments', 'error');
    } finally {
        showLoading(false);
    }
}

// Event Listeners
closeModalBtn.addEventListener('click', closePaymentModal);
paymentModal.addEventListener('click', (e) => {
    if (e.target === paymentModal || e.target.id === 'payment-modal-backdrop') {
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
            if (e.target === bulkPaymentModal || e.target.id === 'bulk-modal-backdrop') {
                closeBulkPaymentModal();
            }
        });
    }
    if (bulkPaymentForm) {
        bulkPaymentForm.addEventListener('submit', handleBulkPaymentSubmit);
    }

    // Initialize Lucide icons
    initLucideIcons();

    // Initialize the app
    init();
});
