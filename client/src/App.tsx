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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/practice-groups" component={PracticeGroups} />
      <Route path="/practice-groups/:slug" component={PracticeGroupDetail} />
      <Route path="/industry-groups" component={IndustryGroups} />
      <Route path="/industry-groups/:slug" component={IndustryGroupDetail} />
      <Route path="/team" component={Team} />
      <Route path="/team/:slug" component={TeamMemberDetail} />
      <Route path="/news/:slug" component={NewsDetail} />
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
