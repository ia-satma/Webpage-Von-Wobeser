// QA & Verification — Von Wobeser recreation
// Adversarial check of the two client-reported symptoms:
//   1) "Backend no conecta / secciones vacías"  -> sections must show REAL data.
//   2) "Cambiar idioma no cambia el contenido"   -> EN<->ES must change data-driven content.
//
// Runs against the prod build served at http://localhost:5001 (same-origin API).
// Writes screenshots to qa-evidence/ and prints a PASS/FAIL report.
//
// NO edita la app. Solo lee el DOM real.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const EVID = join(ROOT, "qa-evidence");
mkdirSync(EVID, { recursive: true });

const BASE = "http://localhost:5001";

const results = []; // {route, nonEmpty:{pass,detail}, i18n:{pass,detail}, shots:[]}

// ---------- helpers ----------

const norm = (s) => (s || "").replace(/\s+/g, " ").trim();

// Home shows a full-screen "new offices" modal (dialog-new-offices, bg-black/80)
// and a cookie consent banner on load — both can cover the header/lang selector.
// A real user dismisses them; we do the same so the header becomes interactive.
// Returns the list of overlays it had to dismiss (reported as a UX finding).
async function dismissModals(page) {
  const dismissed = [];
  // New-offices popup
  const closePopup = page.locator('[data-testid="button-close-popup"]').filter({ visible: true }).first();
  if (await closePopup.count()) {
    await closePopup.click({ timeout: 3000 }).catch(() => {});
    dismissed.push("dialog-new-offices");
    await page.waitForTimeout(400);
  }
  // Cookie banner (accept)
  const cookieAccept = page.locator('[data-testid="button-cookie-accept"]').filter({ visible: true }).first();
  if (await cookieAccept.count()) {
    await cookieAccept.click({ timeout: 3000 }).catch(() => {});
    dismissed.push("banner-cookie-consent");
    await page.waitForTimeout(400);
  }
  // Safety: any residual Radix dialog overlay -> Escape
  const stray = await page
    .locator('div.fixed.inset-0.bg-black\\/80')
    .filter({ visible: true })
    .count()
    .catch(() => 0);
  if (stray) {
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(300);
  }
  return dismissed;
}

let HOME_MODAL_FINDING = null;

async function gotoReady(page, path) {
  await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 45000 });
  // SPA + react-query: wait for network to settle then a beat for render.
  try {
    await page.waitForLoadState("networkidle", { timeout: 25000 });
  } catch {
    /* networkidle can be flaky with long-poll; continue */
  }
  await page.waitForTimeout(800);
  // Dismiss any load-time modals so the header (lang selector) is usable.
  const d = await dismissModals(page);
  if (path === "/" && d.length && !HOME_MODAL_FINDING) {
    HOME_MODAL_FINDING = d;
  }
}

// Read the language currently shown by the LanguageSelector trigger.
// compact mode shows "EN"/"ES"; isMobile/non-compact shows native name.
async function currentLang(page) {
  const txt = norm(
    await page
      .locator('[data-testid="text-current-language"]')
      .first()
      .textContent()
      .catch(() => "")
  ).toLowerCase();
  if (txt.includes("es") || txt.includes("español") || txt.includes("espanol")) return "es";
  if (txt.includes("en") || txt.includes("english")) return "en";
  // Fallback: read <html lang> / i18n
  const htmlLang = await page.evaluate(() => document.documentElement.lang || "");
  return htmlLang.toLowerCase().startsWith("es") ? "es" : "en";
}

// Dismiss any stray Radix Select overlay/listbox that might intercept clicks.
async function dismissOverlay(page) {
  // If a select listbox is open, Escape closes it; the overlay div is then removed.
  const open = await page.locator('[data-testid="select-language-content"]').count();
  if (open) {
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(250);
  }
}

