import { motion } from "framer-motion";
import { Briefcase, FileText, Mail, Settings, User } from "lucide-react";
import { TranslateButton } from "@/components/admin/TranslateButton";
import { Form } from "@/components/ui/form";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BiographyTab } from "./BiographyTab";
import { CapabilitiesTab } from "./CapabilitiesTab";
import { ContactTab } from "./ContactTab";
import { GeneralTab } from "./GeneralTab";
import { SettingsTab } from "./SettingsTab";
import type { TeamMemberFormController } from "./useTeamMemberForm";

interface TeamFormTabsProps {
  controller: TeamMemberFormController;
}

export function TeamFormTabs({ controller }: TeamFormTabsProps) {
  const {
    form,
    submit,
    activeTab,
    setActiveTab,
    t,
    language,
    generateSlug,
    memberId,
    watchedValues,
    practiceGroups,
    industryGroups,
  } = controller;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Form {...form}>
        <form
          id="team-member-form"
          onSubmit={form.handleSubmit(submit)}
          className="space-y-6"
        >
          <div className="flex justify-end">
            <TranslateButton
              getSource={() => ({
                title: form.getValues("titleEs"),
                role: form.getValues("roleEs"),
                bio: form.getValues("bioEs"),
              })}
              onApply={(fields) => {
                if (fields.title != null) form.setValue("title", fields.title, { shouldDirty: true });
                if (fields.role != null) form.setValue("role", fields.role, { shouldDirty: true });
                if (fields.bio != null) form.setValue("bio", fields.bio, { shouldDirty: true });
              }}
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start bg-card border border-[#D9D8D7] rounded-none p-1 h-auto">
              <TabsTrigger
                value="general"
                className="rounded-none data-[state=active]:bg-[#AA1A2E] data-[state=active]:text-white px-6 py-2.5"
              >
                <User className="w-4 h-4 mr-2" />
                {t.tabs.general}
              </TabsTrigger>
              <TabsTrigger
                value="contact"
                className="rounded-none data-[state=active]:bg-[#AA1A2E] data-[state=active]:text-white px-6 py-2.5"
              >
                <Mail className="w-4 h-4 mr-2" />
                {t.tabs.contact}
              </TabsTrigger>
              <TabsTrigger
                value="bio"
                className="rounded-none data-[state=active]:bg-[#AA1A2E] data-[state=active]:text-white px-6 py-2.5"
              >
                <FileText className="w-4 h-4 mr-2" />
                {t.tabs.bio}
              </TabsTrigger>
              <TabsTrigger
                value="practices"
                className="rounded-none data-[state=active]:bg-[#AA1A2E] data-[state=active]:text-white px-6 py-2.5"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                {language === "es" ? "Prácticas e industrias" : "Practices & Industries"}
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="rounded-none data-[state=active]:bg-[#AA1A2E] data-[state=active]:text-white px-6 py-2.5"
              >
                <Settings className="w-4 h-4 mr-2" />
                {t.tabs.settings}
              </TabsTrigger>
            </TabsList>
            <GeneralTab form={form} t={t} language={language} generateSlug={generateSlug} />
            <ContactTab form={form} t={t} />
            <BiographyTab
              form={form}
              t={t}
              language={language}
              memberId={memberId}
              watchedValues={watchedValues}
            />
            <CapabilitiesTab
              form={form}
              language={language}
              practiceGroups={practiceGroups}
              industryGroups={industryGroups}
            />
            <SettingsTab form={form} t={t} />
          </Tabs>
        </form>
      </Form>
    </motion.div>
  );
}
