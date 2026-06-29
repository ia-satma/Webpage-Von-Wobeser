import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export type Change = { label: string; before: string; after: string };

/** Formatea un valor a texto legible para el resumen. */
export function fmtValue(v: any): string {
  if (v === null || v === undefined || v === "") return "(vacío)";
  if (typeof v === "boolean") return v ? "Sí" : "No";
  if (Array.isArray(v)) return `${v.length} elemento(s)`;
  if (typeof v === "object") return JSON.stringify(v).slice(0, 80);
  const s = String(v);
  return s.length > 120 ? s.slice(0, 120) + "…" : s;
}

/** Compara original vs actual usando un mapa de etiquetas; devuelve los cambios. */
export function computeChanges(
  original: Record<string, any> | undefined,
  current: Record<string, any>,
  labels: Record<string, string>,
): Change[] {
  const out: Change[] = [];
  for (const key of Object.keys(labels)) {
    const before = fmtValue(original?.[key]);
    const after = fmtValue(current?.[key]);
    if (before !== after) out.push({ label: labels[key], before, after });
  }
  return out;
}

/**
 * Ventana de confirmación que muestra los cambios antes de guardar.
 * El usuario lee qué va a modificar y confirma o cancela.
 */
export function ConfirmChangesDialog({
  open,
  onOpenChange,
  changes,
  onConfirm,
  loading,
  title = "Confirmar cambios",
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  changes: Change[];
  onConfirm: () => void;
  loading?: boolean;
  title?: string;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            Revisa lo que vas a modificar antes de guardar.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="max-h-72 overflow-auto border divide-y text-sm" data-testid="changes-list">
          {changes.length === 0 ? (
            <p className="text-muted-foreground p-3">No detectamos cambios.</p>
          ) : (
            changes.map((c, i) => (
              <div key={i} className="p-3" data-testid={`change-${i}`}>
                <p className="font-medium">{c.label}</p>
                <p className="text-muted-foreground break-words">
                  <span className="line-through opacity-70">{c.before}</span>
                  <span className="mx-1">→</span>
                  <span className="text-foreground font-medium">{c.after}</span>
                </p>
              </div>
            ))
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel data-testid="confirm-cancel">Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={loading} data-testid="confirm-save">
            {loading ? "Guardando…" : "Confirmar y guardar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
