import { useState } from "react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Truck, Clock, MapPin, Shield, 
  Navigation, CheckCircle2, AlertCircle, Bike
} from "lucide-react";

export interface DeliveryInterviewData {
  yearsExperience: string;
  availability: string;
  workAreas: string[];
  vehicleType: string;
  hasLicense: boolean;
  hasInsurance: boolean;
  certifications: string;
  motivation: string;
  previousExperience: string;
  knowledgeOfCity: string;
  maxDeliveryRadius: string;
}

interface DeliveryInterviewFormProps {
  data: DeliveryInterviewData;
  onComplete: (data: DeliveryInterviewData) => void;
}

const workAreaOptions = [
  "Luanda Centro", "Viana", "Cacuaco", "Talatona",
  "Kilamba", "Benfica", "Morro Bento", "Maianga",
];

export function DeliveryInterviewForm({ data, onComplete }: DeliveryInterviewFormProps) {
  const [formData, setFormData] = useState<DeliveryInterviewData>(data);

  const updateField = <K extends keyof DeliveryInterviewData>(field: K, value: DeliveryInterviewData[K]) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onComplete(newData);
  };

  const toggleWorkArea = (area: string) => {
    const current = formData.workAreas || [];
    const newAreas = current.includes(area) ? current.filter(a => a !== area) : [...current, area];
    updateField("workAreas", newAreas);
  };

  return (
    <div className="space-y-6">
      {/* Vehicle Type */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <Bike className="w-4 h-4 text-primary flex-shrink-0" />
          <Label className="text-foreground font-medium">Que veículo utiliza para entregas?</Label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {["Bicicleta", "Moto", "Carro", "A pé"].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => updateField("vehicleType", option)}
              className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all text-left ${formData.vehicleType === option ? "border-primary bg-primary/10" : "border-border/50 bg-secondary/30 hover:border-primary/50"}`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${formData.vehicleType === option ? "border-primary" : "border-muted-foreground"}`}>
                {formData.vehicleType === option && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <span className="text-sm">{option}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Delivery Experience */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-primary flex-shrink-0" />
          <Label className="text-foreground font-medium">Experiência em entregas</Label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {["Sem experiência", "Menos de 1 ano", "1-3 anos", "Mais de 3 anos"].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => updateField("yearsExperience", option)}
              className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all text-left ${formData.yearsExperience === option ? "border-primary bg-primary/10" : "border-border/50 bg-secondary/30 hover:border-primary/50"}`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${formData.yearsExperience === option ? "border-primary" : "border-muted-foreground"}`}>
                {formData.yearsExperience === option && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <span className="text-sm">{option}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* City Knowledge */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-primary flex-shrink-0" />
          <Label className="text-foreground font-medium">Conhecimento da cidade</Label>
        </div>
        <div className="space-y-2">
          {[
            { value: "excellent", label: "Excelente — conheço muito bem as ruas e bairros" },
            { value: "good", label: "Bom — conheço as zonas principais" },
            { value: "basic", label: "Básico — uso GPS para navegar" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateField("knowledgeOfCity", option.value)}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all w-full text-left ${formData.knowledgeOfCity === option.value ? "border-primary bg-primary/10" : "border-border/50 bg-secondary/30 hover:border-primary/50"}`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${formData.knowledgeOfCity === option.value ? "border-primary" : "border-muted-foreground"}`}>
                {formData.knowledgeOfCity === option.value && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <span className="text-sm">{option.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Availability */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary flex-shrink-0" />
          <Label className="text-foreground font-medium">Disponibilidade para entregas</Label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "full-time", label: "Tempo integral" },
            { value: "part-time", label: "Meio período" },
            { value: "weekends", label: "Fins de semana" },
            { value: "flexible", label: "Horário flexível" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateField("availability", option.value)}
              className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all text-left ${formData.availability === option.value ? "border-primary bg-primary/10" : "border-border/50 bg-secondary/30 hover:border-primary/50"}`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${formData.availability === option.value ? "border-primary" : "border-muted-foreground"}`}>
                {formData.availability === option.value && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <span className="text-sm">{option.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Max Delivery Radius */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-primary flex-shrink-0" />
          <Label className="text-foreground font-medium">Raio máximo de entrega</Label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {["Até 5 km", "5-15 km", "15-30 km", "Sem limite"].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => updateField("maxDeliveryRadius", option)}
              className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all text-left ${formData.maxDeliveryRadius === option ? "border-primary bg-primary/10" : "border-border/50 bg-secondary/30 hover:border-primary/50"}`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${formData.maxDeliveryRadius === option ? "border-primary" : "border-muted-foreground"}`}>
                {formData.maxDeliveryRadius === option && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <span className="text-sm">{option}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Work Areas */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
          <Label className="text-foreground font-medium">Zonas de atuação</Label>
        </div>
        <p className="text-xs text-muted-foreground">Selecione onde pretende fazer entregas</p>
        <div className="grid grid-cols-2 gap-2">
          {workAreaOptions.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => toggleWorkArea(area)}
              className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all text-left ${formData.workAreas?.includes(area) ? "border-primary bg-primary/10" : "border-border/50 bg-secondary/30 hover:border-primary/50"}`}
            >
              <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${formData.workAreas?.includes(area) ? "bg-primary border-primary" : "border-muted-foreground"}`}>
                {formData.workAreas?.includes(area) && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
              </div>
              <span className="text-sm">{area}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* License & Insurance */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary flex-shrink-0" />
          <Label className="text-foreground font-medium">Documentação</Label>
        </div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => updateField("hasLicense", !formData.hasLicense)}
            className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all w-full text-left ${formData.hasLicense ? "border-primary bg-primary/10" : "border-border/50 bg-secondary/30 hover:border-primary/50"}`}
          >
            <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center ${formData.hasLicense ? "bg-primary border-primary" : "border-muted-foreground"}`}>
              {formData.hasLicense && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">Possuo carta de condução</span>
              <p className="text-xs text-muted-foreground">Válida para o veículo indicado</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => updateField("hasInsurance", !formData.hasInsurance)}
            className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all w-full text-left ${formData.hasInsurance ? "border-primary bg-primary/10" : "border-border/50 bg-secondary/30 hover:border-primary/50"}`}
          >
            <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center ${formData.hasInsurance ? "bg-primary border-primary" : "border-muted-foreground"}`}>
              {formData.hasInsurance && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">Tenho seguro do veículo</span>
              <p className="text-xs text-muted-foreground">Seguro activo e válido</p>
            </div>
          </button>
        </div>
      </motion.div>

      {/* Certifications */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary flex-shrink-0" />
          <Label className="text-foreground font-medium">Outras certificações (opcional)</Label>
        </div>
        <Input placeholder="Ex: Curso de condução defensiva, primeiros socorros..." value={formData.certifications || ""} onChange={(e) => updateField("certifications", e.target.value)} className="h-12 rounded-xl bg-secondary/50 border-border/50" />
      </motion.div>

      {/* Previous Experience */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-primary flex-shrink-0" />
          <Label className="text-foreground font-medium">Experiência anterior em entregas</Label>
        </div>
        <Textarea placeholder="Já trabalhou com entregas? Descreva onde e por quanto tempo..." value={formData.previousExperience || ""} onChange={(e) => updateField("previousExperience", e.target.value)} className="min-h-[100px] rounded-xl bg-secondary/50 border-border/50 resize-none" />
      </motion.div>

      {/* Motivation */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-primary flex-shrink-0" />
          <Label className="text-foreground font-medium">Por que quer ser entregador no Kilende?</Label>
        </div>
        <Textarea placeholder="Conte-nos o que o motiva a fazer entregas na nossa plataforma..." value={formData.motivation || ""} onChange={(e) => updateField("motivation", e.target.value)} className="min-h-[100px] rounded-xl bg-secondary/50 border-border/50 resize-none" />
      </motion.div>
    </div>
  );
}
