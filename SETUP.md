# Alex Expense Tracker - Google Sheets Setup

> **Note**: This app is already configured with a working Google Sheet and Apps Script. These instructions are for setting up your own Google Sheet if needed.

## Step 1: Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Name it "Alex Expense Tracker"
3. Rename the first tab to "Payments"
4. Add these headers in row 1:
   - A1: `Date`
   - B1: `Category`
   - C1: `Amount`
   - D1: `Notes`
   - E1: `ID`

## Step 2: Create the Google Apps Script

1. In your Google Sheet, go to **Extensions > Apps Script**
2. Delete any existing code and paste the contents of `google-apps-script.js` (provided in this project)
3. Update the `SHEET_ID` constant at the top with your Sheet's ID (found in the URL)
4. Click **Save** (give it a name like "Expense Tracker API")

## Step 3: Deploy the Apps Script as a Web App

1. In Apps Script, click **Deploy > New deployment**
2. Click the gear icon next to "Select type" and choose **Web app**
3. Configure:
   - Description: "Expense Tracker API"
   - Execute as: **Me**
   - Who has access: **Anyone** (this allows the web app to call it)
4. Click **Deploy**
5. **Copy the Web App URL** - you'll need this for the next step

## Step 4: Configure the Web App

1. Open `js/config.js`
2. Replace `YOUR_APPS_SCRIPT_URL_HERE` with the URL you copied
3. Set `USE_LOCAL_STORAGE: false` to enable cloud sync

## Step 5: Test

1. Open `index.html` in a browser
2. Try adding a payment
3. Check your Google Sheet - the payment should appear!

## Troubleshooting

- **CORS errors**: Make sure the Apps Script is deployed with "Anyone" access
- **Permission errors**: You may need to authorize the script the first time you deploy
- **Data not syncing**: Check the browser console for errors

## Updating the Apps Script

If you modify `google-apps-script.js`, you must redeploy for changes to take effect:

1. Open the Google Sheet
2. Go to **Extensions > Apps Script**
3. Replace the code with the updated version
4. Click **Deploy > Manage deployments**
5. Click the **Edit (pencil)** icon
6. Select **New version** from the dropdown
7. Click **Deploy**

The deployment URL stays the same, so no config changes are needed.

## Security Notes

- The Apps Script URL is safe to include in your code - it only allows access to this specific sheet
- The script runs with your Google account permissions, but only exposes the functions you define
- No API keys are exposed in the client-side code
