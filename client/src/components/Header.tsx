import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Globe, Search, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import ThemeToggle from "./ThemeToggle";
import type { TeamMember, PracticeGroup, IndustryGroup, News } from "@shared/schema";

interface HeaderProps {
  language: "es" | "en";
  onLanguageChange: (lang: "es" | "en") => void;
}

interface SearchResults {
  team: TeamMember[];
  practiceGroups: PracticeGroup[];
  industryGroups: IndustryGroup[];
  news: News[];
}

export default function Header({ language, onLanguageChange }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, navigate] = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);

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

  const menuItems = [
    { 
      label: language === "es" ? "La Firma" : "The Firm", 
      href: "/about", 
      id: "about", 
      isPage: true,
      subItems: [
        { label: language === "es" ? "Acerca de Nosotros" : "About Us", href: "/about", id: "about-us" },
        { label: language === "es" ? "Nuestro Equipo" : "Our Team", href: "/team", id: "team" },
        { label: language === "es" ? "Contacto" : "Contact", href: "/contact", id: "contact" },
      ]
    },
    { 
      label: language === "es" ? "Áreas de Práctica" : "Practice Areas", 
      href: "/practice-groups", 
      id: "practice-groups", 
      isPage: true 
    },
    { 
      label: language === "es" ? "Industrias" : "Industries", 
      href: "/industry-groups", 
      id: "industry-groups", 
      isPage: true 
    },
    { 
      label: language === "es" ? "Equipo" : "Team", 
      href: "/team", 
      id: "team", 
      isPage: true 
    },
    { 
      label: language === "es" ? "Noticias" : "News", 
      href: "/news", 
      id: "news", 
      isPage: true 
    },
    { 
      label: language === "es" ? "Contacto" : "Contact", 
      href: "/contact", 
      id: "contact", 
      isPage: true 
    },
  ];

  const scrollToSection = (href: string) => {
    setIsMobileMenuOpen(false);
    if (location !== "/") {
      navigate("/");
      setTimeout(() => {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleSearchSelect = (href: string) => {
    setSearchQuery("");
    setIsSearchOpen(false);
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
          >
            <img
              src="https://vonwobeser.com/images/vonwobeser_2025_.png"
              alt="Von Wobeser y Sierra"
              className={cn(
                "transition-all duration-300",
                isScrolled ? "h-10" : "h-12",
                !isScrolled && "brightness-0 invert"
              )}
              data-testid="img-logo"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-6" data-testid="nav-desktop">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium tracking-wide uppercase transition-colors duration-200",
                  isScrolled
                    ? "text-gray-700 dark:text-gray-300 hover:text-primary"
                    : "text-white/90 hover:text-white",
                  location === item.href && "text-primary"
                )}
                data-testid={`link-nav-${item.id}`}
              >
                {item.label}
              </Link>
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
              >
                <Search className="w-5 h-5" />
              </Button>
              
              {isSearchOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden" data-testid="container-search">
                  <div className="p-3">
                    <Input
                      type="text"
                      placeholder={language === "es" ? "Buscar..." : "Search..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="rounded-md"
                      autoFocus
                      data-testid="input-global-search"
                    />
                  </div>
                  
                  {searchQuery.length >= 2 && hasResults && (
                    <div className="max-h-96 overflow-y-auto border-t border-gray-100 dark:border-gray-700">
                      {searchResults.team.length > 0 && (
                        <div className="p-2">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-2 mb-1">
                            {language === "es" ? "Equipo" : "Team"}
                          </p>
                          {searchResults.team.map((member) => (
                            <button
                              key={member.id}
                              onClick={() => handleSearchSelect(`/team/${member.slug}`)}
                              className="w-full text-left px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                              data-testid={`search-result-team-${member.slug}`}
                            >
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                                {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-white">{member.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {language === "es" ? member.titleEs : member.title}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {searchResults.practiceGroups.length > 0 && (
                        <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-2 mb-1">
                            {language === "es" ? "Áreas de Práctica" : "Practice Areas"}
                          </p>
                          {searchResults.practiceGroups.map((group) => (
                            <button
                              key={group.id}
                              onClick={() => handleSearchSelect(`/practice-groups/${group.slug}`)}
                              className="w-full text-left px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              data-testid={`search-result-practice-${group.slug}`}
                            >
                              <p className="text-sm font-medium text-gray-800 dark:text-white">
                                {language === "es" ? group.nameEs : group.name}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {searchResults.industryGroups.length > 0 && (
                        <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-2 mb-1">
                            {language === "es" ? "Industrias" : "Industries"}
                          </p>
                          {searchResults.industryGroups.map((group) => (
                            <button
                              key={group.id}
                              onClick={() => handleSearchSelect(`/industry-groups/${group.slug}`)}
                              className="w-full text-left px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              data-testid={`search-result-industry-${group.slug}`}
                            >
                              <p className="text-sm font-medium text-gray-800 dark:text-white">
                                {language === "es" ? group.nameEs : group.name}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {searchResults.news.length > 0 && (
                        <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-2 mb-1">
                            {language === "es" ? "Noticias" : "News"}
                          </p>
                          {searchResults.news.map((article) => (
                            <button
                              key={article.id}
                              onClick={() => handleSearchSelect(`/news/${article.slug}`)}
                              className="w-full text-left px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              data-testid={`search-result-news-${article.slug}`}
                            >
                              <p className="text-sm font-medium text-gray-800 dark:text-white line-clamp-1">
                                {language === "es" ? article.titleEs : article.title}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {searchQuery.length >= 2 && !hasResults && (
                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
                      {language === "es" ? "No se encontraron resultados" : "No results found"}
                    </div>
                  )}
                </div>
              )}
            </div>

            {isScrolled && <ThemeToggle />}
            
            <button
              onClick={() => onLanguageChange(language === "es" ? "en" : "es")}
              className={cn(
                "flex items-center gap-2 text-sm font-medium transition-colors duration-200 px-2 py-1",
                isScrolled
                  ? "text-gray-700 dark:text-gray-300 hover:text-primary"
                  : "text-white/90 hover:text-white"
              )}
              data-testid="button-language-toggle"
            >
              <Globe className="w-4 h-4" data-testid="icon-globe" />
              <span data-testid="text-language">{language === "es" ? "ENG" : "ESP"}</span>
            </button>

            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "lg:hidden",
                isScrolled ? "text-gray-700 dark:text-gray-300" : "text-white"
              )}
              onClick={() => setIsMobileMenuOpen(true)}
              data-testid="button-mobile-menu"
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-primary" data-testid="modal-mobile-menu">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6">
              <img
                src="https://vonwobeser.com/images/vonwobeser_2025_.png"
                alt="Von Wobeser y Sierra"
                className="h-10 brightness-0 invert"
                data-testid="img-logo-mobile"
              />
              <Button
                variant="ghost"
                size="icon"
                className="text-white"
                onClick={() => setIsMobileMenuOpen(false)}
                data-testid="button-close-menu"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            <nav className="flex flex-col items-center justify-center flex-1 gap-6" data-testid="nav-mobile">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-2xl font-heading text-white/90 hover:text-white transition-colors"
                  data-testid={`link-mobile-${item.id}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  onLanguageChange(language === "es" ? "en" : "es");
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 text-lg text-white/80 hover:text-white mt-8"
                data-testid="button-mobile-language"
              >
                <Globe className="w-5 h-5" />
                <span>{language === "es" ? "English" : "Español"}</span>
              </button>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
