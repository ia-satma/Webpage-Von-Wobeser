import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SiteConfigController } from "./useSiteConfig";
import type { SiteConfigFieldGroup } from "./contracts";
import { SiteConfigFieldControl } from "./SiteConfigFieldControl";

interface SiteConfigGroupProps {
  group: SiteConfigFieldGroup;
  controller: SiteConfigController;
}

export function SiteConfigGroup({ group, controller }: SiteConfigGroupProps) {
  return (
    <Card>
      {group.title && (
        <CardHeader>
          <CardTitle className="text-base">{group.title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-6">
        {group.fields.map((field) => (
          <SiteConfigFieldControl
            key={field.key}
            field={field}
            draft={controller.draft}
            saving={controller.saving}
            setValue={controller.set}
            requestSave={controller.requestSave}
          />
        ))}
      </CardContent>
    </Card>
  );
}
