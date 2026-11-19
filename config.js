// Site settings. Edit here, nothing else needs to change.
window.SITE = {
  brand: "Singularity",

  // Look and copy picks. Empty = what is written in index.html.
  // Filled from the review panel's "Copy my picks" once the choices are made.
  //   bg: "platinum" | "white", tag: "", cta: "", sub: "",
  //   logo: { id, family, weight, style, space, upper, scale, google }
  picks: { aiLook: "marker", studioLook: "link", studio: "More of our work" },

  // Where leads go.
  // 0. Google Sheet (main): paste the Apps Script web app URL (ends in /exec). Every lead becomes a row and
  //    the sheet owner gets an email. Script: tools/lead-sheet.gs
  sheetUrl: "https://script.google.com/macros/s/AKfycbx1gRBnfR9ieKkUEltr1bEdogouD0FVnzKiCQSqCwEvW-SaBhGwuySLRu3DjAfDxW5RXw/exec",
  // 1. Or paste a Web3Forms access key here and every lead is emailed to the inbox that key belongs to.
  //    (The key is made at web3forms.com with your email. It is safe to keep in this file: it can only send to you.)
  // 2. While this is empty, the live form hands the lead to WhatsApp with the details already typed.
  web3formsKey: "",

  whatsapp: "919116692952",            // digits only, with country code
  whatsappShown: "+91 91166 92952",
  email: "harsh62442@gmail.com",
  callUrl: "https://calendly.com/harsh62442/30min",

  // Visit tracking (track.js). Visits go to the same Google Sheet web app as leads (sheetUrl), "Visits" tab.
  // Microsoft Clarity project id (clarity.microsoft.com > Settings > Setup). Empty = Clarity off.
  clarityId: "",
  // Quick phone ping with no setup (ntfy.sh). Open https://ntfy.sh/<this name> on the phone, or subscribe in the ntfy app.
  // Public in this file, so it only carries page, source and device. Set to "" once the sheet's private ping works.
  quickPingTopic: "ss-aa1bdbb70be57b14dbc3",

  // Local test only: tools/serve.py saves leads to leads/leads.jsonl and visits to leads/visits.jsonl
  localLeadEndpoint: "/api/lead",
  localTrackEndpoint: "/api/track"
};
