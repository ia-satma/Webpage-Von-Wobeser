import { AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslatedContent } from "@/hooks/useTranslatedContent";
import { isNativeLanguage } from "@/lib/translationUtils";
import { getPracticeImage } from "@/lib/practiceIndustryImages";
import {
  CapabilityHero,
  CapabilityGrid,
  CapabilityCard,
} from "@/components/capabilities";
import type { PracticeGroup } from "@shared/schema";

/**
 * PracticeGroups — listado de áreas de práctica en el look viejo de Von Wobeser.
 *
 * Conserva el data-fetching original (`/api/practice-groups`) y la traducción
 * campo a campo por tarjeta. El Header/Footer los provee <Layout> (App.tsx);
 * aquí sólo se renderiza el contenido + <SEOHead>.
 */

interface PracticeCardProps {
  group: PracticeGroup;
}

function PracticeCard({ group }: PracticeCardProps) {
  const { language } = useLanguage();

  const { translatedFields, isLoading, isTranslating } = useTranslatedContent({
    contentType: "practice_group",
    entityId: String(group.id),
    fields: {
      name: group.name,
      nameEs: group.nameEs,
      description: group.description,
      descriptionEs: group.descriptionEs,
    },
    enabled: !isNativeLanguage(language),
  });

  const displayName = translatedFields.name || group.name;
  const displayDescription = translatedFields.description || group.description;
  const imageUrl = getPracticeImage(group.slug, group.imageUrl);

  return (
    <CapabilityCard
      href={`/practice-groups/${group.slug}`}
      title={displayName}
      description={displayDescription}
      imageUrl={imageUrl}
      isTranslating={isLoading || isTranslating}
      testId={`card-practice-group-${group.slug}`}
    />
  );
}

export default function PracticeGroups() {
  const { language } = useLanguage();

  const { data: practiceGroups, isLoading, error } = useQuery<PracticeGroup[]>({
    queryKey: ["/api/practice-groups"],
  });

  const content: Record<string, { eyebrow: string; title: string; subtitle: string; errorMessage: string }> = {
    en: { eyebrow: "Capabilities", title: "Practice Groups", subtitle: "Our expertise covers all major legal areas", errorMessage: "Failed to load practice groups" },
    es: { eyebrow: "Capacidades", title: "Áreas de Práctica", subtitle: "Nuestra experiencia cubre todas las principales áreas legales", errorMessage: "Error al cargar las áreas de práctica" },
    de: { eyebrow: "Kapazitäten", title: "Praxisbereiche", subtitle: "Unsere Expertise deckt alle wichtigen Rechtsgebiete ab", errorMessage: "Fehler beim Laden der Praxisbereiche" },
    zh: { eyebrow: "业务能力", title: "业务领域", subtitle: "我们的专业覆盖所有主要法律领域", errorMessage: "加载业务领域失败" },
    ko: { eyebrow: "역량", title: "업무 분야", subtitle: "우리의 전문성은 모든 주요 법률 분야를 아우릅니다", errorMessage: "업무 분야 로드 실패" },
    ja: { eyebrow: "専門領域", title: "取扱分野", subtitle: "当事務所の専門性はすべての主要な法律分野をカバーしています", errorMessage: "取扱分野の読み込みに失敗しました" },
    ar: { eyebrow: "القدرات", title: "مجالات الممارسة", subtitle: "خبرتنا تغطي جميع المجالات القانونية الرئيسية", errorMessage: "فشل تحميل مجالات الممارسة" },
    ru: { eyebrow: "Компетенции", title: "Практики", subtitle: "Наша экспертиза охватывает все основные области права", errorMessage: "Не удалось загрузить практики" },
    fr: { eyebrow: "Compétences", title: "Domaines de pratique", subtitle: "Notre expertise couvre tous les principaux domaines juridiques", errorMessage: "Échec du chargement des domaines de pratique" },
    it: { eyebrow: "Competenze", title: "Aree di pratica", subtitle: "La nostra competenza copre tutte le principali aree legali", errorMessage: "Impossibile caricare le aree di pratica" },
  };

  const t = content[language] || content.en;

  return (
    <div data-testid="page-practice-groups">
      <SEOHead page="practiceGroups" language={language} />

      <CapabilityHero
        eyebrow={t.eyebrow}
        title={t.title}
        subtitle={t.subtitle}
        testId="section-practice-groups-hero"
      />

      {error ? (
        <section className="bg-white py-20">
          <div className="vw-wrap text-center" data-testid="container-practice-groups-error">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-vw-graylight" />
            <p className="text-vw-gray" data-testid="text-practice-groups-error">
              {t.errorMessage}
            </p>
          </div>
        </section>
      ) : isLoading ? (
        <CapabilityGrid testId="grid-practice-groups-loading">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] animate-pulse bg-vw-graylight/40"
              data-testid={`skeleton-practice-group-${i}`}
            />
          ))}
        </CapabilityGrid>
      ) : (
        <CapabilityGrid testId="grid-practice-groups">
          {practiceGroups?.map((group) => (
            <PracticeCard key={group.id} group={group} />
          ))}
        </CapabilityGrid>
      )}
    </div>
  );
}
