import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * StatBlock — cifra destacada del look viejo (número grande Publico + label
 * Geomanist uppercase). Se usa en "La firma en números" y estadísticas de
 * diversidad.
 */
export interface StatBlockProps {
  value: ReactNode;
  label: ReactNode;
  className?: string;
  "data-testid"?: string;
}

export default function StatBlock({
  value,
  label,
  className,
  "data-testid": testId,
}: StatBlockProps) {
  return (
    <div
      className={cn("text-center", className)}
      data-testid={testId}
    >
      <div className="font-serif text-5xl leading-none text-vw-red md:text-6xl">
        {value}
      </div>
      <div className="vw-label mt-3 text-[11px] text-vw-gray">{label}</div>
    </div>
  );
}
