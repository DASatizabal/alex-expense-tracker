/**
 * Google Apps Script Backend for Alex Expense Tracker
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
 */

// IMPORTANT: Replace with your actual Sheet ID from the URL
// Example: https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit
const SHEET_ID = '1i5LozGG2aRrgEG-v17R4Ib15wlKe3dJzylAndFoHEnY';
const SHEET_NAME = 'Payments';

/**
 * Handle GET requests - Returns all payments as JSON
 */
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

    if (!sheet) {
      return createResponse({ error: 'Sheet not found' }, 404);
    }

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
 * Handle POST requests - Adds or deletes a payment
 */
function doPost(e) {
  try {
    // Handle missing or malformed request
    if (!e || !e.postData || !e.postData.contents) {
      return createResponse({ error: 'No data received' }, 400);
    }

    const data = JSON.parse(e.postData.contents);

    // Handle delete action
    if (data.action === 'delete') {
      return deletePayment(data.id);
    }

    // Handle add payment
    return addPayment(data);

  } catch (error) {
    return createResponse({ error: 'Parse error: ' + error.message }, 500);
  }
}

/**
 * Add a new payment to the sheet
 */
function addPayment(payment) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

    if (!sheet) {
      return createResponse({ error: 'Sheet not found' }, 404);
    }

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
 * Delete a payment by ID
 */
function deletePayment(paymentId) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

    if (!sheet) {
      return createResponse({ error: 'Sheet not found' }, 404);
    }

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
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

    if (!sheet) {
      Logger.log('ERROR: Sheet "' + SHEET_NAME + '" not found!');
      return;
    }

    Logger.log('SUCCESS: Found sheet "' + SHEET_NAME + '"');
    Logger.log('Rows: ' + sheet.getLastRow());
    Logger.log('Columns: ' + sheet.getLastColumn());

    const headers = sheet.getRange(1, 1, 1, 5).getValues()[0];
    Logger.log('Headers: ' + headers.join(', '));

  } catch (error) {
    Logger.log('ERROR: ' + error.message);
    Logger.log('Make sure SHEET_ID is correct: ' + SHEET_ID);
  }
}
