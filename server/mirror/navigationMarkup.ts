import * as cheerio from "cheerio";
import { NAVIGATION_LANDING_CHILD_IDS } from "@shared/navigation";
import type { PublicNavigationMenu } from "./navigationMenu";

const LANDING_CHILD_IDS = new Set<string>(NAVIGATION_LANDING_CHILD_IDS);

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function landingLabel(id: string, lang: "en" | "es", classic: boolean): string {
  if (classic) {
    const classicLabels: Record<string, [string, string]> = {
      firm: ["Nuestra Firma", "Our Firm"],
      attorneys: ["Todos los abogados", "All attorneys"],
      practices: ["Todas las prácticas", "All practices"],
      industries: ["Todas las industrias", "All industries"],
      perspectives: ["Todas las publicaciones", "All publications"],
      talent: ["Carrera en VWyS", "Careers at VWyS"],
    };
    return classicLabels[id]?.[lang === "es" ? 0 : 1] || (lang === "es" ? "Ver sección" : "View section");
  }
  const labels: Record<string, [string, string]> = {
    firm: ["Quiénes somos", "Who we are"],
    attorneys: ["Ver todos los abogados", "View all attorneys"],
    practices: ["Ver todas las prácticas", "View all practices"],
    industries: ["Ver todas las industrias", "View all industries"],
    perspectives: ["Ver todos los Insights", "View all Insights"],
    talent: ["Trabaja con nosotros", "Work with us"],
  };
  return labels[id]?.[lang === "es" ? 0 : 1] || (lang === "es" ? "Ver sección" : "View section");
}

/**
 * Reemplaza el menú heredado por la jerarquía ya resuelta en servidor. La plantilla
 * conserva logo, buscador e idioma originales como respaldo; las utilidades del menú
 * actúan como controles proxy y no duplican formularios ni IDs.
 */
export function applyNavigationMarkup(
  html: string,
  menu: PublicNavigationMenu,
  lang: "en" | "es",
): string {
  const navigation = menu.navigation;
  if (!navigation) return html;
  const classic = navigation.preset === "classic-vwys";
  const $ = cheerio.load(html);
  const $holder = $(".nav__menu--holder").first();
  if (!$holder.length) return html;

  const primary = navigation.items.filter((item) => item.visible).map((item) => {
    const children = item.children.filter((child) => child.visible && !LANDING_CHILD_IDS.has(child.id));
    const panelId = `vw-nav-panel-${item.id}`;
    const childMarkup = children.map((child) => (
      `<a class="vw-nav-v2__child${child.dynamic ? " vw-nav-v2__child--dynamic" : ""}"` +
      ` href="${esc(child.href)}" data-vw-destination="${esc(child.id)}">` +
      `<span>${esc(child.label)}</span><span aria-hidden="true">→</span></a>`
    )).join("");
    const disclosureLabel = lang === "es"
      ? `Abrir submenú de ${item.label}`
      : `Open ${item.label} submenu`;
    return (
      `<li class="nav__menu--item vw-nav-v2__item vw-nav-v2__item--${esc(item.id)}" data-vw-primary="${esc(item.id)}">` +
        `<div class="vw-nav-v2__primary-row">` +
          `<a class="nav__menu--link vw-nav-v2__primary-link" href="${esc(item.href)}" data-vw-primary-link="${esc(item.id)}">` +
            `<span>${esc(item.label)}</span>` +
          `</a>` +
          `<button class="vw-nav-v2__trigger" type="button" aria-expanded="false" aria-controls="${panelId}" aria-label="${esc(disclosureLabel)}">` +
            `<span class="vw-nav-v2__chevron" aria-hidden="true"></span>` +
          `</button>` +
        `</div>` +
        `<div class="vw-nav-v2__panel" id="${panelId}" hidden>` +
          `<div class="vw-nav-v2__panel-head">` +
            `<span class="vw-nav-v2__panel-title">${esc(item.label)}</span>` +
            `<a class="vw-nav-v2__landing" href="${esc(item.href)}">${esc(landingLabel(item.id, lang, classic))}<span aria-hidden="true">→</span></a>` +
          `</div>` +
          `<div class="vw-nav-v2__children">${childMarkup}</div>` +
        `</div>` +
      `</li>`
    );
  }).join("");

  const utility = (
    `<li class="vw-nav-v2__utilities" aria-label="${lang === "es" ? "Utilidades" : "Utilities"}">` +
      `<button class="vw-nav-v2__utility vw-nav-v2__utility--search" type="button" data-vw-nav-search>` +
        `<span class="vw-nav-v2__search-icon" aria-hidden="true"></span><span>${esc(navigation.utilities.search.label)}</span>` +
      `</button>` +
      `<button class="vw-nav-v2__utility vw-nav-v2__utility--language" type="button" data-vw-nav-language aria-label="${lang === "es" ? "Cambiar a inglés" : "Switch to Spanish"}">ES | EN</button>` +
      `<a class="vw-nav-v2__utility vw-nav-v2__utility--contact" href="${esc(navigation.utilities.contact.href)}">${esc(navigation.utilities.contact.label)}</a>` +
    `</li>`
  );

  const markup = `<ul class="nav__menu--holder vw-nav-v2" data-vw-navigation-version="2" data-vw-navigation-preset="${esc(navigation.preset)}" data-vw-navigation-revision="${esc(navigation.revision)}">${primary}${utility}</ul>`;
  $holder.replaceWith(markup);
  $("body")
    .addClass("vwb-navigation-v2")
    .addClass(classic ? "vwb-navigation-preset--classic" : "vwb-navigation-preset--definitive");
  return $.html();
}
