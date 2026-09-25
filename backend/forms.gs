/* =========================================================
   Yansa website — form backend (Google Apps Script)

   Receives the Contact and Download Brochure forms and appends
   each submission as a row in the "Yansa Website — Form
   Submissions" Google Sheet (owned by paradexstudios@gmail.com).

   This file is a copy for version control. The live copy is
   pasted into the sheet: Extensions → Apps Script.

   Setup / redeploy:
   1. Open the sheet → Extensions → Apps Script, replace
      Code.gs with this file, save.
   2. Deploy → New deployment → type "Web app".
      Execute as: Me   ·   Who has access: Anyone
   3. Copy the Web app URL into FORMS_ENDPOINT in js/script.js.
   After later edits: Deploy → Manage deployments → edit →
   Version: New version (keeps the same URL).
   ========================================================= */

var FORMS = {
  contact: {
    sheet: 'Contact',
    fields: ['fullname', 'email', 'facility', 'message'],
    headers: ['Timestamp', 'Full Name', 'Email', 'Facility/Company', 'Message', 'Page']
  },
  brochure: {
    sheet: 'Brochure',
    fields: ['name', 'organisation', 'email', 'phone'],
    headers: ['Timestamp', 'Full Name', 'Organisation', 'Work Email', 'Phone', 'Page']
  }
};

function doPost(e) {
  var p = (e && e.parameter) || {};

  // Honeypot: real visitors never see or fill the "website" field
  if (p.website) return json({ ok: true });

  var form = FORMS[p.form];
  if (!form) return json({ ok: false, error: 'Unknown form' });

  // Serialise writes so simultaneous submissions don't collide
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var row = [new Date()];
    form.fields.forEach(function (f) { row.push(clean(p[f])); });
    row.push(clean(p.page));
    getSheet(form).appendRow(row);
  } finally {
    lock.releaseLock();
  }

  return json({ ok: true });
}

// Lets you open the Web app URL in a browser to check it's live
function doGet() {
  return json({ ok: true, service: 'Yansa forms' });
}

function getSheet(form) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(form.sheet);
  if (!sheet) {
    sheet = ss.insertSheet(form.sheet);
    sheet.appendRow(form.headers);
    sheet.getRange(1, 1, 1, form.headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Trims, caps length, and stops values like "=HYPERLINK(...)" from
// running as formulas in the sheet
function clean(v) {
  v = String(v == null ? '' : v).trim().slice(0, 5000);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Optional: run once from the editor to create both tabs up front
function setup() {
  Object.keys(FORMS).forEach(function (k) { getSheet(FORMS[k]); });
  var blank = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0) SpreadsheetApp.getActiveSpreadsheet().deleteSheet(blank);
}
