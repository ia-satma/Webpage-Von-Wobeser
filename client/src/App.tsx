import { Switch, Route, useLocation, Redirect } from "wouter";
import { useEffect, lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { applyBrowserFavicon, loadBrowserFavicon } from "@/lib/browserIdentity";

function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location]);
  
  return null;
}

function BrowserIdentity() {
  useEffect(() => {
    loadBrowserFavicon().catch(() => undefined);
    const update = (event: Event) => {
      const favicon = (event as CustomEvent<string>).detail;
      if (typeof favicon === "string") applyBrowserFavicon(favicon);
    };
    window.addEventListener("vwb:favicon-change", update);
    return () => window.removeEventListener("vwb:favicon-change", update);
  }, []);
  return null;
}

// NOTE: The public site is served by the mirror frontend (Express, server/mirror).
// This React app is the ADMIN PANEL ONLY. Public redesign pages were removed.
const NotFound = lazy(() => import("@/pages/not-found"));

const AdminLogin = lazy(() => import("@/pages/admin/AdminLogin"));
const AdminChangePassword = lazy(() => import("@/pages/admin/AdminChangePassword"));
const AdminSiteConfig = lazy(() => import("@/pages/admin/AdminSiteConfig"));
const AdminNavigation = lazy(() => import("@/pages/admin/AdminNavigation"));
const AdminRecognitions = lazy(() => import("@/pages/admin/AdminRecognitions"));
const AdminTestimonials = lazy(() => import("@/pages/admin/AdminTestimonials"));
const AdminNewsletter = lazy(() => import("@/pages/admin/AdminNewsletter"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminNews = lazy(() => import("@/pages/admin/AdminNews"));
const AdminNewsForm = lazy(() => import("@/pages/admin/AdminNewsForm"));
const AdminNewsAuthorReview = lazy(() => import("@/pages/admin/AdminNewsAuthorReview"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminSubmissions = lazy(() => import("@/pages/admin/AdminSubmissions"));
const AdminAgents = lazy(() => import("@/pages/AdminAgents"));
const AdminArticleProcessing = lazy(() => import("@/pages/admin/AdminArticleProcessing"));
const AdminAudits = lazy(() => import("@/pages/admin/AdminAudits"));
const AdminTeam = lazy(() => import("@/pages/admin/AdminTeam"));
const AdminTeamForm = lazy(() => import("@/pages/admin/AdminTeamForm"));
const AdminGuide = lazy(() => import("@/pages/admin/AdminGuide"));
const AdminPerformance = lazy(() => import("@/pages/admin/AdminPerformance"));
const AdminPracticeGroups = lazy(() => import("@/pages/admin/AdminPracticeGroups"));
const AdminIndustryGroups = lazy(() => import("@/pages/admin/AdminIndustryGroups"));
const AdminKnowledge = lazy(() => import("@/pages/admin/AdminKnowledge"));
const AdminTranslations = lazy(() => import("@/pages/admin/AdminTranslations"));
const AdminEvents = lazy(() => import("@/pages/admin/AdminEvents"));
const AdminAlliances = lazy(() => import("@/pages/admin/AdminAlliances"));
const AdminOpenings = lazy(() => import("@/pages/admin/AdminOpenings"));
const AdminHealthCheck = lazy(() => import("@/pages/admin/AdminHealthCheck"));
const SystemExplorer = lazy(() => import("@/pages/admin/SystemExplorer"));
const AdminArticleDetail = lazy(() => import("@/pages/admin/AdminArticleDetail"));
const AdminOffices = lazy(() => import("@/pages/admin/AdminOffices"));
const AdminGeneratedImages = lazy(() => import("@/pages/admin/AdminGeneratedImages"));
const AdminGeneratedAudio = lazy(() => import("@/pages/admin/AdminGeneratedAudio"));
const AdminCopyHistory = lazy(() => import("@/pages/admin/AdminCopyHistory"));
const AdminPresentations = lazy(() => import("@/pages/admin/AdminPresentations"));
const AdminManual = lazy(() => import("@/pages/admin/AdminManual"));
const AdminCookieConsent = lazy(() => import("@/pages/admin/AdminCookieConsent"));
const AdminComingSoon = lazy(() => import("@/pages/admin/AdminComingSoon"));

function SkipLinks() {
  const { language } = useLanguage();
  
  const labels = {
    en: {
      skipToMain: "Skip to main content",
      skipToNav: "Skip to navigation",
    },
    es: {
      skipToMain: "Saltar al contenido principal",
      skipToNav: "Saltar a la navegación",
    },
    de: {
      skipToMain: "Zum Hauptinhalt springen",
      skipToNav: "Zur Navigation springen",
    },
    zh: {
      skipToMain: "跳至主要内容",
      skipToNav: "跳至导航",
    },
    ko: {
      skipToMain: "주요 콘텐츠로 건너뛰기",
      skipToNav: "탐색으로 건너뛰기",
    },
    ja: {
      skipToMain: "メインコンテンツにスキップ",
      skipToNav: "ナビゲーションにスキップ",
    },
    ar: {
      skipToMain: "انتقل إلى المحتوى الرئيسي",
      skipToNav: "انتقل إلى التنقل",
    },
    ru: {
      skipToMain: "Перейти к основному содержанию",
      skipToNav: "Перейти к навигации",
    },
    fr: {
      skipToMain: "Aller au contenu principal",
      skipToNav: "Aller à la navigation",
    },
    it: {
      skipToMain: "Vai al contenuto principale",
      skipToNav: "Vai alla navigazione",
    },
  };
  
  const t = labels[language as keyof typeof labels] || labels.en;
  
  return (
    <div className="skip-links">
      <a
        href="#main-content"
        className="skip-link"
        data-testid="link-skip-to-main"
      >
        {t.skipToMain}
      </a>
      <a
        href="#main-navigation"
        className="skip-link"
        data-testid="link-skip-to-nav"
      >
        {t.skipToNav}
      </a>
    </div>
  );
}

function Router() {
  const [routerLocation] = useLocation();
  // El shell del admin (barra superior) envuelve todas las páginas /admin excepto el login.
  const isAdminShell = routerLocation.startsWith("/admin")
    && routerLocation !== "/admin/login"
    && routerLocation !== "/admin/change-password";
  const routes = (
    <Switch>
      {/* Root of the React app → admin (public site lives in the mirror). */}
        <Route path="/"><Redirect to="/admin/login" /></Route>
        {/* /admin exacto no tenía ruta y caía en NotFound (404). Redirige al dashboard. */}
        <Route path="/admin"><Redirect to="/admin/dashboard" /></Route>
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/change-password" component={AdminChangePassword} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/manual" component={AdminManual} />
        <Route path="/admin/coming-soon/:key" component={AdminComingSoon} />
        <Route path="/admin/site-config" component={AdminSiteConfig} />
        <Route path="/admin/site-config/:section" component={AdminSiteConfig} />
        <Route path="/admin/navigation" component={AdminNavigation} />
        <Route path="/admin/cookie-consent" component={AdminCookieConsent} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/submissions" component={AdminSubmissions} />
        <Route path="/admin/recognitions" component={AdminRecognitions} />
        <Route path="/admin/testimonials" component={AdminTestimonials} />
        <Route path="/admin/newsletter" component={AdminNewsletter} />
        <Route path="/admin/news" component={AdminNews} />
        <Route path="/admin/news/authors-review" component={AdminNewsAuthorReview} />
        <Route path="/admin/news/new" component={AdminNewsForm} />
        <Route path="/admin/news/:id/edit" component={AdminNewsForm} />
        <Route path="/admin/news/:id" component={AdminArticleDetail} />
        <Route path="/admin/agents" component={AdminAgents} />
        <Route path="/admin/processing" component={AdminArticleProcessing} />
        <Route path="/admin/audits" component={AdminAudits} />
        <Route path="/admin/team" component={AdminTeam} />
        <Route path="/admin/team/new" component={AdminTeamForm} />
        <Route path="/admin/team/:id/edit" component={AdminTeamForm} />
        <Route path="/admin/guide" component={AdminGuide} />
        <Route path="/admin/performance" component={AdminPerformance} />
        <Route path="/admin/practice-groups" component={AdminPracticeGroups} />
        <Route path="/admin/industry-groups" component={AdminIndustryGroups} />
        <Route path="/admin/knowledge" component={AdminKnowledge} />
        <Route path="/admin/translations" component={AdminTranslations} />
        <Route path="/admin/events" component={AdminEvents} />
        <Route path="/admin/alliances" component={AdminAlliances} />
        <Route path="/admin/openings" component={AdminOpenings} />
        <Route path="/admin/health-check" component={AdminHealthCheck} />
        <Route path="/admin/explorer" component={SystemExplorer} />
        <Route path="/admin/offices" component={AdminOffices} />
        <Route path="/admin/gallery"><Redirect to="/admin/offices?tab=gallery" /></Route>
        <Route path="/admin/generated-images" component={AdminGeneratedImages} />
        <Route path="/admin/generated-audio" component={AdminGeneratedAudio} />
        <Route path="/admin/copies-ai" component={AdminCopyHistory} />
        <Route path="/admin/presentations" component={AdminPresentations} />
        <Route component={NotFound} />
      </Switch>
  );
  return (
    <Suspense fallback={null}>
      {isAdminShell ? <AdminLayout>{routes}</AdminLayout> : routes}
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <BrowserIdentity />
          <ScrollToTop />
          <SkipLinks />
          <Toaster />
          <Router />
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
