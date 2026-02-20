import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Clock, DollarSign, User, Phone, Mail, FileText, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ServiceRequest } from "@/hooks/useServiceRequests";

interface ServiceDetailsDialogProps {
  service: ServiceRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServiceDetailsDialog({
  service,
  open,
  onOpenChange,
}: ServiceDetailsDialogProps) {
  if (!service) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success/10 text-success border-success/20">Concluído</Badge>;
      case "in_progress":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Em Andamento</Badge>;
      case "cancelled":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Cancelado</Badge>;
      case "accepted":
        return <Badge className="bg-warning/10 text-warning border-warning/20">Aceito</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Detalhes do Serviço</span>
            {getStatusBadge(service.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Informações do Serviço
            </h3>
            <div className="grid gap-3 p-4 rounded-xl bg-secondary/50">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Categoria</span>
                <span className="font-medium">{service.category?.name || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Descrição</span>
                <span className="font-medium text-right max-w-[60%]">{service.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Urgência</span>
                <Badge variant={service.urgency === "urgent" ? "destructive" : "secondary"}>
                  {service.urgency === "urgent" ? "Urgente" : "Normal"}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Location */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Localização
            </h3>
            <div className="p-4 rounded-xl bg-secondary/50">
              <p className="text-foreground">{service.address}</p>
              {service.latitude && service.longitude && (
                <p className="text-sm text-muted-foreground mt-1">
                  Coordenadas: {service.latitude.toFixed(6)}, {service.longitude.toFixed(6)}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Pricing */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Valores
            </h3>
            <div className="grid gap-3 p-4 rounded-xl bg-secondary/50">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Preço Base</span>
                <span className="font-medium">{service.base_price.toLocaleString()} Kz</span>
              </div>
              {service.extras && service.extras.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Extras</span>
                  <span className="font-medium">
                    {service.extras.reduce((sum: number, e: any) => sum + (e.price || 0), 0).toLocaleString()} Kz
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-primary text-lg">
                  {service.total_price.toLocaleString()} Kz
                </span>
              </div>
            </div>
          </div>

          {/* Quote/Budget Info */}
          {(service as any).quote_status && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Orçamento Digital
                </h3>
                <div className="grid gap-3 p-4 rounded-xl bg-secondary/50">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className={
                      (service as any).quote_status === "approved" 
                        ? "bg-success/10 text-success border-success/20"
                        : (service as any).quote_status === "rejected"
                        ? "bg-destructive/10 text-destructive border-destructive/20"
                        : "bg-warning/10 text-warning border-warning/20"
                    }>
                      {(service as any).quote_status === "approved" ? "Aprovado" 
                        : (service as any).quote_status === "rejected" ? "Recusado" 
                        : "Aguardando Aprovação"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor Orçado</span>
                    <span className="font-bold text-primary">{((service as any).quote_amount || 0).toLocaleString()} Kz</span>
                  </div>
                  {(service as any).quote_description && (
                    <div>
                      <span className="text-muted-foreground text-sm">Descrição:</span>
                      <p className="text-foreground mt-1 text-sm">{(service as any).quote_description}</p>
                    </div>
                  )}
                  {(service as any).quote_sent_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Enviado em</span>
                      <span className="font-medium">
                        {format(new Date((service as any).quote_sent_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  )}
                  {(service as any).quote_approved_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Aprovado em</span>
                      <span className="font-medium">
                        {format(new Date((service as any).quote_approved_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Timeline */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Cronologia
            </h3>
            <div className="grid gap-3 p-4 rounded-xl bg-secondary/50">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em</span>
                <span className="font-medium">
                  {format(new Date(service.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              {service.accepted_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aceito em</span>
                  <span className="font-medium">
                    {format(new Date(service.accepted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              )}
              {service.started_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Iniciado em</span>
                  <span className="font-medium">
                    {format(new Date(service.started_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              )}
              {service.completed_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Concluído em</span>
                  <span className="font-medium">
                    {format(new Date(service.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              )}
              {service.cancelled_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cancelado em</span>
                  <span className="font-medium text-destructive">
                    {format(new Date(service.cancelled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Cancellation info */}
          {service.status === "cancelled" && service.cancellation_reason && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-destructive">Motivo do Cancelamento</h3>
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                  <p className="text-foreground">{service.cancellation_reason}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Cancelado por: {service.cancelled_by === "client" ? "Cliente" : "Técnico"}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Rating */}
          {service.rating && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" />
                  Avaliação
                </h3>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-2 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < service.rating! ? "fill-primary text-primary" : "text-muted-foreground"
                        }`}
                      />
                    ))}
                    <span className="font-medium ml-2">{service.rating}/5</span>
                  </div>
                  {service.feedback && (
                    <p className="text-muted-foreground mt-2">{service.feedback}</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Client Info */}
          {service.client && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Cliente
                </h3>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <p className="font-medium text-foreground">{service.client.name}</p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{service.client.email}</span>
                  </div>
                  {service.client.phone && (
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{service.client.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Technician Info */}
          {service.technician && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Técnico
                </h3>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <p className="font-medium text-foreground">{service.technician.name}</p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{service.technician.email}</span>
                  </div>
                  {service.technician.phone && (
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{service.technician.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
