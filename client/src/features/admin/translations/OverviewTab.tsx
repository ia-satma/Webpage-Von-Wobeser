import { CheckCircle, Globe, Languages } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { TabsContent } from "@/components/ui/tabs";
import { getCoverageColor, getProgressColor } from "./helpers";
import type { TranslationsController } from "./useTranslationsController";

export function OverviewTab({ controller }: { controller: TranslationsController }) {
  const { copy, overallStats } = controller;
  return (
    <TabsContent value="overview" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-articles">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{copy.totalArticles}</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {controller.cmsStatsQuery.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-total-articles">
                {overallStats.total}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-translated-articles">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{copy.translatedArticles}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {controller.cmsStatsQuery.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div
                className="text-2xl font-bold text-green-600"
                data-testid="text-translated-articles"
              >
                {overallStats.translated}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-coverage-rate">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{copy.coverageRate}</CardTitle>
            <Languages className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {controller.cmsStatsQuery.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div
                  className={`text-2xl font-bold ${getCoverageColor(overallStats.coverage)}`}
                  data-testid="text-coverage-rate"
                >
                  {overallStats.coverage}%
                </div>
                <Progress value={overallStats.coverage} className="mt-2" />
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-languages-supported">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{copy.languagesSupported}</CardTitle>
            <Globe className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-languages-count">
              {overallStats.languages}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-language-coverage">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            {copy.languageCoverage}
          </CardTitle>
          <CardDescription>{copy.languageCoverageDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {controller.cmsStatsQuery.isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <Skeleton key={item} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {controller.languageCoverage.map((language) => (
                <div
                  key={language.code}
                  className="space-y-2"
                  data-testid={`language-row-${language.code}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{language.name}</span>
                      <span className="text-sm text-muted-foreground">({language.native})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {language.translated} / {language.total}
                      </span>
                      <span
                        className={`font-medium ${getCoverageColor(language.coverage)}`}
                        data-testid={`text-coverage-${language.code}`}
                      >
                        {language.coverage}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className={`h-full transition-all ${getProgressColor(language.coverage)}`}
                      style={{ width: `${language.coverage}%` }}
                      data-testid={`progress-${language.code}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
