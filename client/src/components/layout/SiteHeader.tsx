import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Menu, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import LanguageSelector from "@/components/LanguageSelector";
import logoColor from "@assets/logovw_1775695774326.png";
import logoWhite from "@assets/logovw-b_1775695826011.png";

/**
 * SiteHeader — header sticky + nav-overlay hamburguesa del shell viejo.
 *
 * - Logo (link a Home), toggle de buscador, selector de idioma (reusa el
 *   LanguageContext/i18n EXISTENTE via <LanguageSelector />).
 * - Botón hamburguesa que abre un menú full-screen #c4c4c4 con items grandes
 *   (Publico-Roman, blanco, hover rojo con subrayado expansivo) y aparición
 *   escalonada (staggered, clase `.vw-nav-open` + `.vw-nav-item`).
 * - Estilos del overlay portados desde templates/beez3/css/style.css (.nav).
 *
 * El i18n usa claves existentes (nav.*) con fallback de texto directo.
 */

interface SubLink {
  href: string;
  labelKey: string;
  fallback: string;
}

interface NavItem {
  href: string;
  labelKey: string;
  fallback: string;
  sublinks?: SubLink[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", labelKey: "nav.home", fallback: "Inicio" },
  { href: "/team", labelKey: "nav.attorneys", fallback: "Abogados" },
  {
    href: "/practice-groups",
    labelKey: "nav.capabilities",
    fallback: "Capacidades",
    sublinks: [
      { href: "/practice-groups", labelKey: "nav.practices", fallback: "Prácticas" },
      { href: "/industry-groups", labelKey: "nav.industryGroups", fallback: "Industrias" },
    ],
  },
  { href: "/news", labelKey: "nav.publications", fallback: "Publicaciones" },
  {
    href: "/about",
    labelKey: "nav.ourFirm",
    fallback: "Nuestra Firma",
    sublinks: [
      { href: "/diversity-inclusion", labelKey: "nav.diversity", fallback: "Diversidad" },
      { href: "/pro-bono", labelKey: "nav.probono", fallback: "Pro Bono" },
    ],
  },
  { href: "/careers", labelKey: "nav.career", fallback: "Carreras" },
  { href: "/contact", labelKey: "nav.contact", fallback: "Contacto" },
];

export default function SiteHeader() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  // Disparador del staggered: se activa un tick después de montar el overlay.
  const [staggerOn, setStaggerOn] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Refs para la gestión de foco del nav-overlay (a11y): contenedor del
  // overlay, botón de cerrar (destino del foco al abrir) y el disparador
  // hamburguesa (al que se restaura el foco al cerrar).
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  // Sombra/contraste del header al hacer scroll.
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Bloquea el scroll del body cuando el overlay está abierto y dispara el
  // staggered de aparición de los items del menú.
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
      const id = window.requestAnimationFrame(() => setStaggerOn(true));
      return () => {
        document.body.style.overflow = "";
        window.cancelAnimationFrame(id);
      };
    }
    setStaggerOn(false);
    document.body.style.overflow = "";
  }, [menuOpen]);

  // A11y del nav-overlay (role=dialog aria-modal): cierre con Escape, traslado
  // del foco al botón de cerrar al abrir, restauración del foco al disparador
  // hamburguesa al cerrar y focus trap que cicla Tab/Shift+Tab dentro del
  // overlay para no dejar escapar el foco al contenido de fondo.
  useEffect(() => {
    if (!menuOpen) return;

    // Recuerda el elemento que tenía el foco para restaurarlo al cerrar
    // (suele ser el botón hamburguesa que abrió el overlay).
    const previouslyFocused = menuTriggerRef.current;

    // Mueve el foco al botón de cerrar al abrir el overlay.
    closeButtonRef.current?.focus();

    // Selector de los elementos enfocables dentro del overlay.
    const getFocusable = (): HTMLElement[] => {
      const overlay = overlayRef.current;
      if (!overlay) return [];
      return Array.from(
        overlay.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = getFocusable();
      if (focusable.length === 0) {
        // Sin enfocables: retiene el foco en el contenedor del overlay.
        e.preventDefault();
        overlayRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      // Si el foco escapó del overlay, lo trae de vuelta al inicio/fin.
      if (!active || !overlayRef.current?.contains(active)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
        return;
      }

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      // Restaura el foco al disparador al cerrar el overlay.
      previouslyFocused?.focus();
    };
  }, [menuOpen]);

  // Enfoca el input de búsqueda al abrirlo.
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const closeMenu = () => setMenuOpen(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navegación SPA (wouter) a Publicaciones con la búsqueda como query param.
    // News.tsx lee `?q` y precarga el filtro de búsqueda. Evitamos
    // `window.location.href` para no forzar una recarga dura del SPA.
    const q = searchValue.trim();
    if (!q) return;
    setLocation(`/news?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setSearchValue("");
  };

  return (
    <>
      <header
        id="main-navigation"
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300",
          isScrolled
            ? "bg-white/95 backdrop-blur-sm shadow-sm py-3"
            : "bg-white py-4",
        )}
        data-testid="site-header"
      >
        <div className="vw-wrap flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="inline-flex items-center transition-opacity hover:opacity-75"
            data-testid="link-logo"
            aria-label="Von Wobeser y Sierra — Inicio"
          >
            <img
              src={logoColor}
              alt="Von Wobeser y Sierra, S.C."
              className="h-10 w-auto md:h-12"
              data-testid="img-logo"
            />
          </Link>

          {/* Acciones: búsqueda, idioma, hamburguesa */}
          <div className="flex items-center gap-2 md:gap-4">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-none text-vw-gray transition-colors hover:text-vw-red"
              aria-label={t("nav.search", "Buscar")}
              aria-expanded={searchOpen}
              data-testid="button-search-toggle"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>

            <LanguageSelector isScrolled compact className="hidden sm:flex" />

            {/* Sello ESR — Empresa Socialmente Responsable (presente en el original) */}
            <img
              src="/esr.jpg"
              alt="Empresa Socialmente Responsable (ESR)"
              className="hidden h-10 w-auto sm:block"
              data-testid="img-esr"
            />

            <button
              ref={menuTriggerRef}
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-none text-vw-gray transition-colors hover:text-vw-red"
              aria-label={t("nav.menu", "Menú")}
              aria-expanded={menuOpen}
              aria-controls="vw-nav-overlay"
              data-testid="button-menu-open"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Buscador desplegable */}
        {searchOpen && (
          <div className="vw-wrap pb-4 pt-2">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-2 border-b border-vw-graylight"
              role="search"
            >
              <Search className="h-5 w-5 text-vw-red" aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={t("nav.searchPlaceholder", "Buscar...")}
                className="w-full bg-transparent py-2 text-vw-gray outline-none placeholder:text-vw-graylight"
                data-testid="input-search"
                aria-label={t("nav.search", "Buscar")}
              />
            </form>
          </div>
        )}
      </header>

      {/* ───────── NAV OVERLAY full-screen #c4c4c4 ───────── */}
      {menuOpen && (
        <div
          ref={overlayRef}
          id="vw-nav-overlay"
          className="vw-nav-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={t("nav.menu", "Menú")}
          tabIndex={-1}
          data-testid="nav-overlay"
        >
          <div className="vw-wrap flex items-center justify-between py-8">
            <Link
              href="/"
              onClick={closeMenu}
              className="inline-flex items-center"
              data-testid="link-overlay-logo"
            >
              <img
                src={logoWhite}
                alt="Von Wobeser y Sierra, S.C."
                className="h-10 w-auto"
              />
            </Link>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeMenu}
              className="flex h-12 w-12 items-center justify-center text-white transition-colors hover:text-vw-red"
              aria-label={t("nav.close", "Cerrar")}
              data-testid="button-menu-close"
            >
              <X className="h-8 w-8" aria-hidden="true" />
            </button>
          </div>

          <nav
            className="vw-wrap flex min-h-[calc(100vh-160px)] items-center"
            aria-label={t("nav.menu", "Menú principal")}
          >
            <ul
              className={cn(
                "flex w-full max-w-[400px] flex-col gap-2",
                staggerOn && "vw-nav-open",
              )}
            >
              {NAV_ITEMS.map((item) => (
                <li key={item.href} className="vw-nav-item">
                  <Link
                    href={item.href}
                    onClick={closeMenu}
                    className="vw-nav-link"
                    data-testid={`nav-link-${item.labelKey}`}
                  >
                    {t(item.labelKey, item.fallback)}
                  </Link>
                  {item.sublinks && (
                    <div className="vw-nav-sublink">
                      {item.sublinks.map((sub, idx) => (
                        <span key={sub.href}>
                          <Link
                            href={sub.href}
                            onClick={closeMenu}
                            className="transition-colors hover:text-vw-red"
                            data-testid={`nav-sublink-${sub.labelKey}`}
                          >
                            {t(sub.labelKey, sub.fallback)}
                          </Link>
                          {idx < item.sublinks!.length - 1 && (
                            <span aria-hidden="true"> · </span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Selector de idioma dentro del overlay (mobile-friendly) */}
          <div className="vw-wrap pb-10">
            <LanguageSelector isMobile />
          </div>
        </div>
      )}
    </>
  );
}
