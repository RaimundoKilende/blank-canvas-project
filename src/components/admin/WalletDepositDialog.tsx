import { useState } from "react";
import { Wallet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useWallet } from "@/hooks/useWallet";
import type { Technician } from "@/hooks/useTechnicians";

interface WalletDepositDialogProps {
  technician: Technician | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletDepositDialog({ technician, open, onOpenChange }: WalletDepositDialogProps) {
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState("");
  const { deposit } = useWallet();

  const quickAmounts = [1000, 2500, 5000, 10000, 25000, 50000];

  const handleDeposit = async () => {
    if (!technician || amount <= 0) return;

    await deposit.mutateAsync({
      technicianId: technician.id,
      amount,
      description: description || undefined,
    });

    setAmount(0);
    setDescription("");
    onOpenChange(false);
  };

  const handleClose = (value: boolean) => {
    if (!value) {
      setAmount(0);
      setDescription("");
    }
    onOpenChange(value);
  };

  if (!technician) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Carregar Carteira
          </DialogTitle>
          <DialogDescription>
            Adicionar saldo à carteira do técnico.
          </DialogDescription>
        </DialogHeader>

        {/* Technician Info */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {technician.profile?.name?.split(" ").map((n) => n[0]).join("") || "T"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">
              {technician.profile?.name || "Técnico"}
            </p>
            <p className="text-xs text-muted-foreground">
              Saldo atual: <span className={`font-semibold ${technician.wallet_balance <= 0 ? "text-destructive" : "text-success"}`}>
                {(technician.wallet_balance || 0).toLocaleString("pt-AO")} Kz
              </span>
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Quick Amount Buttons */}
          <div className="space-y-2">
            <Label>Valor rápido</Label>
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((val) => (
                <Button
                  key={val}
                  type="button"
                  variant={amount === val ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAmount(val)}
                  className="text-xs"
                >
                  {val.toLocaleString("pt-AO")} Kz
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="space-y-2">
            <Label>Valor personalizado (Kz)</Label>
            <Input
              type="number"
              min={0}
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Ex: 15000"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Carregamento via transferência bancária"
              rows={2}
            />
          </div>

          {/* Preview */}
          {amount > 0 && (
            <div className="p-3 rounded-xl bg-success/10 border border-success/20">
              <p className="text-sm text-success font-medium">
                Novo saldo após depósito: {((technician.wallet_balance || 0) + amount).toLocaleString("pt-AO")} Kz
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleDeposit}
            disabled={amount <= 0 || deposit.isPending}
          >
            {deposit.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Wallet className="w-4 h-4 mr-2" />
            )}
            Depositar {amount > 0 ? `${amount.toLocaleString("pt-AO")} Kz` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
