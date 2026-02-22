import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Zap, Droplets, Wind, Sparkles, Monitor, Wrench,
  MapPin, Loader2, Star, ChevronRight, Search, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useServiceCategories } from "@/hooks/useServiceCategories";
import { useServices } from "@/hooks/useServices";
import { useTechnicians, Technician } from "@/hooks/useTechnicians";
import { useGeolocation } from "@/hooks/useGeolocation";
import { TechnicianCard } from "@/components/ui/TechnicianCard";
import { TechnicianProfileViewDialog } from "@/components/client/TechnicianProfileViewDialog";

const iconMap: Record<string, any> = {
  "zap": Zap,
  "droplets": Droplets,
  "wind": Wind,
  "sparkles": Sparkles,
  "monitor": Monitor,
  "wrench": Wrench,
};

const getIcon = (iconName: string) => iconMap[iconName.toLowerCase()] || Wrench;

export default function CategoryServices() {
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [viewingTechnician, setViewingTechnician] = useState<Technician | null>(null);
  const [technicianDialogOpen, setTechnicianDialogOpen] = useState(false);

  const { categories } = useServiceCategories();
  const { services, isLoading: loadingServices } = useServices();
  const { latitude, longitude, calculateDistance, formatDistance } = useGeolocation();

  const category = categories.find(c => c.id === categoryId);
  const CategoryIcon = category ? getIcon(category.icon) : Wrench;

  // Filter services by category
  const categoryServices = useMemo(() => {
    return services
      .filter(s => s.category_id === categoryId)
      .filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [services, categoryId, searchQuery]);

  // Get selected service for technician filtering
  const selectedService = services.find(s => s.id === selectedServiceId);
  const { technicians } = useTechnicians(selectedService?.name);

  // Calculate nearby technicians with distance
  const nearbyTechnicians = useMemo(() => {
    return technicians
      .map((tech) => {
        let distance = "N/A";
        let distanceKm = Infinity;
        if (latitude && longitude && tech.latitude && tech.longitude) {
          distanceKm = calculateDistance(latitude, longitude, tech.latitude, tech.longitude);
          distance = formatDistance(distanceKm);
        }
        return { ...tech, distance, distanceKm };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 6);
  }, [technicians, latitude, longitude, calculateDistance, formatDistance]);

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(selectedServiceId === serviceId ? null : serviceId);
  };

  const handleRequestService = () => {
    if (selectedServiceId) {
      navigate(`/client/request?service=${selectedServiceId}`);
    } else {
      navigate(`/client/request?category=${categoryId}`);
    }
  };

  const handleViewTechnician = (tech: Technician) => {
    setViewingTechnician(tech);
    setTechnicianDialogOpen(true);
  };

  const handleRequestFromTechnician = () => {
    if (viewingTechnician) {
      const serviceParam = selectedServiceId ? `&service=${selectedServiceId}` : "";
      navigate(`/client/request?technician=${viewingTechnician.user_id}&direct=true${serviceParam}`);
    }
    setTechnicianDialogOpen(false);
  };

  if (!category) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen pb-32"
      >
        {/* Header */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border/50">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={() => navigate("/client")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                    <CategoryIcon className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="font-display font-bold text-foreground">{category.name}</h1>
                    <p className="text-xs text-muted-foreground">{categoryServices.length} serviços disponíveis</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar serviço..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 py-5 rounded-xl bg-secondary/50 border-0 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pt-4">
          {loadingServices ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : categoryServices.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto mb-4 flex items-center justify-center">
                <Wrench className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Nenhum serviço encontrado</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "Tente outro termo de busca" : "Esta categoria ainda não tem serviços"}
              </p>
            </motion.div>
          ) : (
            <>
              {/* Services List */}
              <div className="space-y-3 mb-6">
                <AnimatePresence mode="popLayout">
                  {categoryServices.map((service, index) => {
                    const IconComponent = getIcon(service.icon);
                    const isSelected = selectedServiceId === service.id;
                    
                    return (
                      <motion.div
                        key={service.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        layout
                      >
                        <button
                          onClick={() => handleServiceSelect(service.id)}
                          className={`w-full text-left p-4 rounded-2xl transition-all duration-300 ${
                            isSelected
                              ? "bg-primary/10 border-2 border-primary shadow-lg shadow-primary/10"
                              : "bg-card/50 border border-border/50 hover:border-primary/30 hover:bg-card/80"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                              isSelected ? "gradient-primary" : "bg-secondary"
                            }`}>
                              <IconComponent className={`w-6 h-6 ${
                                isSelected ? "text-primary-foreground" : "text-muted-foreground"
                              }`} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-foreground">{service.name}</h3>
                                {isSelected && (
                                  <Badge className="bg-primary/20 text-primary text-[10px]">
                                    Selecionado
                                  </Badge>
                                )}
                              </div>
                              {service.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1 mb-1">
                                  {service.description}
                                </p>
                              )}
                              <p className="text-sm font-semibold text-primary">
                                A partir de {service.base_price.toLocaleString()} Kz
                              </p>
                            </div>

                            <ChevronRight className={`w-5 h-5 transition-transform ${
                              isSelected ? "text-primary rotate-90" : "text-muted-foreground"
                            }`} />
                          </div>
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Nearby Technicians Section - only show when a service is selected */}
              {selectedServiceId && nearbyTechnicians.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-primary" />
                    <h2 className="font-display font-semibold text-foreground">Técnicos Disponíveis</h2>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {nearbyTechnicians.length} encontrados
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {nearbyTechnicians.map((tech, index) => (
                      <motion.div
                        key={tech.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                      >
                        <TechnicianCard
                          name={tech.profile?.name || "Técnico"}
                          avatar={tech.profile?.avatar_url || undefined}
                          specialty={tech.specialties?.[0] || category.name}
                          rating={tech.rating || 0}
                          reviewCount={tech.review_count || 0}
                          completedJobs={tech.completed_jobs || 0}
                          distance={tech.distance}
                          available={tech.active || false}
                          verified={tech.verified || false}
                          onViewProfile={() => handleViewTechnician(tech)}
                          onRequestService={() => {
                            const serviceParam = selectedServiceId ? `&service=${selectedServiceId}` : "";
                            navigate(`/client/request?technician=${tech.user_id}&direct=true${serviceParam}`);
                          }}
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* Fixed Bottom CTA */}
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8 z-20"
        >
          <div className="max-w-md mx-auto">
            <Button
              size="lg"
              className="w-full gradient-primary text-primary-foreground rounded-2xl py-6 shadow-lg shadow-primary/20"
              onClick={handleRequestService}
            >
              <MapPin className="w-5 h-5 mr-2" />
              {selectedServiceId ? "Solicitar Serviço" : "Pesquisa Rápida"}
            </Button>
          </div>
        </motion.div>
      </motion.div>

      {/* Technician Profile Dialog */}
      <TechnicianProfileViewDialog
        technician={viewingTechnician}
        open={technicianDialogOpen}
        onOpenChange={setTechnicianDialogOpen}
        onRequestService={handleRequestFromTechnician}
      />
    </MobileLayout>
  );
}
