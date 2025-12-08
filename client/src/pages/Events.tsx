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

const getEventTypeLabel = (eventType: string, language: "es" | "en"): string => {
  const type = eventTypes.find(t => t.value === eventType);
  if (!type) return eventType;
  return language === "es" ? type.es : type.en;
};

export default function EventsPage() {
  const { language, displayLanguage } = useLanguage();
  const [selectedType, setSelectedType] = useState<string>("all");

  const { data: events, isLoading, error } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const content = {
    en: {
      title: "Events",
      subtitle: "Join us at conferences, webinars, and networking events",
      errorMessage: "Failed to load events",
      noResults: "No events match your filter",
      learnMore: "Learn More",
      all: "All",
      upcoming: "Upcoming",
      past: "Past",
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
    },
  };

  const t = content[displayLanguage];

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
    return d.toLocaleDateString(language === "es" ? 'es-MX' : 'en-US', {
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
    <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-events">
      <SEOHead page="events" language={language} />
      <Header />
      
      <section className="pt-32 pb-12 bg-primary" data-testid="section-events-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 
              className="text-4xl md:text-5xl font-heading font-light text-white mb-4"
              data-testid="text-events-title"
            >
              {t.title}
            </h1>
            <p 
              className="text-lg text-white/90 max-w-2xl mx-auto"
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
            animate={{ opacity: 1, y: 0 }}
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
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
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
              <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400" data-testid="text-events-error">
                {t.errorMessage}
              </p>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card 
                  key={i} 
                  className="rounded-md overflow-hidden border-0 shadow-sm"
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
              <CalendarDays className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
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
                  <Card
                    className={`group h-full rounded-md overflow-hidden border shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer bg-white dark:bg-gray-800 ${
                      isUpcoming(event.date) 
                        ? 'border-gray-200 dark:border-gray-700' 
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
                          {getEventTypeLabel(event.eventType || 'conference', displayLanguage)}
                        </Badge>
                        {!isUpcoming(event.date) && (
                          <Badge 
                            variant="secondary"
                            className="text-gray-500"
                            data-testid={`badge-event-past-${event.id}`}
                          >
                            {t.past}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span data-testid={`text-event-date-${event.id}`}>
                          {formatDate(event.date)}
                        </span>
                      </div>
                      
                      <h3 
                        className="text-xl font-semibold text-gray-800 dark:text-white mb-3 group-hover:text-primary transition-colors line-clamp-2"
                        data-testid={`text-event-title-${event.id}`}
                      >
                        {language === "es" ? event.titleEs : event.title}
                      </h3>
                      
                      {(event.location || event.locationEs) && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span data-testid={`text-event-location-${event.id}`}>
                            {language === "es" ? (event.locationEs || event.location) : event.location}
                          </span>
                        </div>
                      )}
                      
                      <p 
                        className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4"
                        data-testid={`text-event-description-${event.id}`}
                      >
                        {language === "es" ? event.descriptionEs : event.description}
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
