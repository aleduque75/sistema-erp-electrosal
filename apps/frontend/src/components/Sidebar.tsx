import { cn } from "@/lib/utils";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  return (
    <div className={cn(
      "hidden", // Oculta completamente o sidebar
      className
    )}>
      {/* Conteúdo do sidebar removido */}
    </div>
  );
}