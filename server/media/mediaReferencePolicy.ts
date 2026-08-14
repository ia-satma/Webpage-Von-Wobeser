export function mediaReferenceKeys(value: unknown): string[] {
  if (typeof value !== 'string' || !value.trim()) return [];
  const original = value.trim();
  const pathname = original.split(/[?#]/, 1)[0];
  return original === pathname ? [pathname] : [original, pathname];
}

export function mediaItemIsReferenced(
  media: { path: string; filename: string },
  referencedPaths: ReadonlySet<string>,
): boolean {
  const candidates = [
    ...mediaReferenceKeys(media.path),
    `/uploads/${media.filename}`,
    media.filename,
  ];
  return candidates.some((candidate) => referencedPaths.has(candidate));
}
