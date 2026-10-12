(() => {
  "use strict";
  const VERSION = "0.1.0";

  // ---------- AI (Linje tab) ----------
  // Fill in after deploying supabase/functions/rim-ai (see README). Empty = the app runs without AI.
  // The anon key is meant to be public.
  const AI = { url: "", anonKey: "" };

  // ---------- Phone view on desktop (same as 99MS) ----------
  const framed = window.self !== window.top;
  if (framed) document.documentElement.classList.add("in-frame");
  const desktop = matchMedia("(hover: hover) and (pointer: fine)").matches && Math.min(screen.width, window.innerWidth) >= 820;
  const PV_KEY = "99rim-phone-view";
  const pvGet = () => { try { return localStorage.getItem(PV_KEY) === "1"; } catch { return false; } };
  const pvSet = (on) => { try { on ? localStorage.setItem(PV_KEY, "1") : localStorage.removeItem(PV_KEY); } catch {} };
  const toggle = document.getElementById("view-toggle");
  if (desktop && !framed) {
    toggle.hidden = false;
    toggle.addEventListener("click", () => { pvSet(!pvGet()); location.reload(); });
    if (pvGet()) {
      document.body.classList.add("phone-host");
      toggle.title = toggle.ariaLabel = "Computervisning";
      toggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="4" width="19" height="12.5" rx="1.6"></rect><path d="M9 20h6M12 16.5V20"></path></svg>';
      const stage = document.getElementById("phone-stage");
      stage.innerHTML = `
        <div class="device" id="device">
          <div class="device-screen">
            <iframe title="99RIM telefonvisning"></iframe>
            <div class="statusbar" aria-hidden="true"><span class="sb-time" id="sb-time"></span></div>
            <div class="island" aria-hidden="true"></div>
            <div class="home-ind" aria-hidden="true"></div>
          </div>
        </div>`;
      stage.querySelector("iframe").src = location.pathname + "?frame=1" + location.hash;
      stage.hidden = false;
      const device = document.getElementById("device");
      const fit = () => device.style.setProperty("--s", Math.min(1, (innerHeight - 40) / 896, (innerWidth - 40) / 424).toFixed(4));
      fit(); addEventListener("resize", fit);
      const fmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
      const tick = () => { document.getElementById("sb-time").textContent = fmt.format(new Date()).replace(/\s?[AP]M$/i, ""); };
      tick(); setInterval(tick, 10000);
      return; // the framed copy runs the app
    }
  }

  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = new Intl.NumberFormat("da-DK");

  // ---------- Saved state (this device only) ----------
  const KEY = "99rim";
  const state = Object.assign({ tab: "find", ui: "da", same: false, recent: [], saved: [], pad: "" }, (() => {
    try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
  })());
  let saveT = null;
  const persist = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }, 200); };

  // ---------- Text ----------
  const TEXT = {
    da: {
      "tab.find": "Find", "tab.line": "Linje", "tab.book": "Noter", "tab.settings": "Indstillinger",
      "find.placeholder": "Skriv et ord", "find.meaning": "Betydning", "find.more": "Vis flere", "find.recent": "Seneste",
      "find.intro": "Skriv et ord eller en vending, fx \"kærlighed\" eller \"os to\". Rimene findes på din telefon ud fra udtalen, så det går hurtigt og virker uden net.",
      "find.loading": "Henter ordbogen…", "find.loadFail": "Ordbogen kunne ikke hentes. Tjek din forbindelse og genindlæs siden.",
      "band.all": "Alle", "band.perfect": "Perfekte", "band.near": "Næsten",
      "find.none": "Ingen rim fundet. Prøv et andet ord eller en kortere vending.",
      "find.noneFilter": "Ingen rim med det filter.",
      "find.count": (n) => `${num.format(n)} rim`,
      "find.syl": (n) => `${n} ${n === 1 ? "stavelse" : "stavelser"}`,
      "find.guessed": (w) => `udtalen af "${w}" er gættet`,
      "find.depth": (d) => d === 1 ? "Rimer på sidste stavelse" : `Rimer på ${d} stavelser`,
      "find.sylAll": "Alle længder",
      "line.title": "Rim til en linje", "line.placeholder": "Skriv din linje…", "line.go": "Find rim", "line.ai": "AI's valg",
      "line.local": (w) => `Rim på "${w}"`,
      "line.noAi": "AI er ikke slået til endnu. Her er rimene på linjens sidste ord.",
      "line.aiFail": "AI'en svarede ikke. Prøv igen om lidt. Rimene herunder virker stadig.",
      "line.thinking": "AI'en læser din linje…",
      "line.next": "Forslag til næste linje",
      "book.title": "Noter", "book.pad": "Tekst", "book.padPlaceholder": "Skriv din tekst her. Den gemmes på denne enhed.",
      "book.rhymeLast": "Rim på sidste ord", "book.saved": "Gemte ord", "book.empty": "Tryk på et rim og vælg \"Gem i noter\" for at gemme det her.",
      "book.savedAt": "Gemt", "book.remove": "Fjern",
      "set.title": "Indstillinger", "set.ui": "Sprog i appen", "set.rhymes": "Rim", "set.soon": "snart",
      "set.same": "Vis sammensatte ord med samme slutning (fx \"sommerhus\" til \"hus\")", "set.about": "Om 99RIM",
      "set.aboutText": "99RIM finder rim ud fra udtale, ikke stavning. Ordbogen har ca. 29.000 almindelige danske ord med udtale fra eSpeak NG. Enkelte udtaler kan være forkerte. AI'en på Linje-fanen vælger kun blandt rim, appen selv har fundet.",
      "ws.copy": "Kopiér", "ws.save": "Gem i noter", "ws.unsave": "Fjern fra noter", "ws.search": "Find rim på dette ord", "ws.meaning": "Betydning (ordnet.dk)", "ws.close": "Luk",
      "ws.info": (r) => `${r.score} / 100 · ${r.syl} ${r.syl === 1 ? "stavelse" : "stavelser"}`,
      "toast.copied": "Kopieret", "toast.saved": "Gemt i noter", "toast.removed": "Fjernet fra noter", "toast.noWord": "Skriv noget først",
    },
    en: {
      "tab.find": "Find", "tab.line": "Line", "tab.book": "Notes", "tab.settings": "Settings",
      "find.placeholder": "Type a word", "find.meaning": "Meaning", "find.more": "Show more", "find.recent": "Recent",
      "find.intro": "Type a Danish word or phrase, like \"kærlighed\" or \"os to\". Rhymes are found on your phone from the pronunciation, so it's fast and works offline.",
      "find.loading": "Loading the dictionary…", "find.loadFail": "Couldn't load the dictionary. Check your connection and reload.",
      "band.all": "All", "band.perfect": "Perfect", "band.near": "Near",
      "find.none": "No rhymes found. Try another word or a shorter phrase.",
      "find.noneFilter": "No rhymes with that filter.",
      "find.count": (n) => `${num.format(n)} rhymes`,
      "find.syl": (n) => `${n} ${n === 1 ? "syllable" : "syllables"}`,
      "find.guessed": (w) => `pronunciation of "${w}" is a guess`,
      "find.depth": (d) => d === 1 ? "Rhymes on the last syllable" : `Rhymes on ${d} syllables`,
      "find.sylAll": "Any length",
      "line.title": "Rhymes for a line", "line.placeholder": "Write your line…", "line.go": "Find rhymes", "line.ai": "AI picks",
      "line.local": (w) => `Rhymes for "${w}"`,
      "line.noAi": "AI isn't switched on yet. Here are the rhymes for the line's last word.",
      "line.aiFail": "The AI didn't answer. Try again in a moment. The rhymes below still work.",
      "line.thinking": "The AI is reading your line…",
      "line.next": "Ideas for the next line",
      "book.title": "Notes", "book.pad": "Lyrics", "book.padPlaceholder": "Write your lyrics here. They're saved on this device.",
      "book.rhymeLast": "Rhyme the last word", "book.saved": "Saved words", "book.empty": "Tap a rhyme and choose \"Save to notes\" to keep it here.",
      "book.savedAt": "Saved", "book.remove": "Remove",
      "set.title": "Settings", "set.ui": "App language", "set.rhymes": "Rhymes", "set.soon": "soon",
      "set.same": "Show compounds with the same ending (like \"sommerhus\" for \"hus\")", "set.about": "About 99RIM",
      "set.aboutText": "99RIM finds rhymes by sound, not spelling. The dictionary has about 29,000 common Danish words with pronunciations from eSpeak NG. A few pronunciations may be wrong. The AI on the Line tab only picks from rhymes the app found itself.",
      "ws.copy": "Copy", "ws.save": "Save to notes", "ws.unsave": "Remove from notes", "ws.search": "Find rhymes for this word", "ws.meaning": "Meaning (ordnet.dk)", "ws.close": "Close",
      "ws.info": (r) => `${r.score} / 100 · ${r.syl} ${r.syl === 1 ? "syllable" : "syllables"}`,
      "toast.copied": "Copied", "toast.saved": "Saved to notes", "toast.removed": "Removed from notes", "toast.noWord": "Type something first",
    },
  };
  const t = (k, ...a) => { const v = TEXT[state.ui][k] ?? TEXT.da[k]; return typeof v === "function" ? v(...a) : v; };
  function applyText() {
    document.documentElement.lang = state.ui;
    document.querySelectorAll("[data-t]").forEach((n) => { n.textContent = t(n.dataset.t); });
    document.querySelectorAll("[data-tp]").forEach((n) => { n.placeholder = t(n.dataset.tp); });
    $("version").textContent = `v${VERSION}`;
  }

  let toastT = null;
  function toast(msg) {
    const el = $("toast");
    el.textContent = msg; el.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 1600);
  }

  // ---------- Tabs ----------
  const TABS = ["find", "line", "book", "settings"];
  const tabBtns = [...document.querySelectorAll(".tabbar [data-tab]")];
  function go(tab) {
    if (!TABS.includes(tab)) tab = "find";
    const view = $("v-" + tab);
    if (state.tab === tab && !view.hidden) { view.scrollTo({ top: 0, behavior: "smooth" }); return; }
    state.tab = tab; persist();
    TABS.forEach((k) => { $("v-" + k).hidden = k !== tab; });
    tabBtns.forEach((b) => (b.dataset.tab === tab ? b.setAttribute("aria-current", "page") : b.removeAttribute("aria-current")));
    if (tab === "book") renderBook();
    if (tab === "settings") renderSettings();
  }
  tabBtns.forEach((b) => b.addEventListener("click", () => go(b.dataset.tab)));

  // ---------- Dictionary ----------
  let dict = null;
  const ready = fetch("data/da.tsv")
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then((txt) => { dict = new Rim.Dict(txt); $("loading").hidden = true; })
    .catch(() => { $("loading").textContent = t("find.loadFail"); });

  // ---------- Find ----------
  const PAGE = 150;
  const find = { res: null, band: "all", syl: 0, shown: PAGE };
  const q = $("q");
  let typeT = null;

  function search(text, { keep = true } = {}) {
    text = Rim.normalize(text);
    // While typing, leave the field alone: normalizing would eat the space in "os to".
    if (keep) q.value = text;
    const url = new URL(location.href);
    text ? url.searchParams.set("q", text) : url.searchParams.delete("q");
    history.replaceState(null, "", url);
    if (!text) { find.res = null; renderFind(); return; }
    ready.then(() => {
      if (!dict || Rim.normalize(q.value) !== text) return;
      find.res = dict.find(text, { limit: 5000 });
      find.syl = 0; find.shown = PAGE;
      if (keep) remember(text);
      renderFind();
    });
  }

  function remember(text) {
    if (!find.res || find.res.query !== text || !find.res.total) return;
    state.recent = [text, ...state.recent.filter((r) => r !== text)].slice(0, 12); persist();
  }

  function visible() {
    if (!find.res) return [];
    return find.res.results.filter((r) =>
      (state.same || !r.same) &&
      (find.band === "all" || (find.band === "perfect") === (Rim.band(r.score) === "perfect")) &&
      (!find.syl || (find.syl === 4 ? r.syl >= 4 : r.syl === find.syl)));
  }

  const perfect = (r) => Rim.band(r.score) === "perfect";
  const isSaved = (w) => state.saved.some((s) => s.w === w);
  const wordBtn = (r) =>
    `<button type="button" class="w${perfect(r) ? "" : " near"}${r.same ? " same" : ""}${isSaved(r.word) ? " saved" : ""}" data-w="${esc(r.word)}">${esc(r.word)}${perfect(r) ? "" : `<i>${r.score}</i>`}</button>`;

  function renderFind() {
    const res = find.res;
    const has = !!(res && res.query);
    $("find-empty").hidden = has;
    $("meta").hidden = $("filters").hidden = !has || !res.total;
    $("more").hidden = true;
    if (!has) { $("results").innerHTML = ""; renderRecent(); return; }
    if (!res.total) { $("results").innerHTML = `<p class="empty">${esc(t("find.none"))}</p>`; return; }

    const g = res.guessed.length ? ` · ${t("find.guessed", res.guessed.join(", "))}` : "";
    $("meta-ipa").textContent = `/${res.ipa}/ · ${t("find.syl", res.syl)}${g}`;
    const all = res.results.filter((r) => state.same || !r.same);
    $("meta-count").textContent = t("find.count", all.length);
    const last = res.query.split(" ").pop();
    $("meta-def").href = `https://ordnet.dk/ddo/ordbog?query=${encodeURIComponent(last)}`;

    // Syllable chips only for lengths that exist
    const lens = [...new Set(all.map((r) => Math.min(4, r.syl)))].sort();
    $("syl-chips").innerHTML = [0, ...lens].map((n) =>
      `<button type="button" class="chip" data-syl="${n}" aria-pressed="${find.syl === n}">${n ? (n === 4 ? "4+" : n) : esc(t("find.sylAll"))}</button>`).join("");

    const list = visible();
    if (!list.length) { $("results").innerHTML = `<p class="empty">${esc(t("find.noneFilter"))}</p>`; return; }
    const page = list.slice(0, find.shown);
    const groups = new Map();
    for (const r of page) { if (!groups.has(r.depth)) groups.set(r.depth, []); groups.get(r.depth).push(r); }
    $("results").innerHTML = [...groups.keys()].sort((a, b) => b - a).map((d) => `
      <section class="group">
        <h3 class="sec-title">${esc(t("find.depth", d))} <span>${groups.get(d).length}</span></h3>
        <div class="words">${groups.get(d).map(wordBtn).join("")}</div>
      </section>`).join("");
    $("more").hidden = list.length <= find.shown;
  }

  function renderRecent() {
    $("recent-wrap").hidden = !state.recent.length;
    $("recent").innerHTML = state.recent.map((r) => `<button type="button" class="chip word" data-q="${esc(r)}">${esc(r)}</button>`).join("");
  }

  q.addEventListener("input", () => { clearTimeout(typeT); typeT = setTimeout(() => search(q.value, { keep: false }), 160); });
  $("search-form").addEventListener("submit", (e) => { e.preventDefault(); clearTimeout(typeT); search(q.value); q.blur(); });
  q.addEventListener("blur", () => remember(Rim.normalize(q.value)));
  document.querySelectorAll('input[name="band"]').forEach((r) => r.addEventListener("change", () => { find.band = r.value; find.shown = PAGE; renderFind(); }));
  $("syl-chips").addEventListener("click", (e) => { const c = e.target.closest("[data-syl]"); if (c) { find.syl = +c.dataset.syl; find.shown = PAGE; renderFind(); } });
  $("more").addEventListener("click", () => { find.shown += PAGE; renderFind(); });
  $("recent").addEventListener("click", (e) => { const c = e.target.closest("[data-q]"); if (c) search(c.dataset.q); });

  // ---------- Word actions ----------
  let current = null;
  function openWord(word, from) {
    const r = (find.res && find.res.results.find((x) => x.word === word)) || lineRes.find((x) => x.word === word);
    current = { word, from: from || (find.res && find.res.query) || "" };
    $("ws-word").textContent = word;
    $("ws-info").textContent = r ? t("ws.info", r) : "";
    $("ws-save").textContent = t(isSaved(word) ? "ws.unsave" : "ws.save");
    $("ws-def").href = `https://ordnet.dk/ddo/ordbog?query=${encodeURIComponent(word.split(" ").pop())}`;
    $("word-sheet").hidden = false;
    $("word-sheet").querySelector(".ws-btn").focus();
  }
  const closeWord = () => { $("word-sheet").hidden = true; };
  document.addEventListener("click", (e) => {
    const w = e.target.closest(".w[data-w]");
    if (w) openWord(w.dataset.w, w.dataset.from);
  });
  $("word-sheet").addEventListener("click", async (e) => {
    if (e.target === $("word-sheet")) return closeWord();
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (!act || !current) return;
    if (act === "copy") {
      try { await navigator.clipboard.writeText(current.word); toast(t("toast.copied")); } catch { toast(current.word); }
    } else if (act === "save") {
      if (isSaved(current.word)) { state.saved = state.saved.filter((s) => s.w !== current.word); toast(t("toast.removed")); }
      else { state.saved.unshift({ w: current.word, from: current.from, at: Date.now() }); toast(t("toast.saved")); }
      persist(); renderFind(); renderBook();
    } else if (act === "search") {
      go("find"); search(current.word);
    }
    closeWord();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeWord();
    if (e.key === "/" && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); go("find"); q.focus(); q.select(); }
  });

  // ---------- Line ----------
  let lineRes = [];
  $("line-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const line = $("line-in").value.trim();
    const words = Rim.normalize(line).split(" ").filter(Boolean);
    if (!words.length) return toast(t("toast.noWord"));
    await ready;
    if (!dict) return;
    const last = words[words.length - 1];
    // Two-word endings rhyme better ("os to"): use them when the last word is short.
    const tail = last.length <= 3 && words.length > 1 ? words.slice(-2).join(" ") : last;
    lineRes = dict.find(tail, { limit: 5000 }).results.filter((r) => !r.same);
    $("line-local").hidden = false;
    $("line-local-title").textContent = t("line.local", tail);
    $("line-local-body").innerHTML = lineRes.length
      ? `<div class="words">${lineRes.slice(0, 60).map((r) => wordBtn(r).replace("<button", `<button data-from="${esc(tail)}"`)).join("")}</div>`
      : `<p class="empty">${esc(t("find.none"))}</p>`;

    const box = $("line-ai-body");
    $("line-ai").hidden = !AI.url || !lineRes.length;
    $("line-note").hidden = !!AI.url;
    if ($("line-ai").hidden) return;
    box.innerHTML = `<div class="row-actions"><div class="spinner"></div><span class="note">${esc(t("line.thinking"))}</span></div>`;
    const btn = e.submitter || $("line-form").querySelector(".go");
    btn.disabled = true;
    try {
      const r = await fetch(AI.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: AI.anonKey, Authorization: `Bearer ${AI.anonKey}` },
        body: JSON.stringify({ line, lang: state.ui, candidates: lineRes.slice(0, 120).map((x) => x.word) }),
      });
      if (!r.ok) throw new Error(r.status);
      const data = await r.json();
      box.innerHTML = `
        <div>${data.picks.map((p) => `<div class="pick"><button type="button" class="w" data-w="${esc(p.word)}" data-from="${esc(tail)}">${esc(p.word)}</button><em>${esc(p.why)}</em></div>`).join("")}</div>
        <h3 class="sec-title">${esc(t("line.next"))}</h3>
        <div class="ai-list">${data.lines.map((l) => `<p class="sugg" data-copy="${esc(l)}">${esc(l)}</p>`).join("")}</div>`;
    } catch {
      box.innerHTML = `<p class="note">${esc(t("line.aiFail"))}</p>`;
    } finally {
      btn.disabled = false;
    }
  });
  $("line-ai-body").addEventListener("click", async (e) => {
    const s = e.target.closest("[data-copy]");
    if (!s) return;
    try { await navigator.clipboard.writeText(s.dataset.copy); toast(t("toast.copied")); } catch {}
  });

  // ---------- Notebook ----------
  const pad = $("pad");
  pad.value = state.pad;
  pad.addEventListener("input", () => { state.pad = pad.value; persist(); });
  $("pad-rhyme").addEventListener("click", () => {
    const words = Rim.normalize(pad.value).split(" ").filter(Boolean);
    if (!words.length) return toast(t("toast.noWord"));
    go("find"); search(words[words.length - 1]);
  });
  function renderBook() {
    if (!state.saved.length) { $("saved").innerHTML = `<p class="empty">${esc(t("book.empty"))}</p>`; return; }
    const groups = new Map();
    for (const s of state.saved) { const k = s.from || "–"; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(s); }
    $("saved").innerHTML = [...groups].map(([from, list]) => `
      <div class="saved-row">
        <div><div class="from">${esc(from)}</div><div class="words">${list.map((s) => `<button type="button" class="w" data-w="${esc(s.w)}" data-from="${esc(s.from)}">${esc(s.w)}</button>`).join("")}</div></div>
        <button type="button" class="x" data-rm="${esc(from)}">${esc(t("book.remove"))}</button>
      </div>`).join("");
  }
  $("saved").addEventListener("click", (e) => {
    const rm = e.target.closest("[data-rm]");
    if (!rm) return;
    state.saved = state.saved.filter((s) => (s.from || "–") !== rm.dataset.rm);
    persist(); renderBook(); renderFind();
  });

  // ---------- Settings ----------
  function renderSettings() {
    $("ui-" + state.ui).checked = true;
    $("opt-same").checked = state.same;
  }
  document.querySelectorAll('input[name="ui"]').forEach((r) => r.addEventListener("change", () => {
    state.ui = r.value; persist(); applyText(); renderFind(); renderBook();
  }));
  $("opt-same").addEventListener("change", (e) => { state.same = e.target.checked; persist(); renderFind(); });

  // ---------- Start ----------
  applyText();
  const startQ = new URL(location.href).searchParams.get("q");
  go(startQ ? "find" : state.tab);
  renderFind();
  if (startQ) search(startQ);
  else if (state.tab === "find" && desktop) q.focus();

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
