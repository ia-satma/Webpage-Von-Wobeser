import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { 
  AI_AGENTS, 
  PUBLIC_MODULES, 
  ADMIN_MODULES, 
  INFRASTRUCTURE,
  getAllFeatures,
  searchFeatures,
  getFeaturesByCategory,
  getTranslations,
  getSystemStats,
  generateMarkdownReport,
  type SystemFeature,
  type SystemCategory,
} from "@/lib/systemManifest";
import { 
  Search, 
  Download, 
  Brain, 
  Cpu, 
  Shield, 
  Globe, 
  Settings, 
  Lock, 
  Server,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileText,
  Layers,
  Database
} from "lucide-react";

const CATEGORY_ICONS: Record<SystemCategory, typeof Brain> = {
  ai_brain: Brain,
  ai_hands: Cpu,
  ai_shield: Shield,
  public_site: Globe,
  admin_system: Settings,
  security: Lock,
  infrastructure: Server,
};

const CATEGORY_COLORS: Record<SystemCategory, string> = {
  ai_brain: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  ai_hands: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  ai_shield: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  public_site: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  admin_system: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  security: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  infrastructure: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
};

function FeatureCard({ feature, t, isExpanded, onToggle }: { 
  feature: SystemFeature; 
  t: ReturnType<typeof getTranslations>;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const Icon = CATEGORY_ICONS[feature.category];
  const colorClass = CATEGORY_COLORS[feature.category];
  const categoryInfo = t.categories[feature.category];

  const getStatusBadge = () => {
    switch (feature.status) {
      case 'production':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            {t.statuses.production}
          </Badge>
        );
      case 'beta':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30">
            <AlertCircle className="w-3 h-3 mr-1" />
            {t.statuses.beta}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30">
            {t.statuses.development}
          </Badge>
        );
    }
  };

  return (
    <Card 
      className="hover-elevate transition-all duration-200 cursor-pointer"
      data-testid={`feature-card-${feature.id}`}
      onClick={onToggle}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="font-medium">{categoryInfo.title}</p>
                <p className="text-xs text-muted-foreground">{categoryInfo.description}</p>
              </TooltipContent>
            </Tooltip>
            <div className="min-w-0">
              <CardTitle className="text-base leading-tight">{feature.name}</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-muted-foreground font-mono truncate mt-0.5 cursor-help">
                    {feature.technicalName}
                  </p>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-sm">
                  <p className="text-xs">{feature.technicalDetail.substring(0, 150)}...</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {getStatusBadge()}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {feature.userBenefit}
        </p>
        
        <div className="flex flex-wrap gap-1.5">
          {feature.keyCapabilities.slice(0, isExpanded ? undefined : 3).map((cap, idx) => (
            <Tooltip key={idx}>
              <TooltipTrigger asChild>
                <Badge 
                  variant="secondary" 
                  className="text-xs font-normal cursor-help"
                >
                  {cap}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">{cap}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          {!isExpanded && feature.keyCapabilities.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{feature.keyCapabilities.length - 3}
            </Badge>
          )}
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t space-y-3" onClick={(e) => e.stopPropagation()}>
            <div>
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-primary" />
                {t.ui.technicalDetails}
              </h4>
              <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg font-mono leading-relaxed">
                {feature.technicalDetail}
              </p>
            </div>
            
            {feature.technicalSpecs && Object.keys(feature.technicalSpecs).length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(feature.technicalSpecs).map(([key, value]) => (
                  <div key={key} className="text-xs">
                    <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className="ml-1 font-medium">
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof Brain;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card className={`${color} border`}>
      <CardContent className="flex items-center gap-3 p-4">
        <Icon className="w-8 h-8 opacity-80" />
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm opacity-80">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SystemExplorer() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const t = getTranslations(language);
  const stats = getSystemStats();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const filteredFeatures = useMemo(() => {
    let features = searchQuery 
      ? searchFeatures(searchQuery) 
      : getAllFeatures();
    
    if (selectedCategory !== 'all') {
      features = features.filter(f => f.category === selectedCategory);
    }
    
    return features;
  }, [searchQuery, selectedCategory]);

  const toggleCard = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExport = () => {
    const markdown = generateMarkdownReport(language);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vonwobeser-technical-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: t.ui.exportSuccess,
      description: `vonwobeser-technical-report-${new Date().toISOString().split('T')[0]}.md`,
    });
  };

  const categories: Array<{ value: string; label: string }> = [
    { value: 'all', label: t.ui.allCategories },
    { value: 'ai_brain', label: t.categories.ai_brain.title },
    { value: 'ai_hands', label: t.categories.ai_hands.title },
    { value: 'ai_shield', label: t.categories.ai_shield.title },
    { value: 'public_site', label: t.categories.public_site.title },
    { value: 'admin_system', label: t.categories.admin_system.title },
    { value: 'security', label: t.categories.security.title },
    { value: 'infrastructure', label: t.categories.infrastructure.title },
  ];

  return (
    <div className="p-6 space-y-6" data-testid="system-explorer">
      <header className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">
                {t.ui.systemOverview}
              </h1>
              <p className="text-muted-foreground">{t.ui.reportSubtitle}</p>
            </div>
          </div>
          <Button 
            onClick={handleExport}
            className="gap-2"
            data-testid="button-export-report"
          >
            <Download className="w-4 h-4" />
            {t.ui.exportReport}
          </Button>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <StatCard 
            icon={Brain} 
            label={t.ui.totalAgents} 
            value={stats.totalAgents}
            color="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
          />
          <StatCard 
            icon={Globe} 
            label={t.ui.totalModules} 
            value={stats.totalPublicModules + stats.totalAdminModules}
            color="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
          />
          <StatCard 
            icon={Database} 
            label={t.ui.totalInfrastructure} 
            value={stats.totalInfrastructure}
            color="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
          />
          <StatCard 
            icon={Sparkles} 
            label={t.statuses.production} 
            value={stats.productionFeatures}
            color="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
          />
        </div>
      </header>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t.ui.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-category">
            <SelectValue placeholder={t.ui.allCategories} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredFeatures.length === 0 ? (
        <Card className="p-8 text-center">
          <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t.ui.noResults}</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {selectedCategory === 'all' ? (
            <>
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-purple-500" />
                  <h2 className="text-xl font-semibold">{t.categories.ai_brain.title}</h2>
                  <Badge variant="secondary">{AI_AGENTS.filter(a => a.category === 'ai_brain').length}</Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredFeatures
                    .filter(f => f.category === 'ai_brain')
                    .map(feature => (
                      <FeatureCard 
                        key={feature.id} 
                        feature={feature} 
                        t={t}
                        isExpanded={expandedCards.has(feature.id)}
                        onToggle={() => toggleCard(feature.id)}
                      />
                    ))}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Cpu className="w-5 h-5 text-blue-500" />
                  <h2 className="text-xl font-semibold">{t.categories.ai_hands.title}</h2>
                  <Badge variant="secondary">{AI_AGENTS.filter(a => a.category === 'ai_hands').length}</Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredFeatures
                    .filter(f => f.category === 'ai_hands')
                    .map(feature => (
                      <FeatureCard 
                        key={feature.id} 
                        feature={feature} 
                        t={t}
                        isExpanded={expandedCards.has(feature.id)}
                        onToggle={() => toggleCard(feature.id)}
                      />
                    ))}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-green-500" />
                  <h2 className="text-xl font-semibold">{t.categories.ai_shield.title}</h2>
                  <Badge variant="secondary">{AI_AGENTS.filter(a => a.category === 'ai_shield').length}</Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredFeatures
                    .filter(f => f.category === 'ai_shield')
                    .map(feature => (
                      <FeatureCard 
                        key={feature.id} 
                        feature={feature} 
                        t={t}
                        isExpanded={expandedCards.has(feature.id)}
                        onToggle={() => toggleCard(feature.id)}
                      />
                    ))}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-orange-500" />
                  <h2 className="text-xl font-semibold">{t.categories.public_site.title}</h2>
                  <Badge variant="secondary">{PUBLIC_MODULES.length}</Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredFeatures
                    .filter(f => f.category === 'public_site')
                    .map(feature => (
                      <FeatureCard 
                        key={feature.id} 
                        feature={feature} 
                        t={t}
                        isExpanded={expandedCards.has(feature.id)}
                        onToggle={() => toggleCard(feature.id)}
                      />
                    ))}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-5 h-5 text-indigo-500" />
                  <h2 className="text-xl font-semibold">{t.categories.admin_system.title}</h2>
                  <Badge variant="secondary">{ADMIN_MODULES.length}</Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredFeatures
                    .filter(f => f.category === 'admin_system')
                    .map(feature => (
                      <FeatureCard 
                        key={feature.id} 
                        feature={feature} 
                        t={t}
                        isExpanded={expandedCards.has(feature.id)}
                        onToggle={() => toggleCard(feature.id)}
                      />
                    ))}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-5 h-5 text-red-500" />
                  <h2 className="text-xl font-semibold">{t.categories.security.title}</h2>
                  <Badge variant="secondary">
                    {INFRASTRUCTURE.filter(i => i.category === 'security').length}
                  </Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredFeatures
                    .filter(f => f.category === 'security')
                    .map(feature => (
                      <FeatureCard 
                        key={feature.id} 
                        feature={feature} 
                        t={t}
                        isExpanded={expandedCards.has(feature.id)}
                        onToggle={() => toggleCard(feature.id)}
                      />
                    ))}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Server className="w-5 h-5 text-gray-500" />
                  <h2 className="text-xl font-semibold">{t.categories.infrastructure.title}</h2>
                  <Badge variant="secondary">
                    {INFRASTRUCTURE.filter(i => i.category === 'infrastructure').length}
                  </Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredFeatures
                    .filter(f => f.category === 'infrastructure')
                    .map(feature => (
                      <FeatureCard 
                        key={feature.id} 
                        feature={feature} 
                        t={t}
                        isExpanded={expandedCards.has(feature.id)}
                        onToggle={() => toggleCard(feature.id)}
                      />
                    ))}
                </div>
              </section>
            </>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredFeatures.map(feature => (
                <FeatureCard 
                  key={feature.id} 
                  feature={feature} 
                  t={t}
                  isExpanded={expandedCards.has(feature.id)}
                  onToggle={() => toggleCard(feature.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
