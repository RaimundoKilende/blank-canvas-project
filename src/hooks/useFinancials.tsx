import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface FinancialTransaction {
  id: string;
  service_request_id: string | null;
  technician_id: string | null;
  type: "income" | "expense" | "commission";
  category: string;
  description: string;
  amount: number;
  date: string;
  created_at: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  totalCommissions: number;
  netRevenue: number;
  monthlyData: {
    month: string;
    income: number;
    expenses: number;
    commissions: number;
  }[];
}

export function useFinancials(dateRange?: { start: string; end: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ["financial-transactions", dateRange],
    queryFn: async () => {
      let query = supabase
        .from("financial_transactions")
        .select("*")
        .order("date", { ascending: false });

      if (dateRange) {
        query = query
          .gte("date", dateRange.start)
          .lte("date", dateRange.end);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as FinancialTransaction[];
    },
  });

  // Calculate summary
  const summary: FinancialSummary = {
    totalIncome: transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0),
    totalExpenses: transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0),
    totalCommissions: transactions
      .filter((t) => t.type === "commission")
      .reduce((sum, t) => sum + t.amount, 0),
    netRevenue: 0,
    monthlyData: [],
  };
  summary.netRevenue = summary.totalIncome - summary.totalExpenses - summary.totalCommissions;

  // Calculate monthly data
  const monthlyMap = new Map<string, { income: number; expenses: number; commissions: number }>();
  transactions.forEach((t) => {
    const month = t.date.substring(0, 7); // YYYY-MM
    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, { income: 0, expenses: 0, commissions: 0 });
    }
    const data = monthlyMap.get(month)!;
    if (t.type === "income") data.income += t.amount;
    else if (t.type === "expense") data.expenses += t.amount;
    else if (t.type === "commission") data.commissions += t.amount;
  });

  summary.monthlyData = Array.from(monthlyMap.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const createTransaction = useMutation({
    mutationFn: async (transaction: Omit<FinancialTransaction, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("financial_transactions")
        .insert(transaction)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-transactions"] });
      toast({
        title: "Transação registrada!",
        description: "A transação foi adicionada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar transação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("financial_transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-transactions"] });
      toast({
        title: "Transação removida!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover transação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    transactions,
    summary,
    isLoading,
    error,
    createTransaction,
    deleteTransaction,
  };
}
