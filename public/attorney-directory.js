(function () {
  "use strict";

  var directory = document.querySelector("[data-attorney-directory]");
  if (!directory) return;

  var form = directory.querySelector("[data-attorney-filter-form]");
  var query = directory.querySelector("[data-attorney-q]");
  var role = directory.querySelector("[data-attorney-role]");
  var practice = directory.querySelector("[data-attorney-practice]");
  var letter = directory.querySelector("[data-attorney-letter]");
  var letterOptions = Array.prototype.slice.call(directory.querySelectorAll("[data-attorney-letter-option]"));
  var initials = directory.querySelector("[data-attorney-initials]");
  var initialLabel = directory.querySelector("[data-attorney-initial-label]");
  var clear = directory.querySelector("[data-attorney-clear]");
  var status = directory.querySelector("[data-attorney-count]");
  var empty = directory.querySelector("[data-attorney-empty]");
  var entries = Array.prototype.slice.call(directory.querySelectorAll("[data-attorney-result]")).map(function (row) {
    return {
      initials: "|" + (row.dataset.nameInitials || "") + "|",
      name: row.dataset.name || "",
      practices: "|" + (row.dataset.practices || "") + "|",
      role: row.dataset.role || "",
      row: row,
    };
  });
  var groups = Array.prototype.slice.call(directory.querySelectorAll("[data-attorney-group]"));
  var inputFrame = 0;

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase();
  }

  function valuesFromUrl() {
    var params = new URLSearchParams(window.location.search);
    query.value = params.get("q") || "";
    role.value = params.get("role") || "";
    practice.value = params.get("practice") || "";
    setLetter(params.has("set-letter") ? params.get("set-letter") : (params.get("letter") || ""));
  }

  function setLetter(value) {
    letter.value = String(value || "").toUpperCase();
    if (initialLabel) initialLabel.textContent = letter.value || "A–Z";
    letterOptions.forEach(function (option) {
      var active = option.value === letter.value;
      option.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function updateUrl(mode) {
    var url = new URL(window.location.href);
    ["q", "role", "practice", "letter", "set-letter"].forEach(function (key) { url.searchParams.delete(key); });
    if (query.value.trim()) url.searchParams.set("q", query.value.trim());
    if (role.value) url.searchParams.set("role", role.value);
    if (practice.value) url.searchParams.set("practice", practice.value);
    if (letter.value) url.searchParams.set("letter", letter.value);
    window.history[mode + "State"]({}, "", url.pathname + (url.search || "") + url.hash);
  }

  function apply() {
    var q = normalize(query.value).trim();
    var selectedRole = role.value;
    var selectedPractice = practice.value;
    var selectedLetter = letter.value;
    var changedRows = [];
    var visible = 0;

    entries.forEach(function (entry) {
      var matches = (!q || entry.name.indexOf(q) !== -1)
        && (!selectedRole || entry.role === selectedRole)
        && (!selectedPractice || entry.practices.indexOf("|" + selectedPractice + "|") !== -1)
        && (!selectedLetter || entry.initials.indexOf("|" + selectedLetter + "|") !== -1);
      var shouldHide = !matches;
      if (entry.row.hidden !== shouldHide) {
        entry.row.hidden = shouldHide;
        changedRows.push(entry.row);
      }
      if (matches) visible += 1;
    });

    groups.forEach(function (group) {
      var shouldHide = !group.querySelector("[data-attorney-result]:not([hidden])");
      if (group.hidden !== shouldHide) group.hidden = shouldHide;
    });

    empty.hidden = visible !== 0;
    clear.hidden = !(query.value.trim() || role.value || practice.value || letter.value);
    var singular = status.dataset.singular || "result";
    var plural = status.dataset.plural || "results";
    status.textContent = visible + " " + (visible === 1 ? singular : plural);
    return changedRows;
  }

  function animateUpdate(changedRows) {
    if (!changedRows.length || typeof status.animate !== "function"
      || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) return;

    var options = { duration: 180, easing: "cubic-bezier(.16,1,.3,1)" };
    status.animate([
      { opacity: 0.55, transform: "translateY(-2px)" },
      { opacity: 1, transform: "translateY(0)" },
    ], options);
    changedRows.filter(function (row) { return !row.hidden; }).slice(0, 6).forEach(function (row) {
      row.animate([
        { opacity: 0.72, transform: "translateY(3px)" },
        { opacity: 1, transform: "translateY(0)" },
      ], options);
    });
  }

  function applyAndSync(mode) {
    if (inputFrame) {
      window.cancelAnimationFrame(inputFrame);
      inputFrame = 0;
    }
    var changedRows = apply();
    updateUrl(mode || "replace");
    animateUpdate(changedRows);
  }

  function scheduleInputApply() {
    if (inputFrame) return;
    inputFrame = window.requestAnimationFrame(function () {
      inputFrame = 0;
      applyAndSync("replace");
    });
  }

  query.addEventListener("input", scheduleInputApply);
  [role, practice].forEach(function (control) {
    control.addEventListener("change", function () { applyAndSync("replace"); });
  });

  letterOptions.forEach(function (option) {
    option.addEventListener("click", function (event) {
      event.preventDefault();
      setLetter(option.value);
      applyAndSync("push");
      if (initials) initials.open = false;
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    applyAndSync("push");
  });

  clear.addEventListener("click", function (event) {
    event.preventDefault();
    query.value = "";
    role.value = "";
    practice.value = "";
    setLetter("");
    applyAndSync("push");
    if (initials) initials.open = false;
    query.focus();
  });

  window.addEventListener("popstate", function () {
    valuesFromUrl();
    apply();
  });

  valuesFromUrl();
  apply();
}());
