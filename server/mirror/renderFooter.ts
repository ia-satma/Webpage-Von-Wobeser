import { cfg, isConfigEnabled, type ConfigMap } from "./siteConfig";
import type { Lang } from "./htmlPipeline";

const FALLBACK = {
  firm: "Von Wobeser y Sierra, S.C.",
  address: {
    en: "SOMA Chapultepec Tower, 18th floor. Campos Elíseos 204, Polanco\nEntrance on Arquímedes Street No. 10, 11550 Mexico City",
    es: "Torre SOMA Chapultepec, piso 18. Campos Elíseos 204, Polanco\nAcceso por Calle Arquímedes N.° 10, C.P. 11550, Ciudad de México",
  },
  phone: "+52 (55) 5258 1000",
  website: "vonwobeser.com",
  social: {
    facebook: "https://www.facebook.com/Von-Wobeser-Sierra-SC-1655250134508590/about/?ref=page_internal",
    twitter: "https://x.com/VWySOficial",
    linkedin: "https://mx.linkedin.com/company/von-wobeser-y-sierra",
  },
} as const;

const COPY = {
  en: {
    firm: "THE FIRM",
    capabilities: "CAPABILITIES",
    resources: "RESOURCES",
    contact: "CONTACT",
    follow: "FOLLOW US",
    about: "About us",
    team: "Our team",
    careers: "Careers",
    practices: "Practice areas",
    industries: "Industry groups",
    insights: "News & insights",
    rankings: "Rankings",
    privacy: "Privacy notice",
    cookies: "Cookie policy",
    preferences: "Cookie preferences",
    rights: "All rights reserved.",
    admin: "Administration panel",
    esr: "Socially Responsible Company",
  },
  es: {
    firm: "LA FIRMA",
    capabilities: "CAPACIDADES",
    resources: "RECURSOS",
    contact: "CONTACTO",
    follow: "SÍGUENOS",
    about: "Acerca de Nosotros",
    team: "Nuestro Equipo",
    careers: "Carreras",
    practices: "Áreas de Práctica",
    industries: "Grupos Industriales",
    insights: "Noticias e Insights",
    rankings: "Rankings",
    privacy: "Aviso de privacidad",
    cookies: "Política de cookies",
    preferences: "Preferencias de cookies",
    rights: "Todos los derechos reservados.",
    admin: "Panel de administración",
    esr: "Empresa Socialmente Responsable",
  },
} as const;

