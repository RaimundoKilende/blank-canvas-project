import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, MapPin, Camera, Send, Zap, Droplets, Wind,
  Sparkles, Monitor, Wrench, CheckCircle, Loader2,
  X, ImagePlus, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useServiceCategories } from "@/hooks/useServiceCategories";
import { useServices } from "@/hooks/useServices";
import { useGeolocation } from "@/hooks/useGeolocation";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap: Record<string, any> = {
  "zap": Zap, "droplets": Droplets, "wind": Wind,
  "sparkles": Sparkles, "monitor": Monitor, "wrench": Wrench,
};
const getIcon = (iconName: string) => iconMap[iconName.toLowerCase()] || Wrench;

export default function VendorRequestService() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, user } = useAuth();
  const { categories, isLoading: loadingCategories } = useServiceCategories();
  const { services } = useServices();
  const { latitude, longitude, address, loading: loadingLocation, getCurrentPosition } = useGeolocation();

  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [description, setDescription] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [urgency, setUrgency] = useState<"normal" | "urgent">("normal");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photosPreviews, setPhotosPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryServices = services.filter(s => s.category_id === selectedCategoryId);

  useEffect(() => {
    if (address && !addressInput) setAddressInput(address);
  }, [address]);

  useEffect(() => {
    if (selectedCategoryId && categoryServices.length === 1 && !selectedServiceId) {
      setSelectedServiceId(categoryServices[0].id);
    }
  }, [selectedCategoryId, categoryServices, selectedServiceId]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPhotos = Array.from(files).slice(0, 5 - photos.length);
    newPhotos.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setPhotosPreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
    setPhotos(prev => [...prev, ...newPhotos]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotosPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0 || !user) return [];
    const urls: string[] = [];
    for (const photo of photos) {
      const fileExt = photo.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { data, error } = await supabase.storage.from('service-photos').upload(fileName, photo, { cacheControl: '3600', upsert: false });
      if (!error && data) {
        const { data: publicUrl } = supabase.storage.from('service-photos').getPublicUrl(data.path);
        urls.push(publicUrl.publicUrl);
      }
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!selectedCategoryId || !description.trim() || !addressInput.trim()) {
      toast({ title: "Campos obrigatórios", description: "Preencha todos os campos.", variant: "destructive" });
      return;
    }
    if (!user) return;
    setLoading(true);
    try {
      const photoUrls = await uploadPhotos();
      const { error } = await supabase.from("service_requests").insert({
        client_id: user.id,
        category_id: selectedCategoryId,
        description,
        address: addressInput,
        latitude: latitude || null,
        longitude: longitude || null,
        urgency,
        photos: photoUrls.length > 0 ? photoUrls : [],
      });
      if (error) throw error;

      // Notify matching technicians
      const selectedCat = categories.find(c => c.id === selectedCategoryId);
      const categoryName = selectedCat?.name || "";
      const { data: eligibleTechnicians } = await supabase
        .from("technicians").select("user_id").eq("active", true).eq("verified", true);
      if (eligibleTechnicians && eligibleTechnicians.length > 0) {
        const notifications = eligibleTechnicians.map(tech => ({
          user_id: tech.user_id,
          title: "Nova solicitação de serviço!",
          message: `Uma loja precisa de ${categoryName}. Seja o primeiro a aceitar!`,
          type: "service_request",
          data: { client_id: user.id, category: categoryName, from_vendor: true },
        }));
        await supabase.from("notifications").insert(notifications);
      }
      setStep(3);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const selectedService = services.find(s => s.id === selectedServiceId);

  return (
    <MobileLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50">
          <div className="px-4 py-4">
            <div className="flex items-center gap-3 mb-3">
              <Button variant="ghost" size="icon" onClick={() => step === 3 ? navigate("/vendor") : step > 1 && !selectedCategoryId ? setStep(step - 1) : selectedCategoryId && step === 1 ? (setSelectedCategoryId(""), setSelectedServiceId("")) : navigate("/vendor")} className="h-10 w-10 rounded-xl bg-secondary/50">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <h1 className="font-display text-xl font-bold text-foreground">{step === 3 ? "Concluído" : "Solicitar Técnico"}</h1>
                <p className="text-sm text-muted-foreground">{step < 3 ? `Passo ${step} de 2` : "Solicitação criada"}</p>
              </div>
            </div>
            {step < 3 && (
              <div className="flex items-center gap-2">
                {[1, 2].map(i => (
                  <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= step ? "bg-primary" : "bg-secondary"}`} />
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <div className="px-4 py-6 pb-32">
          <AnimatePresence mode="wait">
            {/* Step 1: Category Selection */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-6">
                  <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                    {selectedCategoryId ? "Selecione o serviço" : "Que serviço precisa?"}
                  </h2>
                  <p className="text-muted-foreground">
                    {selectedCategoryId ? `Tipo de ${selectedCategory?.name?.toLowerCase()}` : "Escolha a categoria do serviço"}
                  </p>
                </div>

                {!selectedCategoryId ? (
                  loadingCategories ? (
                    <div className="grid grid-cols-2 gap-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {categories.map(cat => {
                        const Icon = getIcon(cat.icon);
                        return (
                          <button key={cat.id} onClick={() => setSelectedCategoryId(cat.id)} className="group p-5 rounded-2xl text-left bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg active:scale-[0.98] transition-all">
                            <div className="w-12 h-12 rounded-xl mb-3 flex items-center justify-center bg-secondary group-hover:bg-primary/10 transition-colors">
                              <Icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <p className="font-semibold text-sm text-foreground">{cat.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">A partir de {cat.base_price.toLocaleString()} Kz</p>
                          </button>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <div className="space-y-3">
                    {categoryServices.map(service => {
                      const Icon = getIcon(service.icon);
                      const isSelected = selectedServiceId === service.id;
                      return (
                        <button key={service.id} onClick={() => { setSelectedServiceId(service.id); setStep(2); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${isSelected ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"}`}>
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSelected ? "bg-primary/10" : "bg-secondary"}`}>
                            <Icon className={`w-6 h-6 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{service.name}</p>
                            {service.description && <p className="text-xs text-muted-foreground">{service.description}</p>}
                          </div>
                          <span className="text-sm font-bold text-primary">{service.base_price.toLocaleString()} Kz</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div className="mb-4">
                  <h2 className="font-display text-2xl font-bold text-foreground mb-2">Detalhes do serviço</h2>
                  <p className="text-muted-foreground">Descreva o problema e informe a localização</p>
                </div>

                {/* Selected service badge */}
                {selectedService && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <Badge className="bg-primary/10 text-primary border-0">{selectedCategory?.name}</Badge>
                    <span className="text-sm font-medium text-foreground">{selectedService.name}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Descreva o problema *</Label>
                  <Textarea placeholder="Ex: O sistema elétrico da loja precisa de manutenção..." value={description} onChange={e => setDescription(e.target.value)} className="min-h-[120px] rounded-xl bg-secondary/50 border-border/50 resize-none" />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Endereço da loja *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input placeholder="Endereço completo" value={addressInput} onChange={e => setAddressInput(e.target.value)} className="pl-12 h-12 rounded-xl bg-secondary/50 border-border/50" />
                  </div>
                  {!addressInput && (
                    <Button type="button" variant="outline" size="sm" onClick={getCurrentPosition} disabled={loadingLocation} className="w-full rounded-xl">
                      <MapPin className="w-4 h-4 mr-2" />
                      {loadingLocation ? "A obter localização..." : "Usar minha localização"}
                    </Button>
                  )}
                </div>

                {/* Urgency */}
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Urgência</Label>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setUrgency("normal")} className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition-all ${urgency === "normal" ? "border-primary bg-primary/10 text-primary" : "border-border/50 text-muted-foreground"}`}>Normal</button>
                    <button type="button" onClick={() => setUrgency("urgent")} className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-center gap-1 ${urgency === "urgent" ? "border-orange-500 bg-orange-500/10 text-orange-600" : "border-border/50 text-muted-foreground"}`}>
                      <AlertTriangle className="w-4 h-4" /> Urgente
                    </button>
                  </div>
                </div>

                {/* Photos */}
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Fotos (opcional)</Label>
                  <div className="flex gap-2 flex-wrap">
                    {photosPreviews.map((preview, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border/50">
                        <img src={preview} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive/80 flex items-center justify-center">
                          <X className="w-3 h-3 text-destructive-foreground" />
                        </button>
                      </div>
                    ))}
                    {photos.length < 5 && (
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="w-20 h-20 rounded-xl border-2 border-dashed border-border/50 flex items-center justify-center hover:border-primary/50 transition-colors">
                        <ImagePlus className="w-6 h-6 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />
                </div>

                <Button type="button" onClick={handleSubmit} disabled={loading} className="w-full h-12 gradient-primary text-primary-foreground rounded-xl font-semibold">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
                  {loading ? "Enviando..." : "Solicitar Técnico"}
                </Button>
              </motion.div>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 space-y-6">
                <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-2">Solicitação Enviada!</h2>
                  <p className="text-muted-foreground">Técnicos disponíveis serão notificados. Aguarde a confirmação.</p>
                </div>
                <div className="space-y-3">
                  <Button onClick={() => navigate("/vendor")} className="w-full h-12 gradient-primary text-primary-foreground rounded-xl font-semibold">
                    Voltar ao Painel
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MobileLayout>
  );
}
