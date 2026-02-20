import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}

export function StatCard({ icon: Icon, label, value, change, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-6",
        "glass-card",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-3xl font-display font-bold text-foreground">{value}</p>
          
          {change && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-sm font-medium",
              change.positive ? "text-success" : "text-destructive"
            )}>
              <span>{change.positive ? "+" : ""}{change.value}%</span>
              <span className="text-muted-foreground font-normal">vs. último mês</span>
            </div>
          )}
        </div>
        
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
    </div>
  );
}
