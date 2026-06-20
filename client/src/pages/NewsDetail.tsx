import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/JsonLdSchema";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDisplayValue } from "@/lib/translationUtils";
import { AuthorLink } from "@/components/insights";
import type { News, TeamMember } from "@shared/schema";

/**
 * `pdfUrl` aún no existe en el esquema de News (lo añadirá W7). Lo leemos de
 * forma defensiva para que, cuando el campo aparezca, el botón de descarga se
 * muestre sin tocar este archivo.
 */
type NewsWithOptionalPdf = News & { pdfUrl?: string | null };

export default function NewsDetail() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  // --- Data preservada: mismas tres queries que la página vieja ---
  const { data: newsArticle, isLoading, error } = useQuery<News>({
    queryKey: [`/api/news/${slug}`],
    enabled: !!slug,
  });

  const { data: allNews } = useQuery<News[]>({
    queryKey: ["/api/news"],
  });

  const { data: relatedAuthors } = useQuery<TeamMember[]>({
    queryKey: ["/api/news", slug, "authors"],
    enabled: !!slug,
  });

  const content: Record<
    string,
    {
      label: string;
      backToNews: string;
      relatedNews: string;
      errorMessage: string;
      loading: string;
      print: string;
      share: string;
      download: string;
      linkCopied: string;
      aboutTheAuthor: string;
      aboutTheAuthors: string;
      breadcrumbHome: string;
      breadcrumbNews: string;
    }
  > = {
    en: {
      label: "Publication",
      backToNews: "Back to News",
      relatedNews: "Related News",
      errorMessage: "Article not found",
      loading: "Loading...",
      print: "Print",
      share: "Share",
      download: "Download",
      linkCopied: "Link copied to clipboard!",
      aboutTheAuthor: "Author",
      aboutTheAuthors: "Authors",
      breadcrumbHome: "Home",
      breadcrumbNews: "News",
    },
    es: {
      label: "Publicación",
      backToNews: "Volver a Noticias",
      relatedNews: "Noticias Relacionadas",
      errorMessage: "Artículo no encontrado",
      loading: "Cargando...",
      print: "Imprimir",
      share: "Compartir",
      download: "Descargar",
      linkCopied: "¡Enlace copiado al portapapeles!",
      aboutTheAuthor: "Autor",
      aboutTheAuthors: "Autores",
      breadcrumbHome: "Inicio",
      breadcrumbNews: "Noticias",
    },
  };

  const t = content[language] || content.en;

  const getDateLocale = () => {
    const localeMap: Record<string, typeof enUS> = {
      en: enUS,
      es,
    };
    return localeMap[language] || enUS;
  };

  const getDateFormatPattern = () => {
    // El look viejo muestra "Month, Year" (p.ej. "June, 2026").
    const formatMap: Record<string, string> = {
      en: "MMMM, yyyy",
      es: "MMMM, yyyy",
    };
    return formatMap[language] || "MMMM, yyyy";
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, getDateFormatPattern(), { locale: getDateLocale() });
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const handleShare = () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(shareUrl, "_blank", "width=600,height=400");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: t.linkCopied, duration: 3000 });
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const relatedNews = allNews
    ?.filter((item) => item.id !== newsArticle?.id)
    .slice(0, 3);

  const primaryAuthor =
    relatedAuthors && relatedAuthors.length > 0 ? relatedAuthors[0] : null;

  // pdfUrl: defensivo hasta que W7 lo añada al esquema.
  const pdfUrl = (newsArticle as NewsWithOptionalPdf | undefined)?.pdfUrl || null;

  // --- Estado de error (look viejo, sin Header/Footer: los da el Layout) ---
  if (error) {
    return (
      <div className="vw-old bg-white" data-testid="page-news-error">
        <div className="vw-wrap py-24 text-center">
          <h1
            className="font-serif text-[clamp(28px,4vw,40px)] text-vw-gray"
            data-testid="text-error-title"
          >
            {t.errorMessage}
          </h1>
          <Link
            href="/news"
            className="vw-label mt-6 inline-block text-[15px] text-vw-gray transition-colors hover:text-vw-red"
            data-testid="button-back-to-news"
          >
            {t.backToNews}
          </Link>
        </div>
      </div>
    );
  }

  // --- Estado de carga ---
  if (isLoading) {
    return (
      <div className="vw-old bg-white" data-testid="page-news-loading">
        <div className="vw-wrap animate-pulse pt-16 pb-24">
          <div className="flex flex-col gap-10 md:flex-row">
            <div className="w-full bg-vw-graylight/40 p-10 md:w-2/5">
              <div className="mb-6 h-8 w-3/4 bg-white/40" />
              <div className="mb-3 h-4 w-1/2 bg-white/40" />
              <div className="h-4 w-1/2 bg-white/40" />
            </div>
            <div className="flex-1">
              <div className="mb-4 h-5 w-full bg-vw-graylight/30" />
              <div className="mb-4 h-5 w-full bg-vw-graylight/30" />
              <div className="mb-4 h-5 w-5/6 bg-vw-graylight/30" />
              <div className="h-5 w-full bg-vw-graylight/30" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayTitle = getDisplayValue(newsArticle, "title", language);
  const displayContent =
    getDisplayValue(newsArticle, "content", language) ||
    getDisplayValue(newsArticle, "excerpt", language);

  const paragraphs = (displayContent || "")
    .split("\n")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return (
    <div className="vw-old bg-white" data-testid="page-news-detail">
      {newsArticle && (
        <>
          <ArticleJsonLd
            headline={getDisplayValue(newsArticle, "title", language) ?? ""}
            description={getDisplayValue(newsArticle, "excerpt", language) ?? ""}
            datePublished={newsArticle.date}
            dateModified={newsArticle.date}
            authorName={primaryAuthor?.name}
            authorUrl={
              primaryAuthor
                ? `https://www.vonwobeser.com/team/${primaryAuthor.slug}`
                : undefined
            }
            imageUrl={newsArticle.imageUrl}
            url={`https://www.vonwobeser.com/news/${newsArticle.slug}`}
            language={language}
          />
          <BreadcrumbJsonLd
            items={[
              { name: t.breadcrumbHome, url: "https://www.vonwobeser.com" },
              { name: t.breadcrumbNews, url: "https://www.vonwobeser.com/news" },
              {
                name: getDisplayValue(newsArticle, "title", language) ?? "",
                url: `https://www.vonwobeser.com/news/${newsArticle.slug}`,
              },
            ]}
            language={language}
          />
        </>
      )}

      {/* Sección "single" del look viejo: meta gris + contenido */}
      <section className="pt-16 pb-0" data-testid="section-news-single">
        <div className="vw-wrap flex flex-col gap-0 md:flex-row">
          {/* Columna meta (gris, como .single__meta) */}
          <aside
            className="relative w-full self-stretch bg-vw-graylight px-8 py-14 md:w-2/5 md:pr-12"
            data-testid="container-news-meta"
          >
            {/* Etiqueta de tipo en Geomanist uppercase */}
            <p className="vw-label mb-6 text-[14px] text-white">{t.label}</p>

            <h1
              className="mb-8 flex items-start gap-3 font-serif text-[clamp(24px,3vw,32px)] leading-[1.2] text-white"
              data-testid="text-news-title"
            >
              <span>{displayTitle}</span>
            </h1>

            <p
              className="vw-label mb-10 text-[13px] text-white/80"
              data-testid="text-news-date"
            >
              {formatDate(newsArticle?.date || null)}
            </p>

            {/* Botones Print / Share / Download (look viejo) */}
            <div className="flex flex-col gap-3" data-testid="container-news-actions">
              <button
                type="button"
                onClick={handlePrint}
                className="vw-label text-left text-[14px] text-white transition-opacity hover:opacity-70"
                data-testid="button-print"
              >
                {t.print}
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="vw-label text-left text-[14px] text-white transition-opacity hover:opacity-70"
                data-testid="button-share"
              >
                {t.share}
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="vw-label text-left text-[14px] text-white transition-opacity hover:opacity-70"
                data-testid="button-copy-link"
              >
                {t.share} URL
              </button>
              {/* PDF: solo si el dato lo trae (W7 lo añadirá). */}
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="vw-label text-left text-[14px] text-white transition-opacity hover:opacity-70"
                  data-testid="button-download-pdf"
                >
                  {t.download} PDF
                </a>
              )}
            </div>

            {/* Autores enlazados */}
            {relatedAuthors && relatedAuthors.length > 0 && (
              <div className="mt-12" data-testid="container-news-authors">
                <p className="vw-label mb-2 text-[12px] text-white/80">
                  {relatedAuthors.length === 1 ? t.aboutTheAuthor : t.aboutTheAuthors}
                </p>
                <div className="bg-white/30 px-1">
                  {relatedAuthors.map((author) => (
                    <AuthorLink key={author.id} author={author} />
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Columna de contenido (.single__content) */}
          <div
            className="w-full px-0 py-14 md:flex-1 md:pl-14"
            data-testid="container-news-content"
          >
            {/* Imagen (si existe) */}
            {newsArticle?.imageUrl && (
              <img
                src={newsArticle.imageUrl}
                alt={displayTitle || ""}
                className="mb-10 w-full object-cover"
                data-testid="img-news"
              />
            )}

            <div>
              {paragraphs.map((p, i) => (
                <p
                  key={i}
                  className="mb-7 text-justify text-[17px] leading-relaxed text-vw-gray [hyphens:auto]"
                  data-testid={`text-news-paragraph-${i}`}
                >
                  {p}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Noticias relacionadas (lista en estilo archivo, sin tarjetas) */}
      {relatedNews && relatedNews.length > 0 && (
        <section className="vw-wrap py-20" data-testid="section-related-news">
          <h2 className="vw-section-title text-vw-gray" data-testid="text-related-news-title">
            {t.relatedNews}
          </h2>
          <div className="mt-8 flex flex-col gap-8">
            {relatedNews.map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.slug}`}
                className="group block"
                data-testid={`link-related-news-${item.id}`}
              >
                <p
                  className="vw-label mb-1 text-[13px] text-vw-gray"
                  data-testid={`text-related-news-date-${item.id}`}
                >
                  {formatDate(item.date)}
                </p>
                <h3
                  className="font-serif text-[21px] leading-snug text-vw-gray transition-colors duration-200 group-hover:text-vw-red"
                  data-testid={`text-related-news-title-${item.id}`}
                >
                  {getDisplayValue(item, "title", language)}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
