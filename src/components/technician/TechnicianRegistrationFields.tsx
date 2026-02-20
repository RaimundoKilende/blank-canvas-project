import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useSpecialties } from "@/hooks/useSpecialties";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TechnicianRegistrationFieldsProps {
  selectedSpecialties: string[];
  onSpecialtiesChange: (specialties: string[]) => void;
  documents: File[];
  onDocumentsChange: (documents: File[]) => void;
  hideSpecialties?: boolean;
}

export function TechnicianRegistrationFields({
  selectedSpecialties,
  onSpecialtiesChange,
  documents,
  onDocumentsChange,
  hideSpecialties = false,
}: TechnicianRegistrationFieldsProps) {
  const { specialties, isLoading } = useSpecialties();

  const handleSpecialtySelect = (value: string) => {
    if (!selectedSpecialties.includes(value)) {
      onSpecialtiesChange([...selectedSpecialties, value]);
    }
  };

  const removeSpecialty = (specialty: string) => {
    onSpecialtiesChange(selectedSpecialties.filter((s) => s !== specialty));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(
      (file) =>
        file.type === "application/pdf" ||
        file.type.startsWith("image/")
    );
    onDocumentsChange([...documents, ...validFiles]);
  };

  const removeDocument = (index: number) => {
    onDocumentsChange(documents.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Specialties Selection with Select */}
      {!hideSpecialties && (
      <div className="space-y-3">
        <Label>Especialidades *</Label>
        <p className="text-sm text-muted-foreground">
          Selecione os serviços que você está qualificado para realizar
        </p>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : specialties.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            Nenhuma especialidade disponível no momento. Contacte o administrador.
          </p>
        ) : (
          <>
            <Select onValueChange={handleSpecialtySelect}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma especialidade" />
              </SelectTrigger>
              <SelectContent>
              {specialties
                  .filter((s) => !selectedSpecialties.includes(s.name))
                  .map((specialty) => (
                    <SelectItem key={specialty.id} value={specialty.name}>
                      {specialty.name}
                      {specialty.category?.name && (
                        <span className="text-muted-foreground ml-2">
                          ({specialty.category.name})
                        </span>
                      )}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* Selected Specialties */}
            {selectedSpecialties.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedSpecialties.map((specialty) => (
                  <div
                    key={specialty}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary"
                  >
                    <span className="text-sm font-medium">{specialty}</span>
                    <button
                      type="button"
                      onClick={() => removeSpecialty(specialty)}
                      className="hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        
        {selectedSpecialties.length === 0 && (
          <p className="text-sm text-destructive">
            Selecione pelo menos uma especialidade
          </p>
        )}
      </div>
      )}

      {/* Document Upload */}
      <div className="space-y-3">
        <Label>Documentos *</Label>
        <p className="text-sm text-muted-foreground">
          Envie seus documentos de identificação e certificações (PDF ou imagens)
        </p>
        
        <div className="border-2 border-dashed border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
          <input
            type="file"
            id="document-upload"
            className="hidden"
            accept=".pdf,image/*"
            multiple
            onChange={handleFileUpload}
          />
          <label
            htmlFor="document-upload"
            className="flex flex-col items-center cursor-pointer"
          >
            <Upload className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="font-medium text-foreground mb-1">
              Clique para enviar documentos
            </p>
            <p className="text-sm text-muted-foreground">
              PDF ou imagens até 10MB cada
            </p>
          </label>
        </div>

        {/* Uploaded Documents List */}
        {documents.length > 0 && (
          <div className="space-y-2">
            {documents.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
              >
                <FileText className="w-5 h-5 text-primary" />
                <span className="flex-1 text-sm text-foreground truncate">
                  {file.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeDocument(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {documents.length === 0 && (
          <p className="text-sm text-destructive">
            Envie pelo menos um documento
          </p>
        )}
      </div>
    </div>
  );
}
