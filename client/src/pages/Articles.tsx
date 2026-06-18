import { useEffect, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { type News } from "@shared/schema";
import {
  PublicationsHero,
  PublicationsFilters,
  ArticleList,
  Pagination,
} from "@/components/insights";

const languageToLocale: Record<string, string> = {
  en: "en-US",
  es: "es-MX",
  de: "de-DE",
  zh: "zh-CN",
  ko: "ko-KR",
  ja: "ja-JP",
  ar: "ar-SA",
  ru: "ru-RU",
  fr: "fr-FR",
  it: "it-IT",
};

const PAGE_SIZE = 10;

/**
 * Categoría usada para distinguir "artículos" de "noticias" dentro del mismo
 * endpoint /api/news. El sitio viejo separaba /publications/news y
 * /publications/articles; aquí (como hacía la página actual) reutilizamos
 * /api/news. Si en el futuro hay un endpoint propio de artículos, basta con
 * cambiar la query — la presentación (ArticleList) no cambia.
 */
const ARTICLE_CATEGORY = "insights";

export default function ArticlesPage() {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  // --- Data preservada: mismo endpoint que la página vieja ---
  const { data: articles, isLoading, error } = useQuery<News[]>({
    queryKey: ["/api/news"],
  });

  const content: Record<
    string,
    {
      label: string;
      title: string;
      subtitle: string;
      errorMessage: string;
      searchPlaceholder: string;
      readMore: string;
      noResults: string;
      comingSoon: string;
      comingSoonMessage: string;
      pageStart: string;
      pagePrev: string;
      pageNext: string;
      pageEnd: string;
      pageOf: string;
    }
  > = {
    en: {
      label: "Publications",
      title: "Articles",
      subtitle: "Legal insights and publications from Von Wobeser y Sierra",
      errorMessage: "Failed to load articles",
      searchPlaceholder: "Search",
      readMore: "Read more",
      noResults: "No articles match your search",
      comingSoon: "Coming soon",
      comingSoonMessage: "We are preparing new articles. Please check back soon.",
      pageStart: "Start",
      pagePrev: "Prev",
      pageNext: "Next",
      pageEnd: "End",
      pageOf: "Page {current} of {total}",
    },
    es: {
      label: "Publicaciones",
      title: "Artículos",
      subtitle: "Insights legales y publicaciones de Von Wobeser y Sierra",
      errorMessage: "Error al cargar los artículos",
      searchPlaceholder: "Buscar",
      readMore: "Leer más",
      noResults: "No hay artículos que coincidan con su búsqueda",
      comingSoon: "Próximamente",
      comingSoonMessage: "Estamos preparando nuevos artículos. Por favor regrese pronto.",
      pageStart: "Inicio",
      pagePrev: "Anterior",
      pageNext: "Siguiente",
      pageEnd: "Fin",
      pageOf: "Página {current} de {total}",
    },
    de: {
      label: "Publikationen",
      title: "Artikel",
      subtitle: "Einblicke und Analysen von Von Wobeser y Sierra",
      errorMessage: "Artikel konnten nicht geladen werden",
      searchPlaceholder: "Suchen",
      readMore: "Weiterlesen",
      noResults: "Keine Artikel entsprechen Ihrer Suche",
      comingSoon: "Demnächst",
      comingSoonMessage: "Wir bereiten neue Artikel vor. Bitte schauen Sie bald wieder vorbei.",
      pageStart: "Anfang",
      pagePrev: "Zurück",
      pageNext: "Weiter",
      pageEnd: "Ende",
      pageOf: "Seite {current} von {total}",
    },
    zh: {
      label: "出版物",
      title: "文章",
      subtitle: "Von Wobeser y Sierra 的见解与分析",
      errorMessage: "文章加载失败",
      searchPlaceholder: "搜索",
      readMore: "阅读更多",
      noResults: "没有符合搜索条件的文章",
      comingSoon: "即将推出",
      comingSoonMessage: "我们正在准备新文章，请稍后再来。",
      pageStart: "首页",
      pagePrev: "上一页",
      pageNext: "下一页",
      pageEnd: "末页",
      pageOf: "第 {current} 页 / 共 {total} 页",
    },
    ko: {
      label: "출판물",
      title: "기사",
      subtitle: "Von Wobeser y Sierra의 통찰과 분석",
      errorMessage: "기사를 불러오지 못했습니다",
      searchPlaceholder: "검색",
      readMore: "자세히 보기",
      noResults: "검색 결과가 없습니다",
      comingSoon: "곧 출시",
      comingSoonMessage: "새로운 기사를 준비 중입니다. 곧 다시 확인해 주세요.",
      pageStart: "처음",
      pagePrev: "이전",
      pageNext: "다음",
      pageEnd: "마지막",
      pageOf: "{total} 중 {current} 페이지",
    },
    ja: {
      label: "出版物",
      title: "記事",
      subtitle: "Von Wobeser y Sierra の洞察と分析",
      errorMessage: "記事の読み込みに失敗しました",
      searchPlaceholder: "検索",
      readMore: "続きを読む",
      noResults: "検索に一致する記事がありません",
      comingSoon: "近日公開",
      comingSoonMessage: "新しい記事を準備中です。しばらくしてから再度ご確認ください。",
      pageStart: "最初",
      pagePrev: "前へ",
      pageNext: "次へ",
      pageEnd: "最後",
      pageOf: "{total} ページ中 {current} ページ",
    },
    ar: {
      label: "المنشورات",
      title: "المقالات",
      subtitle: "رؤى وتحليلات من Von Wobeser y Sierra",
      errorMessage: "فشل تحميل المقالات",
      searchPlaceholder: "بحث",
      readMore: "اقرأ المزيد",
      noResults: "لا توجد مقالات تطابق بحثك",
      comingSoon: "قريباً",
      comingSoonMessage: "نحن نعد مقالات جديدة. يرجى العودة قريباً.",
      pageStart: "البداية",
      pagePrev: "السابق",
      pageNext: "التالي",
      pageEnd: "النهاية",
      pageOf: "صفحة {current} من {total}",
    },
    ru: {
      label: "Публикации",
      title: "Статьи",
      subtitle: "Аналитика и публикации Von Wobeser y Sierra",
      errorMessage: "Не удалось загрузить статьи",
      searchPlaceholder: "Поиск",
      readMore: "Читать далее",
      noResults: "Статьи по вашему запросу не найдены",
      comingSoon: "Скоро",
      comingSoonMessage: "Мы готовим новые статьи. Пожалуйста, загляните позже.",
      pageStart: "Начало",
      pagePrev: "Назад",
      pageNext: "Далее",
      pageEnd: "Конец",
      pageOf: "Страница {current} из {total}",
    },
    fr: {
      label: "Publications",
      title: "Articles",
      subtitle: "Perspectives et analyses de Von Wobeser y Sierra",
      errorMessage: "Échec du chargement des articles",
      searchPlaceholder: "Rechercher",
      readMore: "Lire la suite",
      noResults: "Aucun article ne correspond à votre recherche",
      comingSoon: "Bientôt disponible",
      comingSoonMessage: "Nous préparons de nouveaux articles. Revenez bientôt.",
      pageStart: "Début",
      pagePrev: "Précédent",
      pageNext: "Suivant",
      pageEnd: "Fin",
      pageOf: "Page {current} sur {total}",
    },
    it: {
      label: "Pubblicazioni",
      title: "Articoli",
      subtitle: "Approfondimenti e analisi di Von Wobeser y Sierra",
      errorMessage: "Impossibile caricare gli articoli",
      searchPlaceholder: "Cerca",
      readMore: "Leggi di più",
      noResults: "Nessun articolo corrisponde alla tua ricerca",
      comingSoon: "Prossimamente",
      comingSoonMessage: "Stiamo preparando nuovi articoli. Torna presto.",
      pageStart: "Inizio",
      pagePrev: "Prec.",
      pageNext: "Succ.",
      pageEnd: "Fine",
      pageOf: "Pagina {current} di {total}",
    },
  };

  const translationBannerMessages: Record<string, string> = {
    de: "Inhalte werden automatisch übersetzt.",
    zh: "内容正在自动翻译中。",
    ko: "콘텐츠가 자동으로 번역됩니다.",
    ja: "コンテンツは自動翻訳されています。",
    ar: "يتم ترجمة المحتوى تلقائياً.",
    ru: "Содержимое автоматически переводится.",
    fr: "Le contenu est traduit automatiquement.",
    it: "Il contenuto viene tradotto automaticamente.",
  };

  const t = content[language] || content.en;
  const dateLocale = languageToLocale[language] || "en-US";
  const isNonNativeLanguage = language !== "es";
  const translationBanner = isNonNativeLanguage
    ? translationBannerMessages[language] ||
      (language === "en" ? "Content is automatically translated from Spanish." : null)
    : null;

  // --- Filtrado preservado: artículos = categoría "insights" dentro de /api/news,
  // más la búsqueda por título/excerpt de la página vieja. ---
  const filteredArticles = useMemo(
    () =>
      articles
        ?.filter((article) => article.category === ARTICLE_CATEGORY)
        .filter((article) => {
          if (!searchQuery) return true;
          const query = searchQuery.toLowerCase();
          const title = language === "es" ? article.titleEs : article.title;
          const excerpt = language === "es" ? article.excerptEs : article.excerpt;
          return (
            title.toLowerCase().includes(query) ||
            excerpt.toLowerCase().includes(query)
          );
        }) ?? [],
    [articles, searchQuery, language],
  );

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [searchQuery, language]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = filteredArticles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="vw-old bg-white" data-testid="page-articles">
      <SEOHead page="articles" language={language} />

      <PublicationsHero
        label={t.label}
        title={t.title}
        subtitle={t.subtitle}
        translationBanner={translationBanner}
        testId="section-articles-hero"
      />

      <section className="vw-wrap pb-24" data-testid="section-articles-archive">
        <PublicationsFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={t.searchPlaceholder}
        />

        {error ? (
          <div className="py-16 text-center" data-testid="container-articles-error">
            <AlertCircle className="mx-auto mb-4 h-10 w-10 text-vw-graylight" aria-hidden="true" />
            <p className="text-vw-gray" data-testid="text-articles-error">
              {t.errorMessage}
            </p>
          </div>
        ) : isLoading ? (
          <div
            className="w-full max-w-[640px] animate-pulse min-[1081px]:ml-[100px]"
            data-testid="container-articles-loading"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="mb-24">
                <div className="mb-3 h-7 w-3/4 bg-vw-graylight/40" />
                <div className="mb-6 h-4 w-32 bg-vw-graylight/40" />
                <div className="mb-2 h-4 w-full bg-vw-graylight/30" />
                <div className="mb-2 h-4 w-full bg-vw-graylight/30" />
                <div className="h-4 w-2/3 bg-vw-graylight/30" />
              </div>
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          searchQuery ? (
            <div className="py-16 text-center" data-testid="container-articles-empty">
              <p className="text-vw-gray">{t.noResults}</p>
            </div>
          ) : (
            <div className="py-20 text-center" data-testid="container-articles-coming-soon">
              <h2
                className="vw-section-title mx-auto inline-block border-b-0 text-vw-gray"
                data-testid="text-coming-soon-title"
              >
                {t.comingSoon}
              </h2>
              <p
                className="mx-auto mt-4 max-w-md text-vw-gray/80"
                data-testid="text-coming-soon-message"
              >
                {t.comingSoonMessage}
              </p>
            </div>
          )
        ) : (
          <>
            <ArticleList
              items={pageItems}
              readMoreText={t.readMore}
              dateLocale={dateLocale}
            />
            <div className="mt-16 w-full max-w-[640px] min-[1081px]:ml-[100px]">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => {
                  setPage(p);
                  if (typeof window !== "undefined") {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                labels={{
                  start: t.pageStart,
                  prev: t.pagePrev,
                  next: t.pageNext,
                  end: t.pageEnd,
                  pageOf: t.pageOf,
                }}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
