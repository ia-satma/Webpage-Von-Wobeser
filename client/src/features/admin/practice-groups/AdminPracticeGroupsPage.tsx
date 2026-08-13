import { Briefcase } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { CapabilityGroupsPage } from "@/features/admin/capability-groups/CapabilityGroupsPage";
import { toCapabilityCopy } from "@/features/admin/capability-groups/helpers";
import type { CapabilityGroupConfig } from "@/features/admin/capability-groups/contracts";
import { createPracticeGroupSchema } from "./contracts";
import { practiceGroupTranslations } from "./translations";

export default function AdminPracticeGroupsPage() {
  const { language } = useLanguage();
  const source = practiceGroupTranslations[
    language as keyof typeof practiceGroupTranslations
  ] || practiceGroupTranslations.en;
  const t = toCapabilityCopy(source, {
    newGroup: "newPracticeGroup",
    editGroup: "editPracticeGroup",
    noGroups: "noPracticeGroups",
  });
  const config: CapabilityGroupConfig = {
    kind: "practice",
    adminEndpoint: "/api/admin/practice-groups",
    publicQueryKey: "/api/practice-groups",
    entityType: "practice_group",
    icon: Briefcase,
    newButtonTestId: "button-new-practice-group",
    rowTestPrefix: "row-practice-group-",
    helpPageId: "areas-practica",
    helpManualSectionId: "areas-practica",
    helpText: "Define las áreas de práctica legal (Corporativo, Fiscal, Litigio…). Cada abogado puede pertenecer a varias.",
    imageDescription: "Se muestra como fondo de esta práctica en el carrusel de la portada.",
    schema: createPracticeGroupSchema(source),
  };
  return <CapabilityGroupsPage config={config} t={t} language={language} />;
}
