import type { Express } from "express";
import net from "node:net";

export function registerLanguageDetectionRoutes(app: Express): void {
  // Geolocation endpoint for automatic language detection
  const COUNTRY_TO_LANGUAGE: Record<string, string> = {
    // Spanish-speaking countries.
    // BR→es is a deliberate fallback: Portuguese ("pt") is not yet a supported UI language.
    // When Portuguese translations are added, remap BR to "pt".
    MX: "es", ES: "es", AR: "es", CO: "es", PE: "es", VE: "es", CL: "es", EC: "es",
    GT: "es", CU: "es", BO: "es", DO: "es", HN: "es", PY: "es", SV: "es", NI: "es",
    CR: "es", PA: "es", UY: "es", PR: "es", BR: "es",
    // German-speaking countries
    DE: "de", AT: "de", CH: "de", LI: "de",
    // Chinese-speaking regions
    CN: "zh", TW: "zh", HK: "zh",
    // Korean
    KR: "ko",
    // Japanese
    JP: "ja",
    // Arabic-speaking countries
    SA: "ar", AE: "ar", EG: "ar", IQ: "ar", MA: "ar", DZ: "ar", SD: "ar", SY: "ar",
    TN: "ar", YE: "ar", JO: "ar", LY: "ar", LB: "ar", OM: "ar", KW: "ar", QA: "ar", BH: "ar",
    // Russian-speaking countries
    RU: "ru", BY: "ru", KZ: "ru", KG: "ru",
    // French-speaking countries
    FR: "fr", BE: "fr", MC: "fr", LU: "fr", SN: "fr", CI: "fr", ML: "fr",
    // Italian-speaking countries
    IT: "it", SM: "it", VA: "it",
    // English-speaking countries (CA corrected from fr → en)
    US: "en", GB: "en", AU: "en", NZ: "en", IE: "en", ZA: "en", NG: "en", GH: "en", KE: "en",
    CA: "en", IN: "en", PH: "en", SG: "en", MY: "en",
    PT: "en", // PT→en fallback: "pt" is not yet a supported UI language; remap when Portuguese translations are added
  };

  // In-memory cache for geolocation results (TTL: 1 hour)
  const geoCache = new Map<string, { language: string; country: string; timestamp: number }>();
  const GEO_CACHE_TTL = 60 * 60 * 1000;

  function parseAcceptLanguage(header: string | undefined): string | null {
    if (!header) return null;
    const supported = ["es", "en", "de", "zh", "ko", "ja", "ar", "ru", "fr", "it"];
    const languages = header.split(",").map(part => {
      const [lang, q] = part.trim().split(";q=");
      return { lang: lang.split("-")[0].toLowerCase(), q: q ? parseFloat(q) : 1.0 };
    }).sort((a, b) => b.q - a.q);
    for (const { lang } of languages) {
      if (supported.includes(lang)) return lang;
    }
    return null;
  }

  function isPrivateIp(ip: string): boolean {
    // Normalize IPv6-mapped IPv4 addresses (e.g. ::ffff:127.0.0.1 → 127.0.0.1)
    const normalized = ip.startsWith("::ffff:") ? ip.slice(7) : ip;
    return (
      normalized === "::1" ||
      normalized === "127.0.0.1" ||
      normalized.startsWith("192.168.") ||
      normalized.startsWith("10.") ||
      normalized.startsWith("172.16.") || normalized.startsWith("172.17.") || normalized.startsWith("172.18.") ||
      normalized.startsWith("172.19.") || normalized.startsWith("172.20.") || normalized.startsWith("172.21.") ||
      normalized.startsWith("172.22.") || normalized.startsWith("172.23.") || normalized.startsWith("172.24.") ||
      normalized.startsWith("172.25.") || normalized.startsWith("172.26.") || normalized.startsWith("172.27.") ||
      normalized.startsWith("172.28.") || normalized.startsWith("172.29.") || normalized.startsWith("172.30.") ||
      normalized.startsWith("172.31.") ||
      normalized.startsWith("fe80:") || // IPv6 link-local
      normalized === "::1"              // IPv6 loopback (explicit for normalized form)
    );
  }

  app.get("/api/detect-language", async (req, res) => {
    try {
      const forwardedFor = req.headers["x-forwarded-for"];
      const clientIp = forwardedFor
        ? (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(",")[0].trim())
        : req.socket.remoteAddress || req.ip;
      const normalizedClientIp = String(clientIp || "").replace(/^::ffff:/, "");

      // Skip geolocation for localhost/private IPs — use Accept-Language then English
      if (!net.isIP(normalizedClientIp) || isPrivateIp(normalizedClientIp)) {
        const fromHeader = parseAcceptLanguage(req.headers["accept-language"]);
        return res.json({ language: fromHeader || "en", country: null, source: fromHeader ? "accept-language" : "fallback" });
      }

      // Check cache first
      const cached = geoCache.get(normalizedClientIp);
      if (cached && Date.now() - cached.timestamp < GEO_CACHE_TTL) {
        return res.json({ language: cached.language, country: cached.country, source: "cache" });
      }

      // HTTPS geolocation via ipapi.co (free tier, no key required)
      const geoResponse = await fetch(`https://ipapi.co/${encodeURIComponent(normalizedClientIp)}/json/`, {
        signal: AbortSignal.timeout(3000),
      });

      if (!geoResponse.ok) {
        const fromHeader = parseAcceptLanguage(req.headers["accept-language"]);
        return res.json({ language: fromHeader || "en", country: null, source: fromHeader ? "accept-language" : "fallback" });
      }

      const geoData = await geoResponse.json() as { country_code?: string; error?: boolean };

      if (geoData.error || !geoData.country_code) {
        const fromHeader = parseAcceptLanguage(req.headers["accept-language"]);
        return res.json({ language: fromHeader || "en", country: null, source: fromHeader ? "accept-language" : "fallback" });
      }

      const countryCode = geoData.country_code.toUpperCase();
      const mapped = COUNTRY_TO_LANGUAGE[countryCode];
      if (!mapped) {
        // Unknown country — fall back to Accept-Language then English
        const fromHeader = parseAcceptLanguage(req.headers["accept-language"]);
        return res.json({ language: fromHeader || "en", country: countryCode, source: fromHeader ? "accept-language" : "fallback" });
      }

      geoCache.set(normalizedClientIp, { language: mapped, country: countryCode, timestamp: Date.now() });

      res.json({ language: mapped, country: countryCode, source: "geolocation" });
    } catch (error) {
      console.error("Language detection error:", error);
      const fromHeader = parseAcceptLanguage(req.headers["accept-language"]);
      res.json({ language: fromHeader || "en", country: null, source: fromHeader ? "accept-language" : "error" });
    }
  });
}
