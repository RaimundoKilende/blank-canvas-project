import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Clock, Camera } from "lucide-react";
import { useSupportTickets, SupportTicket } from "@/hooks/useSupportTickets";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DisputeDefenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: SupportTicket | null;
}

export function DisputeDefenseDialog({ open, onOpenChange, ticket }: DisputeDefenseDialogProps) {
  const { respondToDispute } = useSupportTickets();
  const [response, setResponse] = useState("");

  if (!ticket) return null;

  const deadline = ticket.response_deadline ? new Date(ticket.response_deadline) : null;
  const isExpired = deadline ? deadline < new Date() : false;
  const timeLeft = deadline ? formatDistanceToNow(deadline, { locale: ptBR, addSuffix: false }) : null;

  const handleSubmit = async () => {
    if (!response.trim()) return;
    await respondToDispute.mutateAsync({ id: ticket.id, response });
    setResponse("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Responder à Disputa
          </DialogTitle>
          <DialogDescription>
            Apresente a sua versão dos factos sobre esta reclamação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Deadline */}
          <div className={`flex items-center gap-2 p-3 rounded-xl ${isExpired ? "bg-destructive/10" : "bg-warning/10"}`}>
            <Clock className={`w-4 h-4 ${isExpired ? "text-destructive" : "text-warning"}`} />
            <span className={`text-sm font-medium ${isExpired ? "text-destructive" : "text-warning"}`}>
              {isExpired ? "Prazo expirado!" : `Tempo restante: ${timeLeft}`}
            </span>
          </div>

          {/* Complaint details */}
          <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Reclamação de</span>
              <Badge variant="secondary">{ticket.reporter?.name || "Cliente"}</Badge>
            </div>
            <h4 className="font-semibold text-foreground">{ticket.subject}</h4>
            <p className="text-sm text-muted-foreground">{ticket.description}</p>
          </div>

          {/* Evidence photos */}
          {ticket.evidence_photos && ticket.evidence_photos.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Camera className="w-3 h-3" />
                Evidências do cliente ({ticket.evidence_photos.length})
              </Label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {ticket.evidence_photos.map((photo, i) => (
                  <img
                    key={i}
                    src={photo}
                    alt={`Evidência ${i + 1}`}
                    className="flex-shrink-0 w-20 h-20 rounded-xl object-cover ring-2 ring-border"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Response */}
          <div className="space-y-2">
            <Label>Sua Defesa *</Label>
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Explique a sua versão dos factos com o máximo de detalhe..."
              className="min-h-[120px]"
              disabled={isExpired}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button
            onClick={handleSubmit}
            disabled={!response.trim() || respondToDispute.isPending || isExpired}
          >
            {respondToDispute.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Enviar Defesa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
