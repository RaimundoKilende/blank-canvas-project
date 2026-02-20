import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface WalletTransaction {
  id: string;
  technician_id: string;
  type: "deposit" | "commission_deduction";
  amount: number;
  balance_after: number;
  description: string;
  service_request_id: string | null;
  created_at: string;
  status: string;
  reference_number: string | null;
  entity_code: string | null;
  payment_type: string;
}

export function useWallet() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch wallet transactions
  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ["wallet-transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get technician id first
      const { data: tech } = await supabase
        .from("technicians")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!tech) return [];

      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("technician_id", tech.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as WalletTransaction[];
    },
    enabled: !!user,
  });

  // Deposit funds into wallet (admin operation)
  const deposit = useMutation({
    mutationFn: async ({ technicianId, amount, description }: { technicianId: string; amount: number; description?: string }) => {
      // Get current balance
      const { data: tech, error: techError } = await supabase
        .from("technicians")
        .select("wallet_balance")
        .eq("id", technicianId)
        .single();

      if (techError) throw techError;

      const newBalance = (tech.wallet_balance || 0) + amount;

      // Update balance
      const { error: updateError } = await supabase
        .from("technicians")
        .update({ wallet_balance: newBalance })
        .eq("id", technicianId);

      if (updateError) throw updateError;

      // Record transaction
      const { error: txError } = await supabase
        .from("wallet_transactions")
        .insert({
          technician_id: technicianId,
          type: "deposit",
          amount,
          balance_after: newBalance,
          description: description || "Carregamento de saldo",
        });

      if (txError) throw txError;

      return { newBalance };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["technician-profile"] });
      queryClient.invalidateQueries({ queryKey: ["technicians"] });
      queryClient.invalidateQueries({ queryKey: ["pending-payments"] });
      toast({
        title: "Depósito realizado!",
        description: "O saldo da carteira foi atualizado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao depositar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    transactions,
    loadingTransactions,
    deposit,
  };
}
