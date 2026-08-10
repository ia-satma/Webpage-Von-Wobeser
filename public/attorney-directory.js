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
  var clear = directory.querySelector("[data-attorney-clear]");
  var status = directory.querySelector("[data-attorney-count]");
  var empty = directory.querySelector("[data-attorney-empty]");
  var rows = Array.prototype.slice.call(directory.querySelectorAll("[data-attorney-result]"));
  var groups = Array.prototype.slice.call(directory.querySelectorAll("[data-attorney-group]"));

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
    var visible = 0;

    rows.forEach(function (row) {
      var matches = (!q || (row.dataset.name || "").indexOf(q) !== -1)
        && (!role.value || row.dataset.role === role.value)
        && (!practice.value || (row.dataset.practices || "").split("|").indexOf(practice.value) !== -1)
        && (!letter.value || (row.dataset.nameInitials || "").split("|").indexOf(letter.value) !== -1);
      row.hidden = !matches;
      if (matches) visible += 1;
    });

    groups.forEach(function (group) {
      group.hidden = !group.querySelector("[data-attorney-result]:not([hidden])");
    });

    empty.hidden = visible !== 0;
    clear.hidden = !(query.value.trim() || role.value || practice.value || letter.value);
    setLetter(letter.value);
    var singular = status.dataset.singular || "result";
    var plural = status.dataset.plural || "results";
    status.textContent = visible + " " + (visible === 1 ? singular : plural);
  }

  function applyAndSync(mode) {
    apply();
    updateUrl(mode || "replace");
  }

  query.addEventListener("input", function () { applyAndSync("replace"); });
  [role, practice].forEach(function (control) {
    control.addEventListener("change", function () { applyAndSync("replace"); });
  });

  letterOptions.forEach(function (option) {
    option.addEventListener("click", function (event) {
      event.preventDefault();
      setLetter(option.value);
      applyAndSync("push");
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
    query.focus();
  });

  window.addEventListener("popstate", function () {
    valuesFromUrl();
    apply();
  });

  valuesFromUrl();
  apply();
}());
