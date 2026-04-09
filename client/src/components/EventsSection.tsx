import { motion } from "framer-motion";
import { ArrowRight, AlertCircle, MapPin, Calendar, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslatedContent } from "@/hooks/useTranslatedContent";
import type { Event, LanguageCode } from "@shared/schema";
import { eventTypes } from "@shared/schema";

interface EventsSectionProps {
  language: "en" | "es" | "de" | "zh" | "ko" | "ja" | "ar" | "ru" | "fr" | "it";
}

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
  language: LanguageCode;
  learnMoreText: string;
  formatDate: (date: string | Date | null) => string;
}

function EventCard({ event, language, learnMoreText, formatDate }: EventCardProps) {
  const isSpanish = language === 'es';
  
  const { translatedFields, isLoading: isTranslating } = useTranslatedContent({
    contentType: 'event',
    entityId: event.id,
    fields: {
      title: event.titleEs || event.title || '',
      description: event.descriptionEs || event.description || '',
      location: event.locationEs || event.location || '',
    },
    enabled: !isSpanish,
  });

  const getEventTitle = () => {
    if (language === 'es') return event.titleEs || event.title;
    if (translatedFields.title) return translatedFields.title;
    return event.titleEs || event.title;
  };

  const getEventDescription = () => {
    if (language === 'es') return event.descriptionEs || event.description;
    if (translatedFields.description) return translatedFields.description;
    return event.descriptionEs || event.description;
  };

  const getEventLocation = () => {
    if (language === 'es') return event.locationEs || event.location;
    if (translatedFields.location) return translatedFields.location;
    return event.locationEs || event.location;
  };

  return (
    <Card
      className="group h-full overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 rounded-md bg-white dark:bg-gray-800"
      data-testid={`card-event-${event.id}`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <Badge 
            className={`${getEventTypeColor(event.eventType || 'conference')} text-white font-medium`}
            data-testid={`badge-event-type-${event.id}`}
          >
            {getEventTypeLabel(event.eventType || 'conference', language)}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span data-testid={`text-event-date-${event.id}`}>
            {formatDate(event.date)}
          </span>
        </div>
        
        <h3 
          className={`text-xl font-semibold text-gray-800 dark:text-white mb-3 line-clamp-2 ${isTranslating ? 'opacity-50' : ''}`}
          data-testid={`text-event-title-${event.id}`}
        >
          {getEventTitle()}
        </h3>
        
        {(event.location || event.locationEs) && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span 
              className={isTranslating ? 'opacity-50' : ''}
              data-testid={`text-event-location-${event.id}`}
            >
              {getEventLocation()}
            </span>
          </div>
        )}
        
        <p 
          className={`text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4 ${isTranslating ? 'opacity-50' : ''}`}
          data-testid={`text-event-description-${event.id}`}
        >
          {getEventDescription()}
        </p>
        
        {event.externalUrl && (
          <a
            href={event.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary font-medium text-sm hover:underline"
            data-testid={`link-event-learn-more-${event.id}`}
          >
            {learnMoreText}
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </Card>
  );
}

export default function EventsSection({ language }: EventsSectionProps) {
  const { data: events, isLoading, error } = useQuery<Event[]>({
    queryKey: ["/api/events/upcoming?limit=4"],
  });

  const content: Record<string, {
    title: string;
    viewAll: string;
    learnMore: string;
    errorMessage: string;
    noEvents: string;
  }> = {
    en: {
      title: "Upcoming Events",
      viewAll: "View All Events",
      learnMore: "Learn More",
      errorMessage: "Failed to load events",
      noEvents: "No upcoming events",
    },
    es: {
      title: "Próximos Eventos",
      viewAll: "Ver Todos los Eventos",
      learnMore: "Más Información",
      errorMessage: "Error al cargar eventos",
      noEvents: "No hay eventos próximos",
    },
    de: {
      title: "Kommende Veranstaltungen",
      viewAll: "Alle anzeigen",
      learnMore: "Mehr erfahren",
      errorMessage: "Fehler beim Laden der Veranstaltungen",
      noEvents: "Keine Veranstaltungen geplant",
    },
    zh: {
      title: "即将举行的活动",
      viewAll: "查看全部",
      learnMore: "了解更多",
      errorMessage: "加载活动失败",
      noEvents: "暂无活动",
    },
    ko: {
      title: "예정된 이벤트",
      viewAll: "모두 보기",
      learnMore: "자세히 알아보기",
      errorMessage: "이벤트를 불러오는 데 실패했습니다",
      noEvents: "예정된 이벤트 없음",
    },
    ja: {
      title: "今後のイベント",
      viewAll: "すべて見る",
      learnMore: "詳しく見る",
      errorMessage: "イベントの読み込みに失敗しました",
      noEvents: "予定されているイベントはありません",
    },
    ar: {
      title: "الفعاليات القادمة",
      viewAll: "عرض الكل",
      learnMore: "اعرف المزيد",
      errorMessage: "فشل في تحميل الفعاليات",
      noEvents: "لا توجد فعاليات مجدولة",
    },
    ru: {
      title: "Предстоящие мероприятия",
      viewAll: "Смотреть все",
      learnMore: "Подробнее",
      errorMessage: "Не удалось загрузить мероприятия",
      noEvents: "Нет запланированных мероприятий",
    },
    fr: {
      title: "Événements à venir",
      viewAll: "Voir tout",
      learnMore: "En savoir plus",
      errorMessage: "Échec du chargement des événements",
      noEvents: "Aucun événement prévu",
    },
    it: {
      title: "Prossimi eventi",
      viewAll: "Vedi tutti",
      learnMore: "Scopri di più",
      errorMessage: "Errore nel caricamento degli eventi",
      noEvents: "Nessun evento in programma",
    },
  };

  const t = content[language] || content.en;

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  if (error) {
    return (
      <section id="events" className="py-20 lg:py-28 bg-white dark:bg-gray-900" data-testid="section-events">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400" data-testid="text-events-error">{t.errorMessage}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="events"
      className="py-20 lg:py-28 bg-white dark:bg-gray-900"
      data-testid="section-events"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12"
        >
          <h2
            className="text-2xl md:text-3xl font-heading font-light text-gray-800 dark:text-white uppercase tracking-[0.15em]"
            data-testid="text-events-title"
          >
            {t.title}
          </h2>
          <Link href="/events">
            <Button
              variant="outline"
              className="group"
              data-testid="button-view-all-events"
            >
              {t.viewAll}
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {[1, 2, 3, 4].map((i) => (
              <Card 
                key={i} 
                className="overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm rounded-md bg-white dark:bg-gray-800" 
                data-testid={`skeleton-event-${i}`}
              >
                <div className="p-6">
                  <Skeleton className="h-5 w-24 mb-4" />
                  <Skeleton className="h-4 w-32 mb-3" />
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-40 mb-3" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </Card>
            ))}
          </div>
        ) : events && events.length === 0 ? (
          <div className="text-center py-12" data-testid="container-events-empty">
            <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {t.noEvents}
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"
          >
            {events?.map((event) => (
              <motion.div key={event.id} variants={itemVariants}>
                <EventCard 
                  event={event} 
                  language={language as LanguageCode} 
                  learnMoreText={t.learnMore}
                  formatDate={formatDate}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="mt-10 text-center md:hidden">
          <Link href="/events">
            <Button
              variant="outline"
              className="group"
              data-testid="button-view-all-events-mobile"
            >
              {t.viewAll}
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
