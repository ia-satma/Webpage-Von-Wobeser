import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const ariaLabels = {
  en: { toLight: "Switch to light mode", toDark: "Switch to dark mode" },
  es: { toLight: "Cambiar a modo claro", toDark: "Cambiar a modo oscuro" },
  de: { toLight: "Zum hellen Modus wechseln", toDark: "Zum dunklen Modus wechseln" },
  zh: { toLight: "切换到浅色模式", toDark: "切换到深色模式" },
  ko: { toLight: "라이트 모드로 전환", toDark: "다크 모드로 전환" },
  ja: { toLight: "ライトモードに切り替え", toDark: "ダークモードに切り替え" },
  ar: { toLight: "التبديل إلى الوضع الفاتح", toDark: "التبديل إلى الوضع الداكن" },
  ru: { toLight: "Переключить на светлый режим", toDark: "Переключить на тёмный режим" },
  fr: { toLight: "Passer au mode clair", toDark: "Passer au mode sombre" },
  it: { toLight: "Passa alla modalità chiara", toDark: "Passa alla modalità scura" },
};

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = stored === "dark" || (!stored && prefersDark);
    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const labels = ariaLabels[language as keyof typeof ariaLabels] || ariaLabels.en;
  const ariaLabel = isDark ? labels.toLight : labels.toDark;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="text-gray-700 dark:text-gray-300"
      data-testid="button-theme-toggle"
      aria-label={ariaLabel}
      aria-pressed={isDark}
    >
      {isDark ? (
        <Sun className="w-5 h-5" aria-hidden="true" />
      ) : (
        <Moon className="w-5 h-5" aria-hidden="true" />
      )}
    </Button>
  );
}
