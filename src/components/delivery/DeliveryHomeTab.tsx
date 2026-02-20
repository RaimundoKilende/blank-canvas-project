import { motion } from "framer-motion";
import { Package, Clock, MapPin, CheckCircle, Truck, Star, Wallet, Navigation, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/StatCard";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LowBalanceAlert } from "@/components/shared/LowBalanceAlert";

export function DeliveryHomeTab() {
  const { user, profile } = useAuth();
  const { pendingDeliveries, activeDeliveries, completedDeliveries, acceptDelivery, isLoading } = useDeliveries("delivery");

  const { data: deliveryPerson } = useQuery({
    queryKey: ["delivery-person-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_persons")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const walletBalance = deliveryPerson?.wallet_balance || 0;

  return (
    <div className="px-4 pt-6 pb-24 space-y-6">
      {/* Low Balance Alert */}
      <LowBalanceAlert walletBalance={walletBalance} entityType="entregador" />

      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Olá, {profile?.name || "Entregador"} 🚀
        </h1>
        <p className="text-muted-foreground text-sm">Aceite entregas e comece a ganhar</p>
        <div className="flex items-center gap-2 mt-2">
          {deliveryPerson?.verified ? (
            <Badge className="bg-success/10 text-success border-success/20">✓ Verificado</Badge>
          ) : (
            <Badge variant="secondary">Aguardando verificação</Badge>
          )}
          {deliveryPerson?.rating ? (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="w-3.5 h-3.5 text-warning fill-warning" />
              {(deliveryPerson.rating as number).toFixed(1)}
            </div>
          ) : null}
        </div>
      </motion.div>

      {/* Wallet Quick View */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative overflow-hidden rounded-2xl p-4 gradient-primary"
      >
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-primary-foreground/80" />
              <span className="text-xs text-primary-foreground/80">Saldo da Carteira</span>
            </div>
            <p className="text-2xl font-display font-bold text-primary-foreground">
              {walletBalance.toLocaleString("pt-AO")} Kz
            </p>
          </div>
          {walletBalance <= 0 && (
            <Badge variant="destructive" className="text-xs">Sem saldo</Badge>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Clock, label: "Em Curso", value: `${activeDeliveries.length}` },
          { icon: Package, label: "Pendentes", value: `${pendingDeliveries.length}` },
          { icon: CheckCircle, label: "Concluídas", value: `${completedDeliveries.length}` },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Active Deliveries */}
      {activeDeliveries.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-primary" />
            Entregas em Curso ({activeDeliveries.length})
          </h2>
          <div className="space-y-3">
            {activeDeliveries.map(del => (
              <div key={del.id} className="glass-card rounded-xl p-4 border-l-4 border-primary">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-foreground text-sm">Entrega #{del.id.slice(0, 8)}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {del.delivery_address || "Endereço não definido"}
                    </div>
                  </div>
                  <Badge>{del.status === "accepted" ? "Aceite" : del.status === "picked_up" ? "Recolhido" : del.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Pending alert */}
      {pendingDeliveries.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          className="flex items-center gap-3 p-4 rounded-2xl bg-warning/10 border border-warning/20"
        >
          <Bell className="w-5 h-5 text-warning flex-shrink-0" />
          <p className="font-medium text-foreground text-sm">
            {pendingDeliveries.length} entrega(s) disponível(is) para aceitar
          </p>
        </motion.div>
      )}

      {/* Pending Requests */}
      <div>
        <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-warning" />
          Solicitações Recebidas ({pendingDeliveries.length})
        </h2>
        {pendingDeliveries.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-2xl">
            <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">Nenhuma entrega disponível no momento</p>
            <p className="text-xs text-muted-foreground mt-1">Novas entregas aparecerão aqui</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingDeliveries.map((del, i) => (
              <motion.div key={del.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
                className="glass-card rounded-xl p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-foreground text-sm">Entrega #{del.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(del.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <Badge variant="secondary">Pendente</Badge>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {del.pickup_address && (
                    <div className="flex items-center gap-1">
                      <span className="text-primary font-medium">Recolha:</span> {del.pickup_address}
                    </div>
                  )}
                  {del.delivery_address && (
                    <div className="flex items-center gap-1">
                      <span className="text-primary font-medium">Entrega:</span> {del.delivery_address}
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => acceptDelivery.mutate(del.id)}
                  disabled={acceptDelivery.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Aceitar Entrega
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
