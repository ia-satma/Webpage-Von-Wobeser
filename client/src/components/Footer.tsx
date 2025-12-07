import { Link } from "wouter";
import { MapPin, Phone, Mail, Linkedin, ExternalLink, AlertCircle, Building2, Twitter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SiteContent } from "@shared/schema";
import esrLogo from "@assets/image_1764710915519.png";
import footerLogo from "@assets/Recurso_2_1764819007853.png";

export default function Footer() {
  const { displayLanguage } = useLanguage();
  const { data: siteContent, isLoading, error } = useQuery<SiteContent>({
    queryKey: ["/api/site-content"],
  });

  const content = {
    en: {
      firm: "The Firm",
      firmLinks: [
        { label: "About Us", href: "/about", id: "about" },
        { label: "Our Team", href: "/team", id: "people" },
        { label: "Careers", href: "/careers", id: "careers" },
        { label: "Contact", href: "/contact", id: "contact" },
      ],
      capabilities: "Capabilities",
      capabilitiesLinks: [
        { label: "Practice Areas", href: "/practice-groups", id: "practice" },
        { label: "Industry Groups", href: "/industry-groups", id: "industry" },
      ],
      resources: "Resources",
      resourcesLinks: [
        { label: "News & Insights", href: "/news", id: "news" },
        { label: "Rankings", href: "/rankings", id: "rankings" },
      ],
      contact: "Contact",
      building: "Torre SOMA Chapultepec Floor 18",
      street: "Campos Elíseos 204, Polanco",
      city: "C.P. 11560, Mexico City",
      phone: siteContent?.phone || "+52 55 5258 1000",
      email: siteContent?.email || "info@vonwobeser.com",
      legal: "© 2025 Von Wobeser y Sierra, S.C. All rights reserved.",
      privacy: "Privacy Policy",
      terms: "Terms of Use",
      cookies: "Cookie Preferences",
      description: "Leading law firm in Mexico with over 70 years of experience providing excellent legal services.",
      practiceLabel: "Practice Areas",
      industryLabel: "Industry Groups",
      errorMessage: "Contact information unavailable",
      followUs: "Follow Us",
      linkedinLabel: "Visit Von Wobeser on LinkedIn (opens in new tab)",
      twitterLabel: "Visit Von Wobeser on X/Twitter (opens in new tab)",
      websiteLabel: "Visit Von Wobeser website (opens in new tab)",
      phoneLabel: "Call Von Wobeser",
      emailLabel: "Email Von Wobeser",
      cookiesLabel: "Manage cookie preferences",
    },
    es: {
      firm: "La Firma",
      firmLinks: [
        { label: "Acerca de Nosotros", href: "/about", id: "about" },
        { label: "Nuestro Equipo", href: "/team", id: "people" },
        { label: "Carreras", href: "/careers", id: "careers" },
        { label: "Contacto", href: "/contact", id: "contact" },
      ],
      capabilities: "Capacidades",
      capabilitiesLinks: [
        { label: "Áreas de Práctica", href: "/practice-groups", id: "practice" },
        { label: "Grupos Industriales", href: "/industry-groups", id: "industry" },
      ],
      resources: "Recursos",
      resourcesLinks: [
        { label: "Noticias e Insights", href: "/news", id: "news" },
        { label: "Rankings", href: "/rankings", id: "rankings" },
      ],
      contact: "Contacto",
      building: "Torre SOMA Chapultepec Piso 18",
      street: "Campos Elíseos 204, Polanco",
      city: "C.P. 11560, Ciudad de México",
      phone: siteContent?.phone || "+52 55 5258 1000",
      email: siteContent?.email || "info@vonwobeser.com",
      legal: "© 2025 Von Wobeser y Sierra, S.C. Todos los derechos reservados.",
      privacy: "Política de Privacidad",
      terms: "Términos de Uso",
      cookies: "Preferencias de Cookies",
      description: "Firma de abogados líder en México con más de 70 años de experiencia brindando servicios legales de excelencia.",
      practiceLabel: "Áreas de Práctica",
      industryLabel: "Grupos Industriales",
      errorMessage: "Información de contacto no disponible",
      followUs: "Síguenos",
      linkedinLabel: "Visitar Von Wobeser en LinkedIn (abre en nueva pestaña)",
      twitterLabel: "Visitar Von Wobeser en X/Twitter (abre en nueva pestaña)",
      websiteLabel: "Visitar sitio web de Von Wobeser (abre en nueva pestaña)",
      phoneLabel: "Llamar a Von Wobeser",
      emailLabel: "Enviar correo a Von Wobeser",
      cookiesLabel: "Gestionar preferencias de cookies",
    },
  };

  const t = content[displayLanguage];

  const renderContactInfo = () => {
    if (isLoading) {
      return (
        <div className="space-y-4" data-testid="skeleton-contact" aria-busy="true" aria-label={displayLanguage === "es" ? "Cargando información de contacto" : "Loading contact information"}>
          <div className="flex items-start gap-3">
            <Skeleton className="w-4 h-4 rounded-full flex-shrink-0 mt-1 bg-gray-700" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-40 bg-gray-700" />
              <Skeleton className="h-4 w-36 bg-gray-700" />
              <Skeleton className="h-4 w-32 bg-gray-700" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="w-4 h-4 rounded-full flex-shrink-0 bg-gray-700" />
            <Skeleton className="h-4 w-32 bg-gray-700" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="w-4 h-4 rounded-full flex-shrink-0 bg-gray-700" />
            <Skeleton className="h-4 w-40 bg-gray-700" />
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center gap-3 text-gray-500" data-testid="text-contact-error" role="alert">
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
          <span className="text-sm">{t.errorMessage}</span>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <address className="not-italic" data-testid="text-footer-address">
          <div className="flex items-start gap-3">
            <Building2 className="w-4 h-4 text-primary flex-shrink-0 mt-1" aria-hidden="true" />
            <div className="text-sm text-gray-400">
              <p>{t.building}</p>
              <p>{t.street}</p>
              <p>{t.city}</p>
            </div>
          </div>
        </address>
        <div className="flex items-center gap-3">
          <Phone className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
          <a
            href={`tel:${t.phone.replace(/\s/g, "")}`}
            className="text-sm text-gray-400 hover:text-white transition-colors"
            data-testid="link-footer-phone"
            aria-label={`${t.phoneLabel}: ${t.phone}`}
          >
            {t.phone}
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Mail className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
          <a
            href={`mailto:${t.email}`}
            className="text-sm text-gray-400 hover:text-white transition-colors"
            data-testid="link-footer-email"
            aria-label={`${t.emailLabel}: ${t.email}`}
          >
            {t.email}
          </a>
        </div>
        <div className="pt-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">{t.followUs}</p>
          <div className="flex items-center gap-2">
            <a
              href="https://www.linkedin.com/company/von-wobeser-y-sierra/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center min-w-[44px] min-h-[44px] p-2 text-gray-400 hover:text-white transition-colors touch-manipulation"
              data-testid="link-linkedin"
              aria-label={t.linkedinLabel}
            >
              <Linkedin className="w-5 h-5" aria-hidden="true" />
            </a>
            <a
              href="https://twitter.com/vonwobeser"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center min-w-[44px] min-h-[44px] p-2 text-gray-400 hover:text-white transition-colors touch-manipulation"
              data-testid="link-twitter"
              aria-label={t.twitterLabel}
            >
              <Twitter className="w-5 h-5" aria-hidden="true" />
            </a>
            <a
              href="https://www.vonwobeser.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center min-w-[44px] min-h-[44px] p-2 text-gray-400 hover:text-white transition-colors touch-manipulation"
              data-testid="link-website"
              aria-label={t.websiteLabel}
            >
              <ExternalLink className="w-5 h-5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <footer
      id="footer"
      className="bg-gray-900 text-white py-16 lg:py-20"
      data-testid="footer"
      role="contentinfo"
      aria-label={displayLanguage === "es" ? "Pie de página del sitio" : "Site footer"}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-16">
          <div className="lg:col-span-1">
            <img
              src={footerLogo}
              alt="Von Wobeser y Sierra"
              className="h-8 mb-6"
              data-testid="img-footer-logo"
            />
            <p className="text-gray-400 text-sm leading-relaxed" data-testid="text-footer-description">
              {t.description}
            </p>
          </div>

          <nav aria-label={displayLanguage === "es" ? "Enlaces de la firma" : "Firm links"}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-6" data-testid="text-footer-firm-title">
              {t.firm}
            </h3>
            <ul className="space-y-3" data-testid="list-firm-links">
              {t.firmLinks.map((link) => (
                <li key={link.id}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                    data-testid={`link-footer-${link.id}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <nav aria-label={displayLanguage === "es" ? "Enlaces de capacidades" : "Capabilities links"}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-6" data-testid="text-footer-capabilities-title">
                {t.capabilities}
              </h3>
              <ul className="space-y-3" data-testid="list-capabilities-links">
                {t.capabilitiesLinks.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                      data-testid={`link-footer-${link.id}`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mt-6 pt-6 border-t border-gray-800">
              <div className="flex items-center gap-3 text-primary mb-2" data-testid="stat-practice-groups">
                <span className="text-2xl font-heading" aria-label={`18 ${t.practiceLabel}`}>18</span>
                <span className="text-xs text-gray-400 uppercase tracking-wider">
                  {t.practiceLabel}
                </span>
              </div>
              <div className="flex items-center gap-3 text-primary" data-testid="stat-industry-groups">
                <span className="text-2xl font-heading" aria-label={`7 ${t.industryLabel}`}>7</span>
                <span className="text-xs text-gray-400 uppercase tracking-wider">
                  {t.industryLabel}
                </span>
              </div>
            </div>
          </div>

          <nav aria-label={displayLanguage === "es" ? "Enlaces de recursos" : "Resources links"}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-6" data-testid="text-footer-resources-title">
              {t.resources}
            </h3>
            <ul className="space-y-3" data-testid="list-resources-links">
              {t.resourcesLinks.map((link) => (
                <li key={link.id}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                    data-testid={`link-footer-${link.id}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-6" data-testid="text-footer-contact-title">
              {t.contact}
            </h3>
            {renderContactInfo()}
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6">
              <p className="text-xs text-gray-500" data-testid="text-copyright">
                {t.legal}
              </p>
              <img 
                src={esrLogo} 
                alt={displayLanguage === "es" ? "Empresa Socialmente Responsable" : "Socially Responsible Company"}
                className="h-10 object-contain"
                data-testid="img-esr-logo"
              />
            </div>
            <nav className="flex flex-wrap items-center gap-2 sm:gap-4" aria-label={displayLanguage === "es" ? "Enlaces legales" : "Legal links"}>
              <Link
                href="/privacy-policy"
                className="inline-flex items-center min-h-[44px] px-2 text-xs text-gray-500 hover:text-white transition-colors touch-manipulation"
                data-testid="link-privacy"
              >
                {t.privacy}
              </Link>
              <Link
                href="/terms"
                className="inline-flex items-center min-h-[44px] px-2 text-xs text-gray-500 hover:text-white transition-colors touch-manipulation"
                data-testid="link-terms"
              >
                {t.terms}
              </Link>
              <button
                onClick={() => localStorage.removeItem('vwb_cookie_consent')}
                className="inline-flex items-center min-h-[44px] px-2 text-xs text-gray-500 hover:text-white transition-colors touch-manipulation"
                data-testid="button-cookies"
                aria-label={t.cookiesLabel}
              >
                {t.cookies}
              </button>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
