import { useState } from "react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Briefcase, Clock, MapPin, Award, Users, 
  CheckCircle2, AlertCircle
} from "lucide-react";

interface TechnicianInterviewFormProps {
  onComplete: (data: InterviewData) => void;
  data: InterviewData;
}

export interface InterviewData {
  yearsExperience: string;
  availability: string;
  workAreas: string[];
  hasOwnTools: boolean;
  hasTransport: boolean;
  certifications: string;
  motivation: string;
  previousExperience: string;
}

const workAreaOptions = [
  "Luanda Centro",
  "Viana",
  "Cacuaco",
  "Talatona",
  "Kilamba",
  "Benfica",
  "Morro Bento",
  "Maianga",
];

export function TechnicianInterviewForm({ onComplete, data }: TechnicianInterviewFormProps) {
  const [formData, setFormData] = useState<InterviewData>(data);

  const updateField = <K extends keyof InterviewData>(field: K, value: InterviewData[K]) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onComplete(newData);
  };

  const toggleWorkArea = (area: string) => {
    const current = formData.workAreas || [];
    const newAreas = current.includes(area)
      ? current.filter(a => a !== area)
      : [...current, area];
    updateField("workAreas", newAreas);
  };

  return (
    <div className="space-y-6">
      {/* Experience */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-primary" />
          <Label className="text-foreground font-medium">Anos de Experiência</Label>
        </div>
        <RadioGroup
          value={formData.yearsExperience}
          onValueChange={(value) => updateField("yearsExperience", value)}
          className="grid grid-cols-2 gap-2"
        >
          {["Menos de 1 ano", "1-3 anos", "3-5 anos", "Mais de 5 anos"].map((option) => (
            <Label
              key={option}
              className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                formData.yearsExperience === option
                  ? "border-primary bg-primary/10"
                  : "border-border/50 bg-secondary/30 hover:border-primary/50"
              }`}
            >
              <RadioGroupItem value={option} className="sr-only" />
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                formData.yearsExperience === option ? "border-primary" : "border-muted-foreground"
              }`}>
                {formData.yearsExperience === option && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
              <span className="text-sm">{option}</span>
            </Label>
          ))}
        </RadioGroup>
      </motion.div>

      {/* Availability */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <Label className="text-foreground font-medium">Disponibilidade</Label>
        </div>
        <RadioGroup
          value={formData.availability}
          onValueChange={(value) => updateField("availability", value)}
          className="space-y-2"
        >
          {[
            { value: "full-time", label: "Tempo integral (40h/semana)" },
            { value: "part-time", label: "Meio período (20h/semana)" },
            { value: "weekends", label: "Fins de semana apenas" },
            { value: "flexible", label: "Horário flexível" },
          ].map((option) => (
            <Label
              key={option.value}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                formData.availability === option.value
                  ? "border-primary bg-primary/10"
                  : "border-border/50 bg-secondary/30 hover:border-primary/50"
              }`}
            >
              <RadioGroupItem value={option.value} className="sr-only" />
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                formData.availability === option.value ? "border-primary" : "border-muted-foreground"
              }`}>
                {formData.availability === option.value && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
              <span className="text-sm">{option.label}</span>
            </Label>
          ))}
        </RadioGroup>
      </motion.div>

      {/* Work Areas */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <Label className="text-foreground font-medium">Áreas de Atuação</Label>
        </div>
        <p className="text-xs text-muted-foreground">Selecione as regiões onde pode trabalhar</p>
        <div className="grid grid-cols-2 gap-2">
          {workAreaOptions.map((area) => (
            <Label
              key={area}
              className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                formData.workAreas?.includes(area)
                  ? "border-primary bg-primary/10"
                  : "border-border/50 bg-secondary/30 hover:border-primary/50"
              }`}
            >
              <Checkbox
                checked={formData.workAreas?.includes(area)}
                onCheckedChange={() => toggleWorkArea(area)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span className="text-sm">{area}</span>
            </Label>
          ))}
        </div>
      </motion.div>

      {/* Tools and Transport */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" />
          <Label className="text-foreground font-medium">Recursos</Label>
        </div>
        <div className="space-y-2">
          <Label
            className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
              formData.hasOwnTools
                ? "border-primary bg-primary/10"
                : "border-border/50 bg-secondary/30 hover:border-primary/50"
            }`}
          >
            <Checkbox
              checked={formData.hasOwnTools}
              onCheckedChange={(checked) => updateField("hasOwnTools", checked === true)}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <div>
              <span className="text-sm font-medium">Possuo ferramentas próprias</span>
              <p className="text-xs text-muted-foreground">Equipamentos necessários para o trabalho</p>
            </div>
            {formData.hasOwnTools && <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />}
          </Label>

          <Label
            className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
              formData.hasTransport
                ? "border-primary bg-primary/10"
                : "border-border/50 bg-secondary/30 hover:border-primary/50"
            }`}
          >
            <Checkbox
              checked={formData.hasTransport}
              onCheckedChange={(checked) => updateField("hasTransport", checked === true)}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <div>
              <span className="text-sm font-medium">Tenho transporte próprio</span>
              <p className="text-xs text-muted-foreground">Veículo para deslocação</p>
            </div>
            {formData.hasTransport && <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />}
          </Label>
        </div>
      </motion.div>

      {/* Certifications */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" />
          <Label className="text-foreground font-medium">Certificações (opcional)</Label>
        </div>
        <Input
          placeholder="Ex: Certificado em instalações elétricas, NR-10..."
          value={formData.certifications || ""}
          onChange={(e) => updateField("certifications", e.target.value)}
          className="h-12 rounded-xl bg-secondary/50 border-border/50"
        />
      </motion.div>

      {/* Previous Experience */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <Label className="text-foreground font-medium">Experiência Anterior</Label>
        </div>
        <Textarea
          placeholder="Descreva brevemente sua experiência profissional anterior..."
          value={formData.previousExperience || ""}
          onChange={(e) => updateField("previousExperience", e.target.value)}
          className="min-h-[100px] rounded-xl bg-secondary/50 border-border/50 resize-none"
        />
      </motion.div>

      {/* Motivation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-primary" />
          <Label className="text-foreground font-medium">Por que quer trabalhar conosco?</Label>
        </div>
        <Textarea
          placeholder="Conte-nos sua motivação para fazer parte da nossa equipa..."
          value={formData.motivation || ""}
          onChange={(e) => updateField("motivation", e.target.value)}
          className="min-h-[100px] rounded-xl bg-secondary/50 border-border/50 resize-none"
        />
      </motion.div>
    </div>
  );
}
