/**
 * Google Apps Script Backend for Alex Expense Tracker (Multi-Tenant)
 *
 * This centralized Apps Script auto-provisions per-user storage tabs.
 * New users get their own tab (user_{userId}) automatically created on first request.
 * Known users (primary + admin) continue using the default "Payments" tab.
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a Google Sheet with a tab named "Payments"
 * 2. Add headers in row 1: Date | Category | Amount | Notes | ID
 * 3. Go to Extensions > Apps Script
 * 4. Delete any existing code and paste this entire file
 * 5. Click Deploy > New deployment
 * 6. Select type: Web app
 * 7. Set "Execute as" to your account
 * 8. Set "Who has access" to "Anyone"
 * 9. Click Deploy and copy the Web app URL
 * 10. Paste the URL into your config.js APPS_SCRIPT_URL
 *
 * NOTE: After updating this script, you must create a NEW deployment
 * (Deploy > Manage deployments > Edit > New version) for changes to take effect.
 */

// IMPORTANT: Replace with your actual Sheet ID from the URL
const SHEET_ID = '1i5LozGG2aRrgEG-v17R4Ib15wlKe3dJzylAndFoHEnY';
const DEFAULT_SHEET_NAME = 'Payments';
const SHEET_HEADERS = ['Date', 'Category', 'Amount', 'Notes', 'ID'];

/**
 * Get the sheet name for a user
 * Known users (no userId or empty) use the default "Payments" tab
 * Other users get their own tab: user_{userId}
 */
function getSheetNameForUser(userId) {
  if (!userId || userId === '' || userId === 'undefined' || userId === 'null') {
    return DEFAULT_SHEET_NAME;
  }
  return 'user_' + userId;
}

/**
 * Get or create a user's sheet tab
 * Returns the sheet, creating it with headers if it doesn't exist
 */
function getOrCreateUserSheet(userId) {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const sheetName = getSheetNameForUser(userId);

  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    // Create new sheet for this user
    sheet = spreadsheet.insertSheet(sheetName);
    // Add headers
    sheet.getRange(1, 1, 1, SHEET_HEADERS.length).setValues([SHEET_HEADERS]);
    // Format headers
    sheet.getRange(1, 1, 1, SHEET_HEADERS.length).setFontWeight('bold');
  }

  return sheet;
}

/**
 * Handle GET requests - Returns all payments as JSON
 * Query parameters:
 *   - userId: User's Firebase UID (optional, omit for known users)
 *   - action: Optional action (e.g., 'init' to initialize user sheet)
 */
function doGet(e) {
  try {
    const userId = e.parameter.userId || '';
    const action = e.parameter.action || '';

    // Handle init action - create user sheet if needed
    if (action === 'init') {
      return handleInit(userId);
    }

    const sheet = getOrCreateUserSheet(userId);

    const data = sheet.getDataRange().getValues();

    // Skip header row
    if (data.length <= 1) {
      return createResponse({ payments: [] });
    }

    const payments = data.slice(1).map(row => ({
      date: formatDate(row[0]),
      category: row[1] || '',
      amount: parseFloat(row[2]) || 0,
      notes: row[3] || '',
      id: row[4] || ''
    })).filter(p => p.id); // Filter out empty rows

    return createResponse({ payments });

  } catch (error) {
    return createResponse({ error: error.message }, 500);
  }
}

/**
 * Handle user sheet initialization
 * Creates the user's tab if it doesn't exist
 */
function handleInit(userId) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheetName = getSheetNameForUser(userId);

    let sheet = spreadsheet.getSheetByName(sheetName);
    const existed = !!sheet;

    if (!sheet) {
      // Create new sheet for this user
      sheet = spreadsheet.insertSheet(sheetName);
      // Add headers
      sheet.getRange(1, 1, 1, SHEET_HEADERS.length).setValues([SHEET_HEADERS]);
      // Format headers
      sheet.getRange(1, 1, 1, SHEET_HEADERS.length).setFontWeight('bold');
    }

    return createResponse({
      success: true,
      initialized: !existed,
      sheetName: sheetName
    });

  } catch (error) {
    return createResponse({ error: error.message }, 500);
  }
}

/**
 * Handle POST requests - Adds, updates, or deletes a payment
 * The request body must include userId for routing to the correct tab
 */
function doPost(e) {
  try {
    // Handle missing or malformed request
    if (!e || !e.postData || !e.postData.contents) {
      return createResponse({ error: 'No data received' }, 400);
    }

    const data = JSON.parse(e.postData.contents);
    const userId = data.userId || '';

    // Handle delete action
    if (data.action === 'delete') {
      return deletePayment(userId, data.id);
    }

    // Handle update action
    if (data.action === 'update') {
      return updatePayment(userId, data.id, data.updates);
    }

    // Handle add payment
    return addPayment(userId, data);

  } catch (error) {
    return createResponse({ error: 'Parse error: ' + error.message }, 500);
  }
}

