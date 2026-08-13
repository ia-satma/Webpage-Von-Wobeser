(() => {
  "use strict";

  const sameOriginPath = (value) => {
    try {
      const url = new URL(String(value || ""), window.location.origin);
      if (url.origin !== window.location.origin || !url.pathname.startsWith("/")) return "";
      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return "";
    }
  };

  const closest = (target, selector) => target instanceof Element ? target.closest(selector) : null;

  document.addEventListener("click", (event) => {
    const action = closest(event.target, "[data-vw-action], [data-vw-navigate], [data-vw-legacy-auf], [data-vw-legacy-tab]");
    if (!action) return;

    const type = action.getAttribute("data-vw-action");
    if (type === "print") {
      event.preventDefault();
      window.print();
      return;
    }

    if (type === "legacy-ref") {
      const destination = sameOriginPath(action.getAttribute("data-url"));
      if (!destination) return;
      event.preventDefault();
      window.location.assign(destination);
      return;
    }

    if (type === "popup-print" || type === "popup-email") {
      const destination = sameOriginPath(action.getAttribute("href"));
      if (!destination) return;
      event.preventDefault();
      const features = type === "popup-email"
        ? "noopener,noreferrer,width=400,height=350,menubar=yes,resizable=yes"
        : "noopener,noreferrer,status=no,toolbar=no,scrollbars=yes,titlebar=no,menubar=no,resizable=yes,width=640,height=480,directories=no,location=no";
      const popup = window.open(destination, "_blank", features);
      if (!popup) window.location.assign(destination);
      return;
    }

    const destination = sameOriginPath(action.getAttribute("data-vw-navigate"));
    if (destination) {
      event.preventDefault();
      window.location.assign(destination);
      return;
    }

    const tabTarget = action.getAttribute("data-vw-legacy-tab");
    if (tabTarget && /^module_\d+$/.test(tabTarget)) {
      event.preventDefault();
      if (typeof window.tabshow === "function") window.tabshow(tabTarget);
      return;
    }

    const aufTarget = action.getAttribute("data-vw-legacy-auf");
    if (aufTarget && /^(?:module_\d+|right)$/.test(aufTarget)) {
      event.preventDefault();
      if (typeof window.auf === "function") window.auf(aufTarget);
    }
  }, true);

  document.addEventListener("change", (event) => {
    const element = closest(event.target, "[data-vw-action]");
    if (!element) return;

    if (element.getAttribute("data-vw-action") === "submit-on-change") {
      const form = element.closest("form");
      if (form instanceof HTMLFormElement) form.submit();
      return;
    }

    if (element.getAttribute("data-vw-action") === "career-file-name" && element instanceof HTMLInputElement) {
      const output = document.getElementById("filename");
      if (output instanceof HTMLInputElement) output.value = element.files?.[0]?.name || "";
    }
  });
})();
