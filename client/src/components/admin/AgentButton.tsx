import * as React from "react";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

type AgentButtonProps = React.ComponentProps<typeof Button> & { icon?: React.ReactNode };

/**
 * Botón para acciones que dispara un AGENTE de IA. Color distinto (violeta) + ícono de robot,
 * para que a simple vista se reconozca qué botones son "de agente" en todo el panel.
 * Uso: <AgentButton onClick={...}>Traducir con IA</AgentButton>
 */
export function AgentButton({ className, children, icon, ...props }: AgentButtonProps) {
  return (
    <Button
      {...props}
      className={cn(
        "bg-blue-600 text-white border-transparent shadow-sm transition-all duration-200",
        "hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
        "focus-visible:ring-blue-400",
        className,
      )}
    >
      {icon ?? <Bot className="h-4 w-4 mr-1.5 shrink-0" />}
      {children}
    </Button>
  );
}
