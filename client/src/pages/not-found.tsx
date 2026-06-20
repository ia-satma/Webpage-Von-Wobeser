import { Home, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Section, Label } from "@/components/firm";

export default function NotFound() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "Page Not Found",
      subtitle: "The page you are looking for does not exist or has been moved",
      goHome: "Go to Home",
      goBack: "Go Back"
    },
    es: {
      title: "Página no encontrada",
      subtitle: "La página que busca no existe o ha sido movida",
      goHome: "Ir al inicio",
      goBack: "Volver"
    }
  };

  const t = content[language as keyof typeof content] || content.en;

  return (
    <div dir="ltr" data-testid="page-not-found">
      <Section tone="white" size="large" fade={false} innerClassName="text-center">
        <Label className="mb-4 inline-block">404</Label>
        <h1
          className="font-serif text-4xl leading-tight text-vw-black md:text-6xl"
          data-testid="text-404-title"
        >
          {t.title}
        </h1>
        <p
          className="mx-auto mt-5 max-w-xl font-sans text-lg leading-relaxed text-vw-gray"
          data-testid="text-404-subtitle"
        >
          {t.subtitle}
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/">
            <span
              className="vw-label inline-flex cursor-pointer items-center gap-2 bg-vw-red px-8 py-3.5 text-xs text-white transition-colors hover:bg-vw-black"
              data-testid="button-go-home"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              {t.goHome}
            </span>
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="vw-label inline-flex cursor-pointer items-center gap-2 border border-vw-red px-8 py-3.5 text-xs text-vw-red transition-colors hover:bg-vw-red hover:text-white"
            data-testid="button-go-back"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t.goBack}
          </button>
        </div>
      </Section>
    </div>
  );
}
