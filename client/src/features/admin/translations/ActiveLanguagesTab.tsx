import { Languages, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { TabsContent } from "@/components/ui/tabs";
import { LANG_LABELS, SUPPORTED_LANGUAGES } from "./constants";
import type { TranslationsController } from "./useTranslationsController";

export function ActiveLanguagesTab({
  controller,
}: {
  controller: TranslationsController;
}) {
  return (
    <TabsContent value="languages" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" /> Idiomas activos
          </CardTitle>
          <CardDescription>
            Elige a qué idiomas se traduce el contenido. El traductor generará <b>solo estos idiomas</b>
            {" "}(en vez de los 10 siempre), ahorrando tiempo y créditos. El <b>español</b> es el idioma base y
            siempre está incluido.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {(controller.languagesSettingsQuery.data?.allLanguages || SUPPORTED_LANGUAGES)
              .map((code) => {
                const checked = controller.activeLangs.includes(code);
                const isBase = code === "es";
                return (
                  <label
                    key={code}
                    className={`flex items-center gap-2 border rounded-md p-3 cursor-pointer transition-colors ${checked ? "border-primary bg-primary/5" : "border-border"} ${isBase ? "opacity-70" : ""}`}
                    data-testid={`lang-toggle-${code}`}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={isBase}
                      onCheckedChange={(value) => controller.toggleLanguage(code, value === true)}
                    />
                    <span className="text-sm">
                      {LANG_LABELS[code] || code}{isBase && " (base)"}
                    </span>
                  </label>
                );
              })}
          </div>
          <Button
            onClick={() => controller.saveLanguagesMutation.mutate(controller.activeLangs)}
            disabled={controller.saveLanguagesMutation.isPending}
            data-testid="button-save-languages"
          >
            {controller.saveLanguagesMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Guardar idiomas activos
          </Button>
          <p className="text-xs text-muted-foreground">
            Nota: hoy el sitio público muestra español e inglés; los demás idiomas se guardan para
            cuando se active su despliegue. Traducir con IA requiere créditos de Anthropic disponibles.
          </p>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
