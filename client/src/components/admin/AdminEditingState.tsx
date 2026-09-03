import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

type EditRegistration = {
  id: string;
  isDirty: boolean;
  isSaving?: boolean;
};

type EditingStateValue = {
  register: (state: EditRegistration) => () => void;
  requestNavigation: (navigate: () => void) => void;
  hasUnsavedChanges: boolean;
};

const EditingStateContext = createContext<EditingStateValue | null>(null);

export function AdminEditingStateProvider({ children }: { children: ReactNode }) {
  const [registrations, setRegistrations] = useState<Record<string, EditRegistration>>({});
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const registrationsRef = useRef(registrations);
  const skipNextHistoryEvent = useRef(false);
  registrationsRef.current = registrations;

  const hasUnsavedChanges = Object.values(registrations).some((entry) => entry.isDirty);

  const register = useCallback((state: EditRegistration) => {
    setRegistrations((current) => ({ ...current, [state.id]: state }));
    return () => setRegistrations((current) => {
      const { [state.id]: _removed, ...remaining } = current;
      return remaining;
    });
  }, []);

  const requestNavigation = useCallback((navigate: () => void) => {
    if (Object.values(registrationsRef.current).some((entry) => entry.isDirty)) {
      setPendingNavigation(() => navigate);
      return;
    }
    navigate();
  }, []);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!Object.values(registrationsRef.current).some((entry) => entry.isDirty)) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, []);

  // Browsers do not expose a cancellable `popstate`.  When an editor uses Back,
  // return immediately to the current form, show the same confirmation used by
  // the sidebar, and repeat the Back action only after the editor confirms it.
  useEffect(() => {
    const onPopState = () => {
      if (skipNextHistoryEvent.current) {
        skipNextHistoryEvent.current = false;
        return;
      }
      if (!Object.values(registrationsRef.current).some((entry) => entry.isDirty)) return;
      skipNextHistoryEvent.current = true;
      window.history.go(1);
      setPendingNavigation(() => () => {
        skipNextHistoryEvent.current = true;
        window.history.back();
      });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const value = useMemo(() => ({ register, requestNavigation, hasUnsavedChanges }), [register, requestNavigation, hasUnsavedChanges]);

  return (
    <EditingStateContext.Provider value={value}>
      {children}
      <AlertDialog open={!!pendingNavigation} onOpenChange={(open) => !open && setPendingNavigation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hay cambios sin guardar</AlertDialogTitle>
            <AlertDialogDescription>
              Si sales ahora, los cambios de este formulario se perderán. Guarda el borrador antes de continuar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir editando</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                const navigate = pendingNavigation;
                setPendingNavigation(null);
                navigate?.();
              }}
            >
              Salir sin guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </EditingStateContext.Provider>
  );
}

export function useAdminEditingState(): EditingStateValue {
  const context = useContext(EditingStateContext);
  if (!context) throw new Error("useAdminEditingState must be used within AdminEditingStateProvider");
  return context;
}

/** Registers a form and supplies the visible, consistent editing state. */
export function useAdminEditRegistration(state: EditRegistration): void {
  const { register } = useAdminEditingState();
  useEffect(() => register(state), [register, state.id, state.isDirty, state.isSaving]);
}

export function AdminEditStatus({
  isDirty,
  isSaving,
  published,
}: {
  isDirty: boolean;
  isSaving?: boolean;
  published?: boolean;
}) {
  const label = isSaving ? "Guardando…" : isDirty ? "Cambios sin guardar" : "Cambios guardados";
  const style = isSaving
    ? "border-amber-200 bg-amber-50 text-amber-900"
    : isDirty
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-emerald-200 bg-emerald-50 text-emerald-900";
  return (
    <div className="flex flex-wrap items-center gap-2" aria-live="polite" data-testid="admin-edit-status">
      <Badge variant="outline" className={style}>
        {isSaving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
        {label}
      </Badge>
      {published !== undefined && (
        <Badge variant="outline" className={published ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-slate-50 text-slate-700"}>
          {published ? "Publicado" : "Borrador"}
        </Badge>
      )}
    </div>
  );
}
