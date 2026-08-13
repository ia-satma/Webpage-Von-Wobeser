import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CarouselPreview } from "./CarouselPreview";
import { FirmPreview } from "./FirmPreview";
import { FIRM_TAB_LABELS, HOME_TAB_LABELS } from "./registry";
import { SiteConfigGroup } from "./SiteConfigGroup";
import type { SiteConfigController } from "./useSiteConfig";

export function SiteConfigSections({ controller }: { controller: SiteConfigController }) {
  const { section, page } = controller;
  if (section !== "portada" && section !== "firma") {
    return <>{page.groups.map((group, index) => (
      <SiteConfigGroup key={group.title ?? index} group={group} controller={controller} />
    ))}</>;
  }
  return (
    <Tabs value={controller.homeTab} onValueChange={controller.setHomeTab} className="space-y-5">
      {section === "firma" && (
        <FirmPreview
          hasPreviousVersion={!!controller.data?.firm_landing_previous_version?.value}
          restoring={controller.restoringPreviousFirm}
          restorePrevious={controller.restorePreviousFirmVersion}
        />
      )}
      <TabsList
        className="flex h-auto w-full justify-start gap-1 overflow-x-auto p-1"
        aria-label={section === "firma" ? "Secciones de Nuestra Firma" : "Secciones de la portada"}
      >
        {page.groups.map((group, index) => (
          <TabsTrigger
            key={group.title ?? index}
            value={String(index)}
            className="shrink-0"
            data-testid={`tab-home-${index}`}
          >
            {(section === "firma" ? FIRM_TAB_LABELS : HOME_TAB_LABELS)[index]
              || group.title
              || `Sección ${index + 1}`}
          </TabsTrigger>
        ))}
      </TabsList>
      {page.groups.map((group, index) => (
        <TabsContent key={group.title ?? index} value={String(index)} className="mt-0">
          {index === 1 && (
            <CarouselPreview
              practice={controller.practiceCarouselQuery}
              industry={controller.industryCarouselQuery}
            />
          )}
          <SiteConfigGroup group={group} controller={controller} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
