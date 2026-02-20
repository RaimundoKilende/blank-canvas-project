import { User, Building2, GraduationCap, Users } from "lucide-react";
import { Label } from "@/components/ui/label";

interface ClientTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const clientTypes = [
  {
    value: "personal",
    label: "Pessoal",
    description: "Uso doméstico",
    icon: User,
  },
  {
    value: "company",
    label: "Empresa",
    description: "Uso comercial",
    icon: Building2,
  },
  {
    value: "institution",
    label: "Instituição",
    description: "Escola, hospital, etc.",
    icon: GraduationCap,
  },
  {
    value: "organization",
    label: "Organização",
    description: "ONG, associação, etc.",
    icon: Users,
  },
];

export function ClientTypeSelector({ value, onChange }: ClientTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-foreground font-medium">Tipo de Perfil</Label>
      <div className="grid grid-cols-2 gap-3">
        {clientTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = value === type.value;
          
          return (
            <button
              key={type.value}
              type="button"
              onClick={() => onChange(type.value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                isSelected
                  ? "border-primary bg-primary/10 shadow-lg"
                  : "border-border/50 hover:border-primary/50 bg-secondary/30"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isSelected ? "gradient-primary" : "bg-secondary"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isSelected ? "text-primary-foreground" : "text-muted-foreground"
                  }`}
                />
              </div>
              <div className="text-center">
                <span
                  className={`font-medium text-sm block ${
                    isSelected ? "text-primary" : "text-foreground"
                  }`}
                >
                  {type.label}
                </span>
                <span className="text-xs text-muted-foreground">{type.description}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
