import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  language: "es" | "en";
  onLanguageChange: (lang: "es" | "en") => void;
}

export default function Header({ language, onLanguageChange }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location, navigate] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menuItems = [
    { label: language === "es" ? "Inicio" : "Home", href: "/", id: "home", isPage: true },
    { label: language === "es" ? "Áreas de Práctica" : "Practice Groups", href: "/practice-groups", id: "practice-groups", isPage: true },
    { label: language === "es" ? "Industrias" : "Industries", href: "/industry-groups", id: "industry-groups", isPage: true },
    { label: language === "es" ? "Equipo" : "Team", href: "/team", id: "team", isPage: true },
    { label: language === "es" ? "Noticias" : "News", href: "#news", id: "news", isPage: false },
    { label: language === "es" ? "Contacto" : "Contact", href: "#footer", id: "contact", isPage: false },
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

          <nav className="hidden lg:flex items-center gap-8" data-testid="nav-desktop">
            {menuItems.map((item) => (
              item.isPage ? (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium tracking-wide uppercase transition-colors duration-200",
                    isScrolled
                      ? "text-gray-700 dark:text-gray-300 hover:text-primary"
                      : "text-white/90 hover:text-white"
                  )}
                  data-testid={`link-nav-${item.id}`}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(item.href);
                  }}
                  className={cn(
                    "text-sm font-medium tracking-wide uppercase transition-colors duration-200",
                    isScrolled
                      ? "text-gray-700 dark:text-gray-300 hover:text-primary"
                      : "text-white/90 hover:text-white"
                  )}
                  data-testid={`link-nav-${item.id}`}
                >
                  {item.label}
                </a>
              )
            ))}
          </nav>

          <div className="flex items-center gap-2">
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

            <nav className="flex flex-col items-center justify-center flex-1 gap-8" data-testid="nav-mobile">
              {menuItems.map((item) => (
                item.isPage ? (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-2xl font-heading text-white/90 hover:text-white transition-colors"
                    data-testid={`link-mobile-${item.id}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(item.href);
                    }}
                    className="text-2xl font-heading text-white/90 hover:text-white transition-colors"
                    data-testid={`link-mobile-${item.id}`}
                  >
                    {item.label}
                  </a>
                )
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
                <span>{language === "es" ? "English" : "Espa\u00f1ol"}</span>
              </button>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
