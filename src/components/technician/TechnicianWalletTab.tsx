import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, 
  Calendar, Loader2, AlertTriangle, CreditCard, Plus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTechnicians } from "@/hooks/useTechnicians";
import { useWallet } from "@/hooks/useWallet";
import { WalletRechargeDialog } from "./WalletRechargeDialog";

export function TechnicianWalletTab() {
  const { profile } = useAuth();
  const { myTechnicianProfile, loadingMyProfile } = useTechnicians();
  const { transactions, loadingTransactions } = useWallet();
  const [filter, setFilter] = useState<"all" | "deposit" | "commission_deduction">("all");
  const [rechargeOpen, setRechargeOpen] = useState(false);

  const walletBalance = myTechnicianProfile?.wallet_balance || 0;
  const isBlocked = walletBalance <= 0;

  const filteredTransactions = filter === "all" 
    ? transactions 
    : transactions.filter(t => t.type === filter);

  if (loadingMyProfile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pb-24">
      <div className="pt-4 mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">Carteira</h1>
          <p className="text-muted-foreground text-sm">Seu saldo e transações</p>
        </div>
        <Button 
          onClick={() => setRechargeOpen(true)}
          className="gradient-primary text-primary-foreground"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Recarregar
        </Button>
      </div>

      {/* Blocked Warning */}
      {isBlocked && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 mb-4"
        >
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
          <div>
            <p className="font-medium text-destructive text-sm">Carteira sem saldo</p>
            <p className="text-xs text-destructive/80">
              Carregue sua carteira para continuar recebendo pedidos de clientes.
            </p>
          </div>
        </motion.div>
      )}

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 mb-6"
        style={{ background: isBlocked ? "var(--destructive)" : "var(--gradient-primary)" }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-primary-foreground/80" />
            <span className="text-sm text-primary-foreground/80">Saldo Disponível</span>
          </div>
          <p className="text-4xl font-display font-bold text-primary-foreground mb-2">
            {walletBalance.toLocaleString("pt-AO")} Kz
          </p>
          <p className="text-sm text-primary-foreground/70">
            {isBlocked 
              ? "⚠ Sem saldo — você não receberá novos pedidos"
              : "Comissões serão descontadas automaticamente"
            }
          </p>
        </div>
      </motion.div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4 rounded-2xl"
        >
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="w-4 h-4 text-success" />
            <span className="text-xs text-muted-foreground">Total Depositado</span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {transactions
              .filter(t => t.type === "deposit")
              .reduce((sum, t) => sum + t.amount, 0)
              .toLocaleString("pt-AO")} Kz
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4 rounded-2xl"
        >
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownRight className="w-4 h-4 text-destructive" />
            <span className="text-xs text-muted-foreground">Total Comissões</span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {transactions
              .filter(t => t.type === "commission_deduction")
              .reduce((sum, t) => sum + t.amount, 0)
              .toLocaleString("pt-AO")} Kz
          </p>
        </motion.div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {[
          { key: "all" as const, label: "Todas" },
          { key: "deposit" as const, label: "Depósitos" },
          { key: "commission_deduction" as const, label: "Comissões" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Transactions */}
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground mb-4">
          Histórico de Transações
        </h2>
        
        {loadingTransactions ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma transação encontrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 rounded-2xl bg-card/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === "deposit" 
                      ? "bg-success/10" 
                      : "bg-destructive/10"
                  }`}>
                    {transaction.type === "deposit" 
                      ? <ArrowUpRight className="w-5 h-5 text-success" />
                      : <ArrowDownRight className="w-5 h-5 text-destructive" />
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground text-sm">
                        {transaction.description}
                      </p>
                      {transaction.status === "pending" && (
                        <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/20">
                          Pendente
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {transaction.reference_number && (
                        <span className="ml-1 font-mono"> • Ref: {transaction.reference_number}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`font-bold text-sm ${
                    transaction.type === "deposit" ? "text-success" : "text-destructive"
                  }`}>
                    {transaction.type === "deposit" ? "+" : "-"}
                    {transaction.amount.toLocaleString("pt-AO")} Kz
                  </span>
                  {transaction.status === "completed" && (
                    <p className="text-[10px] text-muted-foreground">
                      Saldo: {transaction.balance_after.toLocaleString("pt-AO")} Kz
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Recharge Dialog */}
      {myTechnicianProfile && (
        <WalletRechargeDialog
          open={rechargeOpen}
          onOpenChange={setRechargeOpen}
          technicianId={myTechnicianProfile.id}
          onSuccess={() => {
            // Refresh data
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
