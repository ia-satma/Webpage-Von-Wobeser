import { PlusCircle } from "lucide-react";
import { TranslateButton } from "@/components/admin/TranslateButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { EventBasicFields } from "./EventBasicFields";
import { EventEditorialFields } from "./EventEditorialFields";
import { EventSettingsFields } from "./EventSettingsFields";
import type { EventsAdminController } from "./useEventsAdmin";

interface EventFormDialogProps {
  controller: EventsAdminController;
}

export function EventFormDialog({ controller }: EventFormDialogProps) {
  const {
    isDialogOpen,
    setIsDialogOpen,
    prepareCreate,
    editingEvent,
    form,
    saveMutation,
    closeEventDialog,
    t,
  } = controller;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={prepareCreate}
          className="bg-[#AA1A2E] hover:bg-[#8B1525] rounded-none"
          data-testid="button-new-event"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          {t.newEvent}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">
            {editingEvent ? t.editEvent : t.newEvent}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))}
            className="space-y-4"
          >
            <div className="flex justify-end">
              <TranslateButton
                getSource={() => ({
                  title: form.getValues("titleEs"),
                  location: form.getValues("locationEs"),
                  description: form.getValues("descriptionEs"),
                })}
                onApply={(fields) => {
                  if (fields.title != null) form.setValue("title", fields.title, { shouldDirty: true });
                  if (fields.location != null) form.setValue("location", fields.location, { shouldDirty: true });
                  if (fields.description != null) {
                    form.setValue("description", fields.description, { shouldDirty: true });
                  }
                }}
              />
            </div>
            <EventBasicFields form={form} t={t} />
            <EventEditorialFields form={form} t={t} eventId={editingEvent?.id} />
            <EventSettingsFields form={form} t={t} />
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeEventDialog}
                className="rounded-none"
                data-testid="button-cancel"
              >
                {t.cancel}
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="bg-[#AA1A2E] hover:bg-[#8B1525] rounded-none"
                data-testid="button-save"
              >
                {saveMutation.isPending ? t.saving : t.save}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
