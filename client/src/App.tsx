import { Switch, Route, useLocation, Redirect } from "wouter";
import { useEffect, lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";

function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location]);
  
  return null;
}

// NOTE: The public site is served by the mirror frontend (Express, server/mirror).
// This React app is the ADMIN PANEL ONLY. Public redesign pages were removed.
const NotFound = lazy(() => import("@/pages/not-found"));

const AdminLogin = lazy(() => import("@/pages/admin/AdminLogin"));
const AdminSiteConfig = lazy(() => import("@/pages/admin/AdminSiteConfig"));
const AdminRecognitions = lazy(() => import("@/pages/admin/AdminRecognitions"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminPosts = lazy(() => import("@/pages/admin/AdminPosts"));
const AdminPostForm = lazy(() => import("@/pages/admin/AdminPostForm"));
const AdminCategories = lazy(() => import("@/pages/admin/AdminCategories"));
const AdminNews = lazy(() => import("@/pages/admin/AdminNews"));
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
const AdminHealthCheck = lazy(() => import("@/pages/admin/AdminHealthCheck"));
const SystemExplorer = lazy(() => import("@/pages/admin/SystemExplorer"));
const AdminArticleDetail = lazy(() => import("@/pages/admin/AdminArticleDetail"));
const GalleryAdmin = lazy(() => import("@/pages/admin/GalleryAdmin"));

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
  return (
    <Suspense fallback={null}>
      <Switch>
        {/* Root of the React app → admin (public site lives in the mirror). */}
        <Route path="/"><Redirect to="/admin/login" /></Route>
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/site-config" component={AdminSiteConfig} />
        <Route path="/admin/recognitions" component={AdminRecognitions} />
        <Route path="/admin/posts" component={AdminPosts} />
        <Route path="/admin/posts/new" component={AdminPostForm} />
        <Route path="/admin/posts/:id/edit" component={AdminPostForm} />
        <Route path="/admin/categories" component={AdminCategories} />
        <Route path="/admin/news" component={AdminNews} />
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
        <Route path="/admin/health-check" component={AdminHealthCheck} />
        <Route path="/admin/explorer" component={SystemExplorer} />
        <Route path="/admin/gallery" component={GalleryAdmin} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
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