// Switch language using the REAL Radix Select control.
async function switchLang(page, target /* 'en'|'es' */) {
  await dismissOverlay(page);
  // The compact desktop selector is hidden below sm; on small viewports the
  // visible trigger lives inside the nav overlay. Find a *visible* trigger,
  // opening the menu overlay if needed.
  let trigger = page.locator('[data-testid="select-language-trigger"]').filter({ visible: true }).first();
  if ((await trigger.count()) === 0) {
    // Open hamburger overlay to reveal the mobile language selector.
    const menuBtn = page.locator('[data-testid="button-menu-open"]').filter({ visible: true }).first();
    if (await menuBtn.count()) {
      await menuBtn.click();
      await page.waitForTimeout(450);
    }
    trigger = page.locator('[data-testid="select-language-trigger"]').filter({ visible: true }).first();
  }
  if ((await trigger.count()) === 0) {
    throw new Error("language trigger not found/visible (DOM lacks select-language-trigger)");
  }
  // Use the trigger as the open mechanism; Radix portals the listbox to body.
  await trigger.click();
  const content = page.locator('[data-testid="select-language-content"]').first();
  await content.waitFor({ state: "visible", timeout: 8000 });
  const opt = page.locator(`[data-testid="select-language-option-${target}"]`).first();
  await opt.waitFor({ state: "visible", timeout: 8000 });
  // Radix select items: click the option directly (it lives in the portal,
  // above the aria-hidden overlay, so it is the correct event target).
  await opt.click();
  // The overlay is removed once the select closes; confirm it's gone.
  await page.waitForTimeout(300);
  await dismissOverlay(page);
  // Close hamburger overlay if it was opened (mobile path).
  const closeBtn = page.locator('[data-testid="button-menu-close"]').filter({ visible: true }).first();
  if (await closeBtn.count()) {
    await closeBtn.click().catch(() => {});
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(900); // let react re-render data-driven content
}

// Content reveals on scroll (useFadeOnScroll adds .vw-fade -> opacity). Scroll
// through the page so fade-in sections become visible, then return to top.
async function revealContent(page) {
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const h = document.body.scrollHeight;
    const step = Math.max(400, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y <= h; y += step) {
      window.scrollTo(0, y);
      await sleep(120);
    }
    window.scrollTo(0, 0);
    await sleep(200);
  });
  await page.waitForTimeout(400);
}

async function shotFull(page, name) {
  await revealContent(page);
  const p = join(EVID, name);
  await page.screenshot({ path: p, fullPage: true });
  return name;
}

// ---------- per-route check definitions ----------
// Each returns { nonEmpty:{pass,detail,count}, capture: <string used for i18n diff> }

