import { CheckCircle2, Circle } from "lucide-react";

export type CompletionItem = { label: string; complete: boolean; hint?: string };

/** A guide only: it never blocks saving a draft or hides an editorial field. */
export function AdminCompletionChecklist({ title = "Revisión antes de publicar", items }: { title?: string; items: CompletionItem[] }) {
  return (
    <aside className="mb-5 border-l-2 border-primary/30 bg-muted/30 px-4 py-3" aria-label={title} data-testid="admin-completion-checklist">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground">{title}</p>
      <ul className="mt-2 grid gap-1.5 text-sm sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.label} className="flex min-w-0 items-start gap-2">
            {item.complete ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
            <span className={item.complete ? "text-foreground" : "text-muted-foreground"}>
              {item.label}{item.hint && !item.complete ? <span className="text-xs"> · {item.hint}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
