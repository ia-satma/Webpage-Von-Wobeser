import type { Change } from "@/components/admin/ConfirmChangesDialog";
import type { NavigationConfiguration, NavigationPrimaryId } from "@shared/navigation";

export function moveAt<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const destination = index + direction;
  if (destination < 0 || destination >= items.length) return items;
  const next = [...items];
  [next[index], next[destination]] = [next[destination], next[index]];
  return next;
}

export function navigationChanges(
  original: NavigationConfiguration | undefined,
  current: NavigationConfiguration,
): Change[] {
  if (!original) return [];
  const changes: Change[] = [];
  const originalOrder = original.items.map((item) => item.labelEs).join(" · ");
  const currentOrder = current.items.map((item) => item.labelEs).join(" · ");
  if (originalOrder !== currentOrder) changes.push({ label: "Orden principal", before: originalOrder, after: currentOrder });
  const originals = new Map(original.items.map((item) => [item.id, item]));
  for (const item of current.items) {
    const before = originals.get(item.id);
    if (!before) continue;
    if (before.labelEs !== item.labelEs) changes.push({ label: `${before.labelEs} — español`, before: before.labelEs, after: item.labelEs });
    if (before.labelEn !== item.labelEn) changes.push({ label: `${before.labelEs} — inglés`, before: before.labelEn, after: item.labelEn });
    if (before.visible !== item.visible) changes.push({ label: `${item.labelEs} — visibilidad`, before: before.visible ? "Visible" : "Oculto", after: item.visible ? "Visible" : "Oculto" });
    const previousChildren = new Map(before.children.map((child) => [child.id, child]));
    const previousOrder = before.children.map((child) => child.labelEs).join(" · ");
    const nextOrder = item.children.map((child) => child.labelEs).join(" · ");
    if (previousOrder !== nextOrder) changes.push({ label: `${item.labelEs} — orden interno`, before: previousOrder, after: nextOrder });
    for (const child of item.children) {
      const previous = previousChildren.get(child.id);
      if (!previous) continue;
      if (previous.labelEs !== child.labelEs) changes.push({ label: `${item.labelEs} / ${previous.labelEs} — español`, before: previous.labelEs, after: child.labelEs });
      if (previous.labelEn !== child.labelEn) changes.push({ label: `${item.labelEs} / ${previous.labelEs} — inglés`, before: previous.labelEn, after: child.labelEn });
      if (previous.visible !== child.visible) changes.push({ label: `${item.labelEs} / ${child.labelEs} — visibilidad`, before: previous.visible ? "Visible" : "Oculto", after: child.visible ? "Visible" : "Oculto" });
    }
  }
  if (original.utilities.search.labelEs !== current.utilities.search.labelEs) changes.push({ label: "Buscar — español", before: original.utilities.search.labelEs, after: current.utilities.search.labelEs });
  if (original.utilities.search.labelEn !== current.utilities.search.labelEn) changes.push({ label: "Buscar — inglés", before: original.utilities.search.labelEn, after: current.utilities.search.labelEn });
  if (original.utilities.contact.labelEs !== current.utilities.contact.labelEs) changes.push({ label: "Contacto — español", before: original.utilities.contact.labelEs, after: current.utilities.contact.labelEs });
  if (original.utilities.contact.labelEn !== current.utilities.contact.labelEn) changes.push({ label: "Contacto — inglés", before: original.utilities.contact.labelEn, after: current.utilities.contact.labelEn });
  return changes;
}

export function updateNavigationItem(
  configuration: NavigationConfiguration,
  id: NavigationPrimaryId,
  update: (item: NavigationConfiguration["items"][number]) => NavigationConfiguration["items"][number],
): NavigationConfiguration {
  return { ...configuration, items: configuration.items.map((item) => item.id === id ? update(item) : item) };
}
