import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, FileText, Mail, Phone } from "lucide-react";

interface OrganizationFieldsProps {
  clientType: string;
  companyName: string;
  nif: string;
  organizationType?: string;
  onCompanyNameChange: (value: string) => void;
  onNifChange: (value: string) => void;
  onOrganizationTypeChange?: (value: string) => void;
}

const getFieldLabels = (clientType: string) => {
  switch (clientType) {
    case "company":
      return {
        nameLabel: "Nome da Empresa",
        namePlaceholder: "Ex: Empresa ABC, Lda",
        nifLabel: "NIF (Número de Identificação Fiscal)",
      };
    case "institution":
      return {
        nameLabel: "Nome da Instituição",
        namePlaceholder: "Ex: Escola Primária XYZ",
        nifLabel: "NIF da Instituição",
      };
    case "organization":
      return {
        nameLabel: "Nome da Organização",
        namePlaceholder: "Ex: ONG Ajuda Angola",
        nifLabel: "NIF da Organização",
      };
    default:
      return {
        nameLabel: "Nome",
        namePlaceholder: "",
        nifLabel: "NIF",
      };
  }
};

export function OrganizationFields({
  clientType,
  companyName,
  nif,
  onCompanyNameChange,
  onNifChange,
}: OrganizationFieldsProps) {
  const labels = getFieldLabels(clientType);

  if (clientType === "personal") {
    return null;
  }

  return (
    <div className="space-y-4 pt-2 border-t border-border/50">
      <p className="text-sm text-muted-foreground">
        Informações da {clientType === "company" ? "Empresa" : clientType === "institution" ? "Instituição" : "Organização"}
      </p>

      <div className="space-y-2">
        <Label htmlFor="companyName" className="text-foreground font-medium">
          {labels.nameLabel} *
        </Label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Building2 className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <Input
            id="companyName"
            type="text"
            placeholder={labels.namePlaceholder}
            value={companyName}
            onChange={(e) => onCompanyNameChange(e.target.value)}
            className="pl-12 h-12 rounded-xl bg-secondary/50 border-border/50 focus:border-primary focus:bg-background transition-all"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nif" className="text-foreground font-medium">
          {labels.nifLabel} *
        </Label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <FileText className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <Input
            id="nif"
            type="text"
            placeholder="Ex: 5000123456"
            value={nif}
            onChange={(e) => onNifChange(e.target.value)}
            className="pl-12 h-12 rounded-xl bg-secondary/50 border-border/50 focus:border-primary focus:bg-background transition-all"
            required
          />
        </div>
      </div>
    </div>
  );
}
