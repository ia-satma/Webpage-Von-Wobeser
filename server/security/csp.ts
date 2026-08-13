import { randomBytes } from "node:crypto";
import { LOCAL_SRI_MANIFEST } from "./sriManifest";

export function createCspNonce(): string {
  return randomBytes(32).toString("base64");
}

function replaceOrAddAttribute(tag: string, name: string, value: string): string {
  const existing = new RegExp(`\\s${name}\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+)`, "i");
  const attribute = ` ${name}="${value}"`;
  if (existing.test(tag)) return tag.replace(existing, attribute);
  return tag.replace(/\s*\/?>(?:\s*)$/, `${attribute}>`);
}

/** Añade el nonce actual solo a bloques que el servidor ya compuso y saneó. */
export function applyCspNonce(html: string, nonce: string): string {
  return html.replace(/<(script|style)\b[^>]*>/gi, (tag) => replaceOrAddAttribute(tag, "nonce", nonce));
}

function resourcePath(value: string): string {
  return value.trim().split(/[?#]/, 1)[0] || "";
}

/** Inserta SRI únicamente en scripts y hojas de estilo locales con hash versionado. */
export function applyLocalSri(html: string): string {
  return html.replace(/<(script|link)\b[^>]*>/gi, (tag, rawType: string) => {
    if (/\bintegrity\s*=/i.test(tag)) return tag;
    const type = rawType.toLowerCase();
    const isStyle = type === "link" && /\brel\s*=\s*(["'])[^"']*\bstylesheet\b[^"']*\1/i.test(tag);
    const attribute = type === "script" ? "src" : isStyle ? "href" : "";
    if (!attribute) return tag;
    const match = tag.match(new RegExp(`\\b${attribute}\\s*=\\s*["']([^"']+)["']`, "i"));
    const integrity = match ? LOCAL_SRI_MANIFEST[resourcePath(match[1])] : undefined;
    if (!integrity) return tag;
    let next = replaceOrAddAttribute(tag, "integrity", integrity);
    if (!/\bcrossorigin\s*=/i.test(next)) next = replaceOrAddAttribute(next, "crossorigin", "anonymous");
    return next;
  });
}

/**
 * El espejo fue capturado desde Joomla y contiene unos pocos handlers inline.
 * Los convertimos a datos declarativos consumidos por vwb-legacy-events.js y
 * eliminamos cualquier handler no reconocido antes de responder HTML.
 */
export function migrateLegacyInlineHandlers(html: string): string {
  const converted = html
    .replace(/\s+onclick\s*=\s*(["'])\s*ref\(this\)\s*;?\s*\1/gi, ' data-vw-action="legacy-ref"')
    .replace(/\s+onclick\s*=\s*(["'])\s*window\.print\(\)\s*;?\s*\1/gi, ' data-vw-action="print"')
    .replace(/\s+onclick\s*=\s*(["'])\s*window\.location\.href\s*=\s*(['"])(\/(?:new-offices|nuevas-oficinas)\/index\.html)\2\s*;?\s*\1/gi, (_match, _quote, _pathQuote, destination) => ` data-vw-navigate="${destination}"`)
    .replace(/\s+onclick\s*=\s*(["'])\s*tabshow\((['"])(module_\d+)\2\)\s*;?\s*(?:return\s+false\s*;?)?\s*\1/gi, (_match, _quote, _targetQuote, target) => ` data-vw-legacy-tab="${target}"`)
    .replace(/\s+onclick\s*=\s*(["'])\s*auf\((['"])(module_\d+|right)\2\)\s*;?\s*(?:return\s+false\s*;?)?\s*\1/gi, (_match, _quote, _targetQuote, target) => ` data-vw-legacy-auf="${target}"`)
    .replace(/\s+onclick\s*=\s*(["'])\s*window\.open\(this\.href\s*,\s*(['"])win2\2\s*,\s*(['"])([^'"]+)\3\)\s*;?\s*(?:return\s+false\s*;?)?\s*\1/gi, (_match, _quote, _windowQuote, _featuresQuote, features) => {
      const action = /(?:^|,)\s*width=400(?:,|$)/i.test(features) ? "popup-email" : "popup-print";
      return ` data-vw-action="${action}"`;
    })
    .replace(/\s+onchange\s*=\s*(["'])\s*this\.form\.submit\(\)\s*;?\s*\1/gi, ' data-vw-action="submit-on-change"')
    .replace(/\s+onchange\s*=\s*(["'])\s*Handlechange\(\)\s*;?\s*required\s*;?\s*\1/gi, ' required data-vw-action="career-file-name"');

  return converted.replace(/\s+on[a-z][a-z0-9_-]*\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
}

export function prepareTrustedHtmlForCsp(html: string, nonce: string): string {
  return applyLocalSri(applyCspNonce(migrateLegacyInlineHandlers(html), nonce));
}
