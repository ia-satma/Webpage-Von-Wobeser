import { Link, useParams } from "wouter";
import { useMemo } from "react";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslatedContent } from "@/hooks/useTranslatedContent";
import {
  CapabilityHero,
  CapabilityProse,
  RepresentativeMatters,
  RelatedAttorneys,
  CapabilityRankings,
  CapabilityContactCta,
  type CapabilityRankingItem,
} from "@/components/capabilities";
import type { PracticeGroup, TeamMember, RepresentativeMatterDb } from "@shared/schema";

/* ─────────────────────────────────────────────────────────────────────────
   Datos preservados de la implementación previa (rankings + mapeo de roles).
   ───────────────────────────────────────────────────────────────────────── */

const practiceRankingsData: Record<string, CapabilityRankingItem[]> = {
  "corporate-ma": [
    { publication: "Chambers Latin America", ranking: "Band 1", rankingEs: "Banda 1", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 1", rankingEs: "Tier 1", year: "2024", badgeType: "tier" },
    { publication: "IFLR1000", ranking: "Highly Regarded", rankingEs: "Altamente Reconocido", year: "2024", badgeType: "recommended" },
  ],
  "antitrust-competition": [
    { publication: "Chambers Latin America", ranking: "Band 1", rankingEs: "Banda 1", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 1", rankingEs: "Tier 1", year: "2024", badgeType: "tier" },
    { publication: "GCR 100", ranking: "Elite", rankingEs: "Élite", year: "2024", badgeType: "star" },
    { publication: "Who's Who Legal", ranking: "Recommended", rankingEs: "Recomendado", year: "2024", badgeType: "recommended" },
  ],
  "arbitration": [
    { publication: "Chambers Latin America", ranking: "Band 1", rankingEs: "Banda 1", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 1", rankingEs: "Tier 1", year: "2024", badgeType: "tier" },
    { publication: "GAR 100", ranking: "Top 30 Worldwide", rankingEs: "Top 30 Mundial", year: "2024", badgeType: "star" },
    { publication: "Latin Lawyer 250", ranking: "Elite", rankingEs: "Élite", year: "2024", badgeType: "star" },
  ],
  "litigation": [
    { publication: "Chambers Latin America", ranking: "Band 1", rankingEs: "Banda 1", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 1", rankingEs: "Tier 1", year: "2024", badgeType: "tier" },
    { publication: "Benchmark Litigation", ranking: "Top Tier", rankingEs: "Top Tier", year: "2024", badgeType: "tier" },
  ],
  "investigations-anticorruption": [
    { publication: "Chambers Latin America", ranking: "Band 1", rankingEs: "Banda 1", year: "2024", badgeType: "band" },
    { publication: "GIR 100", ranking: "Top 100 Global", rankingEs: "Top 100 Global", year: "2024", badgeType: "star" },
    { publication: "Legal 500", ranking: "Tier 1", rankingEs: "Tier 1", year: "2024", badgeType: "tier" },
  ],
  "bankruptcy-restructuring": [
    { publication: "Chambers Latin America", ranking: "Band 2", rankingEs: "Banda 2", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 1", rankingEs: "Tier 1", year: "2024", badgeType: "tier" },
    { publication: "GRR 100", ranking: "Top 100 Global", rankingEs: "Top 100 Global", year: "2024", badgeType: "star" },
  ],
  "banking-finance": [
    { publication: "Chambers Latin America", ranking: "Band 2", rankingEs: "Banda 2", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 2", rankingEs: "Tier 2", year: "2024", badgeType: "tier" },
    { publication: "IFLR1000", ranking: "Highly Regarded", rankingEs: "Altamente Reconocido", year: "2024", badgeType: "recommended" },
  ],
  "energy-natural-resources": [
    { publication: "Chambers Latin America", ranking: "Band 1", rankingEs: "Banda 1", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 1", rankingEs: "Tier 1", year: "2024", badgeType: "tier" },
    { publication: "Who's Who Legal", ranking: "Recommended", rankingEs: "Recomendado", year: "2024", badgeType: "recommended" },
  ],
  "esg": [
    { publication: "Chambers Latin America", ranking: "Ranked", rankingEs: "Clasificado", year: "2024", badgeType: "recommended" },
    { publication: "Legal 500", ranking: "Tier 2", rankingEs: "Tier 2", year: "2024", badgeType: "tier" },
  ],
  "real-estate": [
    { publication: "Chambers Latin America", ranking: "Band 2", rankingEs: "Banda 2", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 2", rankingEs: "Tier 2", year: "2024", badgeType: "tier" },
  ],
  "intellectual-property": [
    { publication: "Chambers Latin America", ranking: "Band 2", rankingEs: "Banda 2", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 2", rankingEs: "Tier 2", year: "2024", badgeType: "tier" },
    { publication: "WTR 1000", ranking: "Silver", rankingEs: "Plata", year: "2024", badgeType: "recommended" },
  ],
  "labor-employment": [
    { publication: "Chambers Latin America", ranking: "Band 2", rankingEs: "Banda 2", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 2", rankingEs: "Tier 2", year: "2024", badgeType: "tier" },
  ],
  "tax": [
    { publication: "Chambers Latin America", ranking: "Band 2", rankingEs: "Banda 2", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 2", rankingEs: "Tier 2", year: "2024", badgeType: "tier" },
    { publication: "ITR World Tax", ranking: "Tier 2", rankingEs: "Tier 2", year: "2024", badgeType: "tier" },
  ],
  "international-trade": [
    { publication: "Chambers Latin America", ranking: "Band 2", rankingEs: "Banda 2", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 2", rankingEs: "Tier 2", year: "2024", badgeType: "tier" },
  ],
  "telecommunications-media-technology": [
    { publication: "Chambers Latin America", ranking: "Band 2", rankingEs: "Banda 2", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 2", rankingEs: "Tier 2", year: "2024", badgeType: "tier" },
  ],
  "environmental": [
    { publication: "Chambers Latin America", ranking: "Band 3", rankingEs: "Banda 3", year: "2024", badgeType: "band" },
    { publication: "Legal 500", ranking: "Tier 2", rankingEs: "Tier 2", year: "2024", badgeType: "tier" },
  ],
  "administrative-law": [
    { publication: "Chambers Latin America", ranking: "Ranked", rankingEs: "Clasificado", year: "2024", badgeType: "recommended" },
    { publication: "Legal 500", ranking: "Tier 3", rankingEs: "Tier 3", year: "2024", badgeType: "tier" },
  ],
  "german-desk": [
    { publication: "Legal 500", ranking: "Recommended", rankingEs: "Recomendado", year: "2024", badgeType: "recommended" },
  ],
};

const practiceAreaRoleMapping: Record<string, string[]> = {
  "corporate-ma": ["Corporate & M&A", "Corporate, M&A & Pharmaceutical Co-Leader"],
  "antitrust-competition": ["Antitrust & Competition"],
  "arbitration": ["Arbitration", "Arbitration & Energy", "Founding Partner, Arbitration & Litigation Expert"],
  "litigation": ["Litigation"],
  "investigations-anticorruption": ["Investigations, Anti-corruption & Compliance"],
  "bankruptcy-restructuring": ["Bankruptcy & Restructuring"],
  "banking-finance": ["Banking & Finance"],
  "energy-natural-resources": ["Energy & Natural Resources", "Arbitration & Energy"],
  "esg": ["ESG"],
  "real-estate": ["Real Estate"],
  "intellectual-property": ["Intellectual Property"],
  "labor-employment": ["Labor & Employment"],
  "tax": ["Tax", "Tax Practice"],
  "international-trade": ["International Trade"],
  "telecommunications-media-technology": ["Telecommunications, Media & Technology"],
  "environmental": ["Environmental"],
  "administrative-law": ["Administrative Law"],
  "german-desk": ["German Desk"],
};

export default function PracticeGroupDetail() {
  const { language } = useLanguage();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data: practiceGroup, isLoading, error } = useQuery<PracticeGroup>({
    queryKey: [`/api/practice-groups/${slug}`],
    enabled: !!slug,
  });

  const { data: allTeamMembers } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
  });

  const { data: representativeMatters } = useQuery<RepresentativeMatterDb[]>({
    queryKey: ["/api/practice-groups", slug, "representative-matters"],
    enabled: !!slug,
  });

  const { translatedFields, isTranslating } = useTranslatedContent({
    contentType: "practice_group",
    entityId: practiceGroup?.id?.toString() || "",
    fields: {
      name: practiceGroup?.name,
      nameEs: practiceGroup?.nameEs,
      description: practiceGroup?.description,
      descriptionEs: practiceGroup?.descriptionEs,
      fullDescription: practiceGroup?.fullDescription,
      fullDescriptionEs: practiceGroup?.fullDescriptionEs,
    },
    enabled: !!practiceGroup,
  });

  const translations: Record<string, {
    backToAll: string;
    contactCta: string;
    contactSubtitle: string;
    emailUs: string;
    callUs: string;
    ourTeam: string;
    partners: string;
    ofCounsel: string;
    associates: string;
    viewAll: string;
    rankingsTitle: string;
    rankingsSubtitle: string;
    successCasesTitle: string;
    successCasesSubtitle: string;
    errorMessage: string;
    overview: string;
    featured: string;
    client: string;
  }> = {
    en: { backToAll: "All Practice Groups", contactCta: "Contact our team", contactSubtitle: "Let our experienced attorneys help you navigate your legal challenges.", emailUs: "Email Us", callUs: "Call Us", ourTeam: "Our Team", partners: "Partners", ofCounsel: "Of Counsel", associates: "Associates", viewAll: "View all", rankingsTitle: "Rankings & Recognition", rankingsSubtitle: "Recognized by leading legal directories worldwide", successCasesTitle: "Success Cases", successCasesSubtitle: "Representative matters", errorMessage: "Practice group not found", overview: "Overview", featured: "Featured", client: "Client:" },
    es: { backToAll: "Todas las Áreas de Práctica", contactCta: "Contacte a nuestro equipo", contactSubtitle: "Permita que nuestros abogados experimentados le ayuden a navegar sus desafíos legales.", emailUs: "Enviar Email", callUs: "Llamar", ourTeam: "Nuestro Equipo", partners: "Socios", ofCounsel: "Of Counsel", associates: "Asociados", viewAll: "Ver todos", rankingsTitle: "Rankings y Reconocimientos", rankingsSubtitle: "Reconocidos por los principales directorios legales del mundo", successCasesTitle: "Casos de Éxito", successCasesSubtitle: "Casos representativos", errorMessage: "Área de práctica no encontrada", overview: "Resumen", featured: "Destacado", client: "Cliente:" },
    de: { backToAll: "Zurück zu Praxisbereichen", contactCta: "Kontaktieren Sie unser Team", contactSubtitle: "Lassen Sie unsere erfahrenen Anwälte Ihnen bei Ihren rechtlichen Herausforderungen helfen.", emailUs: "E-Mail senden", callUs: "Anrufen", ourTeam: "Unser Team", partners: "Partner", ofCounsel: "Of Counsel", associates: "Associates", viewAll: "Alle anzeigen", rankingsTitle: "Rankings & Anerkennung", rankingsSubtitle: "Von führenden Rechtsverzeichnissen weltweit anerkannt", successCasesTitle: "Erfolgsfälle", successCasesSubtitle: "Repräsentative Mandate", errorMessage: "Praxisbereich nicht gefunden", overview: "Übersicht", featured: "Empfohlen", client: "Mandant:" },
    zh: { backToAll: "返回业务领域", contactCta: "联系我们的团队", contactSubtitle: "让我们经验丰富的律师帮助您应对法律挑战。", emailUs: "发送邮件", callUs: "致电", ourTeam: "我们的团队", partners: "合伙人", ofCounsel: "顾问律师", associates: "律师助理", viewAll: "查看全部", rankingsTitle: "排名与认可", rankingsSubtitle: "获得全球领先法律目录的认可", successCasesTitle: "成功案例", successCasesSubtitle: "代表性案件", errorMessage: "未找到业务领域", overview: "概述", featured: "精选", client: "客户：" },
    ko: { backToAll: "업무 분야로 돌아가기", contactCta: "팀에 연락하기", contactSubtitle: "경험 풍부한 변호사가 법적 문제 해결을 도와드립니다.", emailUs: "이메일 보내기", callUs: "전화하기", ourTeam: "우리 팀", partners: "파트너", ofCounsel: "고문 변호사", associates: "어소시에이트", viewAll: "모두 보기", rankingsTitle: "순위 및 인정", rankingsSubtitle: "세계 주요 법률 디렉토리에서 인정받음", successCasesTitle: "성공 사례", successCasesSubtitle: "대표 사례", errorMessage: "업무 분야를 찾을 수 없습니다", overview: "개요", featured: "추천", client: "의뢰인:" },
    ja: { backToAll: "取扱分野に戻る", contactCta: "チームにお問い合わせ", contactSubtitle: "経験豊富な弁護士が法的課題の解決をお手伝いします。", emailUs: "メールを送る", callUs: "電話する", ourTeam: "私たちのチーム", partners: "パートナー", ofCounsel: "オブカウンセル", associates: "アソシエイト", viewAll: "すべて表示", rankingsTitle: "ランキングと評価", rankingsSubtitle: "世界の主要な法律ディレクトリで評価されています", successCasesTitle: "成功事例", successCasesSubtitle: "代表的な案件", errorMessage: "取扱分野が見つかりません", overview: "概要", featured: "注目", client: "クライアント：" },
    ar: { backToAll: "العودة إلى مجالات الممارسة", contactCta: "تواصل مع فريقنا", contactSubtitle: "دع محامينا ذوي الخبرة يساعدونك في تحدياتك القانونية.", emailUs: "راسلنا", callUs: "اتصل بنا", ourTeam: "فريقنا", partners: "الشركاء", ofCounsel: "مستشار قانوني", associates: "محامون مساعدون", viewAll: "عرض الكل", rankingsTitle: "التصنيفات والاعتراف", rankingsSubtitle: "معترف بها من قبل أبرز الدلائل القانونية في العالم", successCasesTitle: "قضايا ناجحة", successCasesSubtitle: "قضايا تمثيلية", errorMessage: "مجال الممارسة غير موجود", overview: "نظرة عامة", featured: "مميز", client: "العميل:" },
    ru: { backToAll: "Назад к практикам", contactCta: "Связаться с командой", contactSubtitle: "Позвольте нашим опытным юристам помочь вам с вашими правовыми вопросами.", emailUs: "Написать", callUs: "Позвонить", ourTeam: "Наша команда", partners: "Партнёры", ofCounsel: "Of Counsel", associates: "Ассоциаты", viewAll: "Показать все", rankingsTitle: "Рейтинги и признание", rankingsSubtitle: "Признаны ведущими юридическими справочниками мира", successCasesTitle: "Успешные дела", successCasesSubtitle: "Показательные дела", errorMessage: "Практика не найдена", overview: "Обзор", featured: "Рекомендовано", client: "Клиент:" },
    fr: { backToAll: "Retour aux domaines de pratique", contactCta: "Contactez notre équipe", contactSubtitle: "Laissez nos avocats expérimentés vous aider dans vos défis juridiques.", emailUs: "Envoyer un email", callUs: "Appeler", ourTeam: "Notre équipe", partners: "Associés", ofCounsel: "Of Counsel", associates: "Collaborateurs", viewAll: "Voir tout", rankingsTitle: "Classements et reconnaissance", rankingsSubtitle: "Reconnus par les principaux annuaires juridiques mondiaux", successCasesTitle: "Affaires réussies", successCasesSubtitle: "Affaires représentatives", errorMessage: "Domaine de pratique non trouvé", overview: "Aperçu", featured: "En vedette", client: "Client :" },
    it: { backToAll: "Torna alle aree di pratica", contactCta: "Contatta il nostro team", contactSubtitle: "Lascia che i nostri avvocati esperti ti aiutino con le tue sfide legali.", emailUs: "Invia email", callUs: "Chiama", ourTeam: "Il nostro team", partners: "Soci", ofCounsel: "Of Counsel", associates: "Associati", viewAll: "Vedi tutto", rankingsTitle: "Classifiche e riconoscimenti", rankingsSubtitle: "Riconosciuti dalle principali directory legali a livello mondiale", successCasesTitle: "Casi di successo", successCasesSubtitle: "Casi rappresentativi", errorMessage: "Area di pratica non trovata", overview: "Panoramica", featured: "In evidenza", client: "Cliente:" },
  };

  const t = translations[language] || translations.en;

  const filteredAndGroupedMembers = useMemo(() => {
    if (!allTeamMembers || !slug) return { partners: [], ofCounsel: [], associates: [] };

    const roleMatches = practiceAreaRoleMapping[slug] || [];

    const matchingMembers = allTeamMembers.filter((member) =>
      roleMatches.some(
        (role) =>
          member.role.toLowerCase().includes(role.toLowerCase()) ||
          role.toLowerCase().includes(member.role.toLowerCase()),
      ),
    );

    const partners = matchingMembers.filter((m) => m.isPartner);
    const ofCounsel = matchingMembers.filter((m) => m.title === "Of Counsel");
    const associates = matchingMembers.filter((m) => m.title === "Associate");

    return { partners, ofCounsel, associates };
  }, [allTeamMembers, slug]);

  const practiceRankings = slug ? practiceRankingsData[slug] || [] : [];

  /* ── Estados de error / carga ───────────────────────────────────────── */

  if (error) {
    return (
      <div data-testid="page-practice-group-error">
        <div className="vw-wrap py-24 text-center">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-vw-graylight" />
          <h2 className="mb-6 font-serif text-2xl text-vw-black" data-testid="text-error-title">
            {t.errorMessage}
          </h2>
          <Link
            href="/practice-groups"
            className="inline-flex items-center gap-2 vw-label text-xs text-vw-red"
            data-testid="button-back-to-practice-groups"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.backToAll}
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div data-testid="page-practice-group-loading">
        <div className="vw-wrap py-24">
          <div className="mb-6 h-5 w-48 animate-pulse bg-vw-graylight/50" />
          <div className="h-12 w-64 animate-pulse bg-vw-graylight/50" />
          <div className="mt-10 space-y-4">
            <div className="h-6 w-full animate-pulse bg-vw-graylight/40" />
            <div className="h-6 w-3/4 animate-pulse bg-vw-graylight/40" />
            <div className="h-6 w-5/6 animate-pulse bg-vw-graylight/40" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Resolución de nombre/descripción (preservada de la versión previa) ─ */

  const displayName =
    language === "es"
      ? practiceGroup?.nameEs || practiceGroup?.name
      : language === "en"
        ? practiceGroup?.name
        : translatedFields.name || null;

  const displayDescription =
    language === "es"
      ? practiceGroup?.fullDescriptionEs || practiceGroup?.descriptionEs || practiceGroup?.fullDescription || practiceGroup?.description
      : language === "en"
        ? practiceGroup?.fullDescription || practiceGroup?.description
        : translatedFields.fullDescription || translatedFields.description || null;

  const hasTeam =
    filteredAndGroupedMembers.partners.length > 0 ||
    filteredAndGroupedMembers.ofCounsel.length > 0 ||
    filteredAndGroupedMembers.associates.length > 0;

  return (
    <div data-testid="page-practice-group-detail">
      <CapabilityHero
        eyebrow={t.overview}
        title={displayName || practiceGroup?.name || ""}
        backLabel={t.backToAll}
        backHref="/practice-groups"
        trailing={
          isTranslating ? (
            <Loader2 className="h-5 w-5 animate-spin text-vw-gray" aria-hidden="true" />
          ) : undefined
        }
        testId="section-practice-group-hero"
      />

      {displayDescription && (
        <CapabilityProse
          text={displayDescription}
          testId="section-practice-group-description"
        />
      )}

      {representativeMatters && representativeMatters.length > 0 && (
        <RepresentativeMatters
          matters={representativeMatters}
          language={language}
          t={{
            title: t.successCasesTitle,
            subtitle: t.successCasesSubtitle,
            featured: t.featured,
            client: t.client,
          }}
        />
      )}

      {practiceRankings.length > 0 && (
        <CapabilityRankings
          items={practiceRankings}
          language={language}
          title={t.rankingsTitle}
          subtitle={t.rankingsSubtitle}
        />
      )}

      {hasTeam && (
        <RelatedAttorneys
          groups={filteredAndGroupedMembers}
          language={language}
          practiceSlug={slug}
          t={{
            ourTeam: t.ourTeam,
            partners: t.partners,
            ofCounsel: t.ofCounsel,
            associates: t.associates,
            viewAll: t.viewAll,
          }}
        />
      )}

      <CapabilityContactCta
        title={t.contactCta}
        subtitle={t.contactSubtitle}
        emailLabel={t.emailUs}
        callLabel={t.callUs}
      />
    </div>
  );
}
