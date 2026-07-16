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
        "bg-violet-600 text-white border-transparent hover:bg-violet-700 focus-visible:ring-violet-400",
        className,
      )}
    >
      {icon ?? <Bot className="h-4 w-4 mr-1.5 shrink-0" />}
      {children}
    </Button>
  );
}
