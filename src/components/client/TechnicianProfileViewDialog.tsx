import { Star, MapPin, CheckCircle, Phone, Mail, Briefcase, Calendar, Award, Image, Wrench, Clock, Car } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Technician } from "@/hooks/useTechnicians";

const availabilityLabels: Record<string, string> = {
  "full-time": "Tempo Integral",
  "part-time": "Meio Período",
  "weekends": "Fins de Semana",
  "flexible": "Horário Flexível",
};

interface TechnicianProfileViewDialogProps {
  technician: Technician | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestService?: () => void;
  canRequest?: boolean;
}

export function TechnicianProfileViewDialog({
  technician,
  open,
  onOpenChange,
  onRequestService,
  canRequest = true,
}: TechnicianProfileViewDialogProps) {
  if (!technician) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Perfil do Técnico</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Header - Avatar and Name */}
          <div className="flex flex-col items-center text-center">
            <Avatar className="w-24 h-24 border-4 border-primary/20 mb-4">
              <AvatarImage src={technician.profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {technician.profile?.name?.split(" ").map((n) => n[0]).join("") || "T"}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-display text-xl font-bold text-foreground">
                {technician.profile?.name || "Técnico"}
              </h2>
              {technician.verified && (
                <CheckCircle className="w-5 h-5 text-primary" />
              )}
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-primary fill-primary" />
                <span className="font-semibold">{technician.rating?.toFixed(1) || "0.0"}</span>
              </div>
              <span className="text-muted-foreground">
                ({technician.review_count || 0} avaliações)
              </span>
            </div>

            {technician.active ? (
              <Badge className="bg-success/10 text-success border-success/20">
                <div className="w-2 h-2 rounded-full bg-success mr-2" />
                Disponível agora
              </Badge>
            ) : (
              <Badge variant="secondary">Indisponível</Badge>
            )}
          </div>

          <Separator />

          {/* Tabs for CV sections */}
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="about" className="text-xs">Sobre</TabsTrigger>
              <TabsTrigger value="experience" className="text-xs">Experiência</TabsTrigger>
              <TabsTrigger value="portfolio" className="text-xs">Portfólio</TabsTrigger>
            </TabsList>

            {/* About Tab */}
            <TabsContent value="about" className="space-y-4 mt-4">
              {/* Bio */}
              {technician.bio && (
                <div>
                  <h3 className="font-semibold text-foreground mb-2 text-sm">Sobre</h3>
                  <p className="text-muted-foreground text-sm">{technician.bio}</p>
                </div>
              )}

              {/* Specialties */}
              <div>
                <h3 className="font-semibold text-foreground mb-2 text-sm">Especialidades</h3>
                <div className="flex flex-wrap gap-2">
                  {technician.specialties?.length ? (
                    technician.specialties.map((specialty, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {specialty}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Sem especialidades cadastradas</span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <Briefcase className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <p className="font-bold text-foreground text-sm">{technician.completed_jobs || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Serviços concluídos</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <Calendar className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <p className="font-bold text-foreground text-sm">
                    {new Date(technician.created_at).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Membro desde</p>
                </div>
              </div>

              {/* Professional details */}
              <div className="space-y-2">
                {technician.years_experience && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{technician.years_experience} de experiência</span>
                  </div>
                )}
                {technician.availability && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {availabilityLabels[technician.availability] || technician.availability}
                    </span>
                  </div>
                )}
                <div className="flex gap-2">
                  {technician.has_own_tools && (
                    <div className="flex-1 flex items-center gap-1.5 p-2 rounded-lg bg-success/10">
                      <Wrench className="w-3.5 h-3.5 text-success" />
                      <span className="text-[11px] text-success font-medium">Ferramentas</span>
                    </div>
                  )}
                  {technician.has_transport && (
                    <div className="flex-1 flex items-center gap-1.5 p-2 rounded-lg bg-info/10">
                      <Car className="w-3.5 h-3.5 text-info" />
                      <span className="text-[11px] text-info font-medium">Transporte</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground mb-2 text-sm">Contato</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>{technician.profile?.email || "Email não informado"}</span>
                </div>
                {technician.profile?.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{technician.profile.phone}</span>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Experience Tab */}
            <TabsContent value="experience" className="space-y-4 mt-4">
              {/* Certifications */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-foreground text-sm">Certificações</h3>
                </div>
                {technician.certifications ? (
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">{technician.certifications}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Nenhuma certificação informada</p>
                )}
              </div>

              <Separator />

              {/* Previous Experience */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-foreground text-sm">Experiência Profissional</h3>
                </div>
                {technician.previous_experience ? (
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">{technician.previous_experience}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Nenhuma experiência informada</p>
                )}
              </div>

              <Separator />

              {/* Work Areas */}
              {technician.work_areas && technician.work_areas.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground text-sm">Áreas de Atuação</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {technician.work_areas.map((area, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">{area}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Motivation */}
              {technician.motivation && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold text-foreground text-sm mb-2">Motivação</h3>
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">{technician.motivation}</p>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Portfolio Tab */}
            <TabsContent value="portfolio" className="mt-4">
              {technician.portfolio_photos && technician.portfolio_photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {technician.portfolio_photos.map((photo, index) => (
                    <div key={index} className="aspect-square rounded-xl overflow-hidden border border-border">
                      <img src={photo} className="w-full h-full object-cover" alt={`Portfólio ${index + 1}`} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Image className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma foto no portfólio</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Action Button */}
          {canRequest && technician.active && onRequestService && (
            <Button 
              className="w-full gradient-primary text-primary-foreground" 
              size="lg"
              onClick={onRequestService}
            >
              Solicitar Serviço deste Técnico
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
