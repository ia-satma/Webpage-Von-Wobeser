import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Search, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import ThemeToggle from "./ThemeToggle";
import LanguageSelector from "./LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TeamMember, PracticeGroup, IndustryGroup, News } from "@shared/schema";
import logoHD from "@assets/vonwobeser_logo_2025_full.png";

interface SearchResults {
  team: TeamMember[];
  practiceGroups: PracticeGroup[];
  industryGroups: IndustryGroup[];
  news: News[];
}

interface SubMenuItem {
  label: { en: string; es: string };
  href: string;
  id: string;
}

interface MenuItem {
  label: { en: string; es: string };
  href: string;
  id: string;
  subItems?: SubMenuItem[];
}

export default function Header() {
  const { language, displayLanguage } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [expandedMobileMenus, setExpandedMobileMenus] = useState<string[]>([]);
  const [location, navigate] = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: searchResults } = useQuery<SearchResults>({
    queryKey: ["/api/search", searchQuery],
    enabled: searchQuery.length >= 2,
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  const ariaLabels = {
    en: {
      mainNav: "Main navigation",
      mobileNav: "Mobile navigation",
      search: "Search",
      openSearch: "Open search",
      closeSearch: "Close search",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      toggleLanguage: "Switch language",
      searchPlaceholder: "Search...",
      noResults: "No results found",
      teamSection: "Team",
      practiceSection: "Practice Areas",
      industrySection: "Industries",
      newsSection: "News",
      expandSubmenu: "Expand submenu",
      collapseSubmenu: "Collapse submenu",
    },
    es: {
      mainNav: "Navegación principal",
      mobileNav: "Navegación móvil",
      search: "Buscar",
      openSearch: "Abrir búsqueda",
      closeSearch: "Cerrar búsqueda",
      openMenu: "Abrir menú",
      closeMenu: "Cerrar menú",
      toggleLanguage: "Cambiar idioma",
      searchPlaceholder: "Buscar...",
      noResults: "No se encontraron resultados",
      teamSection: "Equipo",
      practiceSection: "Áreas de Práctica",
      industrySection: "Industrias",
      newsSection: "Noticias",
      expandSubmenu: "Expandir submenú",
      collapseSubmenu: "Contraer submenú",
    },
  };

  const aria = ariaLabels[displayLanguage];

  const menuItems: MenuItem[] = [
    {
      label: { en: "Our Firm", es: "Nuestra Firma" },
      href: "/about",
      id: "our-firm",
      subItems: [
        { label: { en: "Pro Bono", es: "Pro Bono" }, href: "/pro-bono", id: "pro-bono" },
        { label: { en: "Diversity & Inclusion", es: "Diversidad e Inclusión" }, href: "/diversity-inclusion", id: "diversity-inclusion" },
      ],
    },
    {
      label: { en: "Attorneys", es: "Profesionales" },
      href: "/team",
      id: "attorneys",
      subItems: [
        { label: { en: "Partners", es: "Socios" }, href: "/team?type=partners", id: "partners" },
        { label: { en: "Of Counsel", es: "Of Counsel" }, href: "/team?type=of-counsel", id: "of-counsel" },
        { label: { en: "Counsel", es: "Consejeros" }, href: "/team?type=counsel", id: "counsel" },
        { label: { en: "Associates", es: "Asociados" }, href: "/team?type=associates", id: "associates" },
      ],
    },
    {
      label: { en: "Capabilities", es: "Capacidades" },
      href: "/practice-groups",
      id: "capabilities",
      subItems: [
        { label: { en: "Practices (18)", es: "Prácticas (18)" }, href: "/practice-groups", id: "practices" },
        { label: { en: "Industry Groups (7)", es: "Grupos de Industria (7)" }, href: "/industry-groups", id: "industry-groups" },
        { label: { en: "German Desk", es: "German Desk" }, href: "/german-desk", id: "german-desk" },
      ],
    },
    {
      label: { en: "Publications", es: "Publicaciones" },
      href: "/news",
      id: "publications",
      subItems: [
        { label: { en: "News", es: "Noticias" }, href: "/news", id: "news" },
        { label: { en: "Articles", es: "Artículos" }, href: "/articles", id: "articles" },
        { label: { en: "Newsletter", es: "Boletines" }, href: "/newsletter", id: "newsletter" },
      ],
    },
    {
      label: { en: "Career at VWyS", es: "Carrera en VWyS" },
      href: "/careers",
      id: "careers",
      subItems: [
        { label: { en: "Interns", es: "Pasantes" }, href: "/careers/interns", id: "interns" },
      ],
    },
    {
      label: { en: "Contact", es: "Contacto" },
      href: "/contact",
      id: "contact",
    },
  ];

  const handleDropdownEnter = (itemId: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setActiveDropdown(itemId);
  };

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  const toggleMobileSubmenu = (itemId: string) => {
    setExpandedMobileMenus((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSearchSelect = (href: string) => {
    setSearchQuery("");
    setIsSearchOpen(false);
    navigate(href);
  };

  const handleMobileNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    setExpandedMobileMenus([]);
    navigate(href);
  };

  const hasResults = searchResults && (
    searchResults.team.length > 0 ||
    searchResults.practiceGroups.length > 0 ||
    searchResults.industryGroups.length > 0 ||
    searchResults.news.length > 0
  );

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isScrolled
            ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-md py-3"
            : "bg-transparent py-6"
        )}
        data-testid="header"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-3"
            data-testid="link-logo"
            aria-label={displayLanguage === "es" ? "Von Wobeser y Sierra - Inicio" : "Von Wobeser y Sierra - Home"}
          >
            <img
              src={logoHD}
              alt="Von Wobeser y Sierra"
              width={318}
              height={70}
              className={cn(
                "transition-all duration-300 w-auto",
                isScrolled ? "h-8 md:h-10" : "h-10 md:h-12",
                !isScrolled && "brightness-0 invert",
                isScrolled && "dark:brightness-0 dark:invert"
              )}
              style={{ imageRendering: "crisp-edges" }}
              data-testid="img-logo"
            />
          </Link>

          <nav
            id="main-navigation"
            className="hidden lg:flex items-center gap-1"
            data-testid="nav-desktop"
            role="navigation"
            aria-label={aria.mainNav}
          >
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="relative"
                onMouseEnter={() => item.subItems && handleDropdownEnter(item.id)}
                onMouseLeave={handleDropdownLeave}
                data-testid={`nav-item-${item.id}`}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 text-sm font-medium tracking-wide uppercase transition-colors duration-200",
                    isScrolled
                      ? "text-gray-700 dark:text-gray-300 hover:text-primary"
                      : "text-white/90 hover:text-white",
                    location === item.href && "text-primary"
                  )}
                  data-testid={`link-nav-${item.id}`}
                  aria-current={location === item.href ? "page" : undefined}
                  aria-haspopup={item.subItems ? "true" : undefined}
                  aria-expanded={item.subItems ? activeDropdown === item.id : undefined}
                >
                  {item.label[displayLanguage]}
                  {item.subItems && (
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        activeDropdown === item.id && "rotate-180"
                      )}
                      aria-hidden="true"
                      data-testid={`icon-chevron-${item.id}`}
                    />
                  )}
                </Link>

                {item.subItems && activeDropdown === item.id && (
                  <div
                    className="absolute top-full left-0 mt-1 min-w-[220px] bg-white dark:bg-gray-800 rounded-md shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50"
                    role="menu"
                    aria-label={`${item.label[displayLanguage]} submenu`}
                    data-testid={`dropdown-${item.id}`}
                    onMouseEnter={() => handleDropdownEnter(item.id)}
                    onMouseLeave={handleDropdownLeave}
                  >
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.id}
                        href={subItem.href}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary transition-colors duration-150"
                        role="menuitem"
                        data-testid={`link-subnav-${subItem.id}`}
                        onClick={() => setActiveDropdown(null)}
                      >
                        {subItem.label[displayLanguage]}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="relative" ref={searchRef}>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  isScrolled ? "text-gray-700 dark:text-gray-300" : "text-white"
                )}
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                data-testid="button-search"
                aria-label={isSearchOpen ? aria.closeSearch : aria.openSearch}
                aria-expanded={isSearchOpen}
                aria-controls="search-panel"
              >
                <Search className="w-5 h-5" aria-hidden="true" />
              </Button>

              {isSearchOpen && (
                <div
                  id="search-panel"
                  className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                  data-testid="container-search"
                  role="search"
                  aria-label={aria.search}
                >
                  <div className="p-3">
                    <Input
                      type="search"
                      placeholder={aria.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="rounded-md"
                      autoFocus
                      data-testid="input-global-search"
                      aria-label={aria.search}
                    />
                  </div>

                  {searchQuery.length >= 2 && hasResults && (
                    <div
                      className="max-h-96 overflow-y-auto border-t border-gray-100 dark:border-gray-700"
                      role="listbox"
                      aria-label={displayLanguage === "es" ? "Resultados de búsqueda" : "Search results"}
                    >
                      {searchResults.team.length > 0 && (
                        <div className="p-2" role="group" aria-label={aria.teamSection}>
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-2 mb-1" id="search-team-label">
                            {aria.teamSection}
                          </p>
                          {searchResults.team.map((member) => (
                            <button
                              key={member.id}
                              onClick={() => handleSearchSelect(`/team/${member.slug}`)}
                              className="w-full text-left px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                              data-testid={`search-result-team-${member.slug}`}
                              role="option"
                            >
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium" aria-hidden="true">
                                {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-white">{member.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {displayLanguage === "es" ? member.titleEs : member.title}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {searchResults.practiceGroups.length > 0 && (
                        <div className="p-2 border-t border-gray-100 dark:border-gray-700" role="group" aria-label={aria.practiceSection}>
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-2 mb-1">
                            {aria.practiceSection}
                          </p>
                          {searchResults.practiceGroups.map((group) => (
                            <button
                              key={group.id}
                              onClick={() => handleSearchSelect(`/practice-groups/${group.slug}`)}
                              className="w-full text-left px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              data-testid={`search-result-practice-${group.slug}`}
                              role="option"
                            >
                              <p className="text-sm font-medium text-gray-800 dark:text-white">
                                {displayLanguage === "es" ? group.nameEs : group.name}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}

                      {searchResults.industryGroups.length > 0 && (
                        <div className="p-2 border-t border-gray-100 dark:border-gray-700" role="group" aria-label={aria.industrySection}>
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-2 mb-1">
                            {aria.industrySection}
                          </p>
                          {searchResults.industryGroups.map((group) => (
                            <button
                              key={group.id}
                              onClick={() => handleSearchSelect(`/industry-groups/${group.slug}`)}
                              className="w-full text-left px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              data-testid={`search-result-industry-${group.slug}`}
                              role="option"
                            >
                              <p className="text-sm font-medium text-gray-800 dark:text-white">
                                {displayLanguage === "es" ? group.nameEs : group.name}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}

                      {searchResults.news.length > 0 && (
                        <div className="p-2 border-t border-gray-100 dark:border-gray-700" role="group" aria-label={aria.newsSection}>
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-2 mb-1">
                            {aria.newsSection}
                          </p>
                          {searchResults.news.map((article) => (
                            <button
                              key={article.id}
                              onClick={() => handleSearchSelect(`/news/${article.slug}`)}
                              className="w-full text-left px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              data-testid={`search-result-news-${article.slug}`}
                              role="option"
                            >
                              <p className="text-sm font-medium text-gray-800 dark:text-white line-clamp-1">
                                {displayLanguage === "es" ? article.titleEs : article.title}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {searchQuery.length >= 2 && !hasResults && (
                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700" role="status">
                      {aria.noResults}
                    </div>
                  )}
                </div>
              )}
            </div>

            {isScrolled && <ThemeToggle />}

            <LanguageSelector isScrolled={isScrolled} />

            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "lg:hidden",
                isScrolled ? "text-gray-700 dark:text-gray-300" : "text-white"
              )}
              onClick={() => setIsMobileMenuOpen(true)}
              data-testid="button-mobile-menu"
              aria-label={aria.openMenu}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <Menu className="w-6 h-6" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div
          id="mobile-menu"
          className="fixed inset-0 z-[60] bg-primary"
          data-testid="modal-mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label={aria.mobileNav}
        >
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between p-6">
              <img
                src={logoHD}
                alt="Von Wobeser y Sierra"
                width={318}
                height={70}
                className="h-6 w-auto brightness-0 invert"
                style={{ imageRendering: "crisp-edges" }}
                data-testid="img-logo-mobile"
              />
              <div className="flex items-center gap-2">
                <LanguageSelector isMobile={true} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setExpandedMobileMenus([]);
                  }}
                  data-testid="button-close-menu"
                  aria-label={aria.closeMenu}
                >
                  <X className="w-6 h-6" aria-hidden="true" />
                </Button>
              </div>
            </div>

            <nav
              className="flex-1 overflow-y-auto px-6 py-4"
              data-testid="nav-mobile"
              role="navigation"
              aria-label={aria.mobileNav}
            >
              <div className="space-y-2">
                {menuItems.map((item) => (
                  <div key={item.id} className="border-b border-white/10 last:border-0" data-testid={`mobile-nav-item-${item.id}`}>
                    {item.subItems ? (
                      <>
                        <button
                          onClick={() => toggleMobileSubmenu(item.id)}
                          className="w-full flex items-center justify-between py-4 text-xl font-heading text-white/90 hover:text-white transition-colors"
                          data-testid={`button-mobile-nav-${item.id}`}
                          aria-expanded={expandedMobileMenus.includes(item.id)}
                          aria-controls={`mobile-submenu-${item.id}`}
                          aria-label={`${item.label[displayLanguage]} - ${expandedMobileMenus.includes(item.id) ? aria.collapseSubmenu : aria.expandSubmenu}`}
                        >
                          <span>{item.label[displayLanguage]}</span>
                          <ChevronDown
                            className={cn(
                              "w-5 h-5 transition-transform duration-200",
                              expandedMobileMenus.includes(item.id) && "rotate-180"
                            )}
                            aria-hidden="true"
                          />
                        </button>
                        <div
                          id={`mobile-submenu-${item.id}`}
                          className={cn(
                            "overflow-hidden transition-all duration-300",
                            expandedMobileMenus.includes(item.id)
                              ? "max-h-96 opacity-100 pb-4"
                              : "max-h-0 opacity-0"
                          )}
                          role="menu"
                          aria-label={`${item.label[displayLanguage]} submenu`}
                        >
                          <div className="pl-4 space-y-2">
                            <button
                              onClick={() => handleMobileNavClick(item.href)}
                              className="block w-full text-left py-2 text-base text-white/70 hover:text-white transition-colors"
                              role="menuitem"
                              data-testid={`link-mobile-subnav-${item.id}-all`}
                            >
                              {displayLanguage === "es" ? "Ver todo" : "View all"}
                            </button>
                            {item.subItems.map((subItem) => (
                              <button
                                key={subItem.id}
                                onClick={() => handleMobileNavClick(subItem.href)}
                                className="block w-full text-left py-2 text-base text-white/70 hover:text-white transition-colors"
                                role="menuitem"
                                data-testid={`link-mobile-subnav-${subItem.id}`}
                              >
                                {subItem.label[displayLanguage]}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={() => handleMobileNavClick(item.href)}
                        className="w-full text-left py-4 text-xl font-heading text-white/90 hover:text-white transition-colors"
                        data-testid={`link-mobile-${item.id}`}
                        aria-current={location === item.href ? "page" : undefined}
                      >
                        {item.label[displayLanguage]}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
