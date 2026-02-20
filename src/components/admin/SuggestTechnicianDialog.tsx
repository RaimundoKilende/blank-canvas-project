import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Star, MapPin, Loader2, UserPlus } from "lucide-react";
import { Technician } from "@/hooks/useTechnicians";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SuggestTechnicianDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceRequest: any;
  technicians: Technician[];
  onSuccess?: () => void;
}

export function SuggestTechnicianDialog({
  open,
  onOpenChange,
  serviceRequest,
  technicians,
  onSuccess,
}: SuggestTechnicianDialogProps) {
  const [search, setSearch] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
  const { toast } = useToast();

  // Filter technicians by category specialty
  const eligibleTechnicians = useMemo(() => {
    const categoryName = serviceRequest?.category?.name?.toLowerCase() || "";
    return technicians.filter((tech) => {
      // Must be active and verified
      if (!tech.active || !tech.verified) return false;
      
      // Check if specialty matches
      const hasSpecialty = tech.specialties?.some(
        (s) => s.toLowerCase() === categoryName || categoryName.includes(s.toLowerCase())
      );
      
      // Match search query
      const matchesSearch = !search || 
        tech.profile?.name?.toLowerCase().includes(search.toLowerCase()) ||
        tech.specialties?.some(s => s.toLowerCase().includes(search.toLowerCase()));
      
      return hasSpecialty && matchesSearch;
    });
  }, [technicians, serviceRequest, search]);

  const handleAssign = async (technicianUserId: string) => {
    if (!serviceRequest?.id) return;
    
    setAssigning(true);
    setSelectedTechId(technicianUserId);
    
    try {
      // Update the service request with the new technician
      const { error: updateError } = await supabase
        .from("service_requests")
        .update({
          technician_id: technicianUserId,
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", serviceRequest.id);

      if (updateError) throw updateError;

      // Notify the client
      await supabase.from("notifications").insert({
        user_id: serviceRequest.client_id,
        title: "Técnico Sugerido",
        message: `O administrador sugeriu um técnico para o seu serviço de ${serviceRequest.category?.name}. O técnico já está a caminho!`,
        type: "service_update",
        data: { service_request_id: serviceRequest.id },
      });

      // Notify the technician
      await supabase.from("notifications").insert({
        user_id: technicianUserId,
        title: "Novo Serviço Atribuído",
        message: `O administrador atribuiu-lhe um serviço de ${serviceRequest.category?.name}.`,
        type: "service_request",
        data: { service_request_id: serviceRequest.id },
      });

      toast({
        title: "Técnico atribuído",
        description: "O técnico foi sugerido e notificado com sucesso.",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erro ao atribuir técnico",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
      setSelectedTechId(null);
    }
  };

  if (!serviceRequest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Sugerir Técnico
          </DialogTitle>
          <DialogDescription>
            Selecione um técnico para atender o serviço de {serviceRequest.category?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Service Info */}
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-sm text-muted-foreground mb-1">Serviço solicitado:</p>
            <p className="font-medium text-foreground">{serviceRequest.category?.name}</p>
            <p className="text-sm text-muted-foreground line-clamp-2">{serviceRequest.description}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {serviceRequest.address}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar técnico..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Technicians List */}
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {eligibleTechnicians.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum técnico disponível para esta especialidade</p>
              </div>
            ) : (
              eligibleTechnicians.map((tech) => (
                <div
                  key={tech.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {tech.profile?.name?.split(" ").map((n) => n[0]).join("") || "T"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{tech.profile?.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-primary fill-primary" />
                          {tech.rating?.toFixed(1) || "0.0"}
                        </div>
                        <span>•</span>
                        <span>{tech.completed_jobs || 0} serviços</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAssign(tech.user_id)}
                    disabled={assigning}
                  >
                    {assigning && selectedTechId === tech.user_id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Atribuir"
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
