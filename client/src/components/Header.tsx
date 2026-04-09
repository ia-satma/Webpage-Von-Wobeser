import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Search, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import ThemeToggle from "./ThemeToggle";
import LanguageSelector from "./LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslatedContent } from "@/hooks/useTranslatedContent";
import type { TeamMember, PracticeGroup, IndustryGroup, News, LanguageCode } from "@shared/schema";
import logoColor from "@assets/Artboard_1_1775695263479.png";
import logoWhite from "@assets/Artboard_1_copy_4_1775695277034.png";

interface SearchResults {
  team: TeamMember[];
  practiceGroups: PracticeGroup[];
  industryGroups: IndustryGroup[];
  news: News[];
}

interface SubMenuItem {
  labelKey: string;
  href: string;
  id: string;
}

interface MenuItem {
  labelKey: string;
  href: string;
  id: string;
  subItems?: SubMenuItem[];
}

function SearchResultTeamMember({
  member,
  language,
  onSelect,
}: {
  member: TeamMember;
  language: LanguageCode;
  onSelect: (href: string) => void;
}) {
  const { translatedFields } = useTranslatedContent({
    contentType: 'team_member',
    entityId: member.id.toString(),
    fields: { title: member.titleEs || member.title, titleEs: member.titleEs },
    enabled: language !== 'es',
  });

  const displayTitle = language === 'es'
    ? member.titleEs
    : (translatedFields.title || member.titleEs || member.title);

  return (
    <button
      onClick={() => onSelect(`/team/${member.slug}`)}
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
          {displayTitle}
        </p>
      </div>
    </button>
  );
}

function SearchResultPracticeGroup({
  group,
  language,
  onSelect,
}: {
  group: PracticeGroup;
  language: LanguageCode;
  onSelect: (href: string) => void;
}) {
  const { translatedFields } = useTranslatedContent({
    contentType: 'practice_group',
    entityId: group.id.toString(),
    fields: { name: group.nameEs || group.name, nameEs: group.nameEs },
    enabled: language !== 'es',
  });

  const displayName = language === 'es'
    ? group.nameEs
    : (translatedFields.name || group.nameEs || group.name);

  return (
    <button
      onClick={() => onSelect(`/practice-groups/${group.slug}`)}
      className="w-full text-left px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
      data-testid={`search-result-practice-${group.slug}`}
      role="option"
    >
      <p className="text-sm font-medium text-gray-800 dark:text-white">
        {displayName}
      </p>
    </button>
  );
}

function SearchResultIndustryGroup({
  group,
  language,
  onSelect,
}: {
  group: IndustryGroup;
  language: LanguageCode;
  onSelect: (href: string) => void;
}) {
  const { translatedFields } = useTranslatedContent({
    contentType: 'industry_group',
    entityId: group.id.toString(),
    fields: { name: group.nameEs || group.name, nameEs: group.nameEs },
    enabled: language !== 'es',
  });

  const displayName = language === 'es'
    ? group.nameEs
    : (translatedFields.name || group.nameEs || group.name);

  return (
    <button
      onClick={() => onSelect(`/industry-groups/${group.slug}`)}
      className="w-full text-left px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
      data-testid={`search-result-industry-${group.slug}`}
      role="option"
    >
      <p className="text-sm font-medium text-gray-800 dark:text-white">
        {displayName}
      </p>
    </button>
  );
}

function SearchResultNews({
  article,
  language,
  onSelect,
}: {
  article: News;
  language: LanguageCode;
  onSelect: (href: string) => void;
}) {
  const { translatedFields } = useTranslatedContent({
    contentType: 'news',
    entityId: article.id.toString(),
    fields: { title: article.titleEs || article.title, titleEs: article.titleEs },
    enabled: language !== 'es',
  });

  const displayTitle = language === 'es'
    ? article.titleEs
    : (translatedFields.title || article.titleEs || article.title);

  return (
    <button
      onClick={() => onSelect(`/news/${article.slug}`)}
      className="w-full text-left px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
      data-testid={`search-result-news-${article.slug}`}
      role="option"
    >
      <p className="text-sm font-medium text-gray-800 dark:text-white line-clamp-1">
        {displayTitle}
      </p>
    </button>
  );
}

