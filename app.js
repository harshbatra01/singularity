(function () {
  "use strict";
  var S = window.SITE || {};
  var $ = function (q, el) { return (el || document).querySelector(q); };
  var $$ = function (q, el) { return Array.prototype.slice.call((el || document).querySelectorAll(q)); };
  var isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

  /* ---------- look and copy picks (set in config.js; the local review panel can override) ---------- */
  var pendingLayout = "grid";
  function applyPicks(p) {
    p = p || {};
    var root = document.documentElement;
    if (p.bg) { root.dataset.bg = p.bg; var tc = document.getElementById("themeColor"); if (tc) tc.content = p.bg === "white" ? "#ffffff" : "#e9e8e4"; }
    var set = function (key, val) { if (val == null) return; $$('[data-pick="' + key + '"]').forEach(function (el) { el.textContent = val; }); };
    set("tag", p.tag); set("cta", p.cta); set("sub", p.sub); if (p.want) { set("want", p.want.long); set("wantShort", p.want.short); }
    if (p.ai) {
      $$("[data-ai-slot]").forEach(function (el) {
        var on = el.getAttribute("data-ai-slot") === p.ai.where;
        el.hidden = !on;
        if (on) { el.textContent = ""; var t = document.createElement("span"); t.textContent = p.ai.text; el.appendChild(t); }
      });
    }
    if (p.aiLook) root.dataset.aiLook = p.aiLook;
    if (p.studioLook) {
      root.dataset.studio = p.studioLook;
      $$(".studio-nav").forEach(function (el) { el.hidden = p.studioLook !== "nav"; });
      $$(".studio-close").forEach(function (el) { el.hidden = p.studioLook !== "close"; });
    }
    set("studio", p.studio);
    if (p.layout) { pendingLayout = p.layout; if (window.__setLayout) window.__setLayout(p.layout); }
    var L = p.logo;
    if (L) {
      if (L.google && !document.getElementById("logoFont-" + L.id)) {
        var l = document.createElement("link"); l.rel = "stylesheet"; l.id = "logoFont-" + L.id;
        l.href = "https://fonts.googleapis.com/css2?family=" + L.google + "&display=swap"; document.head.appendChild(l);
      }
      var st = root.style;
      st.setProperty("--logo-font", L.family); st.setProperty("--logo-weight", L.weight || 700); st.setProperty("--logo-style", L.style || "normal");
      st.setProperty("--logo-space", L.space || "0"); st.setProperty("--logo-case", L.upper ? "uppercase" : L.lower ? "lowercase" : "none"); st.setProperty("--logo-vary", L.vary || "normal"); st.setProperty("--logo-scale", L.scale || 1);
    }
  }
  window.applyPicks = applyPicks;
  applyPicks(S.picks);
  if (isLocal) { var rs = document.createElement("script"); rs.src = "review.js"; document.body.appendChild(rs); }

  /* ---------- contact links ---------- */
  function waUrl(text) { return "https://wa.me/" + S.whatsapp + "?text=" + encodeURIComponent(text); }
  var hello = "Hi, I saw your video styles page and want a video made.";
  ["waLink", "waLink2", "waLink3"].forEach(function (id) {
    var a = document.getElementById(id); if (!a) return;
    if (!S.whatsapp) { a.hidden = true; return; }
    a.href = waUrl(hello);
    if (id === "waLink2") a.textContent = "WhatsApp " + (S.whatsappShown || "");
  });
  var mail = $("#mailLink"); if (mail) { if (S.email) { mail.href = "mailto:" + S.email; mail.textContent = S.email; } else mail.hidden = true; }
  var call = $("#callLink"); if (call) { if (S.callUrl) call.href = S.callUrl; else call.hidden = true; }

  /* ---------- looping videos: load and play only while on screen ---------- */
  var conn = navigator.connection || {};
  var calm = (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) || conn.saveData === true;
  var loops = $$("video.loop");

  function arm(v) {
    if (v.dataset.armed) return;
    v.dataset.armed = "1";
    $$("source", v).forEach(function (s) { s.src = s.dataset.src; });
    v.load();
  }
  function play(v) {
    if (v._wheelHidden) return;
    arm(v);
    var p = v.play();
    if (p && p.catch) p.catch(function () { /* autoplay refused: the poster stays, tap opens the full video */ });
  }
  if (calm) {
    // Respect data saver and reduced motion: posters only, the "Full video" button still plays on tap.
  } else if ("IntersectionObserver" in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        e.target._onScreen = e.isIntersecting;
        if (e.isIntersecting && !document.hidden) play(e.target); else e.target.pause();
      });
    }, { threshold: 0.3, rootMargin: "120px 0px" });
    loops.forEach(function (v) { vio.observe(v); });
    var wake = function () {
      loops.forEach(function (v) { if (document.hidden) v.pause(); else if (v._onScreen) play(v); });
    };
    document.addEventListener("visibilitychange", wake);
    addEventListener("pageshow", wake);
    addEventListener("focus", wake);
  } else {
    loops.forEach(play);
  }

  /* ---------- reveal on scroll ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); rio.unobserve(e.target); } });
    }, { threshold: 0.01, rootMargin: "0px 0px 18% 0px" });
    reveals.forEach(function (el, i) {
      if (el.classList.contains("card") || el.tagName === "LI") el.style.setProperty("--d", (i % 4) * 70 + "ms");
      rio.observe(el);
    });
  } else reveals.forEach(function (el) { el.classList.add("in"); });

  /* ---------- top bar line and phone sticky bar ---------- */
  var top = $(".top"), sticky = $("#sticky"), stylesEl = $("#styles"), closeEl = $(".close");
  sticky.hidden = false;
  var ticking = false;
  function onScroll() {
    top.classList.toggle("scrolled", scrollY > 8);
    var past = stylesEl.getBoundingClientRect().top < innerHeight * 0.4;
    var atEnd = closeEl.getBoundingClientRect().top < innerHeight * 0.75;
    sticky.classList.toggle("show", past && !atEnd);
    ticking = false;
  }
  addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- wheel layout (optional, set by picks.layout) ---------- */
  (function () {
    var wrap = $("#styles"), nav = $(".wheel-nav"), dotsEl = $(".wn-dots");
    var cards = $$(".card", wrap), n = cards.length, active = 0, on = false, x0 = null, swiped = false;
    cards.forEach(function (c, i) {
      var b = document.createElement("button");
      b.className = "wn-dot"; b.setAttribute("aria-label", "Show " + c.dataset.style);
      b.addEventListener("click", function () { go(i); });
      dotsEl.appendChild(b);
    });
    var dots = $$(".wn-dot", dotsEl);
    function layout() {
      cards.forEach(function (c, i) {
        var off = ((i - active) % n + n) % n;
        if (off > n / 2) off -= n;
        var v = $("video.loop", c);
        if (on) c.setAttribute("data-off", off); else c.removeAttribute("data-off");
        v._wheelHidden = on && Math.abs(off) > 1;
        if (v._wheelHidden) v.pause(); else if (v._onScreen && !calm && !document.hidden) play(v);
        c.setAttribute("aria-hidden", on && off !== 0 ? "true" : "false");
      });
      dots.forEach(function (d, i) { d.setAttribute("aria-current", i === active ? "true" : "false"); });
    }
    function go(i) { active = ((i % n) + n) % n; layout(); }
    window.__setLayout = function (mode) {
      on = mode === "wheel";
      wrap.classList.toggle("wheel", on);
      nav.hidden = !on;
      layout();
    };
    $$("[data-wheel]").forEach(function (b) {
      b.addEventListener("click", function () { go(active + (b.dataset.wheel === "next" ? 1 : -1)); });
    });
    // A tap on a side card turns the wheel instead of opening anything.
    wrap.addEventListener("click", function (e) {
      if (!on) return;
      if (swiped) { swiped = false; e.preventDefault(); e.stopPropagation(); return; }
      var c = e.target.closest(".card");
      if (c && c.getAttribute("data-off") !== "0") { e.preventDefault(); e.stopPropagation(); go(cards.indexOf(c)); }
    }, true);
    wrap.addEventListener("pointerdown", function (e) { if (on) { x0 = e.clientX; swiped = false; } });
    wrap.addEventListener("pointerup", function (e) {
      if (!on || x0 == null) return;
      var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 45) { swiped = true; go(active + (dx < 0 ? 1 : -1)); }
    });
    wrap.addEventListener("keydown", function (e) {
      if (!on) return;
      if (e.key === "ArrowRight") go(active + 1); else if (e.key === "ArrowLeft") go(active - 1);
    });
    window.__setLayout(pendingLayout);
  })();

  /* ---------- dialogs ---------- */
  var lead = $("#leadDialog"), form = $("#leadForm"), done = $("#leadDone");
  var sel = $("#styleSel"), contact = $("#leadContact"), note = $("#note"), err = $("#contactErr");
  var pickedImg = $("#pickedImg"), title = $("#leadTitle"), sendBtn = $("#sendBtn");
  var player = $("#playerDialog"), pv = $("#playerVideo"), playerWant = $("#playerWant");
  var sendLabel = sendBtn.textContent;

  function showDialog(d) { if (d.showModal) d.showModal(); else d.setAttribute("open", ""); }
  function hideDialog(d) { if (d.close) d.close(); else d.removeAttribute("open"); }

  function syncPicked() {
    var card = $$(".card").filter(function (c) { return c.dataset.style === sel.value; })[0];
    if (card) {
      pickedImg.src = "media/" + card.dataset.id + "-poster.jpg";
      pickedImg.classList.remove("none");
      title.textContent = sel.value;
      $(".picked .mono").textContent = "You picked";
    } else {
      pickedImg.classList.add("none");
      title.textContent = "Get a video made";
      $(".picked .mono").textContent = S.brand || "";
    }
  }
  sel.addEventListener("change", syncPicked);

  function openLead(style) {
    if (player.open) closePlayer();
    sel.value = style || "Not sure yet";
    syncPicked();
    form.hidden = false; done.hidden = true;
    setErr("");
    showDialog(lead);
    // Do not pop the keyboard on phones the moment the sheet opens.
    if (matchMedia("(min-width: 641px)").matches) contact.focus();
  }
  $$("[data-open-form]").forEach(function (b) {
    b.addEventListener("click", function () { openLead(b.getAttribute("data-open-form")); });
  });

  function openPlayer(btn) {
    var card = btn.closest(".card");
    pv.poster = btn.dataset.poster;
    pv.src = btn.dataset.full;
    playerWant.dataset.style = card.dataset.style;
    loops.forEach(function (v) { v.pause(); });
    showDialog(player);
    var p = pv.play(); if (p && p.catch) p.catch(function () {});
  }
  function closePlayer() {
    pv.pause(); pv.removeAttribute("src"); pv.load();
    if (player.open) hideDialog(player);
    if (!calm) loops.forEach(function (v) { if (v._onScreen) play(v); });
  }
  $$(".watch").forEach(function (b) { b.addEventListener("click", function () { openPlayer(b); }); });
  // Tapping the looping video itself also opens the full version.
  loops.forEach(function (v) { v.style.cursor = "pointer"; v.addEventListener("click", function () { openPlayer($(".watch", v.parentNode)); }); });
  playerWant.addEventListener("click", function () { openLead(playerWant.dataset.style); });
  player.addEventListener("close", function () { pv.pause(); pv.removeAttribute("src"); pv.load(); });
  player.addEventListener("cancel", function () { closePlayer(); });

  $$("[data-close]").forEach(function (b) {
    b.addEventListener("click", function () { var d = b.closest("dialog"); if (d === player) closePlayer(); else hideDialog(d); });
  });
  [lead, player].forEach(function (d) {
    d.addEventListener("click", function (e) { if (e.target === d) { if (d === player) closePlayer(); else hideDialog(d); } });
  });

  /* ---------- lead form ---------- */
  function setErr(msg) { err.textContent = msg; contact.parentNode.classList.toggle("bad", !!msg); }
  function parseContact(raw) {
    var v = raw.trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return { kind: "email", value: v };
    var digits = v.replace(/[^\d]/g, "");
    if (/^[+\d][\d\s().-]*$/.test(v) && digits.length >= 8 && digits.length <= 15) return { kind: "phone", value: v };
    return null;
  }
  contact.addEventListener("input", function () { if (err.textContent) setErr(""); });

  function leadText(d) {
    return "Hi, I want a video made.\nStyle: " + d.style + "\nReach me at: " + d.contact +
      (d.note ? "\nAbout: " + d.note : "");
  }
  function send(d) {
    if (S.sheetUrl) {
      // Plain-text body keeps this a simple request (no CORS preflight), which Apps Script web apps accept.
      return fetch(S.sheetUrl, { method: "POST", body: JSON.stringify(d) })
        .then(function (r) { return r.json(); })
        .then(function (j) { if (!j.ok) throw new Error(j.error || "sheet failed"); return "sheet"; });
    }
    if (S.web3formsKey) {
      return fetch("https://api.web3forms.com/submit", {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: S.web3formsKey,
          subject: "New video lead: " + d.style,
          from_name: (S.brand || "Site") + " styles page",
          style: d.style, contact: d.contact, contact_type: d.kind, note: d.note, page: d.page,
          replyto: d.kind === "email" ? d.contact : undefined
        })
      }).then(function (r) { return r.json(); }).then(function (j) { if (!j.success) throw new Error(j.message || "send failed"); return "email"; });
    }
    if (isLocal && S.localLeadEndpoint) {
      return fetch(S.localLeadEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) })
        .then(function (r) { if (!r.ok) throw new Error("local save failed"); return "local"; });
    }
    return Promise.reject(new Error("no inbox set"));
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (form.botcheck.checked) return;                       // bots tick the hidden box
    var c = parseContact(contact.value);
    if (!c) { setErr(contact.value.trim() ? "That does not look like an email or a phone number." : "Add an email or a WhatsApp number so we can reach you."); contact.focus(); return; }
    var d = {
      style: sel.value, contact: c.value, kind: c.kind, note: note.value.trim(),
      page: location.href.split("#")[0], at: new Date().toISOString()
    };
    setErr("");
    sendBtn.disabled = true; sendBtn.textContent = "Sending…";
    send(d).then(function () {
      form.hidden = true; done.hidden = false;
      $("#doneLine").textContent = "We have your request for the " + d.style + " style. We will reach out at " + d.contact + ".";
      if (d.style === "Not sure yet") $("#doneLine").textContent = "We have your request. We will reach out at " + d.contact + " and help you pick.";
      form.reset();
    }).catch(function () {
      // No inbox reachable: hand the lead to WhatsApp so it is never lost.
      if (S.whatsapp) {
        form.hidden = true; done.hidden = false;
        $(".done h2").textContent = "One more tap.";
        $("#doneLine").innerHTML = "";
        var a = document.createElement("a");
        a.className = "btn btn-lg"; a.target = "_blank"; a.rel = "noopener";
        a.href = waUrl(leadText(d)); a.textContent = "Send it on WhatsApp";
        $("#doneLine").appendChild(document.createTextNode("Your details are ready to go. Tap to send them to us on WhatsApp."));
        $("#doneLine").appendChild(document.createElement("br")); $("#doneLine").appendChild(document.createElement("br"));
        $("#doneLine").appendChild(a);
      } else {
        setErr("Could not send right now. Please email " + (S.email || "us") + ".");
      }
    }).then(function () { sendBtn.disabled = false; sendBtn.textContent = sendLabel; });
  });
  lead.addEventListener("close", function () { $(".done h2").textContent = "Got it."; });
})();
