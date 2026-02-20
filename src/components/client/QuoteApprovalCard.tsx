import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, CheckCircle, XCircle, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChatButton } from "@/components/chat/ChatButton";

interface QuoteApprovalCardProps {
  serviceId: string;
  technicianName: string;
  serviceName: string;
  quoteAmount: number;
  quoteDescription: string;
  quoteSentAt: string;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
  isRejecting: boolean;
}

export function QuoteApprovalCard({
  serviceId,
  technicianName,
  serviceName,
  quoteAmount,
  quoteDescription,
  quoteSentAt,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: QuoteApprovalCardProps) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const deadline = new Date(quoteSentAt).getTime() + 15 * 60 * 1000; // 15 minutes

    const updateTimer = () => {
      const now = Date.now();
      const remaining = deadline - now;

      if (remaining <= 0) {
        setTimeLeft("Expirado");
        setIsExpired(true);
        return;
      }

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [quoteSentAt]);

  return (
    <div className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">Orçamento Recebido</h3>
          <p className="text-sm text-muted-foreground">{serviceName}</p>
        </div>
        <Badge className={isExpired ? "bg-destructive/10 text-destructive border-0" : "bg-warning/10 text-warning border-0"}>
          {isExpired ? "Expirado" : "Aguardando"}
        </Badge>
      </div>

      {/* Timer */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center justify-center gap-2 p-2 rounded-xl text-sm font-medium ${
          isExpired 
            ? "bg-destructive/10 text-destructive" 
            : "bg-warning/10 text-warning"
        }`}
      >
        <Clock className="w-4 h-4" />
        <span>Tempo restante: {timeLeft}</span>
      </motion.div>

      {/* Technician */}
      <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
        <Avatar className="w-10 h-10">
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {technicianName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-medium text-foreground text-sm">{technicianName}</p>
          <p className="text-xs text-muted-foreground">
            Enviado em {new Date(quoteSentAt).toLocaleDateString("pt-BR", {
              day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
            })}
          </p>
        </div>
      </div>

      {/* Quote Amount */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="p-4 bg-primary/5 border border-primary/20 rounded-2xl text-center"
      >
        <p className="text-xs text-muted-foreground mb-1">Valor do Orçamento</p>
        <p className="text-3xl font-bold text-primary">
          {quoteAmount.toLocaleString("pt-AO")} <span className="text-lg">Kz</span>
        </p>
      </motion.div>

      {/* Description */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Descrição do Serviço</p>
        <p className="text-sm text-foreground bg-secondary/30 p-3 rounded-xl leading-relaxed">
          {quoteDescription}
        </p>
      </div>

      {/* Actions */}
      {!isExpired ? (
        <div className="flex gap-3">
          <Button
            onClick={onApprove}
            disabled={isApproving || isRejecting}
            className="flex-1 gradient-primary text-primary-foreground rounded-xl h-12"
          >
            {isApproving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Aceitar Orçamento
          </Button>
          <Button
            variant="outline"
            onClick={onReject}
            disabled={isApproving || isRejecting}
            className="text-destructive border-destructive/30 hover:bg-destructive/10 rounded-xl h-12"
          >
            {isRejecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
          </Button>
        </div>
      ) : (
        <div className="text-center p-3 rounded-xl bg-destructive/5 border border-destructive/20">
          <p className="text-sm text-destructive font-medium">O tempo para responder expirou</p>
          <p className="text-xs text-muted-foreground mt-1">O técnico pode enviar um novo orçamento</p>
        </div>
      )}

      {/* Chat */}
      <ChatButton serviceRequestId={serviceId} otherUserName={technicianName} />
    </div>
  );
}
