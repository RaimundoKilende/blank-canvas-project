import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick?: () => void;
  className?: string;
}

export function ServiceCard({ icon: Icon, title, description, onClick, className }: ServiceCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl p-6 cursor-pointer",
        "bg-card/50 hover:bg-card border border-border/50 hover:border-primary/30",
        "transition-all duration-300 hover-lift",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <div className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-xl gradient-primary shadow-lg">
          <Icon className="w-7 h-7 text-primary-foreground" />
        </div>
        
        <h3 className="font-display text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        
        <p className="text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>
      </div>
    </div>
  );
}