export default function Header() {
  const { language, displayLanguage } = useLanguage();
  const { t } = useTranslation();
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

  const menuItems: MenuItem[] = [
    {
      labelKey: "nav.ourFirm",
      href: "/about",
      id: "our-firm",
      subItems: [
        { labelKey: "nav.probono", href: "/pro-bono", id: "pro-bono" },
        { labelKey: "nav.diversity", href: "/diversity-inclusion", id: "diversity-inclusion" },
      ],
    },
    {
      labelKey: "nav.attorneys",
      href: "/team",
      id: "attorneys",
      subItems: [
        { labelKey: "nav.partners", href: "/team?type=partners", id: "partners" },
        { labelKey: "nav.ofCounsel", href: "/team?type=of-counsel", id: "of-counsel" },
        { labelKey: "nav.associates", href: "/team?type=associates", id: "associates" },
      ],
    },
    {
      labelKey: "nav.capabilities",
      href: "/practice-groups",
      id: "capabilities",
      subItems: [
        { labelKey: "nav.practices", href: "/practice-groups", id: "practices" },
        { labelKey: "nav.industryGroups", href: "/industry-groups", id: "industry-groups" },
        { labelKey: "nav.desk", href: "/german-desk", id: "german-desk" },
      ],
    },
    {
      labelKey: "nav.publications",
      href: "/news",
      id: "publications",
      subItems: [
        { labelKey: "nav.news", href: "/news", id: "news" },
        { labelKey: "nav.articles", href: "/articles", id: "articles" },
        { labelKey: "nav.newsletter", href: "/newsletter", id: "newsletter" },
      ],
    },
    {
      labelKey: "nav.career",
      href: "/careers",
      id: "careers",
      subItems: [
        { labelKey: "nav.interns", href: "/careers/interns", id: "interns" },
      ],
    },
    {
      labelKey: "nav.contact",
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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-12 flex items-center justify-between gap-2 sm:gap-4">
          <Link
            href="/"
            className="flex items-center gap-3 flex-shrink-0"
            data-testid="link-logo"
            aria-label={`Von Wobeser y Sierra - ${t('nav.home')}`}
          >
            <img
              src={isScrolled ? logoColor : logoWhite}
              alt="Von Wobeser y Sierra"
              className={cn(
                "transition-all duration-300 flex-shrink-0 object-contain",
                isScrolled
                  ? "h-7 sm:h-8 md:h-9 w-auto max-w-[150px] sm:max-w-[180px] md:max-w-[220px] dark:brightness-0 dark:invert"
                  : "h-8 sm:h-9 md:h-11 w-auto max-w-[150px] sm:max-w-[200px] md:max-w-[260px]"
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
            aria-label={t('common.mainNav')}
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
                    location === item.href && "text-primary",
                    activeDropdown === item.id && (isScrolled ? "text-primary" : "text-white")
                  )}
                  data-testid={`link-nav-${item.id}`}
                  aria-current={location === item.href ? "page" : undefined}
                  aria-haspopup={item.subItems ? "true" : undefined}
                  aria-expanded={item.subItems ? activeDropdown === item.id : undefined}
                >
                  {t(item.labelKey)}
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
                    aria-label={`${t(item.labelKey)} submenu`}
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
                        {t(subItem.labelKey)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="relative" ref={searchRef}>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  isScrolled ? "text-gray-700 dark:text-gray-300" : "text-white"
                )}
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                data-testid="button-search"
                aria-label={isSearchOpen ? t('common.closeSearch') : t('common.openSearch')}
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
                  aria-label={t('common.search')}
                >
                  <div className="p-3">
                    <Input
                      type="search"
                      placeholder={t('common.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="rounded-md"
                      autoFocus
                      data-testid="input-global-search"
                      aria-label={t('common.search')}
                    />
                  </div>

                  {searchQuery.length >= 2 && hasResults && (
                    <div
                      className="max-h-96 overflow-y-auto border-t border-gray-100 dark:border-gray-700"
                      role="listbox"
                      aria-label={t('common.searchResults')}
                    >
                      {searchResults.team.length > 0 && (
                        <div className="p-2" role="group" aria-label={t('team.title')}>
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-2 mb-1" id="search-team-label">
                            {t('team.title')}
                          </p>
                          {searchResults.team.map((member) => (
                            <SearchResultTeamMember
                              key={member.id}
                              member={member}
                              language={language as LanguageCode}
                              onSelect={handleSearchSelect}
                            />
                          ))}
                        </div>
                      )}

                      {searchResults.practiceGroups.length > 0 && (
                        <div className="p-2 border-t border-gray-100 dark:border-gray-700" role="group" aria-label={t('practices.title')}>
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-2 mb-1">
                            {t('practices.title')}
                          </p>
                          {searchResults.practiceGroups.map((group) => (
                            <SearchResultPracticeGroup
                              key={group.id}
                              group={group}
                              language={language as LanguageCode}
                              onSelect={handleSearchSelect}
                            />
                          ))}
                        </div>
                      )}

                      {searchResults.industryGroups.length > 0 && (
                        <div className="p-2 border-t border-gray-100 dark:border-gray-700" role="group" aria-label={t('industries.title')}>
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-2 mb-1">
                            {t('industries.title')}
                          </p>
                          {searchResults.industryGroups.map((group) => (
                            <SearchResultIndustryGroup
                              key={group.id}
                              group={group}
                              language={language as LanguageCode}
                              onSelect={handleSearchSelect}
                            />
                          ))}
                        </div>
                      )}

                      {searchResults.news.length > 0 && (
                        <div className="p-2 border-t border-gray-100 dark:border-gray-700" role="group" aria-label={t('news.title')}>
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-2 mb-1">
                            {t('news.title')}
                          </p>
                          {searchResults.news.map((article) => (
                            <SearchResultNews
                              key={article.id}
                              article={article}
                              language={language as LanguageCode}
                              onSelect={handleSearchSelect}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {searchQuery.length >= 2 && !hasResults && (
                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700" role="status">
                      {t('common.noResults')}
                    </div>
                  )}
                </div>
              )}
            </div>

            {isScrolled && <ThemeToggle />}

            <LanguageSelector isScrolled={isScrolled} className="hidden sm:flex" />
            <LanguageSelector isScrolled={isScrolled} compact className="flex sm:hidden" />

            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "lg:hidden",
                isScrolled ? "text-gray-700 dark:text-gray-300" : "text-white"
              )}
              onClick={() => setIsMobileMenuOpen(true)}
              data-testid="button-mobile-menu"
              aria-label={t('common.openMenu')}
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
          aria-label={t('common.mobileNav')}
        >
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-6">
              <img
                src={logoWhite}
                alt="Von Wobeser y Sierra"
                className="h-8 sm:h-10 w-auto max-w-[180px] sm:max-w-[220px] object-contain flex-shrink-0"
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
                  aria-label={t('common.closeMenu')}
                >
                  <X className="w-6 h-6" aria-hidden="true" />
                </Button>
              </div>
            </div>

            <nav
              className="flex-1 overflow-y-auto px-6 py-4"
              data-testid="nav-mobile"
              role="navigation"
              aria-label={t('common.mobileNav')}
            >
              <div className="space-y-2">
                {menuItems.map((item) => (
                  <div key={item.id} className="border-b border-white/10 last:border-0" data-testid={`mobile-nav-item-${item.id}`}>
                    {item.subItems ? (
                      <>
                        <button
                          onClick={() => toggleMobileSubmenu(item.id)}
                          className="w-full flex items-center justify-between min-h-[48px] py-4 text-xl font-heading text-white/90 hover:text-white transition-colors touch-manipulation"
                          data-testid={`button-mobile-nav-${item.id}`}
                          aria-expanded={expandedMobileMenus.includes(item.id)}
                          aria-controls={`mobile-submenu-${item.id}`}
                          aria-label={`${t(item.labelKey)} - ${expandedMobileMenus.includes(item.id) ? t('common.collapseSubmenu') : t('common.expandSubmenu')}`}
                        >
                          <span>{t(item.labelKey)}</span>
                          <ChevronDown
                            className={cn(
                              "w-6 h-6 transition-transform duration-200",
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
                          aria-label={`${t(item.labelKey)} submenu`}
                        >
                          <div className="pl-4 space-y-1">
                            <button
                              onClick={() => handleMobileNavClick(item.href)}
                              className="block w-full text-left min-h-[44px] py-3 text-base text-white/70 hover:text-white transition-colors"
                              role="menuitem"
                              data-testid={`link-mobile-subnav-${item.id}-all`}
                            >
                              {t('common.viewAll')}
                            </button>
                            {item.subItems.map((subItem) => (
                              <button
                                key={subItem.id}
                                onClick={() => handleMobileNavClick(subItem.href)}
                                className="block w-full text-left min-h-[44px] py-3 text-base text-white/70 hover:text-white transition-colors"
                                role="menuitem"
                                data-testid={`link-mobile-subnav-${subItem.id}`}
                              >
                                {t(subItem.labelKey)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={() => handleMobileNavClick(item.href)}
                        className="w-full text-left min-h-[48px] py-4 text-xl font-heading text-white/90 hover:text-white transition-colors touch-manipulation"
                        data-testid={`link-mobile-${item.id}`}
                        aria-current={location === item.href ? "page" : undefined}
                      >
                        {t(item.labelKey)}
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
