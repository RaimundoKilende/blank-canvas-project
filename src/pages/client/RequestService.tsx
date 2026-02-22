import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, MapPin, Clock, Camera, Send, Zap, Droplets, Wind,
  Sparkles, Monitor, Wrench, CheckCircle, Loader2, ArrowRight,
  FileText, AlertTriangle, X, ImagePlus, CalendarIcon
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useServiceCategories } from "@/hooks/useServiceCategories";
import { useServices } from "@/hooks/useServices";
import { useServiceRequests } from "@/hooks/useServiceRequests";
import { useTechnicians } from "@/hooks/useTechnicians";
import { useGeolocation } from "@/hooks/useGeolocation";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { AudioRecorder } from "@/components/client/AudioRecorder";

// Icon mapping for service categories
const iconMap: Record<string, any> = {
  "zap": Zap,
  "droplets": Droplets,
  "wind": Wind,
  "sparkles": Sparkles,
  "monitor": Monitor,
  "wrench": Wrench,
};

const getIcon = (iconName: string) => {
  return iconMap[iconName.toLowerCase()] || Wrench;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring" as const, damping: 20, stiffness: 300 }
  }
};

const stepTitles = {
  1: { title: "Escolha o serviço", subtitle: "Selecione a categoria do serviço que você precisa" },
  2: { title: "Detalhes do serviço", subtitle: "Descreva o problema e informe sua localização" },
  3: { title: "Solicitação enviada!", subtitle: "Aguarde a confirmação do técnico" }
};