const checks = {
  async home(page) {
    // Practices slider (data-driven via getDisplayValue over /api/practice-groups)
    const sliderSel = '[data-testid="section-practices-slider"]';
    await page.locator(sliderSel).first().waitFor({ state: "attached", timeout: 15000 }).catch(() => {});
    const seeMoreLinks = page.locator('[data-testid^="link-practice-"]');
    const linkCount = await seeMoreLinks.count();
    // Extract practice NAME spans + the SEE MORE/VER MÁS copy across ALL slides
    // (visible or not) via JS textContent — slider only paints one at a time.
    const data = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="section-practices-slider"]');
      if (!root) return { names: [], seeMore: [] };
      const links = [...root.querySelectorAll('[data-testid^="link-practice-"]')];
      const names = [];
      const seeMore = [];
      for (const a of links) {
        seeMore.push((a.textContent || "").replace(/\s+/g, " ").trim());
        // The name span is the .font-serif text span that is the previous
        // sibling of the SEE MORE link within the slide.
        const slide = a.closest("div");
        // Walk up to the centered text container and grab the serif name span.
        const container = a.parentElement;
        let nameSpan = null;
        if (container) {
          const serifs = [...container.querySelectorAll("span.font-serif")];
          // Two serif spans per slide: [0]=big number, [1]=name. Take last.
          nameSpan = serifs.length ? serifs[serifs.length - 1] : null;
        }
        names.push(nameSpan ? nameSpan.textContent.replace(/\s+/g, " ").trim() : "");
      }
      return { names: names.filter(Boolean), seeMore: [...new Set(seeMore)] };
    });
    const names = data.names;
    const nonEmpty = linkCount >= 10 && names.length >= 5;
    return {
      nonEmpty: {
        pass: nonEmpty,
        count: linkCount,
        detail: `practices-slider slides(see-more links)=${linkCount}; named-slides=${names.length}; sampleNames=${JSON.stringify(
          names.slice(0, 4)
        )}; seeMoreCopy=${JSON.stringify(data.seeMore)}`,
      },
      // i18n capture = practice names + the CTA copy (both should flip EN<->ES)
      capture: names.slice(0, 8).join(" | ") + " || " + data.seeMore.join(","),
    };
  },

  async team(page) {
    const cards = page.locator('[data-testid^="card-team-member-"]');
    const count = await cards.count();
    // Section title (visible): Partners/Of Counsel/Associates -> Socios/Asociados
    const secTitle = norm(
      await page.locator('[data-testid="section-partners"] h2').first().textContent().catch(() => "")
    );
    // Per-card titles (Partner/Socio) - textContent works even if lg:hidden
    const titleEls = page.locator('[data-testid="section-partners"] [data-testid^="card-team-member-"] span.uppercase, [data-testid^="card-team-member-"] span.uppercase');
    const sampleNames = [];
    for (let i = 0; i < Math.min(count, 3); i++) {
      // first big span inside card = name
      const t = norm(await cards.nth(i).locator("span").first().textContent().catch(() => ""));
      sampleNames.push(t);
    }
    const nonEmpty = count >= 50 && sampleNames.filter(Boolean).length >= 3;
    // i18n capture: section title + a per-card title (display:none-safe via JS)
    const firstCardTitle = await page.evaluate(() => {
      const card = document.querySelector('[data-testid^="card-team-member-"]');
      if (!card) return "";
      const spans = [...card.querySelectorAll("span")];
      const up = spans.find((s) => /uppercase/.test(s.className));
      return up ? up.textContent.trim() : "";
    });
    return {
      nonEmpty: {
        pass: nonEmpty,
        count,
        detail: `team cards=${count}; sectionTitle="${secTitle}"; firstCardTitle="${firstCardTitle}"; names=${JSON.stringify(sampleNames)}`,
      },
      capture: `${secTitle} :: ${firstCardTitle}`,
    };
  },

  async ["practice-groups"](page) {
    const cards = page.locator('[data-testid^="card-practice-group-"]');
    const count = await cards.count();
    const names = [];
    for (let i = 0; i < Math.min(count, 6); i++) {
      names.push(norm(await cards.nth(i).textContent()));
    }
    const nonEmpty = count >= 18 && names.filter(Boolean).length >= 5;
    return {
      nonEmpty: {
        pass: nonEmpty,
        count,
        detail: `practice-group cards=${count} (need >=18); sample=${JSON.stringify(names.slice(0, 4))}`,
      },
      capture: names.join(" | "),
    };
  },

  async news(page) {
    // Articles render as links to /news/<slug>; count anchor cards + headings.
    const page_ = page;
    const archive = page_.locator('[data-testid="section-news-archive"]');
    await archive.first().waitFor({ state: "attached", timeout: 12000 }).catch(() => {});
    // Heuristic: count headings/links inside archive (no per-card testid in News.tsx)
    const data = await page_.evaluate(() => {
      const root =
        document.querySelector('[data-testid="section-news-archive"]') ||
        document.querySelector('[data-testid="page-news"]');
      if (!root) return { count: 0, titles: [], empty: false, error: false };
      const empty = !!root.querySelector('[data-testid="container-news-empty"]');
      const error = !!document.querySelector('[data-testid="text-news-error"]');
      const links = [...root.querySelectorAll('a[href^="/news/"]')];
      const titles = links
        .map((a) => {
          const h = a.querySelector("h1,h2,h3,h4");
          return (h ? h.textContent : a.textContent).replace(/\s+/g, " ").trim();
        })
        .filter(Boolean);
      // de-dup
      const uniq = [...new Set(titles)];
      return { count: uniq.length, titles: uniq.slice(0, 5), empty, error };
    });
    const nonEmpty = !data.error && !data.empty && data.count >= 1;
    return {
      nonEmpty: {
        pass: nonEmpty,
        count: data.count,
        detail: `news article links=${data.count}; empty=${data.empty}; error=${data.error}; titles=${JSON.stringify(
          data.titles.slice(0, 3)
        )}`,
      },
      capture: data.titles.join(" | "),
    };
  },

  async experience(page) {
    const cards = page.locator('[data-testid^="card-featured-matter-"]');
    let count = await cards.count();
    const titleEls = page.locator('[data-testid^="text-featured-title-"]');
    const titleCount = await titleEls.count();
    const titles = [];
    for (let i = 0; i < Math.min(titleCount, 5); i++) {
      titles.push(norm(await titleEls.nth(i).textContent()));
    }
    // also detect error/empty
    const hasErr = (await page.locator('[data-testid="text-experience-error"]').count()) > 0;
    const nonEmpty = !hasErr && (count >= 1 || titleCount >= 1) && titles.filter(Boolean).length >= 1;
    return {
      nonEmpty: {
        pass: nonEmpty,
        count: Math.max(count, titleCount),
        detail: `experience matter-cards=${count}, title-els=${titleCount}, error=${hasErr}; sample=${JSON.stringify(
          titles.slice(0, 3)
        )}`,
      },
      capture: titles.join(" | "),
    };
  },
};

