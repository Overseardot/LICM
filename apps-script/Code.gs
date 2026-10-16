/**
 * LICM Membership Portal backend.
 * Run setup() once from the Apps Script editor, then deploy as a Web App.
 * Member photos and the response spreadsheet remain private in the script owner's Drive.
 */
const CONFIG = {
  SHEET_NAME: 'Membership Applications',
  PHOTO_FOLDER_NAME: 'LICM Private Member Photos',
  MAX_PHOTO_BYTES: 2 * 1024 * 1024
};

function setup() {
  const props = PropertiesService.getScriptProperties();
  const existingSheetId = props.getProperty('LICM_SPREADSHEET_ID');
  const existingFolderId = props.getProperty('LICM_PHOTO_FOLDER_ID');
  if (existingSheetId && existingFolderId) {
    Logger.log('Setup already exists. Spreadsheet: ' + SpreadsheetApp.openById(existingSheetId).getUrl());
    Logger.log('Private photo folder is already configured.');
    return;
  }

  const spreadsheet = SpreadsheetApp.create('LICM Membership Applications');
  const sheet = spreadsheet.getSheets()[0];
  sheet.setName(CONFIG.SHEET_NAME);
  const headers = [
    'Submitted At', 'Membership Reference', 'Full Name', 'Date of Birth',
    'Educational Qualification', 'Fields of Interest', 'Church Membership',
    'Water Baptism', 'Address', 'Mobile Number', 'Photo Drive File ID',
    'Consent to Data Processing'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);

  const folder = DriveApp.createFolder(CONFIG.PHOTO_FOLDER_NAME);
  // Do not make this folder or its files public. Default Drive permissions are private.
  props.setProperties({
    LICM_SPREADSHEET_ID: spreadsheet.getId(),
    LICM_PHOTO_FOLDER_ID: folder.getId()
  }, true);
  Logger.log('Setup complete. Open this private spreadsheet: ' + spreadsheet.getUrl());
  Logger.log('The photo folder was created privately in your Google Drive.');
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Form')
    .setTitle('LICM Membership Registration')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function submitMembership(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid form submission.');
  if (String(payload.website || '').trim() !== '') throw new Error('Submission rejected.');
  const props = PropertiesService.getScriptProperties();
  const spreadsheetId = props.getProperty('LICM_SPREADSHEET_ID');
  const folderId = props.getProperty('LICM_PHOTO_FOLDER_ID');
  if (!spreadsheetId || !folderId) throw new Error('The administrator must complete setup() first.');

  const fullName = requiredText(payload.fullName, 'Full name', 120);
  const dob = requiredText(payload.dob, 'Date of birth', 20);
  const qualification = requiredText(payload.qualification, 'Educational qualification', 100);
  const church = requiredText(payload.church, 'Church membership', 180);
  const baptized = requiredText(payload.baptized, 'Water baptism', 20);
  const address = requiredText(payload.address, 'Address', 600);
  const mobile = requiredText(payload.mobile, 'Mobile number', 30);
  const interests = Array.isArray(payload.interests)
    ? payload.interests.map(v => String(v).slice(0, 80)).filter(Boolean).slice(0, 12)
    : [];
  if (!interests.length) throw new Error('Please select at least one field of interest.');
  if (baptized !== 'Yes' && baptized !== 'No') throw new Error('Please select a valid water-baptism answer.');
  if (payload.consent !== true && payload.consent !== 'true') {
    throw new Error('Please confirm the privacy and data-use consent.');
  }

  const photoDataUrl = String(payload.photoDataUrl || '');
  const match = photoDataUrl.match(/^data:(image\/(?:jpeg|png));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error('Please upload a valid JPG or PNG face photo.');
  const mimeType = match[1];
  const encoded = match[2];
  if (encoded.length > Math.ceil(CONFIG.MAX_PHOTO_BYTES * 4 / 3) + 8) throw new Error('Photo must be 2 MB or smaller.');
  const bytes = Utilities.base64Decode(encoded);
  if (!bytes.length || bytes.length > CONFIG.MAX_PHOTO_BYTES) throw new Error('Photo must be 2 MB or smaller.');

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  let photoFile = null;
  try {
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) throw new Error('The membership sheet is missing. Please contact the administrator.');
    const year = new Date().getFullYear();
    const nextNumber = Math.max(1, sheet.getLastRow());
    const memberId = 'LICM-' + year + '-' + String(nextNumber).padStart(5, '0');
    const safeName = fullName.replace(/[^a-z0-9 _-]/gi, '').trim().slice(0, 60) || 'member';
    const extension = mimeType === 'image/png' ? 'png' : 'jpg';
    const blob = Utilities.newBlob(bytes, mimeType, memberId + '-' + safeName + '.' + extension);
    photoFile = DriveApp.getFolderById(folderId).createFile(blob);
    // No public sharing is enabled. Do not create a public photo URL.
    sheet.appendRow([
      new Date(), memberId, safeCell(fullName), safeCell(dob),
      safeCell(qualification), safeCell(interests.join(', ')), safeCell(church),
      safeCell(baptized), safeCell(address), safeCell(mobile),
      photoFile.getId(), 'Yes'
    ]);
    return { ok: true, memberId: memberId, message: 'Your application was submitted successfully.' };
  } catch (err) {
    if (photoFile) {
      try { photoFile.setTrashed(true); } catch (ignored) {}
    }
    throw new Error(err && err.message ? err.message : 'Submission failed. Please try again.');
  } finally {
    lock.releaseLock();
  }
}

function requiredText(value, label, maxLength) {
  const text = String(value == null ? '' : value).trim();
  if (!text) throw new Error(label + ' is required.');
  if (text.length > maxLength) throw new Error(label + ' is too long.');
  return text;
}

// Prevent user-provided text from being interpreted as a spreadsheet formula.
function safeCell(value) {
  const text = String(value == null ? '' : value);
  return /^[=+@\-]/.test(text) ? "'" + text : text;
}