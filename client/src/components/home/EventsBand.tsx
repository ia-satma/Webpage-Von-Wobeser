import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useFadeOnScroll } from "@/hooks/useFadeOnScroll";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Event } from "@shared/schema";

/**
 * EventsBand — listado de próximos eventos del home. Preserva el
 * data-fetching original `/api/events/upcoming`. Presentación al estilo viejo:
 * título de sección con borde inferior rojo y filas con fecha + título.
 *
 * Si no hay eventos próximos, la sección no se renderiza (igual que el viejo,
 * que solo mostraba el bloque cuando había contenido).
 */

type EventsCopy = {
  title: string;
  seeAll: string;
};

const copy: Record<string, EventsCopy> = {
  en: { title: "Upcoming Events", seeAll: "SEE ALL EVENTS" },
  es: { title: "Próximos Eventos", seeAll: "VER TODOS LOS EVENTOS" },
};

function formatDate(value: string | Date | null, language: string): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(language === "es" ? "es-MX" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function EventsBand() {
  const { language } = useLanguage();
  const ref = useFadeOnScroll<HTMLDivElement>();
  const t = copy[language] || copy.en;

  const { data: events } = useQuery<Event[]>({
    queryKey: ["/api/events/upcoming"],
  });

  const upcoming = (events ?? []).slice(0, 4);
  if (upcoming.length === 0) return null;

  return (
    <section className="bg-white py-20 md:py-24" data-testid="section-events">
      <div className="vw-wrap">
        <div ref={ref} className="vw-fade mx-auto max-w-[940px]">
          <h2 className="vw-section-title pb-3 font-serif text-[35px] text-vw-gray">
            {t.title}
          </h2>

          <ul className="mt-6 flex flex-col">
            {upcoming.map((ev) => {
              const title = language === "es" ? ev.titleEs || ev.title : ev.title || ev.titleEs;
              const location =
                language === "es" ? ev.locationEs || ev.location : ev.location || ev.locationEs;
              return (
                <li
                  key={ev.id}
                  className="flex flex-col gap-1 border-b border-vw-graylight py-5 md:flex-row md:items-baseline md:gap-6"
                  data-testid={`event-${ev.id}`}
                >
                  <span className="vw-label min-w-[140px] text-[12px] text-vw-red">
                    {formatDate(ev.date, language)}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-serif text-[20px] leading-snug text-vw-gray">
                      {ev.externalUrl ? (
                        <a
                          href={ev.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="no-underline transition-colors hover:text-vw-red"
                        >
                          {title}
                        </a>
                      ) : (
                        title
                      )}
                    </h3>
                    {location && (
                      <p className="mt-1 font-sans text-[14px] text-vw-gray/80">{location}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="mt-8">
            <Link
              href="/events"
              className="vw-label text-[12px] font-bold text-vw-red no-underline hover:underline"
              data-testid="link-events-all"
            >
              {t.seeAll}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
