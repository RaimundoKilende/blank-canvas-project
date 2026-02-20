import { useState } from "react";
import { motion } from "framer-motion";
import { Package, ShoppingBag, TrendingUp, Clock, Wallet, Star, MapPin, Bell, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useVendorProfile } from "@/hooks/useVendorProfile";
import { useProducts } from "@/hooks/useProducts";
import { useOrders } from "@/hooks/useOrders";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LowBalanceAlert } from "@/components/shared/LowBalanceAlert";

export function VendorHomeTab() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { vendor } = useVendorProfile();
  const { products } = useProducts(user?.id);
  const { orders } = useOrders("vendor");

  const pendingOrders = orders.filter(o => o.status === "pending");
  const confirmedOrders = orders.filter(o => o.status === "confirmed");
  const completedOrders = orders.filter(o => o.status === "completed" || o.status === "delivered");
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total_price, 0);
  const walletBalance = vendor?.wallet_balance || 0;

  return (
    <div className="px-4 pt-6 pb-24 space-y-6">
      {/* Low Balance Alert */}
      <LowBalanceAlert walletBalance={walletBalance} entityType="vendedor" />

      {/* Welcome Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Olá, {vendor?.store_name || profile?.name || "Vendedor"} 👋
        </h1>
        <p className="text-muted-foreground text-sm">Gerencie sua loja e pedidos</p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            {vendor?.verified ? (
              <Badge className="bg-success/10 text-success border-success/20">✓ Verificado</Badge>
            ) : (
              <Badge variant="secondary">Aguardando verificação</Badge>
            )}
            {vendor?.rating ? (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                {vendor.rating.toFixed(1)}
              </div>
            ) : null}
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate("/vendor/request-service")} className="rounded-xl gap-1.5">
            <Wrench className="w-4 h-4" />
            Solicitar Técnico
          </Button>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Package, label: "Produtos", value: `${products.length}` },
          { icon: Clock, label: "Pendentes", value: `${pendingOrders.length}` },
          { icon: ShoppingBag, label: "Vendas", value: `${completedOrders.length}` },
          { icon: TrendingUp, label: "Receita", value: `${totalRevenue.toLocaleString("pt-AO")} Kz` },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Active Orders Alert */}
      {(pendingOrders.length > 0 || confirmedOrders.length > 0) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="flex items-center gap-3 p-4 rounded-2xl bg-warning/10 border border-warning/20"
        >
          <Bell className="w-5 h-5 text-warning flex-shrink-0" />
          <div>
            <p className="font-medium text-foreground text-sm">
              {pendingOrders.length > 0 && `${pendingOrders.length} pedido(s) aguardando confirmação`}
              {pendingOrders.length > 0 && confirmedOrders.length > 0 && " • "}
              {confirmedOrders.length > 0 && `${confirmedOrders.length} em preparação`}
            </p>
          </div>
        </motion.div>
      )}

      {/* Recent Orders */}
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground mb-3">Pedidos Recentes</h2>
        {pendingOrders.length === 0 ? (
          <div className="text-center py-8 glass-card rounded-2xl">
            <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-muted-foreground text-sm">Nenhum pedido pendente</p>
            <p className="text-xs text-muted-foreground mt-1">Novos pedidos aparecerão aqui</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingOrders.slice(0, 5).map((order, i) => (
              <motion.div key={order.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}
                className="glass-card rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      Pedido #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      {order.total_price.toLocaleString("pt-AO")} Kz
                    </p>
                    <Badge variant="secondary" className="text-xs">Pendente</Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
