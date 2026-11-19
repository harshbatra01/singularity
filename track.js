/* Visit tracker for reachingsingularity.com.
 *
 * What it records per visit (no names, no contact details, no fingerprinting):
 *   who      : the ?r= tag from a personal link (e.g. ?r=shailesh), remembered on that device
 *   visitor  : a random id kept in this browser, plus how many times it has visited
 *   source   : referrer and utm_ tags
 *   device   : phone/tablet/desktop, OS, browser, screen size, language, time zone
 *   on leave : seconds on page, how far they scrolled, which full videos they played, what they clicked
 * Sends to the Google Sheet web app in config.js (sheetUrl), which logs a row and pings Harsh's phone.
 * Also loads Microsoft Clarity when config.js has a clarityId.
 *
 * Skipped when: running on localhost (goes to the local test server instead), the browser sends
 * Do Not Track or Global Privacy Control, or this device was marked as Harsh's own with ?me=1 (?me=0 undoes it).
 */
(function () {
  var S = window.SITE || {};
  var isLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var q = new URLSearchParams(location.search);

  function ls(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {}
    return null;
  }

  if (q.get("me") === "1") ls("ss_me", "1");
  if (q.get("me") === "0") ls("ss_me", null);
  if (ls("ss_me") === "1") return;
  if (navigator.doNotTrack === "1" || window.doNotTrack === "1" || navigator.globalPrivacyControl === true) return;

  var url = isLocal ? S.localTrackEndpoint : S.sheetUrl;

  /* ---------- who and where from ---------- */
  var ref = (q.get("r") || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
  if (ref) ls("ss_ref", ref); else ref = ls("ss_ref") || "";
  var vid = ls("ss_vid");
  if (!vid) { vid = Math.random().toString(36).slice(2, 10); ls("ss_vid", vid); }
  var n = (parseInt(ls("ss_n") || "0", 10) || 0) + 1; ls("ss_n", String(n));

  var utm = ["utm_source", "utm_medium", "utm_campaign"].map(function (k) { return q.get(k) || ""; })
    .filter(Boolean).join(" / ");

  var ua = navigator.userAgent;
  var device = /iPad|Tablet/i.test(ua) ? "tablet" : /Mobi|Android|iPhone/i.test(ua) ? "phone" : "desktop";
  var os = /Android/i.test(ua) ? "Android" : /iPhone|iPad|iPod/i.test(ua) ? "iOS" : /Mac OS X/i.test(ua) ? "macOS" :
    /Windows/i.test(ua) ? "Windows" : /Linux/i.test(ua) ? "Linux" : "other";
  var browser = /Instagram/i.test(ua) ? "Instagram app" : /FBAN|FBAV/i.test(ua) ? "Facebook app" : /LinkedInApp/i.test(ua) ? "LinkedIn app" :
    /Twitter/i.test(ua) ? "X app" : /WhatsApp/i.test(ua) ? "WhatsApp" : /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" :
    /SamsungBrowser/.test(ua) ? "Samsung" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" :
    /Safari\//.test(ua) ? "Safari" : "other";
  var tz = "";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}

  var base = {
    vid: vid, n: n, ref: ref, page: location.pathname + location.search, title: document.title.slice(0, 80),
    from: document.referrer ? document.referrer.split("?")[0].slice(0, 200) : "", utm: utm,
    device: device, os: os, browser: browser, screen: screen.width + "x" + screen.height,
    lang: navigator.language || "", tz: tz
  };

  // Quick ping (no setup): posts a short line straight to an ntfy channel. Used until the sheet script's own,
  // private ping is set up. The channel name is in this public file, so keep the text free of anything personal.
  function quickPing(d) {
    if (!S.quickPingTopic || isLocal) return;
    var who = d.ref || (d.n > 1 ? "returning visitor (" + d.n + ")" : "new visitor");
    var src = d.utm || (d.from ? d.from.replace(/^https?:\/\//, "") : "") || (/app$/.test(d.browser) ? d.browser : "direct");
    var line = d.type === "visit"
      ? "VISIT " + who + " | " + d.page + " | from " + src + " | " + d.device + ", " + d.browser
      : "LEFT " + who + " after " + d.secs + "s, scrolled " + d.scroll + "%" + (d.played ? ", watched " + d.played : "");
    if (d.type === "leave" && d.secs < 10) return;
    try { fetch("https://ntfy.sh/" + S.quickPingTopic, { method: "POST", body: line, keepalive: true }); } catch (e) {}
  }

  function send(type, extra) {
    var d = { type: type, at: new Date().toISOString() }, k;
    for (k in base) d[k] = base[k];
    for (k in extra || {}) d[k] = extra[k];
    quickPing(d);
    if (!url) return;
    var body = JSON.stringify(d);
    // Beacon first (tested 19 Nov: it reaches the Apps Script web app; plain fetch failed in one browser),
    // then fetch as a fallback. text/plain keeps it a simple request, which Apps Script web apps accept.
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type: "text/plain" }))) return;
    } catch (e) {}
    try {
      fetch(url, { method: "POST", body: body, keepalive: true, credentials: "omit", mode: isLocal ? "same-origin" : "no-cors" });
    } catch (e) {}
  }

  /* ---------- what they do on the page ---------- */
  var start = Date.now(), maxScroll = 0, played = [], clicks = [];
  function scrollPct() {
    var h = document.documentElement.scrollHeight - innerHeight;
    var p = h > 0 ? Math.round(scrollY / h * 100) : 100;
    if (p > maxScroll) maxScroll = Math.min(100, p);
  }
  addEventListener("scroll", scrollPct, { passive: true });

  // Count a video only when it plays with sound or in the full-video player (the muted card loops autoplay).
  document.addEventListener("play", function (e) {
    var v = e.target;
    if (!v || v.tagName !== "VIDEO" || (v.muted && !v.closest("dialog"))) return;
    var src = (v.currentSrc || v.src || "").split("/").pop().split("?")[0];
    if (src && played.indexOf(src) < 0 && played.length < 10) played.push(src);
  }, true);

  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("a,button");
    if (!el || clicks.length >= 15) return;
    var label = (el.getAttribute("aria-label") || el.textContent || el.getAttribute("href") || "").replace(/\s+/g, " ").trim().slice(0, 40);
    if (label) clicks.push(label);
  }, true);

  // Phones fire "hidden" when the visitor only switches apps, then they may come back. So a "left" row is sent
  // on every hide, but only when something new happened since the last one (20+ more seconds, a video, a click).
  var last = null;
  function leave() {
    scrollPct();
    var secs = Math.round((Date.now() - start) / 1000);
    var snap = { secs: secs, scroll: maxScroll, played: played.join(", "), clicks: clicks.join(" | ") };
    if (secs < 3 && !played.length && !clicks.length) return;       // a blink, not a real exit
    if (last && secs - last.secs < 20 && snap.played === last.played && snap.clicks === last.clicks) return;
    last = snap;
    send("leave", snap);
  }
  addEventListener("pagehide", leave);
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") leave(); });

  send("visit");

  /* ---------- Microsoft Clarity (recordings and heatmaps) ---------- */
  if (S.clarityId && !isLocal) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", S.clarityId);
    window.clarity("identify", vid);
    if (ref) window.clarity("set", "ref", ref);
  }

  window.SS_TRACK = { vid: vid, ref: ref };
})();
