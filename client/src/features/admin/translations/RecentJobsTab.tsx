import { AlertCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import type { TranslationCopy } from "./translations";

export function RecentJobsTab({ copy }: { copy: TranslationCopy }) {
  return (
    <TabsContent value="jobs" className="space-y-4">
      <Card data-testid="card-recent-jobs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {copy.recentJobs}
          </CardTitle>
          <CardDescription>{copy.recentJobsDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground" data-testid="text-no-jobs">
            <AlertCircle className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
            {copy.noJobs}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
