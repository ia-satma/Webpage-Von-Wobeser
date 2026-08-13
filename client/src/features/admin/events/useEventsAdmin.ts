import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Event } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { adminApiRequest, useAdminAuth } from "@/lib/adminAuth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  createEventFormDefaults,
  eventSchema,
  type EventCopy,
  type EventFormData,
} from "./contracts";
import {
  countUpcomingEvents,
  eventFormToPayload,
  eventToFormData,
  filterAndSortEvents,
} from "./helpers";
import { eventTranslations } from "./translations";

export function useEventsAdmin() {
  const { language } = useLanguage();
  const { isLoading: authLoading, requireAuth } = useAdminAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [filterStartDate, setFilterStartDate] = useState<Date>();
  const [filterEndDate, setFilterEndDate] = useState<Date>();
  const t = (eventTranslations[language as keyof typeof eventTranslations] || eventTranslations.en) as EventCopy;

  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: createEventFormDefaults(),
  });

  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/admin/events"],
    queryFn: async () => {
      const response = await adminApiRequest("GET", "/api/admin/events");
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const payload = eventFormToPayload(data);
      if (editingEvent) {
        const response = await adminApiRequest("PUT", `/api/admin/events/${editingEvent.id}`, payload);
        if (!response.ok) throw new Error("Failed to update event");
        return response.json();
      }
      const response = await adminApiRequest("POST", "/api/admin/events", payload);
      if (!response.ok) throw new Error("Failed to create event");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: t.saveSuccess });
      setIsDialogOpen(false);
      setEditingEvent(null);
      form.reset();
    },
    onError: () => toast({ title: t.saveError, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await adminApiRequest("DELETE", `/api/admin/events/${id}`);
      if (!response.ok) throw new Error("Failed to delete event");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: t.deleteSuccess });
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    },
    onError: () => toast({ title: t.deleteError, variant: "destructive" }),
  });

  const prepareCreate = () => {
    setEditingEvent(null);
    form.reset();
  };

  const editEvent = (event: Event) => {
    setEditingEvent(event);
    form.reset(eventToFormData(event));
    setIsDialogOpen(true);
  };

  const requestDelete = (event: Event) => {
    setEventToDelete(event);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (eventToDelete) deleteMutation.mutate(eventToDelete.id);
  };

  const closeEventDialog = () => {
    setIsDialogOpen(false);
    setEditingEvent(null);
    form.reset();
  };

  const clearFilters = () => {
    setFilterType("all");
    setFilterStartDate(undefined);
    setFilterEndDate(undefined);
  };

  const filteredEvents = filterAndSortEvents(events, {
    type: filterType,
    startDate: filterStartDate,
    endDate: filterEndDate,
  });

  return {
    language,
    authLoading,
    t,
    form,
    events,
    eventsLoading,
    filteredEvents,
    upcomingCount: countUpcomingEvents(events),
    isDialogOpen,
    setIsDialogOpen,
    editingEvent,
    saveMutation,
    prepareCreate,
    editEvent,
    closeEventDialog,
    filterType,
    setFilterType,
    filterStartDate,
    setFilterStartDate,
    filterEndDate,
    setFilterEndDate,
    clearFilters,
    deleteDialogOpen,
    setDeleteDialogOpen,
    eventToDelete,
    requestDelete,
    confirmDelete,
    deleteMutation,
  };
}

export type EventsAdminController = ReturnType<typeof useEventsAdmin>;
