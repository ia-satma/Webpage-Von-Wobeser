import { Building2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { CapabilityGroupsPage } from "@/features/admin/capability-groups/CapabilityGroupsPage";
import { toCapabilityCopy } from "@/features/admin/capability-groups/helpers";
import type { CapabilityGroupConfig } from "@/features/admin/capability-groups/contracts";
import { industryGroupSchema } from "./contracts";
import { industryGroupTranslations } from "./translations";

export default function AdminIndustryGroupsPage() {
  const { language } = useLanguage();
  const source = industryGroupTranslations[
    language as keyof typeof industryGroupTranslations
  ] || industryGroupTranslations.en;
  const t = toCapabilityCopy(
    source,
    {
      newGroup: "newIndustryGroup",
      editGroup: "editIndustryGroup",
      noGroups: "noIndustryGroups",
    },
    {
      fetch: "Failed to fetch industry groups",
      save: "Failed to save industry group",
      delete: "Failed to delete industry group",
    },
  );
  const config: CapabilityGroupConfig = {
    kind: "industry",
    adminEndpoint: "/api/admin/industry-groups",
    publicQueryKey: "/api/industry-groups",
    entityType: "industry_group",
    icon: Building2,
    newButtonTestId: "button-new-industry-group",
    rowTestPrefix: "row-industry-group-",
    helpPageId: "sectores",
    helpManualSectionId: "sectores",
    helpText: "Define los sectores/industrias que atiende la firma. Se conectan con los abogados y las prácticas.",
    imageDescription: "Se muestra como fondo de este grupo en el carrusel de la portada.",
    schema: industryGroupSchema,
  };
  return <CapabilityGroupsPage config={config} t={t} language={language} />;
}
