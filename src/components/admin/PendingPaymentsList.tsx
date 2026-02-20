import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CreditCard, CheckCircle, Loader2, Clock, AlertTriangle, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { confirmPayment } from "@/services/paymentService";

interface PendingTransaction {
  id: string;
  technician_id: string;
  amount: number;
  reference_number: string | null;
  entity_code: string | null;
  status: string;
  created_at: string;
  technicianName?: string;
  technicianEmail?: string;
}

export function PendingPaymentsList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Fetch pending reference payments
  const { data: pendingPayments = [], isLoading } = useQuery({
    queryKey: ["pending-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("status", "pending")
        .eq("payment_type", "referencia")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch technician profiles
      const techIds = [...new Set((data || []).map((t) => t.technician_id))];
      if (techIds.length === 0) return [];

      const { data: technicians } = await supabase
        .from("technicians")
        .select("id, user_id")
        .in("id", techIds);

      const userIds = (technicians || []).map((t) => t.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, email")
        .in("user_id", userIds);

      return (data || []).map((tx) => {
        const tech = technicians?.find((t) => t.id === tx.technician_id);
        const profile = profiles?.find((p) => p.user_id === tech?.user_id);
        return {
          ...tx,
          technicianName: profile?.name || "Técnico",
          technicianEmail: profile?.email || "",
        } as PendingTransaction;
      });
    },
    refetchInterval: 15000, // Auto-refresh every 15s
  });

  // Confirm payment mutation
  const confirmMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      setConfirmingId(transactionId);
      return confirmPayment(transactionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-payments"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["technician-profile"] });
      queryClient.invalidateQueries({ queryKey: ["technicians"] });
      toast({
        title: "Pagamento confirmado! ✅",
        description: "O saldo do técnico foi atualizado.",
      });
      setConfirmingId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao confirmar pagamento",
        description: error.message,
        variant: "destructive",
      });
      setConfirmingId(null);
    },
  });

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Transações Pendentes (Multicaixa)
            </h2>
            <p className="text-sm text-muted-foreground">
              {pendingPayments.length} pagamento{pendingPayments.length !== 1 ? "s" : ""} por confirmar
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["pending-payments"] })}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : pendingPayments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhuma transação pendente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingPayments.map((payment) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 rounded-xl bg-secondary/50"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {payment.technicianName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "T"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground text-sm">{payment.technicianName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Ref: {payment.reference_number || "N/A"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Ent: {payment.entity_code || "N/A"}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(payment.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-bold text-foreground">
                    {payment.amount.toLocaleString("pt-AO")} Kz
                  </p>
                  <div className="flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3 text-warning" />
                    <span className="text-[10px] text-warning font-medium">Pendente</span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="default"
                  className="text-xs"
                  disabled={confirmMutation.isPending && confirmingId === payment.id}
                  onClick={() => confirmMutation.mutate(payment.id)}
                >
                  {confirmMutation.isPending && confirmingId === payment.id ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  )}
                  Simular Confirmação
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {pendingPayments.length > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <strong>Modo de Teste:</strong> O botão "Simular Confirmação" substitui a confirmação 
              automática que virá via webhook da API Multicaixa (ProxyPay/Gisicash) em produção.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
