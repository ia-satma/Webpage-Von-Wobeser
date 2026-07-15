import sanitizeHtml from "sanitize-html";

// Sanitiza contenido HTML del CMS antes de inyectarlo en las páginas públicas.
// Conserva el formato legítimo (párrafos, enlaces, listas, énfasis) pero elimina
// <script>, manejadores on*, iframes, y URLs javascript: — cierra el XSS almacenado.
const OPTS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "span", "a", "ul", "ol", "li", "blockquote", "h2", "h3", "h4", "h5", "h6", "img", "hr", "sub", "sup"],
  allowedAttributes: {
    a: ["href", "target", "rel", "title"],
    img: ["src", "alt", "title"],
    span: ["style"],
    p: ["style"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  // Bloquea url()/expression() y deja solo estilos inocuos.
  allowedStyles: { "*": { "font-size": [/^[\d.]+(px|rem|em|%)$/], "text-align": [/^(left|right|center|justify)$/], color: [/^#[0-9a-fA-F]{3,8}$/, /^rgb\(/] } },
  disallowedTagsMode: "discard",
  enforceHtmlBoundary: true,
  // target="_blank" sin rel="noopener" permite que la pestaña abierta controle window.opener
  // de la pestaña original (reverse tabnabbing) — se fuerza siempre, sin importar qué rel
  // haya puesto quien escribió el HTML.
  transformTags: {
    a: (tagName, attribs) => {
      if (attribs.target === "_blank") {
        attribs.rel = "noopener noreferrer";
      }
      return { tagName, attribs };
    },
  },
};

export function sanitizeCms(html: string | null | undefined): string {
  if (!html) return "";
  return sanitizeHtml(String(html), OPTS);
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Texto plano (guardado antes del editor de texto enriquecido, con doble salto = párrafo
// nuevo y salto simple = <br>) a HTML — mismo comportamiento que ya tenían `toParagraphs()`/
// `textToHtml()`, duplicadas antes en renderPage.ts/renderDesk.ts/renderAttorney.ts/
// renderSingle.ts.
function plainTextToHtml(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

const LOOKS_LIKE_HTML = /<\/?[a-z][\s\S]*>/i;

/**
 * Convierte un campo de texto largo del CMS (noticias, biografías, descripciones, textos de
 * página) a HTML seguro para inyectar en la plantilla pública. Detecta si el valor ya es HTML
 * (guardado desde el editor de texto enriquecido) o texto plano legado (nunca reeditado desde
 * que existía solo el <Textarea>) y trata cada caso apropiadamente — así el contenido viejo
 * sigue viéndose igual sin necesidad de una migración masiva.
 */
export function renderRichText(text: string | null | undefined): string {
  if (!text) return "";
  const s = String(text);
  return sanitizeCms(LOOKS_LIKE_HTML.test(s) ? s : plainTextToHtml(s));
}

/**
 * Sanitiza in-place las claves de texto enriquecido de un payload ya validado por Zod, ANTES
 * de guardarlo — para no confiar únicamente en la sanitización al renderizar (defensa en
 * profundidad: cualquier lectura futura del campo, no solo el mirror público, queda limpia).
 * Solo toca las claves indicadas; el resto del objeto no se modifica.
 */
export function sanitizeFields<T extends Record<string, any>>(obj: T, keys: (keyof T)[]): T {
  for (const key of keys) {
    if (typeof obj[key] === "string") {
      (obj as any)[key] = sanitizeCms(obj[key] as string);
    }
  }
  return obj;
}
