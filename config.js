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

  // Local test only: tools/serve.py saves leads to leads/leads.jsonl
  localLeadEndpoint: "/api/lead"
};
