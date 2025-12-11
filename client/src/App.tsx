import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
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
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import PracticeGroups from "@/pages/PracticeGroups";
import PracticeGroupDetail from "@/pages/PracticeGroupDetail";
import IndustryGroups from "@/pages/IndustryGroups";
import IndustryGroupDetail from "@/pages/IndustryGroupDetail";
import Team from "@/pages/Team";
import TeamMemberDetail from "@/pages/TeamMemberDetail";
import NewsDetail from "@/pages/NewsDetail";
import News from "@/pages/News";
import Contact from "@/pages/Contact";
import About from "@/pages/About";
import Careers from "@/pages/Careers";
import Interns from "@/pages/Interns";
import Experience from "@/pages/Experience";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import Terms from "@/pages/Terms";
import Rankings from "@/pages/Rankings";
import Offices from "@/pages/Offices";
import DiversityInclusion from "@/pages/DiversityInclusion";
import ProBono from "@/pages/ProBono";
import GermanDesk from "@/pages/GermanDesk";
import Articles from "@/pages/Articles";
import Newsletter from "@/pages/Newsletter";
import Events from "@/pages/Events";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminPosts from "@/pages/admin/AdminPosts";
import AdminPostForm from "@/pages/admin/AdminPostForm";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminNews from "@/pages/admin/AdminNews";
import AdminAgents from "@/pages/AdminAgents";
import AdminArticleProcessing from "@/pages/admin/AdminArticleProcessing";
import AdminAudits from "@/pages/admin/AdminAudits";
import AdminTeam from "@/pages/admin/AdminTeam";
import AdminTeamForm from "@/pages/admin/AdminTeamForm";
import AdminGuide from "@/pages/admin/AdminGuide";
import AdminPerformance from "@/pages/admin/AdminPerformance";
import AdminPracticeGroups from "@/pages/admin/AdminPracticeGroups";
import AdminIndustryGroups from "@/pages/admin/AdminIndustryGroups";
import AdminKnowledge from "@/pages/admin/AdminKnowledge";
import AdminTranslations from "@/pages/admin/AdminTranslations";
import AdminEvents from "@/pages/admin/AdminEvents";
import AdminHealthCheck from "@/pages/admin/AdminHealthCheck";
import SystemExplorer from "@/pages/admin/SystemExplorer";

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
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/practice-groups" component={PracticeGroups} />
      <Route path="/practice-groups/:slug" component={PracticeGroupDetail} />
      <Route path="/industry-groups" component={IndustryGroups} />
      <Route path="/industry-groups/:slug" component={IndustryGroupDetail} />
      <Route path="/team" component={Team} />
      <Route path="/team/:slug" component={TeamMemberDetail} />
      <Route path="/news" component={News} />
      <Route path="/news/:slug" component={NewsDetail} />
      <Route path="/contact" component={Contact} />
      <Route path="/careers" component={Careers} />
      <Route path="/careers/interns" component={Interns} />
      <Route path="/experience" component={Experience} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms" component={Terms} />
      <Route path="/rankings" component={Rankings} />
      <Route path="/offices" component={Offices} />
      <Route path="/diversity-inclusion" component={DiversityInclusion} />
      <Route path="/pro-bono" component={ProBono} />
      <Route path="/german-desk" component={GermanDesk} />
      <Route path="/articles" component={Articles} />
      <Route path="/newsletter" component={Newsletter} />
      <Route path="/events" component={Events} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/posts" component={AdminPosts} />
      <Route path="/admin/posts/new" component={AdminPostForm} />
      <Route path="/admin/posts/:id/edit" component={AdminPostForm} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/news" component={AdminNews} />
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
      <Route component={NotFound} />
    </Switch>
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
