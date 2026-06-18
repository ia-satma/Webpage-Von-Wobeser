import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * FormControls — primitivas de formulario con el look viejo de Von Wobeser.
 *
 * Inputs/textarea/select con borde fino gris, focus rojo corporativo,
 * tipografía Optima y labels Geomanist uppercase. Reemplazan visualmente a
 * los componentes shadcn (que cargan el design system nuevo) manteniendo
 * compatibilidad con react-hook-form vía `ref` + props nativas.
 */

const baseField =
  "w-full rounded-none border border-vw-graylight bg-white px-4 py-3 font-sans text-base text-vw-black " +
  "placeholder:text-vw-graylight transition-colors outline-none " +
  "focus:border-vw-red focus-visible:border-vw-red";

export function FirmLabel({
  htmlFor,
  children,
  className,
}: {
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("vw-label mb-2 block text-[11px] text-vw-gray", className)}
    >
      {children}
    </label>
  );
}

export function FirmError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 font-sans text-sm text-vw-red" role="alert">
      {message}
    </p>
  );
}

export interface FirmInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const FirmInput = forwardRef<HTMLInputElement, FirmInputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(baseField, invalid && "border-vw-red", className)}
      {...props}
    />
  ),
);
FirmInput.displayName = "FirmInput";

export interface FirmTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const FirmTextarea = forwardRef<HTMLTextAreaElement, FirmTextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(baseField, "min-h-[140px] resize-y", invalid && "border-vw-red", className)}
      {...props}
    />
  ),
);
FirmTextarea.displayName = "FirmTextarea";

export interface FirmSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const FirmSelect = forwardRef<HTMLSelectElement, FirmSelectProps>(
  ({ className, invalid, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(baseField, "cursor-pointer appearance-none pr-10", invalid && "border-vw-red", className)}
      {...props}
    >
      {children}
    </select>
  ),
);
FirmSelect.displayName = "FirmSelect";

/**
 * FirmSubmit — botón de envío con el look viejo (rojo corporativo, label
 * Geomanist uppercase, sin radios).
 */
export function FirmSubmit({
  children,
  disabled,
  className,
  "data-testid": testId,
}: {
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  "data-testid"?: string;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      data-testid={testId}
      className={cn(
        "vw-label inline-flex items-center justify-center gap-2 rounded-none bg-vw-red px-8 py-3.5 text-xs text-white",
        "transition-colors hover:bg-vw-black disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}
