import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { EventsAdminController } from "./useEventsAdmin";

interface DeleteEventDialogProps {
  controller: EventsAdminController;
}

export function DeleteEventDialog({ controller }: DeleteEventDialogProps) {
  const {
    deleteDialogOpen,
    setDeleteDialogOpen,
    confirmDelete,
    deleteMutation,
    t,
  } = controller;

  return (
    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <DialogContent className="rounded-none">
        <DialogHeader>
          <DialogTitle data-testid="text-delete-dialog-title">{t.confirmDeleteTitle}</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground" data-testid="text-delete-dialog-description">
          {t.confirmDeleteDescription}
        </p>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(false)}
            className="rounded-none"
            data-testid="button-cancel-delete"
          >
            {t.cancel}
          </Button>
          <Button
            variant="destructive"
            onClick={confirmDelete}
            disabled={deleteMutation.isPending}
            className="rounded-none"
            data-testid="button-confirm-delete"
          >
            {deleteMutation.isPending ? t.loading : t.delete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
