import { Link } from "wouter";
import {
  Award,
  Users,
  Globe2,
  Building2,
  Scale,
  Heart,
  Briefcase,
  ArrowRight,
  Sparkles,
  UserCheck,
  Target,
  TrendingUp,
  Handshake,
  GraduationCap,
  Coffee,
  Lightbulb,
  Shield,
  BarChart3,
  UsersRound,
  HeartHandshake,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  PageHero,
  Section,
  SectionTitle,
  Label,
  FeatureCard,
  StatBlock,
} from "@/components/firm";
import type { TeamMember, PracticeGroup, IndustryGroup, LanguageCode } from "@shared/schema";
import logoHD from "@assets/vonwobeser_logo_2025_full.png";

export default function About() {
  const { language } = useLanguage();

  const { data: teamMembers } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
  });

  const { data: practiceGroups } = useQuery<PracticeGroup[]>({
    queryKey: ["/api/practice-groups"],
  });

  const { data: industryGroups } = useQuery<IndustryGroup[]>({
    queryKey: ["/api/industry-groups"],
  });

  const content: Record<LanguageCode, {
    title: string;
    subtitle: string;
    historyTitle: string;
    historyText1: string;
    historyText2: string;
    valuesTitle: string;
    values: { icon: typeof Scale; title: string; text: string }[];
    cultureTitle: string;
    cultureSubtitle: string;
    cultureIntro: string;
    cultureAspects: { icon: typeof Building2; title: string; text: string }[];
    diversityTitle: string;
    diversitySubtitle: string;
    diversityIntro: string;
    diversityStats: { value: string; label: string; icon: typeof UsersRound }[];
    diversityInitiatives: { icon: typeof UserCheck; title: string; text: string }[];
    diversityCommitment: string;
    statsTitle: string;
    stats: { value: string; label: string }[];
    rankingsTitle: string;
    rankingsText: string;
    rankings: string[];
    proBonoTitle: string;
    proBonoText: string;
    careersTitle: string;
    careersText: string;
    learnMore: string;
    viewTeam: string;
    viewPractices: string;
  }> = {
    en: {
      title: "About the Firm",
      subtitle: "Over 70 years of excellence in legal services in Mexico",
      historyTitle: "Our History",
      historyText1: "Founded in 1952, Von Wobeser y Sierra is one of Mexico's most prestigious and recognized law firms. For more than seven decades, we have provided top-tier legal services to national and international clients across a wide range of industries.",
      historyText2: "Our firm has grown to become a leader in the Mexican legal market, consistently ranked among the top law firms in the country by Chambers and Partners, Legal 500, and Latin Lawyer 250.",
      valuesTitle: "Our Values",
      values: [
        { icon: Scale, title: "Excellence", text: "We are committed to delivering the highest quality legal services" },
        { icon: Heart, title: "Integrity", text: "Ethical conduct and transparency guide all our actions" },
        { icon: Users, title: "Collaboration", text: "We work as one team to achieve the best results for our clients" },
        { icon: Globe2, title: "Innovation", text: "We embrace new technologies and approaches to serve our clients better" },
      ],
      cultureTitle: "Our Culture",
      cultureSubtitle: "A workplace where talent thrives and excellence is the standard",
      cultureIntro: "At Von Wobeser y Sierra, we have cultivated a unique culture that blends professional rigor with a supportive and collaborative environment. Our attorneys work alongside some of the most talented legal professionals in Mexico, fostering an atmosphere of continuous learning and mutual respect.",
      cultureAspects: [
        { 
          icon: Building2, 
          title: "Modern Work Environment", 
          text: "State-of-the-art facilities designed to promote collaboration, creativity, and well-being. Our offices feature open spaces, meeting rooms with cutting-edge technology, and areas for relaxation and informal gatherings."
        },
        { 
          icon: Handshake, 
          title: "Team Collaboration", 
          text: "We believe the best legal solutions come from diverse perspectives. Our practice groups work seamlessly together, combining specialized expertise to deliver comprehensive counsel to our clients."
        },
        { 
          icon: GraduationCap, 
          title: "Professional Development", 
          text: "Continuous education is fundamental to our firm. We invest in training programs, mentorship opportunities, and support for advanced degrees and certifications to help our attorneys reach their full potential."
        },
        { 
          icon: HeartHandshake, 
          title: "Community Involvement", 
          text: "We are committed to giving back. Through pro bono work, partnerships with NGOs, and support for legal education initiatives, we strive to make a positive impact beyond our practice."
        },
        { 
          icon: Coffee, 
          title: "Work-Life Balance", 
          text: "We recognize that sustainable success requires balance. Our firm promotes flexible arrangements and wellness initiatives to support our team members both professionally and personally."
        },
        { 
          icon: Lightbulb, 
          title: "Innovation Mindset", 
          text: "We encourage creative thinking and embrace technology to deliver more efficient and effective legal services. Our culture rewards initiative and values new ideas from every level of the organization."
        },
      ],
      diversityTitle: "Diversity & Inclusion",
      diversitySubtitle: "Building a more inclusive legal profession",
      diversityIntro: "Von Wobeser y Sierra is committed to fostering a diverse and inclusive workplace where every individual is valued, respected, and empowered to succeed. We believe that diversity of thought, background, and experience strengthens our firm and enhances the quality of service we provide to our clients.",
      diversityStats: [
        { value: "45%", label: "Women in the Firm", icon: UsersRound },
        { value: "35%", label: "Women Partners", icon: TrendingUp },
        { value: "50%", label: "Women in Leadership Roles", icon: Target },
        { value: "100%", label: "Equal Opportunity Commitment", icon: Shield },
      ],
      diversityInitiatives: [
        { 
          icon: UserCheck, 
          title: "Inclusive Hiring", 
          text: "Our recruitment practices are designed to attract and evaluate candidates based solely on their skills, experience, and potential, ensuring equal opportunities for all regardless of gender, background, or personal circumstances."
        },
        { 
          icon: BarChart3, 
          title: "Gender Equality", 
          text: "We actively promote gender equality at all levels of the organization. Our programs support the advancement of women in leadership positions and ensure equitable compensation and growth opportunities."
        },
        { 
          icon: Sparkles, 
          title: "Equal Opportunities", 
          text: "Every team member has access to the same development resources, challenging assignments, and career advancement paths. We are committed to removing barriers and creating pathways for success for all."
        },
        { 
          icon: Shield, 
          title: "Inclusive Workplace", 
          text: "We foster an environment where differences are celebrated and all voices are heard. Our policies and practices ensure that every individual feels safe, respected, and able to bring their authentic self to work."
        },
      ],
      diversityCommitment: "Our commitment to diversity and inclusion is not just a policy—it's a core value that shapes how we work, grow, and serve our clients. We continuously evaluate and improve our practices to ensure we remain at the forefront of creating a more equitable legal profession.",
      statsTitle: "Our Firm in Numbers",
      stats: [
        { value: "70+", label: "Years of Experience" },
        { value: String(teamMembers?.length || 70), label: "Attorneys" },
        { value: String(practiceGroups?.length || 18), label: "Practice Areas" },
        { value: String(industryGroups?.length || 7), label: "Industry Groups" },
      ],
      rankingsTitle: "Rankings & Recognition",
      rankingsText: "Von Wobeser y Sierra is consistently recognized as one of the leading law firms in Mexico by the most prestigious legal directories worldwide.",
      rankings: [
        "Chambers and Partners Global - Band 1",
        "Chambers and Partners Latin America - Band 1",
        "Legal 500 Latin America - Tier 1",
        "Latin Lawyer 250 - Elite",
        "IFLR1000 - Tier 1",
        "Global Investigations Review 100",
      ],
      proBonoTitle: "Pro Bono",
      proBonoText: "We are deeply committed to providing pro bono legal services to those in need. Our attorneys dedicate significant time to supporting charitable organizations, human rights causes, and access to justice initiatives.",
      careersTitle: "Careers",
      careersText: "Join one of Mexico's leading law firms and build your career with the best. We offer exceptional opportunities for growth and development.",
      learnMore: "Learn More",
      viewTeam: "View Our Team",
      viewPractices: "View Practice Areas",
    },
    es: {
      title: "Acerca de la Firma",
      subtitle: "Más de 70 años de excelencia en servicios legales en México",
      historyTitle: "Nuestra Historia",
      historyText1: "Fundado en 1952, Von Wobeser y Sierra es uno de los despachos de abogados más prestigiosos y reconocidos de México. Durante más de siete décadas, hemos brindado servicios legales de primer nivel a clientes nacionales e internacionales en una amplia gama de industrias.",
      historyText2: "Nuestra firma ha crecido hasta convertirse en líder en el mercado legal mexicano, consistentemente clasificada entre los principales despachos de abogados del país por Chambers and Partners, Legal 500 y Latin Lawyer 250.",
      valuesTitle: "Nuestros Valores",
      values: [
        { icon: Scale, title: "Excelencia", text: "Estamos comprometidos a brindar servicios legales de la más alta calidad" },
        { icon: Heart, title: "Integridad", text: "La conducta ética y la transparencia guían todas nuestras acciones" },
        { icon: Users, title: "Colaboración", text: "Trabajamos en equipo para lograr los mejores resultados para nuestros clientes" },
        { icon: Globe2, title: "Innovación", text: "Adoptamos nuevas tecnologías y enfoques para servir mejor a nuestros clientes" },
      ],
      cultureTitle: "Nuestra Cultura",
      cultureSubtitle: "Un lugar de trabajo donde el talento prospera y la excelencia es el estándar",
      cultureIntro: "En Von Wobeser y Sierra, hemos cultivado una cultura única que combina el rigor profesional con un ambiente de apoyo y colaboración. Nuestros abogados trabajan junto a algunos de los profesionales legales más talentosos de México, fomentando una atmósfera de aprendizaje continuo y respeto mutuo.",
      cultureAspects: [
        { 
          icon: Building2, 
          title: "Ambiente de Trabajo Moderno", 
          text: "Instalaciones de vanguardia diseñadas para promover la colaboración, la creatividad y el bienestar. Nuestras oficinas cuentan con espacios abiertos, salas de reuniones con tecnología de punta y áreas para relajación y reuniones informales."
        },
        { 
          icon: Handshake, 
          title: "Colaboración en Equipo", 
          text: "Creemos que las mejores soluciones legales provienen de perspectivas diversas. Nuestros grupos de práctica trabajan de manera integrada, combinando experiencia especializada para brindar asesoría integral a nuestros clientes."
        },
        { 
          icon: GraduationCap, 
          title: "Desarrollo Profesional", 
          text: "La educación continua es fundamental para nuestra firma. Invertimos en programas de capacitación, oportunidades de mentoría y apoyo para estudios avanzados y certificaciones para ayudar a nuestros abogados a alcanzar su máximo potencial."
        },
        { 
          icon: HeartHandshake, 
          title: "Participación Comunitaria", 
          text: "Estamos comprometidos con retribuir a la sociedad. A través del trabajo pro bono, asociaciones con ONGs y apoyo a iniciativas de educación legal, nos esforzamos por generar un impacto positivo más allá de nuestra práctica."
        },
        { 
          icon: Coffee, 
          title: "Equilibrio Vida-Trabajo", 
          text: "Reconocemos que el éxito sostenible requiere equilibrio. Nuestra firma promueve arreglos flexibles e iniciativas de bienestar para apoyar a los miembros de nuestro equipo tanto profesional como personalmente."
        },
        { 
          icon: Lightbulb, 
          title: "Mentalidad de Innovación", 
          text: "Fomentamos el pensamiento creativo y adoptamos tecnología para brindar servicios legales más eficientes y efectivos. Nuestra cultura recompensa la iniciativa y valora las nuevas ideas de todos los niveles de la organización."
        },
      ],
      diversityTitle: "Diversidad e Inclusión",
      diversitySubtitle: "Construyendo una profesión legal más inclusiva",
      diversityIntro: "Von Wobeser y Sierra está comprometido con fomentar un lugar de trabajo diverso e inclusivo donde cada individuo sea valorado, respetado y empoderado para triunfar. Creemos que la diversidad de pensamiento, antecedentes y experiencia fortalece nuestra firma y mejora la calidad del servicio que brindamos a nuestros clientes.",
      diversityStats: [
        { value: "45%", label: "Mujeres en la Firma", icon: UsersRound },
        { value: "35%", label: "Mujeres Socias", icon: TrendingUp },
        { value: "50%", label: "Mujeres en Roles de Liderazgo", icon: Target },
        { value: "100%", label: "Compromiso con Igualdad de Oportunidades", icon: Shield },
      ],
      diversityInitiatives: [
        { 
          icon: UserCheck, 
          title: "Contratación Inclusiva", 
          text: "Nuestras prácticas de reclutamiento están diseñadas para atraer y evaluar candidatos basándose únicamente en sus habilidades, experiencia y potencial, asegurando igualdad de oportunidades para todos sin importar género, antecedentes o circunstancias personales."
        },
        { 
          icon: BarChart3, 
          title: "Igualdad de Género", 
          text: "Promovemos activamente la igualdad de género en todos los niveles de la organización. Nuestros programas apoyan el avance de mujeres en posiciones de liderazgo y aseguran compensación equitativa y oportunidades de crecimiento."
        },
        { 
          icon: Sparkles, 
          title: "Igualdad de Oportunidades", 
          text: "Cada miembro del equipo tiene acceso a los mismos recursos de desarrollo, asignaciones desafiantes y caminos de avance profesional. Estamos comprometidos a remover barreras y crear caminos hacia el éxito para todos."
        },
        { 
          icon: Shield, 
          title: "Ambiente Inclusivo", 
          text: "Fomentamos un entorno donde las diferencias se celebran y todas las voces son escuchadas. Nuestras políticas y prácticas aseguran que cada individuo se sienta seguro, respetado y capaz de ser auténtico en el trabajo."
        },
      ],
      diversityCommitment: "Nuestro compromiso con la diversidad e inclusión no es solo una política—es un valor fundamental que moldea cómo trabajamos, crecemos y servimos a nuestros clientes. Continuamente evaluamos y mejoramos nuestras prácticas para asegurar que estemos a la vanguardia en la creación de una profesión legal más equitativa.",
      statsTitle: "Nuestra Firma en Números",
      stats: [
        { value: "70+", label: "Años de Experiencia" },
        { value: String(teamMembers?.length || 70), label: "Abogados" },
        { value: String(practiceGroups?.length || 18), label: "Áreas de Práctica" },
        { value: String(industryGroups?.length || 7), label: "Grupos Industriales" },
      ],
      rankingsTitle: "Rankings y Reconocimientos",
      rankingsText: "Von Wobeser y Sierra es consistentemente reconocido como uno de los principales despachos de abogados en México por los directorios legales más prestigiosos del mundo.",
      rankings: [
        "Chambers and Partners Global - Banda 1",
        "Chambers and Partners Latin America - Banda 1",
        "Legal 500 Latin America - Nivel 1",
        "Latin Lawyer 250 - Elite",
        "IFLR1000 - Nivel 1",
        "Global Investigations Review 100",
      ],
      proBonoTitle: "Pro Bono",
      proBonoText: "Estamos profundamente comprometidos con brindar servicios legales pro bono a quienes más lo necesitan. Nuestros abogados dedican tiempo significativo a apoyar organizaciones benéficas, causas de derechos humanos e iniciativas de acceso a la justicia.",
      careersTitle: "Carreras",
      careersText: "Únase a uno de los principales despachos de abogados de México y construya su carrera con los mejores. Ofrecemos oportunidades excepcionales de crecimiento y desarrollo.",
      learnMore: "Conocer Más",
      viewTeam: "Ver Nuestro Equipo",
      viewPractices: "Ver Áreas de Práctica",
    },
  };

  const t = content[language] || content.en;

  return (
    <div data-testid="page-about" className="vw-old">
      <SEOHead page="about" language={language} />

      <PageHero
        eyebrow="Von Wobeser y Sierra"
        title={t.title}
        subtitle={t.subtitle}
        data-testid="section-about-hero"
      />

      {/* Historia */}
      <Section tone="white" data-testid="section-history">
        <SectionTitle>{t.historyTitle}</SectionTitle>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <p className="font-sans text-lg leading-relaxed text-vw-gray">{t.historyText1}</p>
          <p className="font-sans text-lg leading-relaxed text-vw-gray">{t.historyText2}</p>
        </div>
      </Section>

      {/* Valores */}
      <Section tone="gray" data-testid="section-values">
        <SectionTitle>{t.valuesTitle}</SectionTitle>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {t.values.map((value, index) => (
            <FeatureCard
              key={index}
              icon={value.icon}
              title={value.title}
              data-testid={`card-value-${index}`}
            >
              {value.text}
            </FeatureCard>
          ))}
        </div>
      </Section>

      {/* Cultura */}
      <Section tone="white" data-testid="section-culture">
        <Label>{t.cultureSubtitle}</Label>
        <SectionTitle className="mt-3">{t.cultureTitle}</SectionTitle>
        <p className="mb-10 max-w-4xl font-sans text-lg leading-relaxed text-vw-gray" data-testid="text-culture-intro">
          {t.cultureIntro}
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {t.cultureAspects.map((aspect, index) => (
            <FeatureCard
              key={index}
              icon={aspect.icon}
              title={aspect.title}
              data-testid={`card-culture-${index}`}
            >
              {aspect.text}
            </FeatureCard>
          ))}
        </div>
      </Section>

      {/* Diversidad e inclusión */}
      <Section tone="gray" data-testid="section-diversity">
        <div className="mb-3 flex items-center gap-3">
          <UsersRound className="h-7 w-7 text-vw-red" aria-hidden="true" />
          <Label className="mb-0">{t.diversitySubtitle}</Label>
        </div>
        <SectionTitle data-testid="text-diversity-title">{t.diversityTitle}</SectionTitle>
        <p className="mb-12 max-w-4xl font-sans text-lg leading-relaxed text-vw-gray" data-testid="text-diversity-intro">
          {t.diversityIntro}
        </p>

        <div className="mb-12 grid grid-cols-2 gap-8 border-y border-vw-graylight py-10 lg:grid-cols-4">
          {t.diversityStats.map((stat, index) => (
            <StatBlock
              key={index}
              value={stat.value}
              label={stat.label}
              data-testid={`stat-diversity-${index}`}
            />
          ))}
        </div>

        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {t.diversityInitiatives.map((initiative, index) => (
            <FeatureCard
              key={index}
              icon={initiative.icon}
              title={initiative.title}
              data-testid={`card-diversity-initiative-${index}`}
            >
              {initiative.text}
            </FeatureCard>
          ))}
        </div>

        <p className="max-w-3xl font-sans text-base leading-relaxed text-vw-gray" data-testid="text-diversity-commitment">
          {t.diversityCommitment}
        </p>
      </Section>

      {/* La firma en números */}
      <section className="bg-vw-gray py-16 md:py-20" data-testid="section-stats">
        <div className="vw-wrap">
          <h2 className="mb-10 text-center font-serif text-3xl text-white md:text-4xl">
            {t.statsTitle}
          </h2>
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {t.stats.map((stat, index) => (
              <div key={index} className="text-center" data-testid={`stat-${index}`}>
                <div className="font-serif text-4xl leading-none text-white md:text-5xl">
                  {stat.value}
                </div>
                <div className="vw-label mt-3 text-[11px] text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rankings */}
      <Section tone="white" data-testid="section-rankings">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <Award className="h-7 w-7 text-vw-red" aria-hidden="true" />
              <Label className="mb-0">{t.rankingsTitle}</Label>
            </div>
            <SectionTitle>{t.rankingsTitle}</SectionTitle>
            <p className="mb-6 font-sans text-lg leading-relaxed text-vw-gray">{t.rankingsText}</p>
            <ul className="space-y-3">
              {t.rankings.map((ranking, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3 font-sans text-vw-black"
                  data-testid={`text-ranking-${index}`}
                >
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-vw-red" aria-hidden="true" />
                  {ranking}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-center">
            <img
              src={logoHD}
              alt="Von Wobeser y Sierra"
              width={318}
              height={70}
              className="h-auto max-w-full"
              data-testid="img-rankings"
            />
          </div>
        </div>
      </Section>

      {/* Pro Bono + Carreras */}
      <Section tone="gray" data-testid="section-firm-cta">
        <div className="mb-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="border border-vw-graylight bg-white p-8" data-testid="section-pro-bono">
            <div className="mb-4 flex items-center gap-3">
              <Heart className="h-7 w-7 text-vw-red" aria-hidden="true" />
              <h3 className="font-serif text-2xl text-vw-black">{t.proBonoTitle}</h3>
            </div>
            <p className="font-sans leading-relaxed text-vw-gray" data-testid="text-pro-bono">
              {t.proBonoText}
            </p>
          </div>
          <div className="bg-vw-black p-8" data-testid="section-careers">
            <div className="mb-4 flex items-center gap-3">
              <Briefcase className="h-7 w-7 text-vw-red" aria-hidden="true" />
              <h3 className="font-serif text-2xl text-white">{t.careersTitle}</h3>
            </div>
            <p className="mb-6 font-sans leading-relaxed text-white/70" data-testid="text-careers">
              {t.careersText}
            </p>
            <a
              href="mailto:carreras@vonwobeser.com"
              className="vw-label inline-flex items-center gap-2 text-xs text-white transition-colors hover:text-vw-red"
              data-testid="button-careers"
            >
              {t.learnMore}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/team"
            className="vw-label inline-flex items-center justify-center gap-2 rounded-none bg-vw-red px-8 py-3.5 text-xs text-white transition-colors hover:bg-vw-black"
            data-testid="button-view-team"
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            {t.viewTeam}
          </Link>
          <Link
            href="/practice-groups"
            className="vw-label inline-flex items-center justify-center gap-2 rounded-none border border-vw-gray px-8 py-3.5 text-xs text-vw-black transition-colors hover:border-vw-red hover:text-vw-red"
            data-testid="button-view-practices"
          >
            <Briefcase className="h-4 w-4" aria-hidden="true" />
            {t.viewPractices}
          </Link>
        </div>
      </Section>
    </div>
  );
}
