export function escapeCsvCell(value: unknown): string {
  let text = String(value ?? "").replace(/\r?\n/g, " ");
  // Excel y otras hojas de cálculo interpretan estas iniciales como fórmulas.
  // El apóstrofo fuerza texto sin alterar el valor visible para el administrador.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
