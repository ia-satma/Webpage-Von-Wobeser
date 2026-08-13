import { Calendar as CalendarIcon } from "lucide-react";
import { AdminComingSoonNote } from "@/components/admin/AdminComingSoonNote";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteEventDialog } from "./DeleteEventDialog";
import { EventFormDialog } from "./EventFormDialog";
import { EventsOverview } from "./EventsOverview";
import { useEventsAdmin } from "./useEventsAdmin";

export default function AdminEventsPage() {
  const controller = useEventsAdmin();

  if (controller.authLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="admin-events-page">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <AdminPageHeader
          title={controller.t.title}
          icon={CalendarIcon}
          actions={<EventFormDialog controller={controller} />}
        />
        <AdminComingSoonNote />
        <AdminPageHelp pageId="events" manualSectionId="eventos">
          Aquí administras los eventos del despacho (conferencias, webinars, presentaciones). Por ahora se guardan en el panel, en cuanto se autorice se conectan a una página pública.
        </AdminPageHelp>
        <EventsOverview controller={controller} />
        <DeleteEventDialog controller={controller} />
      </main>
    </div>
  );
}
