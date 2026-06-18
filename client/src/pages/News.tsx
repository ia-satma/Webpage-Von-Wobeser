import { useEffect, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { newsCategories, type News } from "@shared/schema";
import {
  PublicationsHero,
  PublicationsFilters,
  ArchiveList,
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

const PAGE_SIZE = 10; // el archivo viejo paginaba de 10 en 10 (Display # = 10)

export default function NewsPage() {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [page, setPage] = useState(1);

  // --- Data preservada: mismo endpoint que la página vieja ---
  const { data: news, isLoading, error } = useQuery<News[]>({
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
      all: string;
      pageStart: string;
      pagePrev: string;
      pageNext: string;
      pageEnd: string;
      pageOf: string;
    }
  > = {
    en: {
      label: "Publications",
      title: "News",
      subtitle: "News and insights from Von Wobeser y Sierra",
      errorMessage: "Failed to load news",
      searchPlaceholder: "Search",
      readMore: "Read more",
      noResults: "No news found",
      all: "All",
      pageStart: "Start",
      pagePrev: "Prev",
      pageNext: "Next",
      pageEnd: "End",
      pageOf: "Page {current} of {total}",
    },
    es: {
      label: "Publicaciones",
      title: "Noticias",
      subtitle: "Noticias y perspectivas de Von Wobeser y Sierra",
      errorMessage: "Error al cargar las noticias",
      searchPlaceholder: "Buscar",
      readMore: "Leer más",
      noResults: "No se encontraron noticias",
      all: "Todos",
      pageStart: "Inicio",
      pagePrev: "Anterior",
      pageNext: "Siguiente",
      pageEnd: "Fin",
      pageOf: "Página {current} de {total}",
    },
    de: {
      label: "Publikationen",
      title: "Nachrichten",
      subtitle: "Neuigkeiten und Einblicke von Von Wobeser y Sierra",
      errorMessage: "Nachrichten konnten nicht geladen werden",
      searchPlaceholder: "Suchen",
      readMore: "Weiterlesen",
      noResults: "Keine Nachrichten gefunden",
      all: "Alle",
      pageStart: "Anfang",
      pagePrev: "Zurück",
      pageNext: "Weiter",
      pageEnd: "Ende",
      pageOf: "Seite {current} von {total}",
    },
    zh: {
      label: "出版物",
      title: "新闻",
      subtitle: "Von Wobeser y Sierra 的新闻与见解",
      errorMessage: "加载新闻失败",
      searchPlaceholder: "搜索",
      readMore: "阅读更多",
      noResults: "未找到新闻",
      all: "全部",
      pageStart: "首页",
      pagePrev: "上一页",
      pageNext: "下一页",
      pageEnd: "末页",
      pageOf: "第 {current} 页 / 共 {total} 页",
    },
    ko: {
      label: "출판물",
      title: "뉴스",
      subtitle: "Von Wobeser y Sierra의 뉴스와 인사이트",
      errorMessage: "뉴스 로드 실패",
      searchPlaceholder: "검색",
      readMore: "더 읽기",
      noResults: "뉴스를 찾을 수 없습니다",
      all: "전체",
      pageStart: "처음",
      pagePrev: "이전",
      pageNext: "다음",
      pageEnd: "마지막",
      pageOf: "{total} 중 {current} 페이지",
    },
    ja: {
      label: "出版物",
      title: "ニュース",
      subtitle: "Von Wobeser y Sierra のニュースと洞察",
      errorMessage: "ニュースの読み込みに失敗しました",
      searchPlaceholder: "検索",
      readMore: "続きを読む",
      noResults: "ニュースが見つかりません",
      all: "すべて",
      pageStart: "最初",
      pagePrev: "前へ",
      pageNext: "次へ",
      pageEnd: "最後",
      pageOf: "{total} ページ中 {current} ページ",
    },
    ar: {
      label: "المنشورات",
      title: "الأخبار",
      subtitle: "الأخبار والرؤى من Von Wobeser y Sierra",
      errorMessage: "فشل تحميل الأخبار",
      searchPlaceholder: "بحث",
      readMore: "اقرأ المزيد",
      noResults: "لم يتم العثور على أخبار",
      all: "الكل",
      pageStart: "البداية",
      pagePrev: "السابق",
      pageNext: "التالي",
      pageEnd: "النهاية",
      pageOf: "صفحة {current} من {total}",
    },
    ru: {
      label: "Публикации",
      title: "Новости",
      subtitle: "Новости и аналитика Von Wobeser y Sierra",
      errorMessage: "Не удалось загрузить новости",
      searchPlaceholder: "Поиск",
      readMore: "Читать далее",
      noResults: "Новости не найдены",
      all: "Все",
      pageStart: "Начало",
      pagePrev: "Назад",
      pageNext: "Далее",
      pageEnd: "Конец",
      pageOf: "Страница {current} из {total}",
    },
    fr: {
      label: "Publications",
      title: "Actualités",
      subtitle: "Actualités et perspectives de Von Wobeser y Sierra",
      errorMessage: "Échec du chargement des actualités",
      searchPlaceholder: "Rechercher",
      readMore: "Lire la suite",
      noResults: "Aucune actualité trouvée",
      all: "Tout",
      pageStart: "Début",
      pagePrev: "Précédent",
      pageNext: "Suivant",
      pageEnd: "Fin",
      pageOf: "Page {current} sur {total}",
    },
    it: {
      label: "Pubblicazioni",
      title: "Notizie",
      subtitle: "Notizie e approfondimenti di Von Wobeser y Sierra",
      errorMessage: "Impossibile caricare le notizie",
      searchPlaceholder: "Cerca",
      readMore: "Leggi di più",
      noResults: "Nessuna notizia trovata",
      all: "Tutto",
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

  const categoryFilters = [
    { value: "all", label: t.all },
    ...newsCategories.map((cat) => ({
      value: cat.value,
      label: language === "es" ? cat.es : cat.en,
    })),
  ];

  // --- Filtrado preservado de la página vieja (categoría + búsqueda) ---
  const filteredNews = useMemo(
    () =>
      news?.filter((article) => {
        const matchesCategory =
          selectedCategory === "all" || article.category === selectedCategory;
        if (!searchQuery) return matchesCategory;

        const query = searchQuery.toLowerCase();
        const title = language === "es" ? article.titleEs : article.title;
        const excerpt = language === "es" ? article.excerptEs : article.excerpt;
        const matchesSearch =
          title.toLowerCase().includes(query) ||
          excerpt.toLowerCase().includes(query);
        return matchesCategory && matchesSearch;
      }) ?? [],
    [news, selectedCategory, searchQuery, language],
  );

  const totalPages = Math.max(1, Math.ceil(filteredNews.length / PAGE_SIZE));

  // Volver a la página 1 cuando cambian los filtros / la búsqueda.
  useEffect(() => {
    setPage(1);
  }, [selectedCategory, searchQuery, language]);

  // Mantener `page` dentro de rango si la lista se encoge.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = filteredNews.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="vw-old bg-white" data-testid="page-news">
      <SEOHead page="news" language={language} />

      <PublicationsHero
        label={t.label}
        title={t.title}
        subtitle={t.subtitle}
        translationBanner={translationBanner}
        testId="section-news-hero"
      />

      <section className="vw-wrap pb-24" data-testid="section-news-archive">
        <PublicationsFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={t.searchPlaceholder}
          categories={categoryFilters}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {error ? (
          <div className="py-16 text-center" data-testid="container-news-error">
            <AlertCircle className="mx-auto mb-4 h-10 w-10 text-vw-graylight" aria-hidden="true" />
            <p className="text-vw-gray" data-testid="text-news-error">
              {t.errorMessage}
            </p>
          </div>
        ) : isLoading ? (
          <div
            className="w-full max-w-[640px] animate-pulse min-[1081px]:ml-[100px]"
            data-testid="container-news-loading"
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
        ) : filteredNews.length === 0 ? (
          <div className="py-16 text-center" data-testid="container-news-empty">
            <p className="text-vw-gray">{t.noResults}</p>
          </div>
        ) : (
          <>
            <ArchiveList
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
