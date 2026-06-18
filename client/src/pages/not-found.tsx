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
    },
    de: {
      title: "Seite nicht gefunden",
      subtitle: "Die gesuchte Seite existiert nicht oder wurde verschoben",
      goHome: "Zur Startseite",
      goBack: "Zurück"
    },
    zh: {
      title: "页面未找到",
      subtitle: "您访问的页面不存在或已被移动",
      goHome: "返回首页",
      goBack: "返回"
    },
    ko: {
      title: "페이지를 찾을 수 없습니다",
      subtitle: "찾고 계신 페이지가 존재하지 않거나 이동되었습니다",
      goHome: "홈으로 가기",
      goBack: "뒤로 가기"
    },
    ja: {
      title: "ページが見つかりません",
      subtitle: "お探しのページは存在しないか、移動されました",
      goHome: "ホームに戻る",
      goBack: "戻る"
    },
    ar: {
      title: "الصفحة غير موجودة",
      subtitle: "الصفحة التي تبحث عنها غير موجودة أو تم نقلها",
      goHome: "الذهاب إلى الرئيسية",
      goBack: "رجوع"
    },
    ru: {
      title: "Страница не найдена",
      subtitle: "Запрошенная страница не существует или была перемещена",
      goHome: "На главную",
      goBack: "Назад"
    },
    fr: {
      title: "Page non trouvée",
      subtitle: "La page que vous recherchez n'existe pas ou a été déplacée",
      goHome: "Aller à l'accueil",
      goBack: "Retour"
    },
    it: {
      title: "Pagina non trovata",
      subtitle: "La pagina che stai cercando non esiste o è stata spostata",
      goHome: "Vai alla home",
      goBack: "Indietro"
    }
  };

  const t = content[language as keyof typeof content] || content.en;
  const isRTL = language === "ar";

  return (
    <div dir={isRTL ? "rtl" : "ltr"} data-testid="page-not-found">
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
