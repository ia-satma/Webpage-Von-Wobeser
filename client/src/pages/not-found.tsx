import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
    <div className="min-h-screen bg-background flex flex-col" dir={isRTL ? "rtl" : "ltr"} data-testid="page-not-found">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-20">
        <Card className="w-full max-w-lg mx-4 rounded-md border border-border">
          <CardContent className="pt-8 pb-8 px-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-primary" />
              </div>
            </div>
            
            <h1 
              className="text-3xl font-heading font-medium text-foreground mb-3"
              data-testid="text-404-title"
            >
              404 - {t.title}
            </h1>

            <p 
              className="text-muted-foreground mb-8"
              data-testid="text-404-subtitle"
            >
              {t.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild data-testid="button-go-home">
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  {t.goHome}
                </Link>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.history.back()}
                data-testid="button-go-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.goBack}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
