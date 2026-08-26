import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Loader2,
  RotateCcw,
  Save,
  SlidersHorizontal,
} from "lucide-react";
import type { TeamMember } from "@shared/schema";
import { getAttorneyPublicName } from "@shared/attorneyName";
import {
  ATTORNEY_ORDER_CATEGORIES,
  type AttorneyOrderCategoryId,
} from "@shared/attorneyOrder";
import { adminApiRequest, useAdminAuth } from "@/lib/adminAuth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AttorneyOrderResponse = {
  category: AttorneyOrderCategoryId;
  members: TeamMember[];
  version: string;
};

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function AttorneyOrderPanel({ language }: { language: string }) {
  const { isAuthenticated, token } = useAdminAuth();
  const { toast } = useToast();
  const isEs = language === "es";
  const [category, setCategory] = useState<AttorneyOrderCategoryId>("partners");
  const [orderedMembers, setOrderedMembers] = useState<TeamMember[]>([]);
  const [orderVersion, setOrderVersion] = useState("");
  const [orderDirty, setOrderDirty] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const copy = isEs
    ? {
        title: "Orden editorial", description: "El orden público se administra por categoría. Los perfiles ocultos conservan su posición.",
        category: "Categoría", instruction: "Arrastra en escritorio o usa Subir y Bajar. Los cambios se publican únicamente al guardar.",
        save: "Guardar orden", cancel: "Cancelar", pending: "Hay cambios de orden pendientes de guardar.",
        hidden: "Oculto", visible: "Publicado", loading: "Cargando orden…", error: "No se pudo cargar el orden de abogados.",
        retry: "Reintentar", staleTitle: "La lista cambió", staleDescription: "Se recargó el orden para evitar sobrescribir cambios de otro administrador.",
        saved: "Orden guardado", savedDescription: "El directorio público ya usa esta secuencia.", saveError: "No se pudo guardar el orden",
        saveErrorDescription: "Tus movimientos siguen visibles para que puedas intentarlo nuevamente.",
        move: "Arrastrar", up: "Subir", down: "Bajar", position: "Posición",
      }
    : {
        title: "Editorial order", description: "Public order is managed per category. Hidden profiles retain their position.",
        category: "Category", instruction: "Drag on desktop or use Move up and Move down. Changes publish only when saved.",
        save: "Save order", cancel: "Cancel", pending: "There are unsaved ordering changes.",
        hidden: "Hidden", visible: "Published", loading: "Loading order…", error: "Could not load attorney order.",
        retry: "Retry", staleTitle: "The list changed", staleDescription: "The order was reloaded to prevent overwriting another administrator's changes.",
        saved: "Order saved", savedDescription: "The public directory now uses this sequence.", saveError: "Could not save order",
        saveErrorDescription: "Your moves remain visible so you can try again.",
        move: "Drag", up: "Move up", down: "Move down", position: "Position",
      };

  const orderQuery = useQuery<AttorneyOrderResponse>({
    queryKey: ["/api/admin/team/order", category],
    queryFn: async () => {
      const response = await adminApiRequest("GET", `/api/admin/team/order?category=${encodeURIComponent(category)}`);
      if (!response.ok) throw new Error(copy.error);
      return response.json();
    },
    enabled: isAuthenticated && !!token,
  });

  useEffect(() => {
    if (!orderDirty && orderQuery.data) {
      setOrderedMembers(orderQuery.data.members);
      setOrderVersion(orderQuery.data.version);
    }
  }, [orderDirty, orderQuery.data]);

  const move = (id: string, direction: -1 | 1) => {
    setOrderedMembers((current) => {
      const from = current.findIndex((member) => member.id === id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setOrderDirty(true);
  };

  const drop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    setOrderedMembers((current) => {
      const from = current.findIndex((member) => member.id === draggedId);
      const to = current.findIndex((member) => member.id === targetId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setOrderDirty(true);
    setDraggedId(null);
    setDragOverId(null);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await adminApiRequest("PUT", "/api/admin/team/order", {
        category,
        ids: orderedMembers.map((member) => member.id),
        version: orderVersion,
      });
      if (response.status === 409) {
        const error = new Error("stale");
        throw error;
      }
      if (!response.ok) throw new Error("save");
      return response.json() as Promise<AttorneyOrderResponse>;
    },
    onSuccess: (result) => {
      queryClient.setQueryData(["/api/admin/team/order", category], result);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team"] });
      setOrderedMembers(result.members);
      setOrderVersion(result.version);
      setOrderDirty(false);
      toast({ title: copy.saved, description: copy.savedDescription });
    },
    onError: async (error: Error) => {
      if (error.message === "stale") {
        toast({ title: copy.staleTitle, description: copy.staleDescription, variant: "destructive" });
        setOrderDirty(false);
        const refreshed = await orderQuery.refetch();
        if (refreshed.data) {
          setOrderedMembers(refreshed.data.members);
          setOrderVersion(refreshed.data.version);
        }
        return;
      }
      toast({ title: copy.saveError, description: copy.saveErrorDescription, variant: "destructive" });
    },
  });

  const cancel = () => {
    setOrderedMembers(orderQuery.data?.members || []);
    setOrderVersion(orderQuery.data?.version || "");
    setOrderDirty(false);
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <Card className="border-[#D9D8D7] shadow-none">
      <CardHeader className="gap-4 border-b border-[#D9D8D7] bg-[#FAFAFA]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-md bg-[#AA1A2E]/10">
                <SlidersHorizontal className="size-4 text-[#AA1A2E]" strokeWidth={2} aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="text-lg text-[#1D1D1B]">{copy.title}</CardTitle>
                <CardDescription>{copy.description}</CardDescription>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">{copy.instruction}</p>
          </div>
          <div className="grid w-full gap-2 sm:grid-cols-[minmax(12rem,1fr)_auto_auto] lg:w-auto">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#4B4B4B]" htmlFor="attorney-order-category">{copy.category}</label>
              <Select
                value={category}
                disabled={orderDirty || saveMutation.isPending}
                onValueChange={(value) => setCategory(value as AttorneyOrderCategoryId)}
              >
                <SelectTrigger id="attorney-order-category" data-testid="select-attorney-order-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ATTORNEY_ORDER_CATEGORIES.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{isEs ? item.labelEs : item.labelEn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" variant="outline" className="self-end" onClick={cancel} disabled={!orderDirty || saveMutation.isPending} data-testid="button-cancel-attorney-order">
              <RotateCcw className="mr-2 size-4" aria-hidden="true" />{copy.cancel}
            </Button>
            <Button type="button" className="self-end bg-[#AA1A2E] hover:bg-[#8D1626] active:scale-[0.98]" onClick={() => saveMutation.mutate()} disabled={!orderDirty || saveMutation.isPending} data-testid="button-save-attorney-order">
              {saveMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : <Save className="mr-2 size-4" aria-hidden="true" />}{copy.save}
            </Button>
          </div>
        </div>
        {orderDirty && <p className="border-l-2 border-[#AA1A2E] pl-3 text-sm text-[#1D1D1B]" role="status">{copy.pending}</p>}
      </CardHeader>
      <CardContent className="p-0">
        {orderQuery.isLoading ? (
          <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden="true" />{copy.loading}</div>
        ) : orderQuery.isError ? (
          <div className="flex flex-col items-start gap-3 p-6">
            <p className="text-sm text-destructive">{copy.error}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => void orderQuery.refetch()}>{copy.retry}</Button>
          </div>
        ) : orderedMembers.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">{isEs ? "No hay abogados en esta categoría." : "There are no attorneys in this category."}</p>
        ) : (
          <ul className="divide-y divide-[#E7E5E4]" aria-label={`${copy.title}: ${ATTORNEY_ORDER_CATEGORIES.find((item) => item.id === category)?.[isEs ? "labelEs" : "labelEn"] || ""}`}>
            {orderedMembers.map((member, index) => {
              const publicName = getAttorneyPublicName(member);
              return <li
                key={member.id}
                className={`transition-colors ${dragOverId === member.id ? "bg-[#AA1A2E]/5" : ""}`}
                onDragOver={(event) => {
                  if (!draggedId) return;
                  event.preventDefault();
                  setDragOverId(member.id);
                }}
                onDragLeave={() => setDragOverId((current) => current === member.id ? null : current)}
                onDrop={(event) => {
                  event.preventDefault();
                  drop(member.id);
                }}
              >
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <button
                      type="button"
                      draggable
                      className="hidden size-9 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AA1A2E] active:cursor-grabbing sm:flex"
                      aria-label={`${copy.move} ${publicName}`}
                      title={copy.move}
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", member.id);
                        setDraggedId(member.id);
                      }}
                      onDragEnd={() => {
                        setDraggedId(null);
                        setDragOverId(null);
                      }}
                    >
                      <GripVertical className="size-5" aria-hidden="true" />
                    </button>
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums" aria-label={`${copy.position} ${index + 1}`}>{index + 1}</span>
                    <Avatar className="size-10 shrink-0 rounded-md">
                      <AvatarImage src={member.imageUrl || undefined} alt="" />
                      <AvatarFallback className="rounded-md text-xs">{initials(publicName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[#1D1D1B]">{publicName}</p>
                      <p className="truncate text-sm text-muted-foreground">{isEs ? member.titleEs : member.title}</p>
                    </div>
                    <Badge variant={member.published === false ? "secondary" : "outline"} className={member.published === false ? "ml-auto shrink-0" : "ml-auto shrink-0 border-emerald-600/30 bg-emerald-50 text-emerald-700"}>
                      {member.published === false ? copy.hidden : copy.visible}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button type="button" variant="outline" size="sm" onClick={() => move(member.id, -1)} disabled={index === 0 || saveMutation.isPending} aria-label={`${copy.up} ${publicName}`} data-testid={`button-attorney-order-up-${member.id}`}>
                      <ArrowUp className="mr-1 size-4" aria-hidden="true" />{copy.up}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => move(member.id, 1)} disabled={index === orderedMembers.length - 1 || saveMutation.isPending} aria-label={`${copy.down} ${publicName}`} data-testid={`button-attorney-order-down-${member.id}`}>
                      <ArrowDown className="mr-1 size-4" aria-hidden="true" />{copy.down}
                    </Button>
                  </div>
                </div>
              </li>;
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
