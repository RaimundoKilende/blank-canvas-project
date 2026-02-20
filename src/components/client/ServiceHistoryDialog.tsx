import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, Calendar, Clock, Star, User, DollarSign, 
  CheckCircle, XCircle, AlertTriangle, Percent, Scale,
  MessageSquare, ShieldAlert, Image
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ServiceHistoryDialogProps {
  service: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DisputeTicket {
  id: string;
  subject: string;
  description: string;
  status: string;
  ticket_type: string;
  evidence_photos: string[] | null;
  technician_response: string | null;
  verdict: string | null;
  verdict_notes: string | null;
  admin_notes: string | null;
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
  response_deadline: string | null;
  reporter?: { name: string };
  against?: { name: string };
}

export function ServiceHistoryDialog({
  service,
  open,
  onOpenChange,
}: ServiceHistoryDialogProps) {
  const [disputes, setDisputes] = useState<DisputeTicket[]>([]);

  useEffect(() => {
    if (!service?.id || !open) return;
    const fetchDisputes = async () => {
      const { data } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("service_request_id", service.id)
        .order("created_at", { ascending: false });

      if (!data || data.length === 0) { setDisputes([]); return; }

      const userIds = [...new Set([
        ...data.map((t: any) => t.reporter_id),
        ...data.map((t: any) => t.against_id).filter(Boolean),
      ])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name")
        .in("user_id", userIds);

      setDisputes(data.map((t: any) => ({
        ...t,
        reporter: profiles?.find((p: any) => p.user_id === t.reporter_id),
        against: profiles?.find((p: any) => p.user_id === t.against_id),
      })));
    };
    fetchDisputes();
  }, [service?.id, open]);

  if (!service) return null;

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "completed":
        return { label: "Concluído", color: "bg-success/10 text-success", icon: CheckCircle };
      case "cancelled":
        return { label: "Cancelado", color: "bg-destructive/10 text-destructive", icon: XCircle };
      case "in_progress":
        return { label: "Em Andamento", color: "bg-primary/10 text-primary", icon: Clock };
      case "accepted":
        return { label: "Aceito", color: "bg-warning/10 text-warning", icon: AlertTriangle };
      default:
        return { label: "Pendente", color: "bg-secondary", icon: Clock };
    }
  };

  const getDisputeStatusLabel = (status: string) => {
    switch (status) {
      case "awaiting_response": return { label: "Aguardando Resposta", color: "bg-warning/10 text-warning" };
      case "under_review": return { label: "Em Análise", color: "bg-primary/10 text-primary" };
      case "resolved": return { label: "Resolvido", color: "bg-success/10 text-success" };
      default: return { label: status, color: "bg-secondary" };
    }
  };

  const getVerdictLabel = (verdict: string) => {
    switch (verdict) {
      case "technician_fault": return { label: "Culpa do Técnico", color: "text-destructive" };
      case "client_misuse": return { label: "Mau uso do Cliente", color: "text-warning" };
      case "partial": return { label: "Responsabilidade Parcial", color: "text-primary" };
      default: return { label: verdict, color: "text-muted-foreground" };
    }
  };

  const statusInfo = getStatusInfo(service.status);
  const StatusIcon = statusInfo.icon;

  const extras = service.extras || [];
  const basePrice = service.base_price || 0;
  const urgencyFee = service.urgency === "urgent" ? basePrice * 0.2 : 0;
  const extrasTotal = extras.reduce((sum: number, e: any) => sum + (e.price || 0), 0);
  const adminDiscount = service.admin_discount || 0;
  const totalPrice = service.total_price || basePrice + urgencyFee + extrasTotal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Serviço</DialogTitle>
          <DialogDescription>
            Informações completas do serviço realizado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status & Category */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-foreground">
                {service.category?.name || "Serviço"}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {service.description}
              </p>
            </div>
            <Badge className={statusInfo.color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusInfo.label}
            </Badge>
          </div>

          <Separator />

          {/* Technician Info */}
          {service.technician && (
            <div className="p-4 rounded-xl bg-secondary/50">
              <h4 className="font-medium text-foreground flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-primary" />
                Técnico
              </h4>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold">
                    {service.technician.name?.charAt(0) || "T"}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{service.technician.name}</p>
                  {service.rating && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="w-3 h-3 text-primary fill-primary" />
                      <span>Você avaliou: {service.rating}/5</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Location */}
          <div className="p-4 rounded-xl bg-secondary/50">
            <h4 className="font-medium text-foreground flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-primary" />
              Local
            </h4>
            <p className="text-sm text-muted-foreground">{service.address}</p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-secondary/50">
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3" />
                Solicitado
              </p>
              <p className="font-medium text-sm">
                {new Date(service.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
            {service.completed_at && (
              <div className="p-4 rounded-xl bg-secondary/50">
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <CheckCircle className="w-3 h-3" />
                  Concluído
                </p>
                <p className="font-medium text-sm">
                  {new Date(service.completed_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="p-4 rounded-xl bg-secondary/50">
            <h4 className="font-medium text-foreground flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-primary" />
              Detalhes do Valor
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Preço base</span>
                <span>{basePrice.toLocaleString()} Kz</span>
              </div>
              {urgencyFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa de urgência</span>
                  <span className="text-warning">+{urgencyFee.toLocaleString()} Kz</span>
                </div>
              )}
              {extras.length > 0 && (
                <>
                  <Separator className="my-2" />
                  <p className="font-medium text-muted-foreground">Extras:</p>
                  {extras.map((extra: any, i: number) => (
                    <div key={i} className="flex justify-between pl-2">
                      <span className="text-muted-foreground">{extra.name}</span>
                      <span>+{extra.price?.toLocaleString()} Kz</span>
                    </div>
                  ))}
                </>
              )}
              {adminDiscount > 0 && (
                <>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-success">
                    <span className="flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      Desconto administrativo
                    </span>
                    <span>-{adminDiscount.toLocaleString()} Kz</span>
                  </div>
                  {service.admin_discount_reason && (
                    <p className="text-xs text-muted-foreground pl-4 italic">
                      Motivo: {service.admin_discount_reason}
                    </p>
                  )}
                </>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold text-base">
                <span>Total</span>
                <span className="text-primary">
                  {(totalPrice - adminDiscount).toLocaleString()} Kz
                </span>
              </div>
            </div>
          </div>

          {/* Feedback */}
          {service.feedback && (
            <div className="p-4 rounded-xl bg-secondary/50">
              <h4 className="font-medium text-foreground mb-2">Seu Comentário</h4>
              <p className="text-sm text-muted-foreground italic">"{service.feedback}"</p>
            </div>
          )}

          {/* Cancellation Reason */}
          {service.cancellation_reason && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <h4 className="font-medium text-destructive mb-2 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Motivo do Cancelamento
              </h4>
              <p className="text-sm text-muted-foreground">{service.cancellation_reason}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Cancelado por: {service.cancelled_by === "client" ? "Cliente" : "Técnico"}
              </p>
            </div>
          )}

          {/* Dispute History */}
          {disputes.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Scale className="w-4 h-4 text-warning" />
                  Histórico de Disputas ({disputes.length})
                </h4>
                <div className="space-y-4">
                  {disputes.map((dispute) => {
                    const dStatus = getDisputeStatusLabel(dispute.status);
                    return (
                      <div key={dispute.id} className="p-4 rounded-xl border border-border/50 bg-card space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-foreground">{dispute.subject}</p>
                            <p className="text-xs text-muted-foreground">
                              Aberto por: {dispute.reporter?.name || "—"} • {new Date(dispute.created_at).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <Badge className={dStatus.color}>{dStatus.label}</Badge>
                        </div>

                        {/* Client description */}
                        <div className="p-3 rounded-lg bg-secondary/50">
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                            <MessageSquare className="w-3 h-3" />
                            Descrição do Problema
                          </p>
                          <p className="text-sm text-foreground">{dispute.description}</p>
                        </div>

                        {/* Evidence photos */}
                        {dispute.evidence_photos && dispute.evidence_photos.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-2">
                              <Image className="w-3 h-3" />
                              Evidências ({dispute.evidence_photos.length})
                            </p>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                              {dispute.evidence_photos.map((photo, i) => (
                                <img
                                  key={i}
                                  src={photo}
                                  alt={`Evidência ${i + 1}`}
                                  className="w-16 h-16 rounded-lg object-cover ring-1 ring-border flex-shrink-0"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Technician response */}
                        {dispute.technician_response && (
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                            <p className="text-xs font-medium text-primary flex items-center gap-1 mb-1">
                              <User className="w-3 h-3" />
                              Defesa do Técnico ({dispute.against?.name || "—"})
                            </p>
                            <p className="text-sm text-foreground">{dispute.technician_response}</p>
                          </div>
                        )}

                        {/* Admin verdict */}
                        {dispute.verdict && (
                          <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                            <p className="text-xs font-medium text-warning flex items-center gap-1 mb-1">
                              <Scale className="w-3 h-3" />
                              Veredito do Admin
                            </p>
                            <p className={`text-sm font-semibold ${getVerdictLabel(dispute.verdict).color}`}>
                              {getVerdictLabel(dispute.verdict).label}
                            </p>
                            {dispute.verdict_notes && (
                              <p className="text-sm text-foreground mt-1">{dispute.verdict_notes}</p>
                            )}
                          </div>
                        )}

                        {/* Admin notes / resolution */}
                        {dispute.admin_notes && (
                          <div className="p-3 rounded-lg bg-secondary/50">
                            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                              <ShieldAlert className="w-3 h-3" />
                              Notas do Admin
                            </p>
                            <p className="text-sm text-foreground">{dispute.admin_notes}</p>
                          </div>
                        )}

                        {dispute.resolution && (
                          <div className="p-3 rounded-lg bg-success/5 border border-success/20">
                            <p className="text-xs font-medium text-success mb-1">Resolução</p>
                            <p className="text-sm text-foreground">{dispute.resolution}</p>
                            {dispute.resolved_at && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Resolvido em: {new Date(dispute.resolved_at).toLocaleDateString("pt-BR")}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
