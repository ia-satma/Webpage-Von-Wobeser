import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
  MapPin,
  Pencil,
  Star,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { eventTypeOptions } from "./contracts";
import type { EventsAdminController } from "./useEventsAdmin";

interface EventsOverviewProps {
  controller: EventsAdminController;
}

function eventTypeIcon(type: string | null) {
  switch (type) {
    case "webinar":
      return <Video className="h-4 w-4" />;
    case "conference":
    case "seminar":
      return <Users className="h-4 w-4" />;
    case "workshop":
      return <Clock className="h-4 w-4" />;
    default:
      return <CalendarIcon className="h-4 w-4" />;
  }
}

export function EventsOverview({ controller }: EventsOverviewProps) {
  const {
    events,
    eventsLoading,
    filteredEvents,
    upcomingCount,
    filterType,
    setFilterType,
    filterStartDate,
    setFilterStartDate,
    filterEndDate,
    setFilterEndDate,
    clearFilters,
    editEvent,
    requestDelete,
    language,
    t,
  } = controller;

  const eventTypeLabel = (type: string | null) => {
    const key = type as keyof typeof t;
    return key && t[key] ? t[key] : type || "";
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">{t.totalEvents}</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-events">
              {events?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">{t.upcoming}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-upcoming-events">
              {upcomingCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-none">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[180px] rounded-none" data-testid="select-filter-type">
                <SelectValue placeholder={t.filterByType} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allTypes}</SelectItem>
                {eventTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t[option.labelKey]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2 flex-wrap">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="rounded-none" data-testid="button-filter-start-date">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterStartDate ? format(filterStartDate, "PP") : t.startDate}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filterStartDate}
                    onSelect={setFilterStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="rounded-none" data-testid="button-filter-end-date">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterEndDate ? format(filterEndDate, "PP") : t.endDateFilter}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filterEndDate}
                    onSelect={setFilterEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {(filterType !== "all" || filterStartDate || filterEndDate) && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="rounded-none"
                  data-testid="button-clear-filters"
                >
                  {t.clearFilters}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8" data-testid="text-no-events">
              {t.noEvents}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.dateColumn}</TableHead>
                    <TableHead>{t.titleColumn}</TableHead>
                    <TableHead>{t.typeColumn}</TableHead>
                    <TableHead>{t.locationColumn}</TableHead>
                    <TableHead>{t.statusColumn}</TableHead>
                    <TableHead className="text-right">{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => (
                    <TableRow key={event.id} data-testid={`row-event-${event.id}`}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          {event.date ? format(new Date(event.date), "PP") : "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {event.isHighlight && <Star className="h-4 w-4 text-yellow-500" />}
                          <span className="font-medium" data-testid={`text-event-title-${event.id}`}>
                            {language === "es" ? event.titleEs : event.title}
                          </span>
                          {event.externalUrl && (
                            <a
                              href={event.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-none gap-1">
                          {eventTypeIcon(event.eventType)}
                          {eventTypeLabel(event.eventType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {language === "es" ? event.locationEs || event.location || "-" : event.location || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={event.published ? "default" : "secondary"} className="rounded-none">
                          {event.published ? t.publishedStatus : t.draft}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => editEvent(event)}
                            data-testid={`button-edit-${event.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => requestDelete(event)}
                            className="text-destructive hover:text-destructive"
                            data-testid={`button-delete-${event.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
