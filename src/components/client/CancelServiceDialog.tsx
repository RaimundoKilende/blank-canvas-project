import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2, DollarSign } from "lucide-react";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";

interface CancelServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<void>;
  isPending: boolean;
  /** Whether the technician has already arrived (in_progress status) */
  technicianArrived?: boolean;
}

export function CancelServiceDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  technicianArrived = false,
}: CancelServiceDialogProps) {
  const [reason, setReason] = useState("");
  const { getSettingNumber } = usePlatformSettings();
  const cancellationFee = getSettingNumber("cancellation_fee", 2000);

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    await onConfirm(reason);
    setReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Cancelar Serviço
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. Por favor, informe o motivo do cancelamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {technicianArrived && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 space-y-2">
              <div className="flex items-center gap-2 text-destructive font-medium text-sm">
                <DollarSign className="w-4 h-4" />
                Taxa de Cancelamento
              </div>
              <p className="text-sm text-foreground">
                O técnico já chegou ao local. Ao cancelar, será cobrada uma taxa mínima de{" "}
                <strong>{cancellationFee.toLocaleString()} Kz</strong>.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Motivo do cancelamento *</Label>
            <Textarea
              placeholder="Descreva o motivo..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Voltar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim() || isPending}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <AlertTriangle className="w-4 h-4 mr-2" />
            )}
            {technicianArrived ? `Cancelar (${cancellationFee.toLocaleString()} Kz)` : "Confirmar Cancelamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
