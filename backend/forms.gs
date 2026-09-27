/* =========================================================
   Yansa website — form backend (Google Apps Script)

   Receives the Contact and Download Brochure forms and appends
   each submission as a row in the "Yansa Website — Form
   Submissions" Google Sheet (owned by paradexstudios@gmail.com).
   Brochure requests are emailed the PDF, and every submission sends
   an alert to NOTIFY_TO. Mail goes out from the account that deploys
   the script; a free Gmail account can send about 100 a day.

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

// Who gets an alert for every submission (comma-separate for several)
var NOTIFY_TO = 'paradexstudios@gmail.com';

// Attached to the brochure email. Served from the public GitHub repo, so it
// is always the copy on main.
var BROCHURE_PDF_URL =
  'https://raw.githubusercontent.com/Paradex-Tech/Yansa/main/assets/yansa-brochure.pdf';

var FORMS = {
  contact: {
    sheet: 'Contact',
    label: 'Contact form',
    fields: ['fullname', 'email', 'facility', 'message'],
    headers: ['Timestamp', 'Full Name', 'Email', 'Facility/Company', 'Message', 'Page']
  },
  brochure: {
    sheet: 'Brochure',
    label: 'Brochure request',
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

  // The row is saved; a mail failure (e.g. the daily quota) must not turn
  // that into an error for the visitor, so each email is attempted on its own.
  if (p.form === 'brochure') {
    try { sendBrochure(p); } catch (err) { console.error('Brochure email failed: ' + err); }
  }
  try { notifyTeam(form, row); } catch (err) { console.error('Team alert failed: ' + err); }

  return json({ ok: true });
}

function sendBrochure(p) {
  var to = String(p.email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return;

  var pdf = UrlFetchApp.fetch(BROCHURE_PDF_URL).getBlob().setName('Yansa Brochure.pdf');
  var name = String(p.name || '').trim().split(/\s+/)[0] || 'there';

  MailApp.sendEmail({
    to: to,
    name: 'Yansa',
    subject: 'Your Yansa brochure',
    htmlBody:
      '<p>Hi ' + esc(name) + ',</p>' +
      '<p>Thank you for your interest in Yansa. Our brochure is attached.</p>' +
      '<p>If you would like us to look at a power quality problem at your facility, ' +
      'just reply to this email and we will set up a diagnosis.</p>' +
      '<p>— The Yansa team</p>',
    attachments: [pdf]
  });
}

function notifyTeam(form, row) {
  if (!NOTIFY_TO) return;
  var lines = form.headers.map(function (h, i) {
    var v = i === 0 ? Utilities.formatDate(row[0], Session.getScriptTimeZone(), 'dd MMM yyyy, HH:mm') : row[i];
    return '<tr><td style="padding:4px 12px 4px 0;color:#5c5c5c">' + esc(h) +
      '</td><td style="padding:4px 0">' + esc(String(v).replace(/^'/, '')) + '</td></tr>';
  });

  MailApp.sendEmail({
    to: NOTIFY_TO,
    name: 'Yansa website',
    subject: 'New ' + form.label + ' — Yansa website',
    htmlBody:
      '<p>A new ' + esc(form.label.toLowerCase()) + ' came in:</p>' +
      '<table>' + lines.join('') + '</table>' +
      '<p><a href="' + SpreadsheetApp.getActiveSpreadsheet().getUrl() + '">Open the sheet</a></p>'
  });
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
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