type SocialNetwork = keyof typeof FALLBACK.social;

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeExternalUrl(value: string): string {
  try {
    const url = new URL(value);
    return /^(?:http|https):$/.test(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

function safeImageUrl(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (/^\/(?!\/)/.test(trimmed) || /^https?:\/\//i.test(trimmed)) return trimmed;
  return fallback;
}

function websiteHref(value: string): string {
  const trimmed = value.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return `mailto:${trimmed}`;
  if (/^https?:\/\//i.test(trimmed)) return safeExternalUrl(trimmed);
  if (/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9][a-z0-9-]*)+$/i.test(trimmed)) {
    return safeExternalUrl(`https://${trimmed}`);
  }
  return "";
}

function phoneHref(value: string): string {
  const normalized = value.replace(/[^+\d]/g, "");
  return /^\+?\d{7,15}$/.test(normalized) ? `tel:${normalized}` : "";
}

function contactIcon(name: "building" | "phone" | "mail"): string {
  const paths = {
    building: '<path d="M3.5 20.5h17M5.5 20.5V4.5h9v16M14.5 9.5h4v11M8.5 7.5h1M11.5 7.5h1M8.5 10.5h1M11.5 10.5h1M8.5 13.5h1M11.5 13.5h1M8.5 16.5h1M11.5 16.5h1"/>',
    phone: '<path d="M7.1 3.8 5.2 4.7c-.8.4-1.2 1.3-.9 2.2 1.6 5.2 5.5 9.1 10.7 10.7.9.3 1.8-.1 2.2-.9l.9-1.9-3.4-2.1-1.5 1.5c-2.2-1.1-3.9-2.8-5-5l1.5-1.5L7.1 3.8Z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="m4 6 8 7 8-7"/>',
  };
  return `<svg class="vwb-site-footer__contact-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name]}</svg>`;
}

function lockIcon(): string {
  return '<svg class="vwb-site-footer__admin-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><rect x="3.5" y="7" width="9" height="6.5" rx=".8" fill="none"/><path d="M5.5 7V5.3a2.5 2.5 0 0 1 5 0V7" fill="none"/></svg>';
}

function listItem(label: string, href: string): string {
  return `<li><a href="${href}">${label}</a></li>`;
}

function socialLink(network: SocialNetwork, href: string): string {
  const labels: Record<SocialNetwork, string> = { facebook: "Facebook", twitter: "X", linkedin: "LinkedIn" };
  const icons: Record<SocialNetwork, string> = {
    facebook: "/images/icon_facebook_gray.png",
    twitter: "/images/icon_twitter_gray.png",
    linkedin: "/images/icon_linkedin_gray.png",
  };
  return `<a class="vwb-site-footer__social-link" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" aria-label="${labels[network]}" title="${labels[network]}"><img src="${icons[network]}" width="22" height="22" alt="" decoding="async"></a>`;
}

/**
 * Reemplaza el footer legacy por el pie central del espejo. La envoltura
 * exterior #footer ya aporta la semántica de footer; por eso el reemplazo es
 * un div y evita anidar elementos <footer> en los HTML históricos.
 */
export function renderPublicFooter(html: string, config: ConfigMap, lang: Lang): string {
  const copy = COPY[lang];
  const value = (key: string, fallback = "") => cfg(config, key, lang).trim() || fallback;
  const firm = value("footer_firm", FALLBACK.firm);
  const address = value("footer_address", FALLBACK.address[lang]);
  const phone = value("footer_phone", FALLBACK.phone);
  const website = value("footer_website", FALLBACK.website);
  const websiteLink = websiteHref(website);
  const phoneLink = phoneHref(phone);
  const esrSource = safeImageUrl(value("footer_esr_image", "/templates/beez3/img/esr.jpg"), "/templates/beez3/img/esr.jpg");
  const esrAlt = value("footer_esr_alt", copy.esr);
  const social = (network: SocialNetwork, defaultVisible = true) => {
    if (!isConfigEnabled(config, `footer_${network}_visible`, defaultVisible)) return "";
    const href = safeExternalUrl(value(`footer_${network}`, FALLBACK.social[network]));
    return href ? socialLink(network, href) : "";
  };
  const socialLinks = [social("facebook", false), social("linkedin"), social("twitter")].filter(Boolean).join("");
  const addressLines = address.split(/\r?\n/).filter(Boolean).map(escapeHtml).join("<br>");
  const contactRows = [
    addressLines ? `<div class="vwb-site-footer__contact-row">${contactIcon("building")}<address>${addressLines}</address></div>` : "",
    phone ? `<div class="vwb-site-footer__contact-row">${contactIcon("phone")}${phoneLink ? `<a href="${phoneLink}">${escapeHtml(phone)}</a>` : `<span>${escapeHtml(phone)}</span>`}</div>` : "",
    website ? `<div class="vwb-site-footer__contact-row">${contactIcon("mail")}${websiteLink ? `<a href="${escapeHtml(websiteLink)}">${escapeHtml(website)}</a>` : `<span>${escapeHtml(website)}</span>`}</div>` : "",
  ].join("");
  const paths = lang === "es"
    ? {
      about: "/acerca-de", team: "/attorneys", careers: "/bolsa-de-trabajo", contact: "/contacto",
      practices: "/capacidades/practicas", industries: "/capacidades/industrias",
      insights: "/perspectivas", rankings: "/perspectivas/reconocimientos", privacy: "/aviso", cookies: "/politica-de-cookies",
    }
    : {
      about: "/about", team: "/attorneys?lang=en", careers: "/careers", contact: "/contact",
      practices: "/capabilities/practices", industries: "/capabilities/industries",
      insights: "/insights", rankings: "/insights/recognitions", privacy: "/privacy", cookies: "/cookie-policy",
    };
  const year = new Date().getFullYear();

  const footer = `<div class="footer footer_fix vwb-site-footer">
  <div class="vwb-site-footer__inner">
    <div class="vwb-site-footer__grid">
      <section class="vwb-site-footer__brand" aria-label="${escapeHtml(firm)}">
        <a class="vwb-site-footer__brand-link" href="${lang === "es" ? "/index.php/home/" : "/"}" aria-label="${lang === "es" ? "Ir al inicio" : "Go to home"}">
          <img class="vwb-site-footer__logo" src="/images/vw40F.png" width="1150" height="769" alt="" decoding="async">
          <span class="vwb-site-footer__brand-name">${escapeHtml(firm)}</span>
        </a>
      </section>
      <nav class="vwb-site-footer__column" aria-label="${copy.firm}">
        <h2>${copy.firm}</h2>
        <ul>${listItem(copy.about, paths.about)}${listItem(copy.team, paths.team)}${listItem(copy.careers, paths.careers)}${listItem(copy.contact, paths.contact)}</ul>
      </nav>
      <nav class="vwb-site-footer__column" aria-label="${copy.capabilities}">
        <h2>${copy.capabilities}</h2>
        <ul>${listItem(copy.practices, paths.practices)}${listItem(copy.industries, paths.industries)}</ul>
      </nav>
      <nav class="vwb-site-footer__column" aria-label="${copy.resources}">
        <h2>${copy.resources}</h2>
        <ul>${listItem(copy.insights, paths.insights)}${listItem(copy.rankings, paths.rankings)}</ul>
      </nav>
      <section class="vwb-site-footer__contact" aria-labelledby="vwb-site-footer-contact-title">
        <h2 id="vwb-site-footer-contact-title">${copy.contact}</h2>
        <div class="vwb-site-footer__contact-list">${contactRows}</div>
        ${socialLinks ? `<div class="vwb-site-footer__socials"><h2>${copy.follow}</h2><div>${socialLinks}</div></div>` : ""}
      </section>
    </div>
    <div class="vwb-site-footer__bottom">
      <p class="vwb-site-footer__copyright">© ${year} ${escapeHtml(firm)}. ${copy.rights}</p>
      <aside class="vwb-site-footer__esr" aria-label="${escapeHtml(esrAlt)}"><img src="${escapeHtml(esrSource)}" alt="${escapeHtml(esrAlt)}" loading="lazy" decoding="async"></aside>
      <nav class="vwb-site-footer__legal" aria-label="${lang === "es" ? "Información legal" : "Legal information"}">
        <a href="${paths.privacy}">${copy.privacy}</a><span aria-hidden="true"></span><a href="${paths.cookies}">${copy.cookies}</a><span aria-hidden="true"></span><a href="#cookie-preferences" data-vwb-cookie-preferences="true">${copy.preferences}</a><a class="vwb-site-footer__admin-link" href="/admin" target="_blank" rel="noopener" title="${copy.admin}" aria-label="${copy.admin}">${lockIcon()}</a>
      </nav>
    </div>
  </div>
</div>`;

  const legacyFooter = /<footer\b(?=[^>]*\bclass=["'][^"']*\bfooter_fix\b[^"']*["'])[^>]*>[\s\S]*?<\/footer>/i;
  return legacyFooter.test(html) ? html.replace(legacyFooter, footer) : html;
}