export default function RequestService() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { profile, user } = useAuth();
  const { categories, isLoading: loadingCategories } = useServiceCategories();
  const { services, isLoading: loadingServices } = useServices();
  const { technicians } = useTechnicians();
  const { createRequest } = useServiceRequests();
  const { latitude, longitude, address, loading: loadingLocation, getCurrentPosition } = useGeolocation();
  
  const preSelectedCategory = searchParams.get("category");
  const preSelectedService = searchParams.get("service");
  const preSelectedTechnician = searchParams.get("technician");
  const isDirectRequest = searchParams.get("direct") === "true";
  
  const [selectedCategoryId, setSelectedCategoryId] = useState(preSelectedCategory || "");
  const [selectedServiceId, setSelectedServiceId] = useState(preSelectedService || "");
  const [description, setDescription] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [urgency, setUrgency] = useState<"normal" | "urgent">("normal");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(preSelectedService ? 2 : 1);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photosPreviews, setPhotosPreviews] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [schedulingType, setSchedulingType] = useState<"now" | "scheduled">("now");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAudioReady = useCallback((url: string | null) => {
    setAudioUrl(url);
  }, []);

  // Get selected technician info
  const selectedTechnician = preSelectedTechnician 
    ? technicians.find(t => t.user_id === preSelectedTechnician)
    : null;

  // Filter services by selected category
  const categoryServices = services.filter(s => s.category_id === selectedCategoryId);

  // Update address input when geolocation is available
  useEffect(() => {
    if (address && !addressInput) {
      setAddressInput(address);
    }
  }, [address]);

  // Set service ID when category changes and there's only one service
  useEffect(() => {
    if (selectedCategoryId && categoryServices.length === 1 && !selectedServiceId) {
      setSelectedServiceId(categoryServices[0].id);
    }
  }, [selectedCategoryId, categoryServices, selectedServiceId]);

  // Auto-set category from preSelected service
  useEffect(() => {
    if (preSelectedService && services.length > 0 && !selectedCategoryId) {
      const service = services.find(s => s.id === preSelectedService);
      if (service) {
        setSelectedCategoryId(service.category_id);
        setSelectedServiceId(preSelectedService);
      }
    }
  }, [preSelectedService, services, selectedCategoryId]);

  // Handle photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos = Array.from(files).slice(0, 5 - photos.length); // Max 5 photos
    
    // Create previews
    newPhotos.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotosPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setPhotos(prev => [...prev, ...newPhotos]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove photo
  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotosPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Upload photos to storage
  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0 || !user) return [];
    
    setUploadingPhotos(true);
    const uploadedUrls: string[] = [];

    try {
      for (const photo of photos) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('service-photos')
          .upload(fileName, photo, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Upload error:', error);
          continue;
        }

        const { data: publicUrl } = supabase.storage
          .from('service-photos')
          .getPublicUrl(data.path);

        uploadedUrls.push(publicUrl.publicUrl);
      }
    } finally {
      setUploadingPhotos(false);
    }

    return uploadedUrls;
  };

  const handleSubmit = async () => {
    const missingFields: string[] = [];
    if (!selectedCategoryId) missingFields.push("categoria");
    if (!description.trim()) missingFields.push("descrição do problema");
    if (!addressInput.trim()) missingFields.push("endereço");
    if (schedulingType === "scheduled" && !scheduledDate) missingFields.push("data do agendamento");
    if (schedulingType === "scheduled" && !scheduledTime) missingFields.push("hora do agendamento");

    if (missingFields.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: `Preencha: ${missingFields.join(", ")}.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Upload photos first
      const photoUrls = await uploadPhotos();

      await createRequest.mutateAsync({
        category_id: selectedCategoryId,
        description,
        address: addressInput,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        urgency,
        photos: photoUrls.length > 0 ? photoUrls : undefined,
        audio_url: audioUrl || undefined,
        technician_id: isDirectRequest && preSelectedTechnician ? preSelectedTechnician : undefined,
        scheduling_type: schedulingType,
        scheduled_date: schedulingType === "scheduled" && scheduledDate ? format(scheduledDate, "yyyy-MM-dd") : undefined,
        scheduled_time: schedulingType === "scheduled" && scheduledTime ? scheduledTime : undefined,
      });

      if (isDirectRequest && preSelectedTechnician && user) {
        await supabase.from("notifications").insert({
          user_id: preSelectedTechnician,
          title: "Nova solicitação direta!",
          message: `${profile?.name || "Um cliente"} solicitou seu serviço diretamente.`,
          type: "service_request",
          data: { client_id: user.id, direct_request: true },
        });
      } else if (!isDirectRequest && user) {
        const selectedCat = categories.find(c => c.id === selectedCategoryId);
        const categoryName = selectedCat?.name || "";
        const selectedSvc = services.find(s => s.id === selectedServiceId);
        const serviceName = selectedSvc?.name || categoryName;

        // Get eligible technicians whose specialties match the selected service name
        const { data: eligibleTechnicians } = await supabase
          .from("technicians")
          .select("user_id, specialties")
          .eq("active", true)
          .eq("verified", true);

        if (eligibleTechnicians && eligibleTechnicians.length > 0) {
          const serviceNameLower = serviceName.toLowerCase();
          const serviceWords = serviceNameLower.split(/\s+/).filter(w => w.length > 2);

          const matchingTechnicians = eligibleTechnicians.filter(tech => {
            if (!tech.specialties || tech.specialties.length === 0) return false;
            return tech.specialties.some((techSpec: string) => {
              const specLower = techSpec.toLowerCase();
              // Direct match
              if (specLower.includes(serviceNameLower) || serviceNameLower.includes(specLower)) return true;
              // Fuzzy word match
              const specWords = specLower.split(/\s+/).filter(w => w.length > 2);
              const matchCount = serviceWords.filter(sw => 
                specWords.some(spw => spw.includes(sw) || sw.includes(spw))
              ).length;
              return matchCount >= Math.max(1, Math.floor(serviceWords.length * 0.6));
            });
          });

          const notifications = matchingTechnicians.map(tech => ({
            user_id: tech.user_id,
            title: "Nova solicitação de serviço!",
            message: `Um cliente precisa de ${serviceName}. ${selectedSvc?.price_type === "quote" ? "Envie seu orçamento!" : "Seja o primeiro a aceitar!"}`,
            type: "service_request",
            data: { client_id: user.id, category: categoryName, category_id: selectedCategoryId, service_name: serviceName, broadcast: true },
          }));

          if (notifications.length > 0) {
            await supabase.from("notifications").insert(notifications);
          }
        }
      }
      
      setStep(3);
    } catch (error) {
      console.error("Error creating request:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const selectedService = services.find((s) => s.id === selectedServiceId);
  const SelectedIcon = selectedService 
    ? getIcon(selectedService.icon) 
    : selectedCategory 
      ? getIcon(selectedCategory.icon) 
      : Zap;

  const calculateEstimatedPrice = () => {
    const basePrice = selectedService?.base_price || selectedCategory?.base_price || 0;
    const urgencyMultiplier = urgency === "urgent" ? 1.2 : 1;
    return `${(basePrice * urgencyMultiplier).toLocaleString()} Kz`;
  };

  const handleBack = () => {
    if (step === 2 && selectedCategoryId && !preSelectedService) {
      setSelectedCategoryId("");
      setSelectedServiceId("");
    } else if (step > 1 && step < 3) {
      setStep(step - 1);
    } else {
      navigate(-1);
    }
  };

  const currentStepInfo = stepTitles[step as keyof typeof stepTitles];

  return (
    <MobileLayout>
      <div className="min-h-screen bg-background">
        {/* Premium Sticky Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50"
        >
          <div className="px-4 py-4">
            <div className="flex items-center gap-3 mb-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-10 w-10 rounded-xl bg-secondary/50 hover:bg-secondary"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <h1 className="font-display text-xl font-bold text-foreground">
                  {step === 3 ? "Concluído" : "Nova Solicitação"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {step < 3 ? `Passo ${step} de 2` : "Solicitação criada com sucesso"}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            {step < 3 && (
              <div className="flex items-center gap-2">
                {[1, 2].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    className={`flex-1 h-1.5 rounded-full transition-colors origin-left ${
                      i <= step ? "bg-primary" : "bg-secondary"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Content */}
        <div className="px-4 py-6 pb-32">
          <AnimatePresence mode="wait">
            {/* Direct Request Banner */}
            {isDirectRequest && selectedTechnician && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-2xl bg-primary/5 border border-primary/20"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {selectedTechnician.profile?.name?.split(" ").map(n => n[0]).join("") || "T"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Solicitação direta para</p>
                    <p className="font-semibold text-foreground">{selectedTechnician.profile?.name}</p>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-0">
                    Direto
                  </Badge>
                </div>
              </motion.div>
            )}

            {/* Step 1: Category & Service Selection */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6">
                  <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                    {selectedCategoryId ? "Selecione o serviço" : currentStepInfo.title}
                  </h2>
                  <p className="text-muted-foreground">
                    {selectedCategoryId 
                      ? `Escolha o tipo específico de ${selectedCategory?.name?.toLowerCase()}`
                      : currentStepInfo.subtitle
                    }
                  </p>
                </div>

                {!selectedCategoryId ? (
                  // Categories Grid
                  <>
                    {loadingCategories ? (
                      <div className="grid grid-cols-2 gap-3">
                        {[...Array(6)].map((_, i) => (
                          <Skeleton key={i} className="h-28 rounded-2xl" />
                        ))}
                      </div>
                    ) : categories.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto mb-4 flex items-center justify-center">
                          <Wrench className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">Nenhum serviço disponível</p>
                      </motion.div>
                    ) : (
                      <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-2 gap-3"
                      >
                        {categories.map((category) => {
                          const IconComponent = getIcon(category.icon);
                          return (
                            <motion.button
                              key={category.id}
                              variants={itemVariants}
                              onClick={() => setSelectedCategoryId(category.id)}
                              className="group relative p-5 rounded-2xl text-left transition-all bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]"
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                              <div className="relative z-10">
                                <div className="w-12 h-12 rounded-xl mb-3 flex items-center justify-center bg-secondary group-hover:bg-primary/10 transition-colors">
                                  <IconComponent className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <p className="font-semibold text-foreground text-sm mb-1 group-hover:text-primary transition-colors">
                                  {category.name}
                                </p>
                                <p className="text-xs text-primary/70 font-medium">
                                  A partir de {category.base_price.toLocaleString()} Kz
                                </p>
                              </div>
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    )}
                  </>
                ) : (
                  // Services List
                  <>
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => {
                        setSelectedCategoryId("");
                        setSelectedServiceId("");
                      }}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Trocar categoria
                    </motion.button>

                    {loadingServices ? (
                      <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                          <Skeleton key={i} className="h-24 rounded-2xl" />
                        ))}
                      </div>
                    ) : categoryServices.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto mb-4 flex items-center justify-center">
                          <FileText className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">Nenhum serviço nesta categoria</p>
                      </motion.div>
                    ) : (
                      <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-3"
                      >
                        {categoryServices.map((service) => {
                          const IconComponent = getIcon(service.icon);
                          const isSelected = selectedServiceId === service.id;
                          return (
                            <motion.button
                              key={service.id}
                              variants={itemVariants}
                              onClick={() => setSelectedServiceId(service.id)}
                              className={`group w-full p-4 rounded-2xl text-left transition-all ${
                                isSelected
                                  ? "bg-primary/10 border-2 border-primary shadow-lg shadow-primary/10"
                                  : "bg-card border border-border/50 hover:border-primary/30 hover:shadow-md"
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                                  isSelected ? "gradient-primary" : "bg-secondary group-hover:bg-primary/10"
                                }`}>
                                  <IconComponent className={`w-6 h-6 ${
                                    isSelected ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                                  }`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`font-semibold mb-1 transition-colors ${
                                    isSelected ? "text-primary" : "text-foreground"
                                  }`}>
                                    {service.name}
                                  </p>
                                  {service.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                      {service.description}
                                    </p>
                                  )}
                                  <p className="text-sm font-medium text-primary/70 mt-1">
                                    A partir de {service.base_price.toLocaleString()} Kz
                                  </p>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                  isSelected ? "border-primary bg-primary" : "border-border"
                                }`}>
                                  {isSelected && <CheckCircle className="w-4 h-4 text-primary-foreground" />}
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* Step 2: Service Details */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6">
                  <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                    {currentStepInfo.title}
                  </h2>
                  <p className="text-muted-foreground">{currentStepInfo.subtitle}</p>
                </div>

                <div className="space-y-5">
                  {/* Selected Service Card */}
                  {(selectedService || selectedCategory) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-2xl bg-card border border-border/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                          <SelectedIcon className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">
                            {selectedService?.name || selectedCategory?.name}
                          </p>
                          <p className="text-sm text-primary/70 font-medium">
                            A partir de {(selectedService?.base_price || selectedCategory?.base_price || 0).toLocaleString()} Kz
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setStep(1)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          Alterar
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Description */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-3"
                  >
                    <Label htmlFor="description" className="text-foreground font-medium">
                      Descreva o problema *
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Ex: A tomada da sala parou de funcionar, está fazendo barulho estranho..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[100px] rounded-xl bg-card border-border/50 focus:border-primary/50 resize-none"
                    />
                    
                    {/* Audio Recording */}
                    <div className="pt-2">
                      <Label className="text-foreground font-medium text-sm mb-2 block">
                        Ou grave um áudio (opcional)
                      </Label>
                      <AudioRecorder 
                        onAudioReady={handleAudioReady} 
                        disabled={loading || uploadingPhotos}
                      />
                    </div>
                  </motion.div>

                  {/* Address */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="address" className="text-foreground font-medium">
                      Endereço *
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="address"
                        placeholder="Seu endereço completo"
                        value={addressInput}
                        onChange={(e) => setAddressInput(e.target.value)}
                        className="pl-12 py-6 rounded-xl bg-card border-border/50 focus:border-primary/50"
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={getCurrentPosition}
                      disabled={loadingLocation}
                      className="mt-2 rounded-xl"
                    >
                      {loadingLocation ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <MapPin className="w-4 h-4 mr-2" />
                      )}
                      {loadingLocation ? "Obtendo..." : "Usar localização atual"}
                    </Button>
                  </motion.div>

                  {/* Urgency */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-3"
                  >
                    <Label className="text-foreground font-medium">Urgência</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setUrgency("normal")}
                        className={`p-4 rounded-2xl text-left transition-all ${
                          urgency === "normal"
                            ? "bg-primary/10 border-2 border-primary"
                            : "bg-card border border-border/50 hover:border-primary/30"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${
                          urgency === "normal" ? "bg-primary/20" : "bg-secondary"
                        }`}>
                          <Clock className={`w-5 h-5 ${urgency === "normal" ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <p className={`font-semibold mb-1 ${urgency === "normal" ? "text-primary" : "text-foreground"}`}>
                          Normal
                        </p>
                        <p className="text-xs text-muted-foreground">Pode aguardar</p>
                      </button>
                      <button
                        onClick={() => setUrgency("urgent")}
                        className={`p-4 rounded-2xl text-left transition-all ${
                          urgency === "urgent"
                            ? "bg-destructive/10 border-2 border-destructive"
                            : "bg-card border border-border/50 hover:border-destructive/30"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${
                          urgency === "urgent" ? "bg-destructive/20" : "bg-secondary"
                        }`}>
                          <AlertTriangle className={`w-5 h-5 ${urgency === "urgent" ? "text-destructive" : "text-muted-foreground"}`} />
                        </div>
                        <p className={`font-semibold mb-1 ${urgency === "urgent" ? "text-destructive" : "text-foreground"}`}>
                          Urgente
                        </p>
                        <p className="text-xs text-muted-foreground">+20% no valor</p>
                      </button>
                    </div>
                  </motion.div>

                  {/* Scheduling Type */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22 }}
                    className="space-y-3"
                  >
                    <Label className="text-foreground font-medium">Quando precisa?</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setSchedulingType("now")}
                        className={`p-4 rounded-2xl text-left transition-all ${
                          schedulingType === "now"
                            ? "bg-primary/10 border-2 border-primary"
                            : "bg-card border border-border/50 hover:border-primary/30"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${
                          schedulingType === "now" ? "bg-primary/20" : "bg-secondary"
                        }`}>
                          <Zap className={`w-5 h-5 ${schedulingType === "now" ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <p className={`font-semibold mb-1 ${schedulingType === "now" ? "text-primary" : "text-foreground"}`}>
                          Agora
                        </p>
                        <p className="text-xs text-muted-foreground">Atendimento imediato</p>
                      </button>
                      <button
                        onClick={() => setSchedulingType("scheduled")}
                        className={`p-4 rounded-2xl text-left transition-all ${
                          schedulingType === "scheduled"
                            ? "bg-primary/10 border-2 border-primary"
                            : "bg-card border border-border/50 hover:border-primary/30"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${
                          schedulingType === "scheduled" ? "bg-primary/20" : "bg-secondary"
                        }`}>
                          <CalendarIcon className={`w-5 h-5 ${schedulingType === "scheduled" ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <p className={`font-semibold mb-1 ${schedulingType === "scheduled" ? "text-primary" : "text-foreground"}`}>
                          Agendar
                        </p>
                        <p className="text-xs text-muted-foreground">Marcar horário</p>
                      </button>
                    </div>

                    {/* Date & Time picker for scheduled */}
                    <AnimatePresence>
                      {schedulingType === "scheduled" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3 overflow-hidden"
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-sm text-muted-foreground">Data *</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal rounded-xl h-12",
                                      !scheduledDate && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {scheduledDate ? format(scheduledDate, "dd/MM/yyyy") : "Selecionar"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={scheduledDate}
                                    onSelect={setScheduledDate}
                                    disabled={(date) => date < new Date()}
                                    className={cn("p-3 pointer-events-auto")}
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm text-muted-foreground">Hora *</Label>
                              <Input
                                type="time"
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                                className="rounded-xl h-12 bg-card"
                              />
                            </div>
                          </div>
                          {scheduledDate && scheduledTime && (
                            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                              <p className="text-sm text-primary font-medium">
                                📅 Agendado para {format(scheduledDate, "dd 'de' MMMM", { locale: pt })} às {scheduledTime}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Photo Upload */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <Label className="text-foreground font-medium">Fotos (opcional)</Label>
                      <span className="text-xs text-muted-foreground">{photos.length}/5</span>
                    </div>

                    {/* Photo Previews */}
                    {photosPreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {photosPreviews.map((preview, index) => (
                          <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                            <img 
                              src={preview} 
                              alt={`Foto ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        ))}
                        
                        {/* Add More Button */}
                        {photos.length < 5 && (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-card/50 flex items-center justify-center transition-all"
                          >
                            <ImagePlus className="w-6 h-6 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Upload Button (when no photos) */}
                    {photos.length === 0 && (
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-6 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 bg-card/50 transition-all group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-secondary mx-auto mb-3 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                          <Camera className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                          Toque para adicionar fotos do problema
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Máximo 5 fotos
                        </p>
                      </button>
                    )}

                    {/* Hidden File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center pt-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12, delay: 0.1 }}
                  className="w-24 h-24 rounded-full bg-green-500/10 mx-auto mb-6 flex items-center justify-center"
                >
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </motion.div>
                
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="font-display text-2xl font-bold text-foreground mb-2"
                >
                  Solicitação enviada!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="text-muted-foreground mb-8 max-w-xs mx-auto"
                >
                  {isDirectRequest && selectedTechnician
                    ? `${selectedTechnician.profile?.name} foi notificado(a).`
                    : "Técnicos próximos estão sendo notificados."}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-card border border-border/50 p-5 rounded-2xl mb-8 text-left"
                >
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Resumo
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Serviço</span>
                      <span className="text-foreground font-medium">
                        {selectedService?.name || selectedCategory?.name}
                      </span>
                    </div>
                    {isDirectRequest && selectedTechnician && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Técnico</span>
                        <span className="text-foreground font-medium">
                          {selectedTechnician.profile?.name}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Endereço</span>
                      <span className="text-foreground font-medium text-right max-w-[180px] truncate">
                        {addressInput}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Urgência</span>
                      <Badge variant={urgency === "urgent" ? "destructive" : "secondary"} className="text-xs">
                        {urgency === "urgent" ? "Urgente" : "Normal"}
                      </Badge>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between items-center">
                      <span className="text-muted-foreground">Valor estimado</span>
                      <span className="text-primary font-bold text-lg">
                        {calculateEstimatedPrice()}
                      </span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="flex gap-3"
                >
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl py-6"
                    onClick={() => navigate("/client")}
                  >
                    Voltar ao Início
                  </Button>
                  <Button
                    className="flex-1 gradient-primary text-primary-foreground rounded-xl py-6"
                    onClick={() => navigate("/client?tab=orders")}
                  >
                    Ver Solicitações
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Fixed Bottom Button */}
        {step < 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t border-border/50 safe-area-bottom"
          >
            <div className="max-w-[450px] mx-auto">
              {step === 1 ? (
                <Button
                  className="w-full gradient-primary text-primary-foreground py-6 rounded-xl text-base font-semibold"
                  disabled={!selectedCategoryId}
                  onClick={() => setStep(2)}
                >
                  Continuar
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <Button
                  className="w-full gradient-primary text-primary-foreground py-6 rounded-xl text-base font-semibold"
                  disabled={!description || !addressInput || loading || uploadingPhotos}
                  onClick={handleSubmit}
                >
                  {loading || uploadingPhotos ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {uploadingPhotos ? "Enviando fotos..." : "Enviando..."}
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      {isDirectRequest ? "Solicitar Técnico" : "Solicitar Serviço"}
                    </>
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </MobileLayout>
  );
}
