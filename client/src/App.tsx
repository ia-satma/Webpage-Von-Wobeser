import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import Experience from "@/pages/Experience";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import Terms from "@/pages/Terms";
import Rankings from "@/pages/Rankings";
import Offices from "@/pages/Offices";

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
      <Route path="/experience" component={Experience} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms" component={Terms} />
      <Route path="/rankings" component={Rankings} />
      <Route path="/offices" component={Offices} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
