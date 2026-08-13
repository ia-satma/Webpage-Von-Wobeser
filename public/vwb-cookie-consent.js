(() => {
  "use strict";

  const COOKIE = "vwb_cookie_consent";
  const OPEN_EVENT = "vwb:open-cookie-preferences";
  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  let config = null;
  let choice = null;
  let lastFocus = null;

  const lang = () => document.documentElement.lang.toLowerCase().startsWith("es") ? "es" : "en";
  const text = (key) => {
    const value = config?.[key];
    return typeof value === "object" ? (value[lang()] || value.en || value.es || "") : (value || "");
  };
  const secureAttribute = () => location.protocol === "https:" ? "; Secure" : "";
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);

  const read = () => {
    try {
      const raw = document.cookie.split(";").map((value) => value.trim()).find((value) => value.startsWith(`${COOKIE}=`));
      if (!raw) return null;
      const data = JSON.parse(decodeURIComponent(raw.slice(COOKIE.length + 1)));
      if (data.version !== config.version || Date.parse(data.expiresAt) <= Date.now()) return null;
      if (!data.categories || data.categories.essential !== true) return null;
      return data;
    } catch {
      return null;
    }
  };

  const write = (categories) => {
    const months = Math.max(1, Math.min(12, Number(config.validityMonths) || 6));
    const expires = new Date();
    expires.setMonth(expires.getMonth() + months);
    choice = {
      version: config.version,
      categories: {
        essential: true,
        analytics: categories.analytics === true,
        external: categories.external === true,
      },
      decidedAt: new Date().toISOString(),
      expiresAt: expires.toISOString(),
    };
    document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(choice))}; Max-Age=${Math.round((expires.getTime() - Date.now()) / 1000)}; Path=/; SameSite=Lax${secureAttribute()}`;
    apply();
    window.dispatchEvent(new CustomEvent("vwb:consent-changed", { detail: choice }));
  };

  const gaCookieNames = () => document.cookie
    .split(";")
    .map((value) => value.trim().split("=")[0])
    .filter((name) => name === "_ga" || name === "_gid" || name === "_gat" || name.startsWith("_ga_"));

  const clearGa = () => {
    if (config?.ga4Id) window[`ga-disable-${config.ga4Id}`] = true;
    if (window.gtag) window.gtag("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    const hostParts = location.hostname.split(".");
    const domains = [location.hostname];
    if (hostParts.length > 2) domains.push(`.${hostParts.slice(-2).join(".")}`);
    gaCookieNames().forEach((name) => {
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${secureAttribute()}`;
      domains.forEach((domain) => {
        document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${domain}; SameSite=Lax${secureAttribute()}`;
      });
    });
  };

  const loadAnalytics = () => {
    if (!config.analyticsEnabled || !/^G-[A-Z0-9]+$/i.test(config.ga4Id || "")) return;
    window[`ga-disable-${config.ga4Id}`] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
    window.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    if (!document.querySelector("script[data-vwb-ga4]")) {
      const script = document.createElement("script");
      script.async = true;
      script.dataset.vwbGa4 = "true";
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.ga4Id)}`;
      document.head.appendChild(script);
      window.gtag("js", new Date());
      window.gtag("config", config.ga4Id, { anonymize_ip: true });
    }
  };

  const provider = (url) => /youtu/i.test(url) ? "YouTube" : /vimeo/i.test(url) ? "Vimeo" : /google|gstatic/i.test(url) ? "Google Maps" : (lang() === "es" ? "contenido externo" : "external content");

  const facade = (element) => {
    if (element.previousElementSibling?.classList.contains("vwb-external-consent")) return;
    const url = element.dataset.vwbConsentSrc || "";
    const box = document.createElement("div");
    box.className = "vwb-external-consent";
    box.innerHTML = `<div class="vwb-external-consent__inner"><h3>${esc(text("externalTitle"))}</h3><p>${esc(text("externalBlocked").replace("{provider}", provider(url)))}</p><button type="button">${esc(text("allowExternal"))}</button></div>`;
    box.querySelector("button").addEventListener("click", () => {
      write({ analytics: !!choice?.categories?.analytics, external: true });
      closeDialog();
    });
    element.hidden = true;
    element.parentNode.insertBefore(box, element);
  };

  const applyExternalFrames = () => document.querySelectorAll("[data-vwb-consent-src]").forEach((element) => {
    if (choice?.categories?.external) {
      const facadeElement = element.previousElementSibling;
      if (facadeElement?.classList.contains("vwb-external-consent")) facadeElement.remove();
      if (!element.getAttribute("src")) element.setAttribute("src", element.dataset.vwbConsentSrc);
      element.hidden = false;
    } else {
      element.removeAttribute("src");
      facade(element);
    }
  });

  const applyExternalImages = () => document.querySelectorAll("[data-vwb-consent-image-src]").forEach((element) => {
    const original = element.dataset.vwbConsentImageSrc;
    const placeholder = element.dataset.vwbConsentPlaceholder || "";
    element.setAttribute("src", choice?.categories?.external ? original : placeholder);
  });

  const embedAttributes = [
    ["data-embed", "data-vwb-consent-embed"],
    ["data-desktop-embed", "data-vwb-consent-desktop-embed"],
    ["data-mobile-embed", "data-vwb-consent-mobile-embed"],
  ];
  const applyEmbeds = () => embedAttributes.forEach(([active, gated]) => document.querySelectorAll(`[${active}],[${gated}]`).forEach((element) => {
    if (choice?.categories?.external) {
      const value = element.getAttribute(gated);
      if (value && !element.getAttribute(active)) element.setAttribute(active, value);
    } else {
      const value = element.getAttribute(active);
      if (value) {
        element.setAttribute(gated, value);
        element.removeAttribute(active);
      }
    }
  }));

  const apply = () => {
    if (choice?.categories?.analytics) loadAnalytics();
    else clearGa();
    applyExternalFrames();
    applyExternalImages();
    applyEmbeds();
  };

  const labels = () => ({
    title: text("bannerTitle"), body: text("bannerBody"), accept: text("acceptAll"), reject: text("rejectOptional"),
    configure: text("configure"), policy: text("policyLabel"), policyUrl: lang() === "es" ? "/politica-de-cookies" : "/cookie-policy",
  });

  const banner = () => {
    const labelsValue = labels();
    const element = document.createElement("section");
    element.className = "vwb-consent";
    element.setAttribute("role", "region");
    element.setAttribute("aria-labelledby", "vwb-consent-title");
    element.innerHTML = `<div><h2 id="vwb-consent-title">${esc(labelsValue.title)}</h2><p>${esc(labelsValue.body)} <a href="${labelsValue.policyUrl}">${esc(labelsValue.policy)}</a></p></div><div class="vwb-consent__actions"><button type="button" data-action="reject">${esc(labelsValue.reject)}</button><button type="button" data-action="configure">${esc(labelsValue.configure)}</button><button type="button" data-action="accept">${esc(labelsValue.accept)}</button></div>`;
    element.addEventListener("click", (event) => {
      const action = event.target.closest("button")?.dataset.action;
      if (action === "accept") { write({ analytics: true, external: true }); element.remove(); }
      if (action === "reject") { write({ analytics: false, external: false }); element.remove(); }
      if (action === "configure") openDialog();
    });
    document.body.appendChild(element);
  };

  const closeDialog = () => {
    const dialog = document.querySelector(".vwb-consent-dialog");
    if (!dialog || dialog.hasAttribute("hidden")) return;
    dialog.setAttribute("hidden", "");
    lastFocus?.focus?.();
  };

  const trapFocus = (event) => {
    const dialog = document.querySelector(".vwb-consent-dialog:not([hidden])");
    if (!dialog || event.key !== "Tab") return;
    const focusable = [...dialog.querySelectorAll(FOCUSABLE)].filter((element) => !element.hasAttribute("hidden"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  const openDialog = () => {
    lastFocus = document.activeElement;
    let element = document.querySelector(".vwb-consent-dialog");
    if (!element) {
      element = document.createElement("div");
      element.className = "vwb-consent-dialog";
      element.setAttribute("role", "dialog");
      element.setAttribute("aria-modal", "true");
      element.setAttribute("aria-labelledby", "vwb-consent-preferences-title");
      element.setAttribute("aria-describedby", "vwb-consent-preferences-body");
      element.innerHTML = `<div class="vwb-consent-dialog__panel"><button type="button" class="vwb-consent-dialog__close" data-action="cancel" aria-label="${esc(text("cancel"))}">×</button><h2 id="vwb-consent-preferences-title">${esc(text("preferencesTitle"))}</h2><p id="vwb-consent-preferences-body" class="vwb-consent-dialog__intro">${esc(text("preferencesBody"))}</p>${["essential", "analytics", "external"].map((key, index) => `<div class="vwb-consent-category"><div><h3>${esc(text(`${key}Title`))}</h3><p>${esc(text(`${key}Description`))}</p></div>${index === 0 ? `<strong>${esc(text("alwaysActive"))}</strong>` : `<input type="checkbox" data-category="${key}" aria-label="${esc(text(`${key}Title`))}">`}</div>`).join("")}<div class="vwb-consent-dialog__actions"><button type="button" data-action="cancel">${esc(text("cancel"))}</button><button type="button" data-action="reject">${esc(text("rejectOptional"))}</button><button type="button" data-action="save">${esc(text("savePreferences"))}</button></div></div>`;
      element.addEventListener("click", (event) => {
        if (event.target === element || event.target.closest('[data-action="cancel"]')) closeDialog();
        if (event.target.closest('[data-action="reject"]')) {
          write({ analytics: false, external: false }); closeDialog(); document.querySelector(".vwb-consent")?.remove();
        }
        if (event.target.closest('[data-action="save"]')) {
          write({
            analytics: !!element.querySelector('[data-category="analytics"]').checked,
            external: !!element.querySelector('[data-category="external"]').checked,
          });
          closeDialog(); document.querySelector(".vwb-consent")?.remove();
        }
      });
      document.body.appendChild(element);
    }
    element.querySelector('[data-category="analytics"]').checked = !!choice?.categories?.analytics;
    element.querySelector('[data-category="external"]').checked = !!choice?.categories?.external;
    element.removeAttribute("hidden");
    element.querySelector("button,input")?.focus();
  };

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDialog();
    trapFocus(event);
  });
  document.addEventListener("click", (event) => {
    const gated = event.target.closest("[data-vwb-consent-embed],[data-vwb-consent-desktop-embed],[data-vwb-consent-mobile-embed]");
    if (gated && !choice?.categories?.external) {
      event.preventDefault(); event.stopImmediatePropagation(); openDialog(); return;
    }
    if (event.target.closest("[data-vwb-cookie-preferences]")) { event.preventDefault(); openDialog(); }
  }, true);
  window.addEventListener(OPEN_EVENT, openDialog);

  const requestConfig = () => {
    const url = `/api/public/consent-config?lang=${lang()}`;
    if (typeof window.fetch === "function") {
      return window.fetch(url, { credentials: "same-origin" }).then(async (response) => {
        if (!response.ok) throw new Error("Consent configuration unavailable");
        return response.json();
      });
    }

    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("GET", url, true);
      request.withCredentials = true;
      request.setRequestHeader("Accept", "application/json");
      request.onreadystatechange = () => {
        if (request.readyState !== XMLHttpRequest.DONE) return;
        if (request.status < 200 || request.status >= 300) {
          reject(new Error("Consent configuration unavailable"));
          return;
        }
        try {
          resolve(JSON.parse(request.responseText));
        } catch {
          reject(new Error("Consent configuration invalid"));
        }
      };
      request.onerror = () => reject(new Error("Consent configuration unavailable"));
      request.send();
    });
  };

  async function init() {
    try {
      config = window.__VWB_COOKIE_CONSENT_CONFIG__ || await requestConfig();
      choice = read();
      // Brave and other privacy-first browsers may expose Global Privacy
      // Control. It keeps optional categories denied until the visitor makes a
      // choice, but it must not silently save a decision or hide the banner.
      // Otherwise the visitor has no visible way to review the policy or
      // manage their preferences on a first visit.
      const gpcOptOut = navigator.globalPrivacyControl === true && !choice;
      if (gpcOptOut) clearGa();
      apply();
      if (!choice) banner();
    } catch {
      document.querySelectorAll("[data-vwb-consent-src]").forEach(facade);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
