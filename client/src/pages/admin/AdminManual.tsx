import { useEffect } from "react";
import { Link } from "wouter";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ADMIN_MANUAL_SECTIONS } from "@/lib/adminManualContent";
import { HelpCircle, ArrowRight } from "lucide-react";

export default function AdminManual() {
  useEffect(() => {
    if (window.location.hash) {
      const el = document.getElementById(window.location.hash.slice(1));
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminPageHeader
          title="Manual de uso"
          description="Qué es cada sección del panel, para qué sirve y cómo usarla, paso a paso."
          icon={HelpCircle}
        />

        <div className="space-y-4">
          {ADMIN_MANUAL_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.id} id={section.id} className="rounded-2xl scroll-mt-6" data-testid={`manual-section-${section.id}`}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                    </div>
                    <Link href={section.relatedHref}>
                      <Button variant="outline" size="sm" data-testid={`button-goto-${section.id}`}>
                        Ir a esta sección <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Qué es</p>
                    <p className="text-foreground/80">{section.whatIsIt}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Para qué sirve</p>
                    <p className="text-foreground/80">{section.whatFor}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Pasos comunes</p>
                    <ol className="list-decimal list-inside space-y-1 text-foreground/80">
                      {section.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
