import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, DollarSign, Loader2, Send, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface SendQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (amount: number, description: string) => void;
  isPending: boolean;
  serviceName: string;
  clientName: string;
  suggestedPriceMin?: number | null;
  suggestedPriceMax?: number | null;
}

export function SendQuoteDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  serviceName,
  clientName,
  suggestedPriceMin,
  suggestedPriceMax,
}: SendQuoteDialogProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    if (!description.trim()) return;
    onSubmit(numAmount, description.trim());
    setAmount("");
    setDescription("");
  };

  const numAmount = parseFloat(amount);
  const isValid = numAmount > 0 && description.trim().length > 0;
  const hasSuggestedRange = suggestedPriceMin != null && suggestedPriceMax != null && suggestedPriceMax > 0;
  const isAboveRange = hasSuggestedRange && numAmount > suggestedPriceMax!;
  const isBelowRange = hasSuggestedRange && numAmount > 0 && numAmount < suggestedPriceMin!;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Enviar Orçamento
          </DialogTitle>
          <DialogDescription>
            Envie um orçamento para <strong>{clientName}</strong> referente ao serviço de <strong>{serviceName}</strong>.
            O cliente terá <strong>15 minutos</strong> para aceitar ou recusar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Suggested Price Range */}
          {hasSuggestedRange && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-primary/5 border border-primary/20"
            >
              <div className="flex items-center gap-2 mb-1">
                <Info className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Faixa de Preço Sugerida</span>
              </div>
              <p className="text-sm text-primary font-semibold">
                {suggestedPriceMin!.toLocaleString("pt-AO")} Kz — {suggestedPriceMax!.toLocaleString("pt-AO")} Kz
              </p>
            </motion.div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Valor do Orçamento (Kz)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Ex: 20000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`pl-9 ${isAboveRange ? "border-destructive" : isBelowRange ? "border-warning" : ""}`}
                min={0}
              />
            </div>

            {/* Price warning */}
            {isAboveRange && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
              >
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-xs text-destructive">
                  <strong>Atenção!</strong> O seu preço está muito acima da média do mercado ({suggestedPriceMax!.toLocaleString("pt-AO")} Kz). As suas chances de ser escolhido são baixas.
                </p>
              </motion.div>
            )}
            {isBelowRange && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20"
              >
                <Info className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                <p className="text-xs text-warning">
                  O valor está abaixo do mínimo sugerido ({suggestedPriceMin!.toLocaleString("pt-AO")} Kz).
                </p>
              </motion.div>
            )}

            {numAmount > 0 && !isAboveRange && !isBelowRange && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-muted-foreground"
              >
                O cliente verá: <strong>{numAmount.toLocaleString("pt-AO")} Kz</strong>
              </motion.p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Descrição do Orçamento</label>
            <Textarea
              placeholder="Descreva o que será feito, materiais necessários, tempo estimado..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{description.length}/500</p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!isValid || isPending}
            className="w-full gradient-primary text-primary-foreground"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Enviar Orçamento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