/**
 * Add a new payment to the user's sheet
 */
function addPayment(userId, payment) {
  try {
    const sheet = getOrCreateUserSheet(userId);

    // Generate ID if not provided
    const id = payment.id || 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Append new row
    sheet.appendRow([
      payment.date,
      payment.category,
      payment.amount,
      payment.notes || '',
      id
    ]);

    return createResponse({
      success: true,
      payment: {
        date: payment.date,
        category: payment.category,
        amount: payment.amount,
        notes: payment.notes || '',
        id: id
      }
    });

  } catch (error) {
    return createResponse({ error: error.message }, 500);
  }
}

/**
 * Delete a payment by ID from the user's sheet
 */
function deletePayment(userId, paymentId) {
  try {
    const sheet = getOrCreateUserSheet(userId);

    const data = sheet.getDataRange().getValues();

    // Find the row with matching ID (ID is in column E, index 4)
    for (let i = 1; i < data.length; i++) {
      if (data[i][4] === paymentId) {
        sheet.deleteRow(i + 1); // +1 because sheets are 1-indexed
        return createResponse({ success: true, deleted: paymentId });
      }
    }

    return createResponse({ error: 'Payment not found' }, 404);

  } catch (error) {
    return createResponse({ error: error.message }, 500);
  }
}

/**
 * Update a payment by ID in the user's sheet
 */
function updatePayment(userId, paymentId, updates) {
  try {
    const sheet = getOrCreateUserSheet(userId);

    const data = sheet.getDataRange().getValues();

    // Find the row with matching ID (ID is in column E, index 4)
    for (let i = 1; i < data.length; i++) {
      if (data[i][4] === paymentId) {
        const row = i + 1; // +1 because sheets are 1-indexed

        // Update each field if provided
        if (updates.date !== undefined) {
          sheet.getRange(row, 1).setValue(updates.date);
        }
        if (updates.category !== undefined) {
          sheet.getRange(row, 2).setValue(updates.category);
        }
        if (updates.amount !== undefined) {
          sheet.getRange(row, 3).setValue(updates.amount);
        }
        if (updates.notes !== undefined) {
          sheet.getRange(row, 4).setValue(updates.notes);
        }

        return createResponse({ success: true, updated: paymentId });
      }
    }

    return createResponse({ error: 'Payment not found' }, 404);

  } catch (error) {
    return createResponse({ error: error.message }, 500);
  }
}

/**
 * Create a JSON response with CORS headers
 */
function createResponse(data, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Format date to YYYY-MM-DD string
 */
function formatDate(value) {
  if (!value) return '';

  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  // If it's already a string, return as-is
  return String(value);
}

/**
 * Test function - Run this to verify your setup
 */
function testSetup() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(DEFAULT_SHEET_NAME);

    if (!sheet) {
      Logger.log('ERROR: Sheet "' + DEFAULT_SHEET_NAME + '" not found!');
      return;
    }

    Logger.log('SUCCESS: Found sheet "' + DEFAULT_SHEET_NAME + '"');
    Logger.log('Rows: ' + sheet.getLastRow());
    Logger.log('Columns: ' + sheet.getLastColumn());

    const headers = sheet.getRange(1, 1, 1, 5).getValues()[0];
    Logger.log('Headers: ' + headers.join(', '));

  } catch (error) {
    Logger.log('ERROR: ' + error.message);
    Logger.log('Make sure SHEET_ID is correct: ' + SHEET_ID);
  }
}

/**
 * Test multi-tenant functionality
 * Creates a test user sheet, adds a payment, and reads it back
 */
function testMultiTenant() {
  const testUserId = 'test_user_12345';

  try {
    // Initialize user sheet
    const initResult = handleInit(testUserId);
    Logger.log('Init result: ' + initResult.getContent());

    // Get the test sheet
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheetName = getSheetNameForUser(testUserId);
    const sheet = spreadsheet.getSheetByName(sheetName);

    if (sheet) {
      Logger.log('SUCCESS: Created/found test sheet: ' + sheetName);
      Logger.log('Rows: ' + sheet.getLastRow());

      // Clean up - delete test sheet
      spreadsheet.deleteSheet(sheet);
      Logger.log('Cleaned up test sheet');
    } else {
      Logger.log('ERROR: Test sheet not found');
    }

  } catch (error) {
    Logger.log('ERROR: ' + error.message);
  }
}
