// EOS Traction Tool — Deployment Configuration
//
// This file is deployed ALONGSIDE index.html (same folder, same GitHub Pages repo).
// It is NEVER overwritten by future index.html updates from Claude — your settings
// here are safe to keep across every future version bump.
//
// You can either:
//   1) Leave this as-is and use the in-app Setup Wizard (it will appear
//      automatically on first load and download you a completed version of
//      this file), or
//   2) Fill in the values below by hand and re-upload.
//
// Every field is optional. Leaving googleClientId blank disables Google
// Sign-In entirely and the app behaves exactly as it did before this file
// existed.

window.EOS_CONFIG = {
    // Set to true once you've filled in the values below (or let the wizard do it).
    // While false, the Setup Wizard will offer to run on load.
    setupComplete: false,

    // Shown in the header and page title.
    companyName: "",

    // From Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID
    // (type: Web application). Leave blank to skip Google Sign-In.
    googleClientId: "",

    // Restrict Google Sign-In to this Workspace domain, e.g. "yourcompany.com".
    // Leave blank to allow any Google account (not recommended for shared use).
    allowedDomain: "",

    // The Google Sheet ID used for team settings sync (from the sheet's URL).
    sharedSheetId: "",

    // Any ONE team member's working Google Apps Script Web App deployment URL.
    // This is what lets a brand new device (e.g. a phone opening the tool for
    // the first time) automatically pull the rest of the team's settings
    // instead of requiring manual copy-paste.
    bootstrapWebAppUrl: ""
};
