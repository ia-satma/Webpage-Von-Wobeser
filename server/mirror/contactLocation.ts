import { escapeHtmlText } from "./htmlEscape";
import { cfg, type ConfigMap } from "./siteConfig";

export type PublicLanguage = "en" | "es";

type LocationLabels = {
  eyebrow: string;
  title: string;
  address: string;
  phone: string;
  email: string;
  directions: string;
  viewMap: string;
  unavailable: string;
};

export type ContactLocation = {
  address: string;
  addressLines: string[];
  email: string;
  phone: string;
  phoneHref: string;
  mapEmbed: string | null;
  mapLink: string;
  labels: LocationLabels;
};

// Destino verificado por el cliente. No se añaden alias de edificio ni vías de
// acceso: Google Maps debe resolver exactamente el domicilio postal solicitado.
export const OFFICE_DIRECTIONS_URL = "https://www.google.com/maps/dir/?api=1&destination=Campos%20El%C3%ADseos%20204%2C%20Polanco%2C%20Polanco%20IV%20Secc%2C%20Miguel%20Hidalgo%2C%2011550%20Ciudad%20de%20M%C3%A9xico%2C%20CDMX";

const FALLBACKS: Record<PublicLanguage, Omit<ContactLocation, "addressLines" | "phoneHref" | "mapEmbed" | "mapLink"> & { mapEmbed: null; mapLink: string }> = {
  es: {
    address: "Torre SOMA Chapultepec, piso 18\nCampos Elíseos 204, Polanco\nAcceso por Calle Arquímedes N.º 10\nC.P. 11550, Ciudad de México",
    email: "info@vwys.com.mx",
    phone: "+52 (55) 5258 1000",
    mapEmbed: null,
    mapLink: OFFICE_DIRECTIONS_URL,
    labels: {
      eyebrow: "UBICACIÓN",
      title: "Nuestra ubicación",
      address: "Dirección",
      phone: "Teléfono",
      email: "Correo electrónico",
      directions: "Obtener direcciones",
      viewMap: "Ver en el mapa",
      unavailable: "El mapa no está disponible en este momento.",
    },
  },
  en: {
    address: "Torre SOMA Chapultepec, 18th floor\n204 Campos Elíseos, Polanco\nAccess via 10 Arquímedes Street\nC.P. 11550, Mexico City",
    email: "info@vwys.com.mx",
    phone: "+52 (55) 5258 1000",
    mapEmbed: null,
    mapLink: OFFICE_DIRECTIONS_URL,
    labels: {
      eyebrow: "LOCATION",
      title: "Our location",
      address: "Address",
      phone: "Phone",
      email: "Email",
      directions: "Get directions",
      viewMap: "View on map",
      unavailable: "The map is not available at this time.",
    },
  },
};

/** Solo se permiten embeds HTTPS de Google Maps administrados por la firma. */
export function safeGoogleMapsEmbed(value: string): string | null {
  try {
    const url = new URL(String(value ?? "").trim());
    const googleHost = /(?:^|\.)google\.[a-z.]+$/i.test(url.hostname);
    if (url.protocol !== "https:" || !googleHost || !/^\/maps\/embed(?:\/|$)/i.test(url.pathname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Las acciones públicas conservan una URL de Google Maps aun si el embed falla. */
export function safeGoogleMapsLink(value: string, fallback = OFFICE_DIRECTIONS_URL): string {
  try {
    const url = new URL(String(value ?? "").trim());
    const googleHost = /(?:^|\.)google\.[a-z.]+$/i.test(url.hostname);
    if (url.protocol === "https:" && googleHost && /^\/maps(?:\/|$)/i.test(url.pathname)) return url.toString();
  } catch {
    // La configuración se considera no confiable hasta que cumpla el allowlist.
  }
  return fallback;
}

export function contactLocationIcon(name: "pin" | "phone" | "mail" | "directions" | "external"): string {
  const paths = {
    pin: '<path d="M12 21s7-5.14 7-11a7 7 0 1 0-14 0c0 5.86 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    phone: '<path d="M5.2 4.8 8 3.7l2.05 4.78-1.96 1.64a15.05 15.05 0 0 0 5.83 5.83l1.64-1.96 4.78 2.05-1.1 2.8c-.32.8-1.16 1.25-2 1.09C9.52 18.45 5.55 14.48 4.11 6.76c-.16-.84.3-1.68 1.09-1.96Z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="m4 7 8 6 8-6"/>',
    directions: '<path d="M12 21s7-5.14 7-11a7 7 0 1 0-14 0c0 5.86 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    external: '<path d="M14 4h6v6"/><path d="m20 4-9 9"/><path d="M19 14v5H5V5h5"/>',
  } as const;
  return `<svg class="vw-contact-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name]}</svg>`;
}

/**
 * Fuente única para las dos superficies públicas. Los datos de oficina publicados
 * viven en la configuración de Contacto y las dos URLs de Google Maps en Oficinas.
 */
export function resolveContactLocation(config: ConfigMap, lang: PublicLanguage): ContactLocation {
  const fallback = FALLBACKS[lang];
  const configuredAddress = cfg(config, "page_contact_address", lang).trim();
  const configuredPhone = cfg(config, "page_contact_phone", lang).trim();
  const configuredEmail = cfg(config, "page_contact_email", lang).trim();
  const address = configuredAddress || fallback.address;
  const phone = configuredPhone || fallback.phone;
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuredEmail) ? configuredEmail : fallback.email;

  return {
    address,
    addressLines: address.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 8),
    email,
    phone,
    phoneHref: `tel:${phone.replace(/[^+\d]/g, "")}`,
    mapEmbed: safeGoogleMapsEmbed(cfg(config, "office_map_embed", lang)),
    mapLink: safeGoogleMapsLink(cfg(config, "office_map_directions", lang), fallback.mapLink),
    labels: fallback.labels,
  };
}

export function renderContactAddressLines(lines: readonly string[]): string {
  return lines.map((line) => `<span>${escapeHtmlText(line)}</span>`).join("");
}
