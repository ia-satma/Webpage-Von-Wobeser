import { useState } from "react";
import { Calendar, MapPin, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import SEOHead from "@/components/SEOHead";
import { PageHero, Section } from "@/components/firm";
import { useFadeOnScroll } from "@/hooks/useFadeOnScroll";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslatedContent } from "@/hooks/useTranslatedContent";
import { isNativeLanguage } from "@/lib/translationUtils";
import type { Event } from "@shared/schema";
import { eventTypes } from "@shared/schema";

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
    <div
      className={cn(
        "flex h-full flex-col border border-vw-graylight bg-white p-7 transition-colors hover:border-vw-red",
        !isUpcoming && "opacity-80",
      )}
      data-testid={`card-event-${event.id}`}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span
          className="vw-label inline-block border border-vw-red px-3 py-1 text-[10px] text-vw-red"
          data-testid={`badge-event-type-${event.id}`}
        >
          {getEventTypeLabel(event.eventType || 'conference', language)}
        </span>
        {!isUpcoming && (
          <span
            className="vw-label inline-block border border-vw-graylight px-3 py-1 text-[10px] text-vw-gray"
            data-testid={`badge-event-past-${event.id}`}
          >
            {t.past}
          </span>
        )}
      </div>

      <div className="mb-3 flex items-center gap-2 font-sans text-sm text-vw-gray">
        <Calendar className="h-4 w-4 flex-shrink-0 text-vw-red" aria-hidden="true" />
        <span data-testid={`text-event-date-${event.id}`}>
          {formatDate(event.date)}
        </span>
      </div>

      <h3
        className={cn(
          "mb-3 font-serif text-xl leading-snug text-vw-black",
          isTranslating && "opacity-70",
        )}
        data-testid={`text-event-title-${event.id}`}
      >
        {displayTitle}
      </h3>

      {displayLocation && (
        <div className="mb-3 flex items-center gap-2 font-sans text-sm text-vw-gray">
          <MapPin className="h-4 w-4 flex-shrink-0 text-vw-red" aria-hidden="true" />
          <span data-testid={`text-event-location-${event.id}`}>
            {displayLocation}
          </span>
        </div>
      )}

      <p
        className={cn(
          "mb-5 font-sans text-base leading-relaxed text-vw-gray",
          isTranslating && "opacity-70",
        )}
        data-testid={`text-event-description-${event.id}`}
      >
        {displayDescription}
      </p>

      {event.externalUrl && (
        <a
          href={event.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="vw-label mt-auto inline-flex items-center gap-2 text-[11px] text-vw-red transition-colors hover:text-vw-black"
          data-testid={`link-event-learn-more-${event.id}`}
        >
          {t.learnMore}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}

export default function EventsPage() {
  const { language } = useLanguage();
  const [selectedType, setSelectedType] = useState<string>("all");
  const gridRef = useFadeOnScroll<HTMLDivElement>();

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

  return (
    <div data-testid="page-events">
      <SEOHead page="events" language={language} />

      <PageHero
        title={t.title}
        subtitle={t.subtitle}
        data-testid="section-events-hero"
      />

      <Section tone="white" data-testid="section-events-list">
        <div
          className="mb-10 flex flex-wrap items-center gap-3"
          data-testid="container-type-filters"
        >
          {typeFilters.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setSelectedType(type.value)}
              className={cn(
                "vw-label rounded-none border px-5 py-2 text-[11px] transition-colors",
                selectedType === type.value
                  ? "border-vw-red bg-vw-red text-white"
                  : "border-vw-graylight bg-white text-vw-gray hover:border-vw-red hover:text-vw-red",
              )}
              data-testid={`button-filter-${type.value}`}
            >
              {language === "es" ? type.es : type.en}
            </button>
          ))}
        </div>

        {error ? (
          <div className="py-12 text-center" data-testid="container-events-error">
            <p className="font-sans text-base text-vw-gray" data-testid="text-events-error">
              {t.errorMessage}
            </p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-64 animate-pulse border border-vw-graylight bg-[#f4f4f4]"
                data-testid={`skeleton-event-${i}`}
              />
            ))}
          </div>
        ) : filteredEvents && filteredEvents.length === 0 ? (
          <div className="py-12 text-center" data-testid="container-events-empty">
            <p className="font-sans text-base text-vw-gray">
              {t.noResults}
            </p>
          </div>
        ) : (
          <div
            ref={gridRef}
            className="vw-fade grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
          >
            {filteredEvents?.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                language={language}
                isUpcoming={isUpcoming(event.date)}
                formatDate={formatDate}
                t={{ past: t.past, learnMore: t.learnMore }}
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
