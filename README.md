# LICM Membership Portal

This repository contains the public GitHub Pages landing page and the Google Apps Script source for LICM membership registration.

## Features

- Collects full name, date of birth, educational qualification, fields of interest, church membership, water-baptism answer, address, mobile number, and a face photo.
- Saves applications automatically to a private Google Sheet.
- Saves photos in a private Google Drive folder and stores only the Drive file ID in the sheet.
- Shows a provisional card after successful submission, with name, mobile number, photo, and reference number.
- Uses a 6 × 8.5 inch portrait print layout.

## 1. Create the private records

1. Sign in to the Google account LICM will use to own the membership records.
2. Open https://script.google.com/ and create a new project named LICM Membership Portal.
3. Open apps-script/Code.gs in this repository. Copy its complete contents into the Apps Script editor's Code.gs.
4. In Apps Script, click +, choose HTML, and name the file exactly Form. Copy all contents of apps-script/Form.html into it.
5. Save the project.
6. Select the setup function in the function dropdown and click Run. Review and approve the Google permissions.
7. Open the execution log. Copy the private spreadsheet URL and verify that the spreadsheet and LICM Private Member Photos folder exist in your Google Drive. Keep both private.

Run setup only once unless you intentionally need a new spreadsheet and photo folder.

## 2. Deploy the registration app

1. In Apps Script, click Deploy → New deployment.
2. Click the gear icon and choose Web app.
3. Set Execute as to Me (the account owning the records).
4. Set Who has access to Anyone so members can submit without signing into your Google account. This makes the submission form public; monitor it for spam.
5. Click Deploy, authorize if asked, and copy the URL ending in /exec. Do not use the /dev test URL for the public site.
6. Test the form with a test application before publishing it.

## 3. Connect GitHub Pages

1. Open index.html in this repository on GitHub and click the pencil icon to edit.
2. Find the sample URL https://script.google.com/macros/s/PASTE_YOUR_DEPLOYMENT_ID/exec.
3. Replace that sample URL with your actual Apps Script /exec URL. Keep the URL inside the quotation marks.
4. Commit the change.
5. In GitHub, open Settings → Pages and ensure Pages publishes the branch and folder containing index.html (usually main and /(root)).
6. Open your published Pages URL and test the Open Membership Form link.

## Card printing

After a successful application, the page displays a provisional card. Choose Print / Save card as PDF. The card uses CSS print dimensions of 6 × 8.5 inches. In the print dialog, choose a 6 × 8.5 inch custom paper size if available, set scale to 100% / Actual size, and disable browser headers and footers. Printer drivers differ, so verify the PDF page dimensions before printing multiple cards.

The card is marked PROVISIONAL · PENDING LICM VERIFICATION. The form does not implement an approval workflow, so do not treat the generated card as proof of approved membership until LICM verifies the application.

## Security notes

- Do not put real member records, photos, spreadsheet IDs, or Drive folder IDs in this public GitHub repository.
- Do not make the spreadsheet or photo folder public or enable Anyone with the link sharing.
- Do not store a public photo URL in the spreadsheet.
- Limit access to the Google account and people explicitly authorized to administer membership.
- The public form can be targeted by spam. Test first, monitor submissions, and add a suitable anti-spam challenge/rate-limiting approach before wide public promotion.
- Collect only information LICM genuinely needs, explain its use to applicants, and define how long records are retained.
- If you change the form fields, keep the Apps Script validation and sheet columns in sync.

## Files

- index.html — public GitHub Pages landing page.
- apps-script/Code.gs — Google Apps Script backend.
- apps-script/Form.html — registration form and printable card UI.
