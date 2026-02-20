import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, ArrowDownRight, Calendar, Loader2, BarChart3 } from "lucide-react";
import { formatAKZ, formatAKZShort } from "@/lib/formatCurrency";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useServiceRequests } from "@/hooks/useServiceRequests";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";

export function TechnicianFinancesTab() {
  const { profile } = useAuth();
  const { transactions, loadingTransactions } = useWallet();
  const { requests } = useServiceRequests();
  const [period, setPeriod] = useState<"daily" | "monthly">("monthly");

  // Calculate earnings from completed service requests
  const completedRequests = useMemo(() => {
    return requests.filter(
      (r) => r.technician_id === profile?.user_id && r.status === "completed"
    );
  }, [requests, profile?.user_id]);

  const totalEarnings = completedRequests.reduce((sum, r) => sum + (r.total_price || 0), 0);
  const totalCommissions = transactions
    .filter((t) => t.type === "commission_deduction")
    .reduce((sum, t) => sum + t.amount, 0);
  const netEarnings = totalEarnings - totalCommissions;

  // Monthly chart data
  const monthlyData = useMemo(() => {
    const map = new Map<string, { month: string; ganhos: number; comissoes: number }>();
    
    completedRequests.forEach((r) => {
      const date = new Date(r.completed_at || r.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      if (!map.has(key)) map.set(key, { month: label, ganhos: 0, comissoes: 0 });
      map.get(key)!.ganhos += r.total_price || 0;
    });

    transactions
      .filter((t) => t.type === "commission_deduction")
      .forEach((t) => {
        const date = new Date(t.created_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const label = date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
        if (!map.has(key)) map.set(key, { month: label, ganhos: 0, comissoes: 0 });
        map.get(key)!.comissoes += t.amount;
      });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([, v]) => v);
  }, [completedRequests, transactions]);

  // Daily chart data (last 30 days)
  const dailyData = useMemo(() => {
    const map = new Map<string, { day: string; ganhos: number; comissoes: number }>();
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      map.set(key, { day: label, ganhos: 0, comissoes: 0 });
    }

    completedRequests.forEach((r) => {
      const key = (r.completed_at || r.created_at).slice(0, 10);
      if (map.has(key)) map.get(key)!.ganhos += r.total_price || 0;
    });

    transactions
      .filter((t) => t.type === "commission_deduction")
      .forEach((t) => {
        const key = t.created_at.slice(0, 10);
        if (map.has(key)) map.get(key)!.comissoes += t.amount;
      });

    return Array.from(map.values());
  }, [completedRequests, transactions]);

  const chartData = period === "monthly" ? monthlyData : dailyData;

  if (loadingTransactions) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pb-24">
      <div className="pt-4 mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">Finanças</h1>
        <p className="text-muted-foreground text-sm">Acompanhe seus ganhos e comissões</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 rounded-2xl text-center"
        >
          <TrendingUp className="w-5 h-5 text-success mx-auto mb-2" />
          <p className="text-lg font-bold text-foreground">{formatAKZShort(totalEarnings)}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Ganhos</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4 rounded-2xl text-center"
        >
          <ArrowDownRight className="w-5 h-5 text-destructive mx-auto mb-2" />
          <p className="text-lg font-bold text-foreground">{formatAKZShort(totalCommissions)}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Comissões</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4 rounded-2xl text-center"
        >
          <DollarSign className="w-5 h-5 text-primary mx-auto mb-2" />
          <p className="text-lg font-bold text-foreground">{formatAKZShort(netEarnings)}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Líquido</p>
        </motion.div>
      </div>

      {/* Period Toggle */}
      <div className="flex gap-2 mb-4">
        {(["daily", "monthly"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
              period === p
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {p === "daily" ? "Diário" : "Mensal"}
          </button>
        ))}
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 rounded-2xl mb-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">
            {period === "daily" ? "Últimos 30 Dias" : "Últimos 12 Meses"}
          </h2>
        </div>

        {chartData.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">Sem dados financeiros</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey={period === "monthly" ? "month" : "day"}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                interval={period === "daily" ? 6 : 0}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => formatAKZShort(v)}
              />
              <Tooltip
                formatter={(value: number) => [formatAKZ(value)]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="ganhos" name="Ganhos" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="comissoes" name="Comissões" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Recent Completed Services */}
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground mb-4">
          Serviços Recentes
        </h2>
        {completedRequests.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">Nenhum serviço concluído</p>
        ) : (
          <div className="space-y-3">
            {completedRequests.slice(0, 10).map((r) => (
              <div key={r.id} className="flex items-center justify-between p-4 rounded-2xl bg-card/50">
                <div>
                  <p className="font-medium text-foreground text-sm">{r.description?.slice(0, 40)}...</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.completed_at || r.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit", month: "short",
                    })}
                  </p>
                </div>
                <span className="font-bold text-sm text-success">
                  +{formatAKZ(r.total_price || 0)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
