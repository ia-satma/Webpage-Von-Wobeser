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
    : null;

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
