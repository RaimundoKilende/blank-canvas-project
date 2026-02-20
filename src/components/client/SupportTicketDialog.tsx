import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, HelpCircle } from "lucide-react";
import { useSupportTickets } from "@/hooks/useSupportTickets";

interface SupportTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceRequestId?: string;
  againstId?: string;
}

export function SupportTicketDialog({ open, onOpenChange, serviceRequestId, againstId }: SupportTicketDialogProps) {
  const { createTicket } = useSupportTickets();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) return;
    await createTicket.mutateAsync({
      subject,
      description,
      service_request_id: serviceRequestId,
      against_id: againstId,
    });
    setSubject("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Apoio ao Cliente
          </DialogTitle>
          <DialogDescription>
            Descreva o seu problema ou disputa. A nossa equipa irá analisar e responder o mais breve possível.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Assunto *</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Disputa com técnico, Problema de pagamento..."
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição detalhada *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o problema com o máximo de detalhes possível..."
              className="min-h-[120px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={!subject.trim() || !description.trim() || createTicket.isPending}
          >
            {createTicket.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
