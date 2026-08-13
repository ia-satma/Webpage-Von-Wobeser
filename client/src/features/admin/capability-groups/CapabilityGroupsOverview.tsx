import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CapabilityGroupsController } from "./useCapabilityGroups";

export function CapabilityGroupsOverview({ controller }: { controller: CapabilityGroupsController }) {
  const {
    config,
    t,
    language,
    groups,
    sortedGroups,
    groupsQuery,
    editGroup,
    deleteGroup,
    deleteMutation,
  } = controller;
  const Icon = config.icon;
  return (
<>
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.totalGroups}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-count">
                {groups.length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            {groupsQuery.isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : sortedGroups.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground" data-testid="text-no-groups">
                <Icon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                {t.noGroups}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">{t.orderColumn}</TableHead>
                    <TableHead className="w-28">Imagen</TableHead>
                    <TableHead>{t.nameColumn}</TableHead>
                    <TableHead>{t.slugColumn}</TableHead>
                    <TableHead className="w-24 text-right">{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedGroups.map((group) => (
                    <TableRow key={group.id} data-testid={`${config.rowTestPrefix}${group.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{group.order}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {group.imageUrl ? (
                          <img
                            src={group.imageUrl}
                            alt={`Imagen del carrusel de ${group.nameEs || group.name}`}
                            className="h-14 w-24 rounded-md border border-border object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-14 w-24 items-center justify-center rounded-md border border-dashed border-border bg-muted text-[11px] text-muted-foreground">Sin imagen</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium" data-testid={`text-name-${group.id}`}>
                            {language === "es" ? group.nameEs : group.name}
                          </div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {language === "es" ? group.descriptionEs : group.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1" data-testid={`text-slug-${group.id}`}>
                          {group.slug}
                        </code>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => editGroup(group)}
                            data-testid={`button-edit-${group.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteGroup(group.id)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${group.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
</>
  );
}