// ---------- run a single route: nonEmpty + i18n + screenshots ----------
async function runRoute(context, route, opts = {}) {
  const { viewports = [["desktop", 1440, 900]], slug = route.replace(/^\//, "") || "home" } = opts;
  const checkFn = checks[slug] || checks[route.replace(/^\//, "")] ;
  const rec = { route, slug, nonEmpty: null, i18n: null, shots: [] };

  for (const [vpName, w, h] of viewports) {
    const page = await context.newPage();
    await page.setViewportSize({ width: w, height: h });
    await gotoReady(page, route);

    const startLang = await currentLang(page);

    // ---- non-empty (capture EN baseline regardless of start lang) ----
    // Ensure we are in EN for the EN screenshot/baseline.
    if (startLang !== "en") {
      try { await switchLang(page, "en"); } catch (e) { /* note later */ }
      await gotoReady(page, route); // re-settle after lang switch reorders/re-renders
    }
    const enRes = await checkFn(page);
    if (vpName === "desktop" || rec.nonEmpty === null) rec.nonEmpty = enRes.nonEmpty;
    const enCapture = enRes.capture;

    // screenshot EN
    rec.shots.push(await shotFull(page, `${slug}-${vpName}-en.png`));

    // ---- switch to ES ----
    let switchErr = null;
    try {
      await switchLang(page, "es");
    } catch (e) {
      switchErr = e.message;
    }
    // Re-run check in ES
    const esRes = await checkFn(page);
    const esCapture = esRes.capture;

    // screenshot ES
    rec.shots.push(await shotFull(page, `${slug}-${vpName}-es.png`));

    // i18n verdict (compute once, on the desktop viewport)
    if (vpName === "desktop" || rec.i18n === null) {
      const changed = norm(enCapture) !== norm(esCapture) && norm(esCapture).length > 0;
      rec.i18n = {
        pass: !switchErr && changed,
        switchErr,
        detail: switchErr
          ? `SWITCH FAILED: ${switchErr}`
          : `EN="${(enCapture || "").slice(0, 120)}" | ES="${(esCapture || "").slice(0, 120)}" | changed=${changed}`,
      };
    }

    await page.close();
  }
  return rec;
}

// ---------- main ----------
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ deviceScaleFactor: 1 });

  // Home in 3 viewports (EN+ES each). Others desktop only.
  const plan = [
    { route: "/", slug: "home", viewports: [["desktop", 1440, 900], ["tablet", 768, 1024], ["mobile", 390, 844]] },
    { route: "/team", slug: "team", viewports: [["desktop", 1440, 900]] },
    { route: "/practice-groups", slug: "practice-groups", viewports: [["desktop", 1440, 900]] },
    { route: "/news", slug: "news", viewports: [["desktop", 1440, 900]] },
    { route: "/experience", slug: "experience", viewports: [["desktop", 1440, 900]] },
  ];

  for (const p of plan) {
    process.stdout.write(`\n>>> ${p.route} ...\n`);
    try {
      const rec = await runRoute(context, p.route, { viewports: p.viewports, slug: p.slug });
      results.push(rec);
      console.log(`    nonEmpty: ${rec.nonEmpty?.pass ? "PASS" : "FAIL"} — ${rec.nonEmpty?.detail}`);
      console.log(`    i18n    : ${rec.i18n?.pass ? "PASS" : "FAIL"} — ${rec.i18n?.detail}`);
      console.log(`    shots   : ${rec.shots.join(", ")}`);
    } catch (e) {
      results.push({ route: p.route, slug: p.slug, fatal: e.message });
      console.log(`    FATAL: ${e.message}`);
    }
  }

  await browser.close();

  // ---------- summary ----------
  console.log("\n\n================ QA SUMMARY ================");
  let allPass = true;
  for (const r of results) {
    if (r.fatal) {
      allPass = false;
      console.log(`${r.route.padEnd(20)} FATAL: ${r.fatal}`);
      continue;
    }
    const ne = r.nonEmpty?.pass ? "PASS" : "FAIL";
    const i18 = r.i18n?.pass ? "PASS" : "FAIL";
    if (!r.nonEmpty?.pass || !r.i18n?.pass) allPass = false;
    console.log(`${r.route.padEnd(20)} nonEmpty=${ne}  i18n=${i18}`);
  }
  console.log("===========================================");
  if (HOME_MODAL_FINDING) {
    console.log(
      `NOTE (UX): Home load shows blocking overlay(s) [${HOME_MODAL_FINDING.join(
        ", "
      )}] covering the header/language selector until dismissed. The QA dismisses them (as a real user would) before testing i18n. The lang control IS reachable after dismissal.`
    );
  }
  console.log(`OVERALL: ${allPass ? "PASS ✅" : "FAIL ❌"}`);
  process.exit(allPass ? 0 : 1);
})();
