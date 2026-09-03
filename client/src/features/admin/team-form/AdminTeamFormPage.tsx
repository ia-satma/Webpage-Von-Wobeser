import { useLocation } from "wouter";
import { Loader2, Save, User } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { AdminCompletionChecklist } from "@/components/admin/AdminCompletionChecklist";
import { AdminEditStatus, useAdminEditRegistration, useAdminEditingState } from "@/components/admin/AdminEditingState";
import { AdminPrivatePreviewButton } from "@/components/admin/AdminPrivatePreviewButton";
import { ConfirmChangesDialog } from "@/components/admin/ConfirmChangesDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamFormTabs } from "./TeamFormTabs";
import { TeamMemberPreview } from "./TeamMemberPreview";
import { useTeamMemberForm } from "./useTeamMemberForm";

export default function AdminTeamFormPage() {
  const [, setLocation] = useLocation();
  const { requestNavigation } = useAdminEditingState();
  const controller = useTeamMemberForm();
  const {
    authLoading,
    isAuthenticated,
    isEditMode,
    member,
    memberLoading,
    isPending,
    t,
    confirm,
    setConfirm,
    updateMutation,
    createMutation,
    doSave,
    form,
    memberId,
    watchedValues,
  } = controller;
  const isDirty = form.formState.isDirty;
  useAdminEditRegistration({ id: `team:${memberId || "new"}`, isDirty, isSaving: isPending });
  const reviewItems = [
    { label: "Datos generales", complete: Boolean(watchedValues.name?.trim() && watchedValues.titleEs?.trim()), hint: "nombre y cargo" },
    { label: "Contacto", complete: Boolean(watchedValues.email?.trim() || watchedValues.phone?.trim()), hint: "opcional, pero recomendado" },
    { label: "Biografía", complete: Boolean(watchedValues.bioEs?.trim() || watchedValues.bio?.trim()), hint: "agrega una biografía" },
    { label: "Prácticas e industrias", complete: watchedValues.practiceGroupIds.length > 0 || watchedValues.industryGroupIds.length > 0, hint: "asocia al menos una si corresponde" },
    { label: "Visibilidad", complete: typeof watchedValues.published === "boolean", hint: "revisa si debe estar visible" },
  ];
  const leaveForm = () => requestNavigation(() => setLocation("/admin/team"));

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F8F8]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-[#AA1A2E] border-t-transparent rounded-full" />
          <p className="text-[#54565B] font-medium">{t.loading}</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return null;

  if (isEditMode && memberLoading) {
    return (
      <div className="min-h-screen bg-[#F8F8F8]">
        <div className="container mx-auto px-6 py-8 max-w-6xl">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-10 rounded-none" />
            <Skeleton className="h-10 w-64" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-[400px] w-full rounded-none" />
            </div>
            <div><Skeleton className="h-[300px] w-full rounded-none" /></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminPageHeader
          title={isEditMode ? member?.name || t.editTitle : t.createTitle}
          description={isEditMode ? t.editSubtitle : t.createSubtitle}
          icon={User}
          actions={
            <>
              <AdminEditStatus isDirty={isDirty} isSaving={isPending} published={watchedValues.published} />
              <AdminPrivatePreviewButton entity="team" id={memberId} hasUnsavedChanges={isDirty} />
              <Button
                type="button"
                variant="outline"
                onClick={leaveForm}
                className="rounded-none border-[#D9D8D7] text-[#54565B] hover:bg-[#F8F8F8]"
                data-testid="button-cancel"
              >
                {t.cancel}
              </Button>
              <Button
                type="submit"
                form="team-member-form"
                disabled={isPending}
                className="rounded-none bg-[#AA1A2E] hover:bg-[#8a1525] text-white min-w-[140px]"
                data-testid="button-submit"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditMode ? t.saving : t.creating}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isEditMode ? t.save : t.create}
                  </>
                )}
              </Button>
            </>
          }
        />
        <AdminPageHelp pageId="equipo-form" manualSectionId="equipo">
          Aquí agregas o editas la ficha de un abogado del equipo: nombre, cargo, foto, áreas de práctica y biografía.
        </AdminPageHelp>
        <AdminCompletionChecklist items={reviewItems} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <TeamFormTabs controller={controller} />
          </div>
          <div className="lg:col-span-1">
            <TeamMemberPreview
              values={controller.watchedValues}
              language={controller.language}
              t={t}
            />
          </div>
        </div>
      </main>
      <ConfirmChangesDialog
        open={!!confirm}
        onOpenChange={(open) => !open && setConfirm(null)}
        changes={confirm?.changes || []}
        loading={updateMutation.isPending || createMutation.isPending}
        title={isEditMode ? "Confirmar cambios del abogado" : "Confirmar nuevo abogado"}
        onConfirm={() => {
          if (confirm) doSave(confirm.data);
          setConfirm(null);
        }}
      />
    </div>
  );
}
