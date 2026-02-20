import { useState } from "react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Store, Clock, MapPin, ShoppingBag, 
  Package, TrendingUp, CheckCircle2, AlertCircle
} from "lucide-react";

export interface VendorInterviewData {
  yearsExperience: string;
  availability: string;
  workAreas: string[];
  storeType: string;
  hasPhysicalStore: boolean;
  hasDeliveryCapability: boolean;
  certifications: string;
  motivation: string;
  previousExperience: string;
  productCategories: string[];
  estimatedProducts: string;
}

interface VendorInterviewFormProps {
  data: VendorInterviewData;
  onComplete: (data: VendorInterviewData) => void;
}

const workAreaOptions = [
  "Luanda Centro", "Viana", "Cacuaco", "Talatona",
  "Kilamba", "Benfica", "Morro Bento", "Maianga",
];

const productCategoryOptions = [
  "Alimentos & Bebidas", "Electrónica", "Moda & Vestuário", "Casa & Decoração",
  "Saúde & Beleza", "Materiais de Construção", "Peças Auto", "Outros",
];

export function VendorInterviewForm({ data, onComplete }: VendorInterviewFormProps) {
  const [formData, setFormData] = useState<VendorInterviewData>(data);

  const updateField = <K extends keyof VendorInterviewData>(field: K, value: VendorInterviewData[K]) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onComplete(newData);
  };

  const toggleWorkArea = (area: string) => {
    const current = formData.workAreas || [];
    const newAreas = current.includes(area) ? current.filter(a => a !== area) : [...current, area];
    updateField("workAreas", newAreas);
  };

  const toggleProductCategory = (cat: string) => {
    const current = formData.productCategories || [];
    const newCats = current.includes(cat) ? current.filter(c => c !== cat) : [...current, cat];
    updateField("productCategories", newCats);
  };

  return (
    <div className="space-y-6">
      {/* Business Experience */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-primary flex-shrink-0" />
          <Label className="text-foreground font-medium">Há quanto tempo atua no comércio?</Label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {["Estou a começar", "Menos de 1 ano", "1-3 anos", "Mais de 3 anos"].map((option) => (
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

      {/* Product Categories */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-primary flex-shrink-0" />
          <Label className="text-foreground font-medium">Que tipo de produtos pretende vender?</Label>
        </div>
        <p className="text-xs text-muted-foreground">Selecione as categorias dos seus produtos</p>
        <div className="grid grid-cols-2 gap-2">
          {productCategoryOptions.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleProductCategory(cat)}
              className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all text-left ${formData.productCategories?.includes(cat) ? "border-primary bg-primary/10" : "border-border/50 bg-secondary/30 hover:border-primary/50"}`}
            >
              <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${formData.productCategories?.includes(cat) ? "bg-primary border-primary" : "border-muted-foreground"}`}>
                {formData.productCategories?.includes(cat) && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
              </div>
              <span className="text-xs">{cat}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Estimated Products */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-primary flex-shrink-0" />
          <Label className="text-foreground font-medium">Quantos produtos pretende listar inicialmente?</Label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {["1-10 produtos", "10-50 produtos", "50-100 produtos", "Mais de 100"].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => updateField("estimatedProducts", option)}
              className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all text-left ${formData.estimatedProducts === option ? "border-primary bg-primary/10" : "border-border/50 bg-secondary/30 hover:border-primary/50"}`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${formData.estimatedProducts === option ? "border-primary" : "border-muted-foreground"}`}>
                {formData.estimatedProducts === option && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <span className="text-sm">{option}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Availability */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary flex-shrink-0" />
          <Label className="text-foreground font-medium">Horário de funcionamento</Label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "full-time", label: "O dia inteiro (08h-18h)" },
            { value: "morning", label: "Manhã (08h-13h)" },
            { value: "afternoon", label: "Tarde (13h-18h)" },
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

      {/* Delivery Zones */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
          <Label className="text-foreground font-medium">Zonas de entrega/atendimento</Label>
        </div>
        <p className="text-xs text-muted-foreground">Selecione onde pode atender clientes</p>
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

      {/* Resources */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
          <Label className="text-foreground font-medium">Infraestrutura</Label>
        </div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => updateField("hasPhysicalStore", !formData.hasPhysicalStore)}
            className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all w-full text-left ${formData.hasPhysicalStore ? "border-primary bg-primary/10" : "border-border/50 bg-secondary/30 hover:border-primary/50"}`}
          >
            <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center ${formData.hasPhysicalStore ? "bg-primary border-primary" : "border-muted-foreground"}`}>
              {formData.hasPhysicalStore && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">Tenho loja física</span>
              <p className="text-xs text-muted-foreground">Ponto de venda ou armazém</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => updateField("hasDeliveryCapability", !formData.hasDeliveryCapability)}
            className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all w-full text-left ${formData.hasDeliveryCapability ? "border-primary bg-primary/10" : "border-border/50 bg-secondary/30 hover:border-primary/50"}`}
          >
            <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center ${formData.hasDeliveryCapability ? "bg-primary border-primary" : "border-muted-foreground"}`}>
              {formData.hasDeliveryCapability && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">Faço entregas próprias</span>
              <p className="text-xs text-muted-foreground">Capacidade de entregar ao cliente</p>
            </div>
          </button>
        </div>
      </motion.div>

      {/* Certifications */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-primary flex-shrink-0" />
          <Label className="text-foreground font-medium">Licenças comerciais (opcional)</Label>
        </div>
        <Input placeholder="Ex: Alvará comercial, NIF empresarial..." value={formData.certifications || ""} onChange={(e) => updateField("certifications", e.target.value)} className="h-12 rounded-xl bg-secondary/50 border-border/50" />
      </motion.div>

      {/* Previous Experience */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-primary flex-shrink-0" />
          <Label className="text-foreground font-medium">Experiência comercial anterior</Label>
        </div>
        <Textarea placeholder="Descreva sua experiência em vendas, se já vendeu online ou em lojas físicas..." value={formData.previousExperience || ""} onChange={(e) => updateField("previousExperience", e.target.value)} className="min-h-[100px] rounded-xl bg-secondary/50 border-border/50 resize-none" />
      </motion.div>

      {/* Motivation */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-primary flex-shrink-0" />
          <Label className="text-foreground font-medium">Por que quer vender na nossa plataforma?</Label>
        </div>
        <Textarea placeholder="Conte-nos o que o motiva a vender no Kilende..." value={formData.motivation || ""} onChange={(e) => updateField("motivation", e.target.value)} className="min-h-[100px] rounded-xl bg-secondary/50 border-border/50 resize-none" />
      </motion.div>
    </div>
  );
}
