import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import logoWhite from "@assets/logovw-b_1775695826011.png";

/**
 * SiteFooter — footer del shell viejo de Von Wobeser.
 *
 * Fondo gris oscuro corporativo (#5e5e5e), contenido centrado, logo blanco,
 * texto de firma y línea de copyright. Mantiene el look minimal del mirror.
 */
export default function SiteFooter() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer
      id="site-footer"
      className="w-full bg-vw-gray text-white"
      data-testid="site-footer"
    >
      <div className="vw-wrap py-14">
        <div className="flex flex-col items-center text-center gap-6">
          <Link
            href="/"
            className="inline-block transition-opacity hover:opacity-75"
            data-testid="link-footer-logo"
          >
            <img
              src={logoWhite}
              alt="Von Wobeser y Sierra, S.C."
              className="h-12 w-auto"
              loading="lazy"
              data-testid="img-footer-logo"
            />
          </Link>

          <p className="font-serif text-xl text-white/90 max-w-2xl">
            Von Wobeser y Sierra, S.C.
          </p>

          <nav
            aria-label={t("nav.contact", "Contacto")}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
          >
            <Link
              href="/contact"
              className="vw-label text-xs text-white/80 transition-opacity hover:opacity-75"
              data-testid="link-footer-contact"
            >
              {t("nav.contact", "Contacto")}
            </Link>
            <Link
              href="/privacy-policy"
              className="vw-label text-xs text-white/80 transition-opacity hover:opacity-75"
              data-testid="link-footer-privacy"
            >
              {t("nav.privacy", "Privacidad")}
            </Link>
            <Link
              href="/terms"
              className="vw-label text-xs text-white/80 transition-opacity hover:opacity-75"
              data-testid="link-footer-terms"
            >
              {t("nav.terms", "Términos")}
            </Link>
          </nav>

          <p className="text-sm text-white/70">
            © {year} Von Wobeser y Sierra, S.C. — Ciudad de México.
          </p>
        </div>
      </div>
    </footer>
  );
}
