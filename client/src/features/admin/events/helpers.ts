import type { Event } from "@shared/schema";
import type { EventFilters, EventFormData } from "./contracts";

export function eventToFormData(event: Event): EventFormData {
  return {
    title: event.title,
    titleEs: event.titleEs,
    eventType: event.eventType || "conference",
    date: event.date ? new Date(event.date) : new Date(),
    endDate: event.endDate ? new Date(event.endDate) : null,
    location: event.location || "",
    locationEs: event.locationEs || "",
    description: event.description,
    descriptionEs: event.descriptionEs,
    externalUrl: event.externalUrl || "",
    isHighlight: event.isHighlight || false,
    published: event.published ?? true,
  };
}

export function eventFormToPayload(data: EventFormData) {
  return {
    ...data,
    date: data.date.toISOString(),
    endDate: data.endDate ? data.endDate.toISOString() : null,
    externalUrl: data.externalUrl || null,
    location: data.location || null,
    locationEs: data.locationEs || null,
  };
}

export function filterAndSortEvents(events: Event[] | undefined, filters: EventFilters): Event[] {
  return (events || [])
    .filter((event) => {
      if (filters.type !== "all" && event.eventType !== filters.type) return false;
      if (filters.startDate && event.date && new Date(event.date) < filters.startDate) return false;
      if (filters.endDate && event.date && new Date(event.date) > filters.endDate) return false;
      return true;
    })
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
}

export function countUpcomingEvents(events: Event[] | undefined, now = new Date()): number {
  return events?.filter((event) => event.date && new Date(event.date) >= now).length || 0;
}
