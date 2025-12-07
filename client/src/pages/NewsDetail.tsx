import { useState } from "react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Share2, Linkedin, Twitter, Mail, LinkIcon, AlertCircle, MessageCircle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/JsonLdSchema";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslatedContent } from "@/hooks/useTranslatedContent";
import type { News, TeamMember } from "@shared/schema";

function NewsHeroImage({ 
  src, 
  alt
}: { 
  src: string; 
  alt: string;
}) {
  const [hasError, setHasError] = useState(false);
  const fallbackImage = "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80";
  
  return (
    <img
      src={hasError ? fallbackImage : src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => setHasError(true)}
      data-testid="img-news-hero"
    />
  );
}

function NewsCardImage({ 
  src, 
  alt, 
  className 
}: { 
  src: string; 
  alt: string; 
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);
  
  if (hasError || !src) {
    return (
      <div className={`bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center ${className}`}>
        <span className="text-3xl font-heading font-bold text-primary/30 tracking-wider">
          VWS
        </span>
      </div>
    );
  }
  
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}

export default function NewsDetail() {
  const { language, displayLanguage } = useLanguage();
  const { toast } = useToast();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data: newsArticle, isLoading, error } = useQuery<News>({
    queryKey: [`/api/news/${slug}`],
    enabled: !!slug,
  });

  const { data: allNews } = useQuery<News[]>({
    queryKey: ["/api/news"],
  });

  const { data: relatedAuthors } = useQuery<TeamMember[]>({
    queryKey: ['/api/news', slug, 'authors'],
    enabled: !!slug,
  });

  const { translatedFields, isTranslating } = useTranslatedContent({
    contentType: 'news',
    entityId: newsArticle?.id?.toString() || '',
    fields: {
      title: newsArticle?.title,
      titleEs: newsArticle?.titleEs,
      excerpt: newsArticle?.excerpt,
      excerptEs: newsArticle?.excerptEs,
      content: newsArticle?.content,
      contentEs: newsArticle?.contentEs,
    },
    enabled: !!newsArticle,
  });

  const content = {
    en: {
      backToNews: "Back to News",
      share: "Share this article",
      relatedNews: "Related News",
      errorMessage: "Article not found",
      loading: "Loading...",
      readMore: "Read More",
      copyLink: "Copy Link",
      linkCopied: "Link copied to clipboard!",
      shareVia: "Share via",
      aboutTheAuthor: "About the Author",
      aboutTheAuthors: "About the Authors",
    },
    es: {
      backToNews: "Volver a Noticias",
      share: "Compartir este artículo",
      relatedNews: "Noticias Relacionadas",
      errorMessage: "Artículo no encontrado",
      loading: "Cargando...",
      readMore: "Leer Más",
      copyLink: "Copiar Enlace",
      linkCopied: "¡Enlace copiado al portapapeles!",
      shareVia: "Compartir vía",
      aboutTheAuthor: "Acerca del Autor",
      aboutTheAuthors: "Acerca de los Autores",
    },
  };

  const t = content[displayLanguage];

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "d 'de' MMMM, yyyy", {
      locale: language === "es" ? es : enUS,
    });
  };

  const handleShare = (platform: "linkedin" | "twitter" | "whatsapp" | "email") => {
    const url = window.location.href;
    const title = language === "es" ? newsArticle?.titleEs : newsArticle?.title;
    const excerpt = language === "es" ? newsArticle?.excerptEs : newsArticle?.excerpt;
    
    const shareUrls = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title || "")}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`,
      email: `mailto:?subject=${encodeURIComponent(title || "")}&body=${encodeURIComponent(`${excerpt || ""}\n\n${url}`)}`,
    };
    
    if (platform === "email") {
      window.location.href = shareUrls[platform];
    } else {
      window.open(shareUrls[platform], "_blank", "width=600,height=400");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: t.linkCopied,
        duration: 3000,
      });
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const scrollToNewsSection = () => {
    window.location.href = "/#news";
  };

  const relatedNews = allNews?.filter((item) => item.id !== newsArticle?.id).slice(0, 3);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const truncateBio = (bio: string | null | undefined, maxLength: number = 150) => {
    if (!bio) return '';
    if (bio.length <= maxLength) return bio;
    return bio.slice(0, maxLength).trim() + '...';
  };

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-news-error">
        <Header />
        <div className="pt-32 pb-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-heading text-gray-800 dark:text-white mb-4" data-testid="text-error-title">
              {t.errorMessage}
            </h2>
            <Button 
              variant="outline" 
              onClick={scrollToNewsSection}
              data-testid="button-back-to-news"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.backToNews}
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-news-loading">
        <Header />
        <section className="pt-24 relative">
          <Skeleton className="w-full h-[50vh] min-h-[400px]" />
        </section>
        <main id="main-content" className="py-16 lg:py-20">
          <div className="max-w-4xl mx-auto px-6 lg:px-12">
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-3/4 mb-8" />
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-6 w-5/6 mb-4" />
            <Skeleton className="h-6 w-full mb-4" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const displayTitle = translatedFields.title || newsArticle?.title;
  const displayContent = translatedFields.content || translatedFields.excerpt || newsArticle?.content || newsArticle?.excerpt;
  const heroImage = newsArticle?.imageUrl || "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80";

  const primaryAuthor = relatedAuthors && relatedAuthors.length > 0 ? relatedAuthors[0] : null;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-news-detail">
      <Header />
      
      {newsArticle && (
        <>
          <ArticleJsonLd
            headline={language === "es" ? newsArticle.titleEs : newsArticle.title}
            description={language === "es" ? newsArticle.excerptEs : newsArticle.excerpt}
            datePublished={newsArticle.date}
            dateModified={newsArticle.date}
            authorName={primaryAuthor?.name}
            authorUrl={primaryAuthor ? `https://www.vonwobeser.com/team/${primaryAuthor.slug}` : undefined}
            imageUrl={newsArticle.imageUrl}
            url={`https://www.vonwobeser.com/news/${newsArticle.slug}`}
            language={displayLanguage}
          />
          <BreadcrumbJsonLd
            items={[
              { name: language === "es" ? "Inicio" : "Home", url: "https://www.vonwobeser.com" },
              { name: language === "es" ? "Noticias" : "News", url: "https://www.vonwobeser.com/#news" },
              { name: language === "es" ? newsArticle.titleEs : newsArticle.title, url: `https://www.vonwobeser.com/news/${newsArticle.slug}` }
            ]}
            language={displayLanguage}
          />
        </>
      )}
      
      <section className="pt-24 relative" data-testid="section-news-hero">
        <div className="relative w-full h-[50vh] min-h-[400px] overflow-hidden">
          <NewsHeroImage
            src={heroImage}
            alt={displayTitle || ""}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
          
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-4xl mx-auto px-6 lg:px-12 pb-12 w-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <button
                  onClick={scrollToNewsSection}
                  className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-6 cursor-pointer text-sm"
                  data-testid="link-back-to-news"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t.backToNews}
                </button>
                
                <div className="flex items-center gap-2 text-white/85 text-sm mb-4">
                  <Calendar className="w-4 h-4" />
                  <span data-testid="text-news-date">{formatDate(newsArticle?.date || null)}</span>
                </div>
                
                <h1 
                  className="text-3xl md:text-4xl lg:text-5xl font-heading font-light text-white leading-tight"
                  data-testid="text-news-title"
                >
                  {displayTitle}
                  {isTranslating && (
                    <Loader2 className="inline-block w-5 h-5 ml-3 animate-spin text-white/60" />
                  )}
                </h1>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <main id="main-content" className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div 
              className="prose prose-lg dark:prose-invert max-w-none mb-12"
              data-testid="container-news-content"
            >
              {displayContent?.split('\n').map((paragraph, index) => (
                <p 
                  key={index} 
                  className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <div 
              className="border-t border-gray-200 dark:border-gray-700 pt-8 mb-16"
              data-testid="section-share"
            >
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm font-medium">{t.share}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-md"
                    onClick={() => handleShare("linkedin")}
                    data-testid="button-share-linkedin"
                    title="LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-md"
                    onClick={() => handleShare("twitter")}
                    data-testid="button-share-twitter"
                    title="Twitter/X"
                  >
                    <Twitter className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-md"
                    onClick={() => handleShare("whatsapp")}
                    data-testid="button-share-whatsapp"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-md"
                    onClick={() => handleShare("email")}
                    data-testid="button-share-email"
                    title="Email"
                  >
                    <Mail className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-md"
                    onClick={handleCopyLink}
                    data-testid="button-share-copy-link"
                    title={t.copyLink}
                  >
                    <LinkIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {relatedAuthors && relatedAuthors.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mb-16"
              data-testid="section-related-authors"
            >
              <h2 
                className="text-2xl font-heading font-light text-gray-800 dark:text-white mb-8"
                data-testid="text-authors-title"
              >
                {relatedAuthors.length === 1 ? t.aboutTheAuthor : t.aboutTheAuthors}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedAuthors.map((author) => (
                  <Link 
                    key={author.id} 
                    href={`/team/${author.slug}`}
                    className="block"
                  >
                    <Card
                      className="group overflow-visible border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 rounded-md bg-white dark:bg-gray-800 hover-elevate"
                      data-testid={`card-author-${author.slug}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="w-16 h-16 flex-shrink-0 border-2 border-gray-100 dark:border-gray-700" data-testid={`avatar-author-${author.slug}`}>
                            <AvatarImage 
                              src={author.imageUrl || undefined} 
                              alt={author.name}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                              {getInitials(author.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 
                              className="text-lg font-medium text-gray-800 dark:text-white group-hover:text-primary transition-colors"
                              data-testid={`text-author-name-${author.slug}`}
                            >
                              {author.name}
                            </h3>
                            <p 
                              className="text-sm text-primary font-medium mb-2"
                              data-testid={`text-author-title-${author.slug}`}
                            >
                              {language === "es" ? author.titleEs : author.title}
                            </p>
                            <p 
                              className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3"
                              data-testid={`text-author-bio-${author.slug}`}
                            >
                              {truncateBio(language === "es" ? author.bioEs : author.bio)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </motion.section>
          )}

          {relatedNews && relatedNews.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              data-testid="section-related-news"
            >
              <h2 
                className="text-2xl font-heading font-light text-gray-800 dark:text-white mb-8"
                data-testid="text-related-news-title"
              >
                {t.relatedNews}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedNews.map((item) => (
                  <Link 
                    key={item.id} 
                    href={`/news/${item.slug}`}
                    className="block"
                  >
                    <Card
                      className="group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 rounded-none bg-white dark:bg-gray-800 hover-elevate"
                      data-testid={`card-related-news-${item.id}`}
                    >
                      <div className="aspect-[16/10] overflow-hidden">
                        <NewsCardImage
                          src={item.imageUrl || ""}
                          alt={language === "es" ? item.titleEs : item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <CardContent className="p-4">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2" data-testid={`text-related-news-date-${item.id}`}>
                          {formatDate(item.date)}
                        </p>
                        <h3 
                          className="text-base font-serif text-gray-800 dark:text-white leading-relaxed line-clamp-2"
                          data-testid={`text-related-news-title-${item.id}`}
                        >
                          {language === "es" ? item.titleEs : item.title}
                        </h3>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </motion.section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
