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
};

export function sanitizeCms(html: string | null | undefined): string {
  if (!html) return "";
  return sanitizeHtml(String(html), OPTS);
}
