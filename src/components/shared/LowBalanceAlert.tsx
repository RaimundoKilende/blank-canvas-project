import { motion } from "framer-motion";
import { AlertTriangle, Wallet, Ban } from "lucide-react";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";

interface LowBalanceAlertProps {
  walletBalance: number;
  entityType: "técnico" | "vendedor" | "entregador";
}

export function LowBalanceAlert({ walletBalance, entityType }: LowBalanceAlertProps) {
  const { getSettingNumber } = usePlatformSettings();
  const threshold = getSettingNumber("low_balance_threshold", 500);

  const isBlocked = walletBalance <= 0;
  const isLow = !isBlocked && walletBalance <= threshold;

  if (!isBlocked && !isLow) return null;

  if (isBlocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 mb-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center flex-shrink-0">
            <Ban className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-destructive text-sm">Conta Bloqueada</h3>
            <p className="text-xs text-destructive/80 mt-1">
              O seu saldo está a zero. Você não está visível para os clientes e não pode receber novos pedidos. 
              Recarregue a sua carteira para voltar a aparecer na plataforma.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-warning/10 border border-warning/30 mb-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-warning" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-warning text-sm">Saldo Baixo</h3>
          <p className="text-xs text-warning/80 mt-1">
            Atenção, o seu saldo está a acabar ({walletBalance.toLocaleString()} Kz). 
            Recarregue para não parar de receber clientes.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
