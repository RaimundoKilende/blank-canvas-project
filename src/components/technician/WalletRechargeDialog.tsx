import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, Copy, Check, Loader2, ArrowLeft, CreditCard,
  CheckCircle, AlertCircle, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { generateReference, verifyPayment, type PaymentReference } from "@/services/paymentService";

interface WalletRechargeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professionalId?: string;
  technicianId?: string;
  professionalType?: "technician" | "vendor" | "delivery";
  onSuccess?: () => void;
}

type Step = "amount" | "reference" | "waiting";

export function WalletRechargeDialog({
  open, onOpenChange, professionalId, technicianId, professionalType = "technician", onSuccess,
}: WalletRechargeDialogProps) {
  const resolvedId = professionalId || technicianId || "";
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState<PaymentReference | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "completed" | "failed">("pending");

  const quickAmounts = [1000, 2500, 5000, 10000, 25000, 50000];

  const resetState = useCallback(() => {
    setStep("amount");
    setAmount(0);
    setCustomAmount("");
    setLoading(false);
    setReference(null);
    setCopiedField(null);
    setPaymentStatus("pending");
  }, []);

  // Reset on close
  useEffect(() => {
    if (!open) {
      const timeout = setTimeout(resetState, 300);
      return () => clearTimeout(timeout);
    }
  }, [open, resetState]);

  // Poll for payment status when waiting
  useEffect(() => {
    if (step !== "waiting" || !reference || paymentStatus !== "pending") return;

    const interval = setInterval(async () => {
      try {
        const result = await verifyPayment(reference.reference_number);
        if (result.status === "completed") {
          setPaymentStatus("completed");
          toast({
            title: "Pagamento confirmado! ✅",
            description: `Seu saldo foi atualizado com ${amount.toLocaleString("pt-AO")} Kz.`,
          });
          onSuccess?.();
        } else if (result.status === "failed") {
          setPaymentStatus("failed");
        }
      } catch {
        // Silently retry
      }
    }, 5000); // Verificar a cada 5 segundos

    return () => clearInterval(interval);
  }, [step, reference, paymentStatus, amount, toast, onSuccess]);

  const handleGenerateReference = async () => {
    const finalAmount = customAmount ? Number(customAmount) : amount;
    if (finalAmount <= 0) return;

    setLoading(true);
    try {
      const ref = await generateReference(finalAmount, resolvedId, professionalType);
      setReference(ref);
      setAmount(finalAmount);
      setStep("reference");
    } catch (error: any) {
      toast({
        title: "Erro ao gerar referência",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: "Copiado!", description: `${field} copiado para a área de transferência.` });
  };

  const handleClose = (value: boolean) => {
    if (step === "waiting" && paymentStatus === "pending") {
      // Allow closing but warn
      toast({
        title: "Pagamento pendente",
        description: "Pode fechar — será notificado quando o pagamento for confirmado.",
      });
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Recarga via Referência Multicaixa
          </DialogTitle>
          <DialogDescription>
            {step === "amount" && "Selecione o valor que deseja carregar na sua carteira."}
            {step === "reference" && "Use os dados abaixo para efetuar o pagamento no Multicaixa."}
            {step === "waiting" && "Aguardando confirmação do seu pagamento..."}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Step 1: Select Amount */}
          {step === "amount" && (
            <motion.div
              key="amount"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Valor rápido</Label>
                <div className="grid grid-cols-3 gap-2">
                  {quickAmounts.map((val) => (
                    <Button
                      key={val}
                      type="button"
                      variant={amount === val && !customAmount ? "default" : "outline"}
                      size="sm"
                      onClick={() => { setAmount(val); setCustomAmount(""); }}
                      className="text-xs"
                    >
                      {val.toLocaleString("pt-AO")} Kz
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ou valor personalizado (Kz)</Label>
                <Input
                  type="number"
                  min={100}
                  value={customAmount}
                  onChange={(e) => { setCustomAmount(e.target.value); setAmount(0); }}
                  placeholder="Ex: 15000"
                />
              </div>

              <Button
                className="w-full"
                onClick={handleGenerateReference}
                disabled={loading || ((amount <= 0) && (!customAmount || Number(customAmount) <= 0))}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Wallet className="w-4 h-4 mr-2" />
                )}
                Gerar Referência de Pagamento
              </Button>
            </motion.div>
          )}

          {/* Step 2: Show Reference */}
          {step === "reference" && reference && (
            <motion.div
              key="reference"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="bg-muted/50 rounded-2xl p-5 space-y-4">
                {/* Entity */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Entidade</p>
                    <p className="text-xl font-mono font-bold text-foreground">{reference.entity_code}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(reference.entity_code, "Entidade")}
                  >
                    {copiedField === "Entidade" ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Reference */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Referência</p>
                    <p className="text-xl font-mono font-bold text-foreground">
                      {reference.reference_number.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(reference.reference_number, "Referência")}
                  >
                    {copiedField === "Referência" ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Amount */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Montante</p>
                    <p className="text-xl font-mono font-bold text-primary">
                      {reference.amount.toLocaleString("pt-AO")} Kz
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(reference.amount.toString(), "Montante")}
                  >
                    {copiedField === "Montante" ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Efetue o pagamento no seu banco ou app Multicaixa Express usando os dados acima.
              </p>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep("amount")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button className="flex-1" onClick={() => setStep("waiting")}>
                  Já Paguei
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Waiting for Payment */}
          {step === "waiting" && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6 py-4"
            >
              {paymentStatus === "pending" && (
                <div className="text-center space-y-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center"
                  >
                    <RefreshCw className="w-8 h-8 text-primary" />
                  </motion.div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">Aguardando Pagamento</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Estamos a verificar o seu pagamento de{" "}
                      <span className="font-bold text-foreground">{amount.toLocaleString("pt-AO")} Kz</span>.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Referência: <span className="font-mono">{reference?.reference_number}</span>
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    A verificação é automática. Pode fechar esta janela — será notificado quando confirmado.
                  </p>
                </div>
              )}

              {paymentStatus === "completed" && (
                <div className="text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center"
                  >
                    <CheckCircle className="w-8 h-8 text-success" />
                  </motion.div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">Pagamento Confirmado!</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-bold text-success">{amount.toLocaleString("pt-AO")} Kz</span> foram adicionados à sua carteira.
                    </p>
                  </div>
                  <Button className="w-full" onClick={() => handleClose(false)}>
                    Fechar
                  </Button>
                </div>
              )}

              {paymentStatus === "failed" && (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">Pagamento Falhado</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Não foi possível confirmar o pagamento. Tente novamente.
                    </p>
                  </div>
                  <Button variant="outline" className="w-full" onClick={resetState}>
                    Tentar Novamente
                  </Button>
                </div>
              )}

              {paymentStatus === "pending" && (
                <Button variant="outline" className="w-full" onClick={() => setStep("reference")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Ver Dados da Referência
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
