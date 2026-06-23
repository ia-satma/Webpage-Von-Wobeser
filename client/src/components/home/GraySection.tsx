import { useQuery } from "@tanstack/react-query";
import { useFadeOnScroll } from "@/hooks/useFadeOnScroll";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SiteContent, Stat } from "@shared/schema";

/**
 * GraySection — banda gris corporativa (`.home__gray`, fondo #5e5e5e) del home
 * viejo. El viejo la usaba para frases de "tres décadas de experiencia" y el
 * conteo del equipo (180+ miembros). Reproducimos esa banda con texto grande
 * Publico centrado.
 *
 * Preserva el data-fetching `/api/stats` (para el conteo de equipo, si existe)
 * y `/api/site-content` (statsTitle como fallback).
 */

const fallbackText: Record<string, string> = {
  en: "Von Wobeser y Sierra, S.C. has more than three decades of experience.",
  es: "Von Wobeser y Sierra, S.C. tiene más de tres décadas de experiencia.",
};

const teamLine: Record<string, (n: string) => string> = {
  en: (n) =>
    `We have more than ${n} legal team members, plus administrative staff supporting our clients.`,
  es: (n) =>
    `Contamos con más de ${n} integrantes del equipo legal, además de personal administrativo al servicio de nuestros clientes.`,
};

// Texto fijo del sitio original (vonwobeser.com) — se usa cuando /api/stats no
// trae un conteo de equipo (hoy solo trae datos de oficina). Cifras del original.
const teamFallback: Record<string, string> = {
  en: "We have more than 180 legal team members (including 26 partners, 6 of counsel, and 8 counsel) and legal interns, plus administrative staff.",
  es: "Contamos con más de 180 integrantes del equipo legal (incluyendo 26 socios, 6 of counsel y 8 counsel) y becarios, además del personal administrativo.",
};

export default function GraySection() {
  const { language } = useLanguage();
  const ref = useFadeOnScroll<HTMLDivElement>();

  const { data: siteContent } = useQuery<SiteContent>({
    queryKey: ["/api/site-content"],
  });

  const { data: stats } = useQuery<Stat[]>({
    queryKey: ["/api/stats"],
  });

  const primary =
    (language === "en" && siteContent?.statsTitle) ||
    fallbackText[language] ||
    fallbackText.en;

  // Busca una estadística que represente al equipo (lawyers / team / members).
  const teamStat = (stats ?? []).find((s) =>
    /lawyer|team|member|abogad|equipo|integrant/i.test(`${s.label} ${s.labelEs}`),
  );
  const secondary = teamStat
    ? (teamLine[language] || teamLine.en)(teamStat.value)
    : teamFallback[language] || teamFallback.en;

  return (
    <section
      className="bg-vw-gray py-24 md:py-32 text-white"
      data-testid="section-home-gray"
    >
      <div className="vw-wrap">
        <div
          ref={ref}
          className="vw-fade mx-auto flex max-w-[900px] flex-col gap-10 text-center"
        >
          <p className="font-serif text-[25px] leading-[1.4] md:text-[28px]">
            {primary}
          </p>
          {secondary && (
            <p className="font-serif text-[20px] leading-[1.5] text-white/85">
              {secondary}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
