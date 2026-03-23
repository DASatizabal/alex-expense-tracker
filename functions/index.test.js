/**
 * Tests for notification logic in checkExpenseNotification and checkGoalNotification
 *
 * Run: node functions/index.test.js
 *
 * These tests verify the core notification scheduling logic without
 * requiring Firebase or web-push dependencies.
 */

// Extract the pure functions from index.js by re-implementing them here
// (they aren't exported, so we duplicate the logic for testing)

function getOrdinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function checkExpenseNotification(expense, payments, today) {
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    if (expense.type === 'goal') {
        return checkGoalNotification(expense, payments, today);
    }

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

function checkGoalNotification(expense, payments, today) {
    const totalPaid = payments
        .filter(p => p.category === expense.id)
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

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

// ─── Test Runner ───

let passed = 0;
let failed = 0;

function assert(condition, testName) {
    if (condition) {
        passed++;
        console.log(`  ✓ ${testName}`);
    } else {
        failed++;
        console.error(`  ✗ ${testName}`);
    }
}

function assertEqual(actual, expected, testName) {
    if (JSON.stringify(actual) === JSON.stringify(expected)) {
        passed++;
        console.log(`  ✓ ${testName}`);
    } else {
        failed++;
        console.error(`  ✗ ${testName}`);
        console.error(`    Expected: ${JSON.stringify(expected)}`);
        console.error(`    Actual:   ${JSON.stringify(actual)}`);
    }
}

// ─── Tests ───

console.log('\n=== getOrdinal ===');
assertEqual(getOrdinal(1), '1st', '1st');
assertEqual(getOrdinal(2), '2nd', '2nd');
assertEqual(getOrdinal(3), '3rd', '3rd');
assertEqual(getOrdinal(4), '4th', '4th');
assertEqual(getOrdinal(11), '11th', '11th');
assertEqual(getOrdinal(12), '12th', '12th');
assertEqual(getOrdinal(13), '13th', '13th');
assertEqual(getOrdinal(21), '21st', '21st');
assertEqual(getOrdinal(22), '22nd', '22nd');
assertEqual(getOrdinal(23), '23rd', '23rd');
assertEqual(getOrdinal(31), '31st', '31st');

console.log('\n=== checkExpenseNotification: due tomorrow ===');
{
    const expense = { id: 'rent', name: 'Rent', amount: 1500, type: 'recurring', dueDay: 15 };
    const result = checkExpenseNotification(expense, [], new Date(2026, 2, 14)); // March 14 -> due 15
    assert(result !== null, 'returns notification when due tomorrow');
    assertEqual(result.type, 'due-tomorrow', 'type is due-tomorrow');
    assert(result.body.includes('$1500.00'), 'body includes amount');
    assert(result.body.includes('the 15th'), 'body includes ordinal due day');
}

console.log('\n=== checkExpenseNotification: due today ===');
{
    const expense = { id: 'rent', name: 'Rent', amount: 1500, type: 'recurring', dueDay: 15 };
    const result = checkExpenseNotification(expense, [], new Date(2026, 2, 15)); // March 15
    assert(result !== null, 'returns notification when due today');
    assertEqual(result.type, 'due-today', 'type is due-today');
    assert(result.title.includes('due today'), 'title says due today');
}

console.log('\n=== checkExpenseNotification: overdue ===');
{
    const expense = { id: 'rent', name: 'Rent', amount: 1500, type: 'recurring', dueDay: 15 };
    const result = checkExpenseNotification(expense, [], new Date(2026, 2, 18)); // March 18, due was 15
    assert(result !== null, 'returns notification when overdue');
    assertEqual(result.type, 'overdue', 'type is overdue');
    assert(result.body.includes('3 days overdue'), 'body shows 3 days overdue');
}

console.log('\n=== checkExpenseNotification: 1 day overdue (singular) ===');
{
    const expense = { id: 'rent', name: 'Rent', amount: 1500, type: 'recurring', dueDay: 15 };
    const result = checkExpenseNotification(expense, [], new Date(2026, 2, 16));
    assert(result !== null, 'returns notification when 1 day overdue');
    assert(result.body.includes('1 day overdue'), 'body shows singular "day"');
    assert(!result.body.includes('1 days'), 'no plural for 1 day');
}

console.log('\n=== checkExpenseNotification: not due soon ===');
{
    const expense = { id: 'rent', name: 'Rent', amount: 1500, type: 'recurring', dueDay: 25 };
    const result = checkExpenseNotification(expense, [], new Date(2026, 2, 15)); // 10 days away
    assertEqual(result, null, 'returns null when not due soon');
}

console.log('\n=== checkExpenseNotification: already paid this month ===');
{
    const expense = { id: 'rent', name: 'Rent', amount: 1500, type: 'recurring', dueDay: 15 };
    const payments = [{ category: 'rent', date: '2026-03-10', amount: 1500 }];
    const result = checkExpenseNotification(expense, payments, new Date(2026, 2, 15));
    assertEqual(result, null, 'returns null when already paid');
}

console.log('\n=== checkExpenseNotification: paid in different month ===');
{
    const expense = { id: 'rent', name: 'Rent', amount: 1500, type: 'recurring', dueDay: 15 };
    const payments = [{ category: 'rent', date: '2026-02-10', amount: 1500 }]; // paid Feb
    const result = checkExpenseNotification(expense, payments, new Date(2026, 2, 15)); // March 15
    assert(result !== null, 'still notifies when paid in a different month');
}

console.log('\n=== checkExpenseNotification: no dueDay ===');
{
    const expense = { id: 'misc', name: 'Misc', amount: 50, type: 'variable', dueDay: null };
    const result = checkExpenseNotification(expense, [], new Date(2026, 2, 15));
    assertEqual(result, null, 'returns null when no dueDay set');
}

console.log('\n=== checkGoalNotification: due tomorrow ===');
{
    const expense = { id: 'vacation', name: 'Vacation Fund', amount: 2000, type: 'goal', dueDate: '2026-03-25' };
    const payments = [{ category: 'vacation', amount: 500, date: '2026-01-15' }];
    const result = checkExpenseNotification(expense, payments, new Date(2026, 2, 24)); // March 24
    assert(result !== null, 'returns notification for goal due tomorrow');
    assertEqual(result.type, 'due-tomorrow', 'type is due-tomorrow');
    assert(result.body.includes('$500.00'), 'body includes saved amount');
    assert(result.body.includes('$2000.00'), 'body includes goal amount');
}

console.log('\n=== checkGoalNotification: goal reached ===');
{
    const expense = { id: 'vacation', name: 'Vacation Fund', amount: 2000, type: 'goal', dueDate: '2026-03-25' };
    const payments = [
        { category: 'vacation', amount: 1000, date: '2026-01-15' },
        { category: 'vacation', amount: 1000, date: '2026-02-15' }
    ];
    const result = checkExpenseNotification(expense, payments, new Date(2026, 2, 24));
    assertEqual(result, null, 'returns null when goal fully funded');
}

console.log('\n=== checkGoalNotification: overdue goal ===');
{
    const expense = { id: 'vacation', name: 'Vacation Fund', amount: 2000, type: 'goal', dueDate: '2026-03-20' };
    const payments = [{ category: 'vacation', amount: 500, date: '2026-01-15' }];
    const result = checkExpenseNotification(expense, payments, new Date(2026, 2, 23)); // 3 days after
    assert(result !== null, 'returns notification for overdue goal');
    assertEqual(result.type, 'overdue', 'type is overdue');
    assert(result.body.includes('3 days ago'), 'body shows days overdue');
}

console.log('\n=== checkGoalNotification: due today ===');
{
    const expense = { id: 'vacation', name: 'Vacation Fund', amount: 2000, type: 'goal', dueDate: '2026-03-23' };
    const payments = [{ category: 'vacation', amount: 800, date: '2026-02-15' }];
    const result = checkExpenseNotification(expense, payments, new Date(2026, 2, 23));
    assert(result !== null, 'returns notification for goal due today');
    assertEqual(result.type, 'due-today', 'type is due-today');
}

console.log('\n=== Edge case: expense with type "loan" ===');
{
    const expense = { id: 'car-loan', name: 'Car Loan', amount: 450, type: 'loan', dueDay: 1 };
    const result = checkExpenseNotification(expense, [], new Date(2026, 2, 1)); // due today
    assert(result !== null, 'loan expenses get notifications');
    assertEqual(result.type, 'due-today', 'type is due-today for loan');
}

console.log('\n=== Edge case: end of month boundary ===');
{
    const expense = { id: 'rent', name: 'Rent', amount: 1500, type: 'recurring', dueDay: 1 };
    // On March 31, due day 1 means daysUntilDue = 1 - 31 = -30
    const result = checkExpenseNotification(expense, [], new Date(2026, 2, 31));
    assert(result !== null, 'flags overdue at end of month for day-1 expense');
    assertEqual(result.type, 'overdue', 'type is overdue');
}

// ─── Summary ───
console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
console.log(`${'='.repeat(40)}\n`);

process.exit(failed > 0 ? 1 : 0);
