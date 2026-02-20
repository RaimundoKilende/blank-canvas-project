import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Star, Phone, Mail, MapPin, Calendar, FileText, 
  CheckCircle, XCircle, ExternalLink, Loader2,
  Briefcase, Clock, Wrench, Car, Award, MessageSquare,
  User, ClipboardList
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Technician } from "@/hooks/useTechnicians";

interface TechnicianProfileDialogProps {
  technician: Technician | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove?: (technicianId: string) => void;
  onReject?: (technicianId: string) => void;
  isPending?: boolean;
  showActions?: boolean;
}

const availabilityLabels: Record<string, string> = {
  "full-time": "Tempo Integral (40h/semana)",
  "part-time": "Meio Período (20h/semana)",
  "weekends": "Fins de Semana",
  "flexible": "Horário Flexível",
};

export function TechnicianProfileDialog({
  technician,
  open,
  onOpenChange,
  onApprove,
  onReject,
  isPending = false,
  showActions = false,
}: TechnicianProfileDialogProps) {
  const [documentUrls, setDocumentUrls] = useState<{ name: string; url: string }[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (technician && open && technician.documents && technician.documents.length > 0) {
      loadDocumentUrls();
    }
    // Reset tab when dialog opens
    if (open) {
      setActiveTab("profile");
    }
  }, [technician, open]);

  const loadDocumentUrls = async () => {
    if (!technician?.documents || technician.documents.length === 0) return;

    setLoadingDocuments(true);
    try {
      const urls = await Promise.all(
        technician.documents.map(async (docPath) => {
          const { data } = await supabase.storage
            .from("technician-documents")
            .createSignedUrl(docPath, 3600);

          return {
            name: docPath.split("/").pop() || docPath,
            url: data?.signedUrl || "",
          };
        })
      );
      setDocumentUrls(urls.filter((u) => u.url));
    } catch (error) {
      console.error("Error loading document URLs:", error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  if (!technician) return null;

  const hasInterviewData = technician.years_experience || technician.availability || 
    technician.work_areas?.length || technician.motivation;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-0">
          <DialogTitle className="sr-only">Perfil do Técnico</DialogTitle>
          <DialogDescription className="sr-only">
            Informações completas do prestador de serviço
          </DialogDescription>
        </DialogHeader>

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4 p-4 bg-gradient-to-r from-primary/10 to-transparent rounded-2xl mb-4"
        >
          <div className="relative">
            <Avatar className="w-20 h-20 border-4 border-primary/20">
              <AvatarImage src={technician.profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-2xl font-bold">
                {technician.profile?.name?.split(" ").map((n) => n[0]).join("") || "T"}
              </AvatarFallback>
            </Avatar>
            {technician.verified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-success border-2 border-background flex items-center justify-center">
                <CheckCircle className="w-3.5 h-3.5 text-success-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground">
              {technician.profile?.name || "Técnico"}
            </h3>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {technician.verified ? (
                <Badge className="bg-success/10 text-success border-success/20">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verificado
                </Badge>
              ) : (
                <Badge variant="secondary" className="border-warning/30 bg-warning/10 text-warning">
                  Pendente de Aprovação
                </Badge>
              )}
              {technician.active ? (
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <div className="w-2 h-2 rounded-full bg-primary mr-1 animate-pulse" />
                  Online
                </Badge>
              ) : (
                <Badge variant="outline">Offline</Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-warning fill-warning" />
              <span className="text-xl font-bold">{technician.rating?.toFixed(1) || "0.0"}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {technician.review_count || 0} avaliações
            </p>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="interview" className="gap-2" disabled={!hasInterviewData}>
              <ClipboardList className="w-4 h-4" />
              Entrevista
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="w-4 h-4" />
              Documentos
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto pr-2">
            <AnimatePresence mode="wait">
              {/* Profile Tab */}
              <TabsContent value="profile" className="mt-0 space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  {/* Contact Info */}
                  <div className="glass-card p-4 rounded-xl space-y-3">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      Informações de Contato
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{technician.profile?.email || "Não informado"}</span>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{technician.profile?.phone || "Não informado"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="glass-card p-4 rounded-xl text-center">
                      <Briefcase className="w-5 h-5 text-primary mx-auto mb-2" />
                      <p className="text-2xl font-bold text-foreground">
                        {technician.completed_jobs || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Serviços</p>
                    </div>
                    <div className="glass-card p-4 rounded-xl text-center">
                      <Star className="w-5 h-5 text-warning mx-auto mb-2" />
                      <p className="text-2xl font-bold text-foreground">
                        {technician.rating?.toFixed(1) || "0.0"}
                      </p>
                      <p className="text-xs text-muted-foreground">Avaliação</p>
                    </div>
                    <div className="glass-card p-4 rounded-xl text-center">
                      <Award className="w-5 h-5 text-info mx-auto mb-2" />
                      <p className="text-2xl font-bold text-foreground">
                        {technician.credits || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Créditos</p>
                    </div>
                  </div>

                  {/* Bio */}
                  {technician.bio && (
                    <div className="glass-card p-4 rounded-xl mt-4">
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        Sobre
                      </h4>
                      <p className="text-sm text-muted-foreground">{technician.bio}</p>
                    </div>
                  )}

                  {/* Specialties */}
                  <div className="glass-card p-4 rounded-xl mt-4">
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-primary" />
                      Especialidades
                    </h4>
                    {technician.specialties && technician.specialties.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {technician.specialties.map((specialty, index) => (
                          <Badge key={index} variant="secondary" className="text-sm">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhuma especialidade registrada</p>
                    )}
                  </div>

                  {/* Created Date */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Cadastrado em {new Date(technician.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </motion.div>
              </TabsContent>

              {/* Interview Tab */}
              <TabsContent value="interview" className="mt-0 space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  {hasInterviewData ? (
                    <>
                      {/* Experience & Availability */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        {technician.years_experience && (
                          <div className="glass-card p-4 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <Briefcase className="w-4 h-4 text-primary" />
                              <h4 className="font-semibold text-foreground text-sm">Experiência</h4>
                            </div>
                            <p className="text-foreground">{technician.years_experience}</p>
                          </div>
                        )}
                        {technician.availability && (
                          <div className="glass-card p-4 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-4 h-4 text-primary" />
                              <h4 className="font-semibold text-foreground text-sm">Disponibilidade</h4>
                            </div>
                            <p className="text-foreground">
                              {availabilityLabels[technician.availability] || technician.availability}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Work Areas */}
                      {technician.work_areas && technician.work_areas.length > 0 && (
                        <div className="glass-card p-4 rounded-xl">
                          <div className="flex items-center gap-2 mb-3">
                            <MapPin className="w-4 h-4 text-primary" />
                            <h4 className="font-semibold text-foreground text-sm">Áreas de Atuação</h4>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {technician.work_areas.map((area, index) => (
                              <Badge key={index} variant="outline" className="text-sm">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Resources */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className={`glass-card p-4 rounded-xl border ${technician.has_own_tools ? 'border-success/30 bg-success/5' : 'border-border/50'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${technician.has_own_tools ? 'bg-success/10' : 'bg-secondary'}`}>
                              <Wrench className={`w-5 h-5 ${technician.has_own_tools ? 'text-success' : 'text-muted-foreground'}`} />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">Ferramentas Próprias</p>
                              <p className="text-xs text-muted-foreground">
                                {technician.has_own_tools ? "Sim, possui" : "Não possui"}
                              </p>
                            </div>
                            {technician.has_own_tools && (
                              <CheckCircle className="w-5 h-5 text-success ml-auto" />
                            )}
                          </div>
                        </div>

                        <div className={`glass-card p-4 rounded-xl border ${technician.has_transport ? 'border-info/30 bg-info/5' : 'border-border/50'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${technician.has_transport ? 'bg-info/10' : 'bg-secondary'}`}>
                              <Car className={`w-5 h-5 ${technician.has_transport ? 'text-info' : 'text-muted-foreground'}`} />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">Transporte Próprio</p>
                              <p className="text-xs text-muted-foreground">
                                {technician.has_transport ? "Sim, possui" : "Não possui"}
                              </p>
                            </div>
                            {technician.has_transport && (
                              <CheckCircle className="w-5 h-5 text-info ml-auto" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Certifications */}
                      {technician.certifications && (
                        <div className="glass-card p-4 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <Award className="w-4 h-4 text-primary" />
                            <h4 className="font-semibold text-foreground text-sm">Certificações</h4>
                          </div>
                          <p className="text-foreground text-sm">{technician.certifications}</p>
                        </div>
                      )}

                      {/* Previous Experience */}
                      {technician.previous_experience && (
                        <div className="glass-card p-4 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <Briefcase className="w-4 h-4 text-primary" />
                            <h4 className="font-semibold text-foreground text-sm">Experiência Anterior</h4>
                          </div>
                          <p className="text-foreground text-sm whitespace-pre-wrap">{technician.previous_experience}</p>
                        </div>
                      )}

                      {/* Motivation */}
                      {technician.motivation && (
                        <div className="glass-card p-4 rounded-xl border border-primary/20 bg-primary/5">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-primary" />
                            <h4 className="font-semibold text-foreground text-sm">Motivação</h4>
                          </div>
                          <p className="text-foreground text-sm italic whitespace-pre-wrap">"{technician.motivation}"</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhum dado de entrevista disponível</p>
                    </div>
                  )}
                </motion.div>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="mt-0 space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  <div className="glass-card p-4 rounded-xl">
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Documentos Enviados
                    </h4>
                    {loadingDocuments ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : documentUrls.length > 0 ? (
                      <div className="space-y-2">
                        {documentUrls.map((doc, index) => (
                          <motion.a
                            key={index}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all border border-transparent hover:border-primary/20"
                            whileHover={{ x: 4 }}
                          >
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <span className="flex-1 text-sm text-foreground truncate">
                              {doc.name}
                            </span>
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                          </motion.a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum documento enviado</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </div>
        </Tabs>

        {showActions && (
          <DialogFooter className="mt-4 pt-4 border-t border-border/50">
            <Button
              variant="outline"
              onClick={() => onReject?.(technician.id)}
              disabled={isPending}
              className="border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Recusar
            </Button>
            <Button
              onClick={() => onApprove?.(technician.id)}
              disabled={isPending}
              className="gradient-primary text-primary-foreground"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Aprovar Técnico
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
