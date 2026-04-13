import { Link, useParams } from "wouter";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Phone, AlertCircle, Award, Star, Trophy, ChevronRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslatedContent } from "@/hooks/useTranslatedContent";
import { getIcon } from "@/lib/icons";
import { isNativeLanguage } from "@/lib/translationUtils";
import type { PracticeGroup, TeamMember, RepresentativeMatterDb } from "@shared/schema";

interface PracticeRanking {
  publication: string;
  ranking: string;
  rankingEs: string;
  year: string;
  badgeType: "band" | "tier" | "star" | "recommended";
}

const practiceRankingsData: Record<string, PracticeRanking[]> = {
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

interface TranslatedMatterCardProps {
  matter: RepresentativeMatterDb;
  language: string;
  t: {
    featured: string;
    client: string;
  };
}

function TranslatedMatterCard({ matter, language, t }: TranslatedMatterCardProps) {
  const { translatedFields } = useTranslatedContent({
    contentType: 'representative_matter',
    entityId: matter.id.toString(),
    fields: {
      title: matter.title,
      titleEs: matter.titleEs,
      description: matter.description,
      descriptionEs: matter.descriptionEs,
      client: matter.client,
      clientEs: matter.clientEs,
    },
    enabled: !isNativeLanguage(language),
  });

  const displayTitle = translatedFields.title || matter.title;
  const displayDescription = translatedFields.description || matter.description;
  const displayClient = translatedFields.client || matter.client;

  return (
    <Card 
      className={`rounded-none border ${matter.isHighlight ? 'border-primary/30 bg-primary/5 dark:bg-primary/10' : 'border-border bg-card'}`}
      data-testid={`card-matter-${matter.id}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {matter.isHighlight && (
                <Badge className="bg-primary text-white rounded-none text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  {t.featured}
                </Badge>
              )}
              <Badge 
                variant="outline" 
                className="rounded-none text-xs"
                data-testid={`badge-matter-year-${matter.id}`}
              >
                {matter.year}
              </Badge>
            </div>
            <h3 
              className="font-semibold text-foreground text-lg"
              data-testid={`text-matter-title-${matter.id}`}
            >
              {displayTitle}
            </h3>
          </div>
        </div>
        <p 
          className="text-muted-foreground mb-3"
          data-testid={`text-matter-description-${matter.id}`}
        >
          {displayDescription}
        </p>
        {displayClient && (
          <p 
            className="text-sm text-gray-500 dark:text-gray-500"
            data-testid={`text-matter-client-${matter.id}`}
          >
            <span className="font-medium">
              {t.client}{" "}
            </span>
            {displayClient}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

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
    queryKey: ['/api/practice-groups', slug, 'representative-matters'],
    enabled: !!slug,
  });

  const { translatedFields, isTranslating } = useTranslatedContent({
    contentType: 'practice_group',
    entityId: practiceGroup?.id?.toString() || '',
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
    contactUs: string;
    contactCta: string;
    contactSubtitle: string;
    emailUs: string;
    callUs: string;
    ourTeam: string;
    partners: string;
    ofCounsel: string;
    associates: string;
    viewAll: string;
    viewProfile: string;
    rankingsTitle: string;
    rankingsSubtitle: string;
    successCasesTitle: string;
    successCasesSubtitle: string;
    errorMessage: string;
    loading: string;
    overview: string;
    keyContacts: string;
    relatedIndustries: string;
    relatedPractices: string;
    representativeMatters: string;
    featured: string;
    client: string;
  }> = {
    en: {
      backToAll: "All Practice Groups",
      contactUs: "Contact Us",
      contactCta: "Contact our team",
      contactSubtitle: "Let our experienced attorneys help you navigate your legal challenges.",
      emailUs: "Email Us",
      callUs: "Call Us",
      ourTeam: "Our Team",
      partners: "Partners",
      ofCounsel: "Of Counsel",
      associates: "Associates",
      viewAll: "View all",
      viewProfile: "View Profile",
      rankingsTitle: "Rankings & Recognition",
      rankingsSubtitle: "Our practice has been recognized by leading legal directories worldwide.",
      successCasesTitle: "Success Cases",
      successCasesSubtitle: "Representative matters successfully handled by our practice.",
      errorMessage: "Practice group not found",
      loading: "Loading...",
      overview: "Overview",
      keyContacts: "Key Contacts",
      relatedIndustries: "Related Industries",
      relatedPractices: "Related Practice Areas",
      representativeMatters: "Representative Matters",
      featured: "Featured",
      client: "Client:",
    },
    es: {
      backToAll: "Todas las Áreas de Práctica",
      contactUs: "Contáctenos",
      contactCta: "Contacte a nuestro equipo",
      contactSubtitle: "Permita que nuestros abogados experimentados le ayuden a navegar sus desafíos legales.",
      emailUs: "Enviar Email",
      callUs: "Llamar",
      ourTeam: "Nuestro Equipo",
      partners: "Socios",
      ofCounsel: "Of Counsel",
      associates: "Asociados",
      viewAll: "Ver todos",
      viewProfile: "Ver Perfil",
      rankingsTitle: "Rankings y Reconocimientos",
      rankingsSubtitle: "Nuestra práctica ha sido reconocida por los principales directorios legales a nivel mundial.",
      successCasesTitle: "Casos de Éxito",
      successCasesSubtitle: "Casos representativos manejados exitosamente por nuestra práctica.",
      errorMessage: "Área de práctica no encontrada",
      loading: "Cargando...",
      overview: "Resumen",
      keyContacts: "Contactos Clave",
      relatedIndustries: "Industrias Relacionadas",
      relatedPractices: "Áreas de Práctica Relacionadas",
      representativeMatters: "Casos Representativos",
      featured: "Destacado",
      client: "Cliente:",
    },
    de: {
      backToAll: "Zurück zu Praxisbereichen",
      contactUs: "Kontakt",
      contactCta: "Kontaktieren Sie unser Team",
      contactSubtitle: "Lassen Sie unsere erfahrenen Anwälte Ihnen bei Ihren rechtlichen Herausforderungen helfen.",
      emailUs: "E-Mail senden",
      callUs: "Anrufen",
      ourTeam: "Unser Team",
      partners: "Partner",
      ofCounsel: "Of Counsel",
      associates: "Associates",
      viewAll: "Alle anzeigen",
      viewProfile: "Profil anzeigen",
      rankingsTitle: "Rankings & Anerkennung",
      rankingsSubtitle: "Unsere Praxis wurde von führenden Rechtsverzeichnissen weltweit anerkannt.",
      successCasesTitle: "Erfolgsfälle",
      successCasesSubtitle: "Repräsentative Mandate, die von unserer Praxis erfolgreich bearbeitet wurden.",
      errorMessage: "Praxisbereich nicht gefunden",
      loading: "Wird geladen...",
      overview: "Übersicht",
      keyContacts: "Hauptkontakte",
      relatedIndustries: "Verwandte Branchen",
      relatedPractices: "Verwandte Praxisbereiche",
      representativeMatters: "Beispielmandate",
      featured: "Empfohlen",
      client: "Mandant:",
    },
    zh: {
      backToAll: "返回业务领域",
      contactUs: "联系我们",
      contactCta: "联系我们的团队",
      contactSubtitle: "让我们经验丰富的律师帮助您应对法律挑战。",
      emailUs: "发送邮件",
      callUs: "致电",
      ourTeam: "我们的团队",
      partners: "合伙人",
      ofCounsel: "顾问律师",
      associates: "律师助理",
      viewAll: "查看全部",
      viewProfile: "查看简介",
      rankingsTitle: "排名与认可",
      rankingsSubtitle: "我们的业务获得了全球领先法律目录的认可。",
      successCasesTitle: "成功案例",
      successCasesSubtitle: "我们业务成功处理的代表性案件。",
      errorMessage: "未找到业务领域",
      loading: "加载中...",
      overview: "概述",
      keyContacts: "主要联系人",
      relatedIndustries: "相关行业",
      relatedPractices: "相关业务领域",
      representativeMatters: "代表性案例",
      featured: "精选",
      client: "客户：",
    },
    ko: {
      backToAll: "업무 분야로 돌아가기",
      contactUs: "문의하기",
      contactCta: "팀에 연락하기",
      contactSubtitle: "경험 풍부한 변호사가 법적 문제 해결을 도와드립니다.",
      emailUs: "이메일 보내기",
      callUs: "전화하기",
      ourTeam: "우리 팀",
      partners: "파트너",
      ofCounsel: "고문 변호사",
      associates: "어소시에이트",
      viewAll: "모두 보기",
      viewProfile: "프로필 보기",
      rankingsTitle: "순위 및 인정",
      rankingsSubtitle: "세계 주요 법률 디렉토리에서 인정받은 업무 분야입니다.",
      successCasesTitle: "성공 사례",
      successCasesSubtitle: "성공적으로 처리한 대표적인 사건들입니다.",
      errorMessage: "업무 분야를 찾을 수 없습니다",
      loading: "로딩 중...",
      overview: "개요",
      keyContacts: "주요 연락처",
      relatedIndustries: "관련 산업",
      relatedPractices: "관련 업무 분야",
      representativeMatters: "대표 사례",
      featured: "추천",
      client: "의뢰인:",
    },
    ja: {
      backToAll: "取扱分野に戻る",
      contactUs: "お問い合わせ",
      contactCta: "チームにお問い合わせ",
      contactSubtitle: "経験豊富な弁護士が法的課題の解決をお手伝いします。",
      emailUs: "メールを送る",
      callUs: "電話する",
      ourTeam: "私たちのチーム",
      partners: "パートナー",
      ofCounsel: "オブカウンセル",
      associates: "アソシエイト",
      viewAll: "すべて表示",
      viewProfile: "プロフィールを見る",
      rankingsTitle: "ランキングと評価",
      rankingsSubtitle: "当事務所の業務は世界の主要な法律ディレクトリで評価されています。",
      successCasesTitle: "成功事例",
      successCasesSubtitle: "当事務所が成功裏に処理した代表的な案件です。",
      errorMessage: "取扱分野が見つかりません",
      loading: "読み込み中...",
      overview: "概要",
      keyContacts: "主要連絡先",
      relatedIndustries: "関連業界",
      relatedPractices: "関連取扱分野",
      representativeMatters: "代表的な案件",
      featured: "注目",
      client: "クライアント：",
    },
    ar: {
      backToAll: "العودة إلى مجالات الممارسة",
      contactUs: "اتصل بنا",
      contactCta: "تواصل مع فريقنا",
      contactSubtitle: "دع محامينا ذوي الخبرة يساعدونك في تحدياتك القانونية.",
      emailUs: "راسلنا",
      callUs: "اتصل بنا",
      ourTeam: "فريقنا",
      partners: "الشركاء",
      ofCounsel: "مستشار قانوني",
      associates: "محامون مساعدون",
      viewAll: "عرض الكل",
      viewProfile: "عرض الملف الشخصي",
      rankingsTitle: "التصنيفات والاعتراف",
      rankingsSubtitle: "تم الاعتراف بممارستنا من قبل أبرز الدلائل القانونية في العالم.",
      successCasesTitle: "قضايا ناجحة",
      successCasesSubtitle: "قضايا تمثيلية تمت معالجتها بنجاح.",
      errorMessage: "مجال الممارسة غير موجود",
      loading: "جاري التحميل...",
      overview: "نظرة عامة",
      keyContacts: "جهات الاتصال الرئيسية",
      relatedIndustries: "القطاعات ذات الصلة",
      relatedPractices: "مجالات الممارسة ذات الصلة",
      representativeMatters: "قضايا تمثيلية",
      featured: "مميز",
      client: "العميل:",
    },
    ru: {
      backToAll: "Назад к практикам",
      contactUs: "Свяжитесь с нами",
      contactCta: "Связаться с командой",
      contactSubtitle: "Позвольте нашим опытным юристам помочь вам с вашими правовыми вопросами.",
      emailUs: "Написать",
      callUs: "Позвонить",
      ourTeam: "Наша команда",
      partners: "Партнёры",
      ofCounsel: "Of Counsel",
      associates: "Ассоциаты",
      viewAll: "Показать все",
      viewProfile: "Посмотреть профиль",
      rankingsTitle: "Рейтинги и признание",
      rankingsSubtitle: "Наша практика признана ведущими юридическими справочниками мира.",
      successCasesTitle: "Успешные дела",
      successCasesSubtitle: "Показательные дела, успешно проведённые нашей практикой.",
      errorMessage: "Практика не найдена",
      loading: "Загрузка...",
      overview: "Обзор",
      keyContacts: "Ключевые контакты",
      relatedIndustries: "Связанные отрасли",
      relatedPractices: "Связанные практики",
      representativeMatters: "Типичные дела",
      featured: "Рекомендовано",
      client: "Клиент:",
    },
    fr: {
      backToAll: "Retour aux domaines de pratique",
      contactUs: "Contactez-nous",
      contactCta: "Contactez notre équipe",
      contactSubtitle: "Laissez nos avocats expérimentés vous aider dans vos défis juridiques.",
      emailUs: "Envoyer un email",
      callUs: "Appeler",
      ourTeam: "Notre équipe",
      partners: "Associés",
      ofCounsel: "Of Counsel",
      associates: "Collaborateurs",
      viewAll: "Voir tout",
      viewProfile: "Voir le profil",
      rankingsTitle: "Classements et reconnaissance",
      rankingsSubtitle: "Notre pratique a été reconnue par les principaux annuaires juridiques mondiaux.",
      successCasesTitle: "Affaires réussies",
      successCasesSubtitle: "Affaires représentatives traitées avec succès par notre cabinet.",
      errorMessage: "Domaine de pratique non trouvé",
      loading: "Chargement...",
      overview: "Aperçu",
      keyContacts: "Contacts clés",
      relatedIndustries: "Industries connexes",
      relatedPractices: "Domaines de pratique connexes",
      representativeMatters: "Dossiers représentatifs",
      featured: "En vedette",
      client: "Client :",
    },
    it: {
      backToAll: "Torna alle aree di pratica",
      contactUs: "Contattaci",
      contactCta: "Contatta il nostro team",
      contactSubtitle: "Lascia che i nostri avvocati esperti ti aiutino con le tue sfide legali.",
      emailUs: "Invia email",
      callUs: "Chiama",
      ourTeam: "Il nostro team",
      partners: "Soci",
      ofCounsel: "Of Counsel",
      associates: "Associati",
      viewAll: "Vedi tutto",
      viewProfile: "Vedi profilo",
      rankingsTitle: "Classifiche e riconoscimenti",
      rankingsSubtitle: "La nostra pratica è stata riconosciuta dalle principali directory legali a livello mondiale.",
      successCasesTitle: "Casi di successo",
      successCasesSubtitle: "Casi rappresentativi gestiti con successo dalla nostra pratica.",
      errorMessage: "Area di pratica non trovata",
      loading: "Caricamento...",
      overview: "Panoramica",
      keyContacts: "Contatti principali",
      relatedIndustries: "Settori correlati",
      relatedPractices: "Aree di pratica correlate",
      representativeMatters: "Casi rappresentativi",
      featured: "In evidenza",
      client: "Cliente:",
    },
  };

  const t = translations[language] || translations.en;

  const filteredAndGroupedMembers = useMemo(() => {
    if (!allTeamMembers || !slug) return { partners: [], ofCounsel: [], associates: [] };

    const roleMatches = practiceAreaRoleMapping[slug] || [];
    
    const matchingMembers = allTeamMembers.filter(member => {
      return roleMatches.some(role => 
        member.role.toLowerCase().includes(role.toLowerCase()) ||
        role.toLowerCase().includes(member.role.toLowerCase())
      );
    });

    const partners = matchingMembers.filter(m => m.isPartner);
    const ofCounsel = matchingMembers.filter(m => m.title === "Of Counsel");
    const associates = matchingMembers.filter(m => m.title === "Associate");

    return { partners, ofCounsel, associates };
  }, [allTeamMembers, slug]);

  const practiceRankings = slug ? (practiceRankingsData[slug] || []) : [];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const getBadgeStyles = (badgeType: string) => {
    switch (badgeType) {
      case "band":
        return "bg-primary text-white";
      case "tier":
        return "bg-amber-600 text-white";
      case "star":
        return "bg-emerald-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  const getBadgeIcon = (badgeType: string) => {
    switch (badgeType) {
      case "band":
        return <Award className="w-3 h-3 mr-1" />;
      case "tier":
        return <Trophy className="w-3 h-3 mr-1" />;
      case "star":
        return <Star className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background" data-testid="page-practice-group-error">
        <Header />
        <div className="pt-32 pb-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-heading text-foreground mb-4" data-testid="text-error-title">
              {t.errorMessage}
            </h2>
            <Link href="/practice-groups">
              <Button variant="outline" data-testid="button-back-to-practice-groups">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.backToAll}
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" data-testid="page-practice-group-loading">
        <Header />
        <section className="pt-36 pb-20 bg-[#1a1a19]">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <Skeleton className="h-5 w-48 bg-white/10 mb-6" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-none bg-white/10" />
              <Skeleton className="h-12 w-64 bg-white/10" />
            </div>
          </div>
        </section>
        <main id="main-content" className="py-16 lg:py-20">
          <div className="max-w-4xl mx-auto px-6 lg:px-12">
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-6 w-5/6 mb-4" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const IconComponent = practiceGroup ? getIcon(practiceGroup.iconName) : null;
  const displayName = language === 'es' 
    ? (practiceGroup?.nameEs || practiceGroup?.name)
    : language === 'en'
      ? practiceGroup?.name
      : (translatedFields.name || null);
  const displayDescription = language === 'es'
    ? (practiceGroup?.fullDescriptionEs || practiceGroup?.descriptionEs || practiceGroup?.fullDescription || practiceGroup?.description)
    : language === 'en'
      ? (practiceGroup?.fullDescription || practiceGroup?.description)
      : (translatedFields.fullDescription || translatedFields.description || null);

  const MAX_ASSOCIATES_DISPLAY = 6;
  const displayedAssociates = filteredAndGroupedMembers.associates.slice(0, MAX_ASSOCIATES_DISPLAY);
  const hasMoreAssociates = filteredAndGroupedMembers.associates.length > MAX_ASSOCIATES_DISPLAY;

  const renderMemberCard = (member: TeamMember) => (
    <Link key={member.id} href={`/team/${member.slug}`}>
      <Card 
        className="rounded-none border border-border bg-card hover:shadow-md transition-shadow cursor-pointer"
        data-testid={`card-team-member-${member.slug}`}
      >
        <CardContent className="p-4 flex items-center gap-4">
          <Avatar className="w-14 h-14">
            <AvatarImage src={member.imageUrl || undefined} alt={member.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
              {getInitials(member.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 
              className="font-semibold text-foreground truncate"
              data-testid={`text-team-member-name-${member.slug}`}
            >
              {member.name}
            </h3>
            <p 
              className="text-sm text-muted-foreground truncate"
              data-testid={`text-team-member-role-${member.slug}`}
            >
              {language === "es" ? member.roleEs : member.role}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="min-h-screen bg-background" data-testid="page-practice-group-detail">
      <Header />
      
      <section className="pt-36 pb-20 bg-[#1a1a19]" data-testid="section-practice-group-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <Link href="/practice-groups">
              <span 
                className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6 cursor-pointer text-sm"
                data-testid="link-back-to-practice-groups"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.backToAll}
              </span>
            </Link>
            <div className="flex items-center gap-4">
              {IconComponent && (
                <div className="w-16 h-16 rounded-none bg-white/5 flex items-center justify-center">
                  <IconComponent className="w-8 h-8 text-primary" data-testid="icon-practice-group-detail" />
                </div>
              )}
              <h1 
                className="text-2xl md:text-3xl lg:text-4xl font-heading font-light text-white uppercase tracking-[0.15em]"
                data-testid="text-practice-group-title"
              >
                {displayName || (isTranslating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-white/60" />
                  </span>
                ) : practiceGroup?.name)}
                {displayName && isTranslating && (
                  <Loader2 className="inline-block w-5 h-5 ml-3 animate-spin text-white/60" />
                )}
              </h1>
            </div>
          </motion.div>
        </div>
      </section>

      <main id="main-content" className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div 
              className="prose prose-lg dark:prose-invert max-w-none mb-16"
              data-testid="container-practice-group-description"
            >
              {displayDescription ? (
                <p className="text-lg text-foreground leading-relaxed text-justify sm:text-left">
                  {displayDescription}
                </p>
              ) : (practiceGroup?.descriptionEs || practiceGroup?.description) && isTranslating ? (
                <div className="flex items-center gap-2 text-muted-foreground italic">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span data-testid="text-translation-pending">
                    {language === 'de' ? 'Übersetzung lädt...' :
                     language === 'zh' ? '翻译加载中...' :
                     language === 'ko' ? '번역 로딩 중...' :
                     language === 'ja' ? '翻訳を読み込み中...' :
                     language === 'ar' ? 'جاري تحميل الترجمة...' :
                     language === 'ru' ? 'Загрузка перевода...' :
                     language === 'fr' ? 'Traduction en cours...' :
                     language === 'it' ? 'Caricamento traduzione...' :
                     'Loading translation...'}
                  </span>
                </div>
              ) : null}
            </div>
          </motion.div>

          {representativeMatters && representativeMatters.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.22 }}
              className="mb-16"
              data-testid="section-representative-matters"
            >
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-6 h-6 text-primary" />
                <h2 
                  className="text-xl font-heading font-light text-foreground uppercase tracking-[0.12em]"
                  data-testid="text-success-cases-title"
                >
                  {t.successCasesTitle}
                </h2>
              </div>
              <p 
                className="text-muted-foreground mb-6"
                data-testid="text-success-cases-subtitle"
              >
                {t.successCasesSubtitle}
              </p>
              <div className="grid grid-cols-1 gap-4">
                {representativeMatters
                  .sort((a, b) => {
                    if (a.isHighlight && !b.isHighlight) return -1;
                    if (!a.isHighlight && b.isHighlight) return 1;
                    return b.year - a.year;
                  })
                  .map((matter) => (
                    <TranslatedMatterCard 
                      key={matter.id} 
                      matter={matter} 
                      language={language} 
                      t={{ featured: t.featured, client: t.client }} 
                    />
                  ))}
              </div>
            </motion.section>
          )}

          {practiceRankings.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mb-16"
              data-testid="section-rankings"
            >
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-6 h-6 text-primary" />
                <h2 
                  className="text-xl font-heading font-light text-foreground uppercase tracking-[0.12em]"
                  data-testid="text-rankings-title"
                >
                  {t.rankingsTitle}
                </h2>
              </div>
              <p 
                className="text-muted-foreground mb-6"
                data-testid="text-rankings-subtitle"
              >
                {t.rankingsSubtitle}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {practiceRankings.map((ranking, index) => (
                  <Card 
                    key={index}
                    className="rounded-none border border-border bg-card"
                    data-testid={`card-ranking-${index}`}
                  >
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p 
                          className="font-medium text-foreground"
                          data-testid={`text-ranking-publication-${index}`}
                        >
                          {ranking.publication}
                        </p>
                        <p 
                          className="text-sm text-muted-foreground"
                          data-testid={`text-ranking-year-${index}`}
                        >
                          {ranking.year}
                        </p>
                      </div>
                      <Badge 
                        className={`rounded-none text-xs flex items-center ${getBadgeStyles(ranking.badgeType)}`}
                        data-testid={`badge-ranking-${index}`}
                      >
                        {getBadgeIcon(ranking.badgeType)}
                        {language === "es" ? ranking.rankingEs : ranking.ranking}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.section>
          )}

          {(filteredAndGroupedMembers.partners.length > 0 || 
            filteredAndGroupedMembers.ofCounsel.length > 0 || 
            filteredAndGroupedMembers.associates.length > 0) && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-16"
              data-testid="section-team-members"
            >
              <h2 
                className="text-xl font-heading font-light text-foreground mb-8 uppercase tracking-[0.12em]"
                data-testid="text-our-team-title"
              >
                {t.ourTeam}
              </h2>

              {filteredAndGroupedMembers.partners.length > 0 && (
                <div className="mb-8" data-testid="section-partners">
                  <h3 
                    className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"
                    data-testid="text-partners-title"
                  >
                    <Badge className="bg-primary text-white rounded-none text-xs">
                      {filteredAndGroupedMembers.partners.length}
                    </Badge>
                    {t.partners}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredAndGroupedMembers.partners.map(renderMemberCard)}
                  </div>
                </div>
              )}

              {filteredAndGroupedMembers.ofCounsel.length > 0 && (
                <div className="mb-8" data-testid="section-of-counsel">
                  <h3 
                    className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"
                    data-testid="text-of-counsel-title"
                  >
                    <Badge className="bg-amber-600 text-white rounded-none text-xs">
                      {filteredAndGroupedMembers.ofCounsel.length}
                    </Badge>
                    {t.ofCounsel}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredAndGroupedMembers.ofCounsel.map(renderMemberCard)}
                  </div>
                </div>
              )}

              {displayedAssociates.length > 0 && (
                <div data-testid="section-associates">
                  <h3 
                    className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"
                    data-testid="text-associates-title"
                  >
                    <Badge className="bg-gray-600 text-white rounded-none text-xs">
                      {filteredAndGroupedMembers.associates.length}
                    </Badge>
                    {t.associates}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayedAssociates.map(renderMemberCard)}
                  </div>
                  {hasMoreAssociates && (
                    <div className="mt-4 text-center">
                      <Link href={`/team?practice=${slug}`}>
                        <Button 
                          variant="outline" 
                          className="rounded-none gap-2"
                          data-testid="button-view-all-associates"
                        >
                          {t.viewAll} ({filteredAndGroupedMembers.associates.length})
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </motion.section>
          )}

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-muted rounded-none p-8 lg:p-12"
            data-testid="section-contact-cta"
          >
            <h2 
              className="text-xl font-heading font-light text-foreground mb-3 uppercase tracking-[0.12em]"
              data-testid="text-contact-cta-title"
            >
              {t.contactCta}
            </h2>
            <p 
              className="text-muted-foreground mb-6"
              data-testid="text-contact-cta-subtitle"
            >
              {t.contactSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/contact">
                <Button 
                  className="rounded-none"
                  data-testid="button-email-us"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {t.emailUs}
                </Button>
              </Link>
              <Button 
                variant="outline"
                className="rounded-none"
                data-testid="button-call-us"
                onClick={() => window.location.href = "tel:+525552581000"}
              >
                <Phone className="w-4 h-4 mr-2" />
                {t.callUs}
              </Button>
            </div>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
