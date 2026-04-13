import { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, MapPin, Calendar, ExternalLink, CalendarDays } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslatedContent } from "@/hooks/useTranslatedContent";
import { isNativeLanguage } from "@/lib/translationUtils";
import type { Event } from "@shared/schema";
import { eventTypes } from "@shared/schema";

const getEventTypeColor = (eventType: string): string => {
  const colors: Record<string, string> = {
    conference: "bg-blue-600",
    webinar: "bg-purple-600",
    sponsorship: "bg-amber-600",
    speaking: "bg-green-600",
    networking: "bg-rose-600",
  };
  return colors[eventType] || "bg-gray-600";
};

const getEventTypeLabel = (eventType: string, language: string): string => {
  const type = eventTypes.find(t => t.value === eventType);
  if (!type) return eventType;
  const langKey = language as keyof typeof type;
  return (type[langKey] as string) || type.en;
};

interface EventCardProps {
  event: Event;
  language: string;
  isUpcoming: boolean;
  formatDate: (date: string | Date | null) => string;
  t: {
    past: string;
    learnMore: string;
  };
}

function EventCard({ event, language, isUpcoming, formatDate, t }: EventCardProps) {
  const { translatedFields, isTranslating } = useTranslatedContent({
    contentType: 'event',
    entityId: String(event.id),
    fields: {
      title: event.title,
      titleEs: event.titleEs,
      description: event.description,
      descriptionEs: event.descriptionEs,
      location: event.location,
      locationEs: event.locationEs,
    },
    enabled: !isNativeLanguage(language),
  });

  const displayTitle = translatedFields.title || event.title;
  const displayDescription = translatedFields.description || event.description;
  const displayLocation = translatedFields.location || event.location;

  return (
    <Card
      className={`group h-full rounded-none overflow-hidden border shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer bg-card ${
        isUpcoming 
          ? 'border-border' 
          : 'border-gray-100 dark:border-gray-800 opacity-80'
      }`}
      data-testid={`card-event-${event.id}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <Badge 
            className={`${getEventTypeColor(event.eventType || 'conference')} text-white font-medium`}
            data-testid={`badge-event-type-${event.id}`}
          >
            {getEventTypeLabel(event.eventType || 'conference', language)}
          </Badge>
          {!isUpcoming && (
            <Badge 
              variant="secondary"
              className="text-gray-500"
              data-testid={`badge-event-past-${event.id}`}
            >
              {t.past}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span data-testid={`text-event-date-${event.id}`}>
            {formatDate(event.date)}
          </span>
        </div>
        
        <h3 
          className={`text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2 ${isTranslating ? 'opacity-70' : ''}`}
          data-testid={`text-event-title-${event.id}`}
        >
          {displayTitle}
        </h3>
        
        {displayLocation && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span data-testid={`text-event-location-${event.id}`}>
              {displayLocation}
            </span>
          </div>
        )}
        
        <p 
          className={`text-muted-foreground text-sm line-clamp-3 mb-4 ${isTranslating ? 'opacity-70' : ''}`}
          data-testid={`text-event-description-${event.id}`}
        >
          {displayDescription}
        </p>
        
        {event.externalUrl && (
          <a
            href={event.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary font-medium text-sm hover:underline"
            data-testid={`link-event-learn-more-${event.id}`}
          >
            {t.learnMore}
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </CardContent>
    </Card>
  );
}

export default function EventsPage() {
  const { language } = useLanguage();
  const [selectedType, setSelectedType] = useState<string>("all");

  const { data: events, isLoading, error } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const content: Record<string, {
    title: string;
    subtitle: string;
    errorMessage: string;
    noResults: string;
    learnMore: string;
    all: string;
    upcoming: string;
    past: string;
    register: string;
    noEvents: string;
  }> = {
    en: {
      title: "Events",
      subtitle: "Join us at conferences, webinars, and networking events",
      errorMessage: "Failed to load events",
      noResults: "No events match your filter",
      learnMore: "Learn More",
      all: "All",
      upcoming: "Upcoming",
      past: "Past",
      register: "Register",
      noEvents: "No events scheduled",
    },
    es: {
      title: "Eventos",
      subtitle: "Únase a nosotros en conferencias, webinars y eventos de networking",
      errorMessage: "Error al cargar los eventos",
      noResults: "No hay eventos que coincidan con su filtro",
      learnMore: "Más Información",
      all: "Todos",
      upcoming: "Próximos",
      past: "Pasados",
      register: "Registrarse",
      noEvents: "No hay eventos programados",
    },
    de: {
      title: "Veranstaltungen",
      subtitle: "Kommende und vergangene Veranstaltungen",
      errorMessage: "Fehler beim Laden der Veranstaltungen",
      noResults: "Keine Veranstaltungen entsprechen Ihrem Filter",
      learnMore: "Mehr erfahren",
      all: "Alle",
      upcoming: "Kommende Veranstaltungen",
      past: "Vergangene Veranstaltungen",
      register: "Anmelden",
      noEvents: "Keine Veranstaltungen geplant",
    },
    zh: {
      title: "活动",
      subtitle: "即将举行和过去的活动",
      errorMessage: "加载活动失败",
      noResults: "没有符合筛选条件的活动",
      learnMore: "了解更多",
      all: "全部",
      upcoming: "即将举行的活动",
      past: "过往活动",
      register: "注册",
      noEvents: "暂无活动",
    },
    ko: {
      title: "이벤트",
      subtitle: "컨퍼런스, 웨비나 및 네트워킹 이벤트",
      errorMessage: "이벤트 로드 실패",
      noResults: "필터와 일치하는 이벤트가 없습니다",
      learnMore: "자세히 보기",
      all: "전체",
      upcoming: "예정된 이벤트",
      past: "지난 이벤트",
      register: "등록",
      noEvents: "예정된 이벤트가 없습니다",
    },
    ja: {
      title: "イベント",
      subtitle: "カンファレンス、ウェビナー、ネットワーキングイベント",
      errorMessage: "イベントの読み込みに失敗しました",
      noResults: "フィルターに一致するイベントがありません",
      learnMore: "詳細を見る",
      all: "すべて",
      upcoming: "今後のイベント",
      past: "過去のイベント",
      register: "登録",
      noEvents: "予定されているイベントはありません",
    },
    ar: {
      title: "الفعاليات",
      subtitle: "الفعاليات القادمة والسابقة",
      errorMessage: "فشل في تحميل الفعاليات",
      noResults: "لا توجد فعاليات تطابق الفلتر",
      learnMore: "اعرف المزيد",
      all: "الكل",
      upcoming: "الفعاليات القادمة",
      past: "الفعاليات السابقة",
      register: "سجّل",
      noEvents: "لا توجد فعاليات مجدولة",
    },
    ru: {
      title: "Мероприятия",
      subtitle: "Предстоящие и прошедшие мероприятия",
      errorMessage: "Не удалось загрузить мероприятия",
      noResults: "Нет мероприятий, соответствующих фильтру",
      learnMore: "Подробнее",
      all: "Все",
      upcoming: "Предстоящие",
      past: "Прошедшие",
      register: "Зарегистрироваться",
      noEvents: "Нет мероприятий",
    },
    fr: {
      title: "Événements",
      subtitle: "Événements à venir et passés",
      errorMessage: "Échec du chargement des événements",
      noResults: "Aucun événement ne correspond à votre filtre",
      learnMore: "En savoir plus",
      all: "Tous",
      upcoming: "À venir",
      past: "Passés",
      register: "S'inscrire",
      noEvents: "Aucun événement prévu",
    },
    it: {
      title: "Eventi",
      subtitle: "Eventi in programma e passati",
      errorMessage: "Impossibile caricare gli eventi",
      noResults: "Nessun evento corrisponde al filtro",
      learnMore: "Scopri di più",
      all: "Tutti",
      upcoming: "Prossimi eventi",
      past: "Eventi passati",
      register: "Registrati",
      noEvents: "Nessun evento",
    },
  };

  const t = content[language] || content.en;

  const typeFilters = [
    { value: "all", en: "All", es: "Todos" },
    ...eventTypes,
  ];

  const filteredEvents = events?.filter(event => {
    if (selectedType === "all") return true;
    return event.eventType === selectedType;
  }).sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const formatDate = (date: string | Date | null) => {
    if (!date) return '';
    const d = new Date(date);
    const localeMap: Record<string, string> = {
      en: 'en-US',
      es: 'es-MX',
      de: 'de-DE',
      zh: 'zh-CN',
      ko: 'ko-KR',
      ja: 'ja-JP',
      ar: 'ar-SA',
      ru: 'ru-RU',
      fr: 'fr-FR',
      it: 'it-IT',
    };
    return d.toLocaleDateString(localeMap[language] || 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isUpcoming = (date: string | Date | null): boolean => {
    if (!date) return false;
    return new Date(date) > new Date();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <div className="min-h-screen bg-background" data-testid="page-events">
      <SEOHead page="events" language={language} />
      <Header />
      
      <section className="pt-36 pb-20 bg-[#1a1a19]" data-testid="section-events-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <div className="h-0.5 w-12 bg-primary mx-auto mb-6" />
            <h1 
              className="text-4xl md:text-5xl font-heading font-light text-white mb-5 uppercase tracking-[0.15em]"
              data-testid="text-events-title"
            >
              {t.title}
            </h1>
            <p 
              className="text-base text-white/60 max-w-2xl mx-auto"
              data-testid="text-events-subtitle"
            >
              {t.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      <main id="main-content" className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mb-10"
          >
            <div className="flex flex-wrap items-center gap-2" data-testid="container-type-filters">
              {typeFilters.map((type) => (
                <Button
                  key={type.value}
                  variant={selectedType === type.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type.value)}
                  className={`transition-all ${
                    selectedType === type.value 
                      ? "bg-primary text-white" 
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                  data-testid={`button-filter-${type.value}`}
                >
                  {language === "es" ? type.es : type.en}
                </Button>
              ))}
            </div>
          </motion.div>

          {error ? (
            <div className="text-center py-12" data-testid="container-events-error">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground" data-testid="text-events-error">
                {t.errorMessage}
              </p>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card 
                  key={i} 
                  className="rounded-none overflow-hidden border-0 shadow-sm"
                  data-testid={`skeleton-event-${i}`}
                >
                  <CardContent className="p-6">
                    <Skeleton className="h-5 w-24 mb-4" />
                    <Skeleton className="h-4 w-32 mb-3" />
                    <Skeleton className="h-6 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-5/6" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredEvents && filteredEvents.length === 0 ? (
            <div className="text-center py-12" data-testid="container-events-empty">
              <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {t.noResults}
              </p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredEvents?.map((event) => (
                <motion.div key={event.id} variants={itemVariants}>
                  <EventCard
                    event={event}
                    language={language}
                    isUpcoming={isUpcoming(event.date)}
                    formatDate={formatDate}
                    t={{ past: t.past, learnMore: t.learnMore }}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
