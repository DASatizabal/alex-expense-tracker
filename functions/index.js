const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const webpush = require('web-push');

// VAPID keys from Cloud Function secrets
const VAPID_PUBLIC_KEY = defineSecret('VAPID_PUBLIC_KEY');
const VAPID_PRIVATE_KEY = defineSecret('VAPID_PRIVATE_KEY');

let app = null;
let db = null;

function ensureInitialized() {
    if (!app) {
        app = initializeApp();
        db = getFirestore();
    }
}

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwQI_sZ76ZvFCXOdndlyhvI0U2UR3CXdJo_m_1NlCuDAUPS26sYyzzLOl7ZIyKCf_aa/exec';

/**
 * Scheduled function - runs daily at 8:00 AM Eastern
 * Checks which expenses are due tomorrow, today, or overdue
 * and sends push notifications to all registered devices.
 */
exports.checkExpenseDues = onSchedule(
    {
        schedule: '0 8 * * *',
        timeZone: 'America/New_York',
        region: 'us-central1',
        secrets: [VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY]
    },
    async (event) => {
        ensureInitialized();

        // Configure web-push with VAPID details
        webpush.setVapidDetails(
            'mailto:dasatizabal@gmail.com',
            VAPID_PUBLIC_KEY.value(),
            VAPID_PRIVATE_KEY.value()
        );

        try {
            // 1. Load expense config from Firestore
            const configDoc = await db.collection('expense_config')
                .doc('primary_user').get();

            if (!configDoc.exists) {
                console.log('No expense config found in Firestore');
                return;
            }

            const { expenses } = configDoc.data();

            // 2. Fetch payment data from Apps Script
            const payments = await fetchPayments();

            // 3. Determine which expenses need notifications
            const today = new Date();
            const notifications = [];

            for (const expense of expenses) {
                const result = checkExpenseNotification(expense, payments, today);
                if (result) {
                    notifications.push(result);
                }
            }

            if (notifications.length === 0) {
                console.log('No notifications to send today');
                return;
            }

            // 4. Get all push subscriptions
            const subsSnapshot = await db.collection('push_subscriptions').get();

            if (subsSnapshot.empty) {
                console.log('No registered devices');
                return;
            }

            // 5. Send notifications
            let totalSent = 0;
            let totalFailed = 0;

            for (const notif of notifications) {
                const payload = JSON.stringify({
                    title: notif.title,
                    body: notif.body,
                    expenseId: notif.expenseId,
                    type: notif.type
                });

                for (const doc of subsSnapshot.docs) {
                    const subData = doc.data();
                    const pushSubscription = {
                        endpoint: subData.endpoint,
                        keys: subData.keys
                    };

                    try {
                        await webpush.sendNotification(pushSubscription, payload);
                        totalSent++;
                    } catch (err) {
                        totalFailed++;
                        // Auto-delete expired/invalid subscriptions
                        if (err.statusCode === 410 || err.statusCode === 404) {
                            console.log(`Removing expired subscription: ${doc.id}`);
                            await db.collection('push_subscriptions').doc(doc.id).delete();
                        } else {
                            console.error(`Push send error (${err.statusCode}):`, err.message);
                        }
                    }
                }
            }

            console.log(`Sent ${totalSent} notifications, ${totalFailed} failed across ${notifications.length} notification type(s)`);

        } catch (error) {
            console.error('Error in checkExpenseDues:', error);
        }
    }
);

/**
 * Fetch payments from the Apps Script endpoint
 * Uses Node 20's built-in fetch
 */
async function fetchPayments() {
    const response = await fetch(APPS_SCRIPT_URL);
    const data = await response.json();
    return data.payments || [];
}

/**
 * Check if an expense needs a notification today.
 * Returns notification object or null.
 */
function checkExpenseNotification(expense, payments, today) {
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Handle savings goals separately
    if (expense.type === 'goal') {
        return checkGoalNotification(expense, payments, today);
    }

    // For recurring, loan, and variable expenses
    // Check if already paid this month
    const paidThisMonth = payments.some(p => {
        const pDate = new Date(p.date);
        return p.category === expense.id &&
            pDate.getMonth() === currentMonth &&
            pDate.getFullYear() === currentYear;
    });

    if (paidThisMonth) return null;

    const dueDay = expense.dueDay;
    if (!dueDay) return null;

    const daysUntilDue = dueDay - currentDay;
    const amount = `$${expense.amount.toFixed(2)}`;

    if (daysUntilDue === 1) {
        return {
            expenseId: expense.id,
            type: 'due-tomorrow',
            title: `${expense.name} due tomorrow`,
            body: `${amount} ${expense.name} payment is due tomorrow (the ${getOrdinal(dueDay)}).`
        };
    }

    if (daysUntilDue === 0) {
        return {
            expenseId: expense.id,
            type: 'due-today',
            title: `${expense.name} due today!`,
            body: `${amount} ${expense.name} payment is due today.`
        };
    }

    if (daysUntilDue < 0) {
        const daysOverdue = Math.abs(daysUntilDue);
        return {
            expenseId: expense.id,
            type: 'overdue',
            title: `${expense.name} is overdue!`,
            body: `${amount} ${expense.name} was due on the ${getOrdinal(dueDay)}. ${daysOverdue} day${daysOverdue === 1 ? '' : 's'} overdue.`
        };
    }

    return null;
}

/**
 * Check if a savings goal needs a notification
 */
function checkGoalNotification(expense, payments, today) {
    const totalPaid = payments
        .filter(p => p.category === expense.id)
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    // Goal already reached
    if (totalPaid >= expense.amount) return null;

    const dueDate = new Date(expense.dueDate);
    const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    const amount = `$${expense.amount.toFixed(2)}`;
    const saved = `$${totalPaid.toFixed(2)}`;

    if (daysUntil === 1) {
        return {
            expenseId: expense.id,
            type: 'due-tomorrow',
            title: `${expense.name} due tomorrow`,
            body: `Your ${expense.name} goal of ${amount} is due tomorrow. You've saved ${saved} so far.`
        };
    }

    if (daysUntil === 0) {
        return {
            expenseId: expense.id,
            type: 'due-today',
            title: `${expense.name} due today!`,
            body: `Your ${expense.name} goal of ${amount} is due today. You've saved ${saved}.`
        };
    }

    if (daysUntil < 0) {
        const daysOverdue = Math.abs(daysUntil);
        return {
            expenseId: expense.id,
            type: 'overdue',
            title: `${expense.name} is overdue!`,
            body: `Your ${expense.name} goal was due ${daysOverdue} day${daysOverdue === 1 ? '' : 's'} ago. ${saved} of ${amount} saved.`
        };
    }

    return null;
}

function getOrdinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
