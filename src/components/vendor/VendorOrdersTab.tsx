import { useState } from "react";
import { CheckCircle, XCircle, Truck, Clock, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOrders } from "@/hooks/useOrders";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function VendorOrdersTab() {
  const { user } = useAuth();
  const { orders, updateOrderStatus, isLoading } = useOrders("vendor");
  const { createDelivery } = useDeliveries("vendor");
  const [filter, setFilter] = useState<string>("all");

  const filteredOrders = filter === "all" ? orders : orders.filter(o => o.status === filter);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      pending: { label: "Pendente", variant: "secondary" },
      confirmed: { label: "Confirmado", variant: "default" },
      preparing: { label: "Preparando", variant: "default" },
      ready: { label: "Pronto", variant: "default" },
      delivered: { label: "Entregue", variant: "default" },
      cancelled: { label: "Cancelado", variant: "destructive" },
    };
    const s = map[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const handleConfirm = async (orderId: string) => {
    await updateOrderStatus.mutateAsync({ orderId, status: "confirmed" });
  };

  const handleReady = async (orderId: string) => {
    await updateOrderStatus.mutateAsync({ orderId, status: "ready" });
  };

  const handleCallDelivery = async (order: any) => {
    if (!user) return;
    await createDelivery.mutateAsync({
      order_id: order.id,
      vendor_id: user.id,
      pickup_address: order.vendor_profile?.address || "Endereço da loja",
      delivery_address: order.delivery_address,
      delivery_latitude: order.delivery_latitude,
      delivery_longitude: order.delivery_longitude,
    });
  };

  return (
    <div className="px-4 pt-6 pb-24 space-y-4">
      <h1 className="font-display text-xl font-bold text-foreground">Pedidos</h1>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["all", "pending", "confirmed", "ready", "delivered"].map(f => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="shrink-0"
          >
            {f === "all" ? "Todos" : f === "pending" ? "Pendentes" : f === "confirmed" ? "Confirmados" : f === "ready" ? "Prontos" : "Entregues"}
          </Button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum pedido encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map(order => (
            <div key={order.id} className="glass-card rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground text-sm">
                    Pedido #{order.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(order.created_at), "dd MMM HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground text-sm">
                    {order.total_price.toLocaleString("pt-AO")} Kz
                  </p>
                  {getStatusBadge(order.status)}
                </div>
              </div>

              {/* Items */}
              {order.items && order.items.length > 0 && (
                <div className="border-t border-border/50 pt-2 space-y-1">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-xs text-muted-foreground">
                      <span>{item.quantity}x {item.product?.name || "Produto"}</span>
                      <span>{(item.quantity * item.unit_price).toLocaleString("pt-AO")} Kz</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {order.status === "pending" && (
                  <>
                    <Button size="sm" className="flex-1" onClick={() => handleConfirm(order.id)}>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Confirmar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => updateOrderStatus.mutate({ orderId: order.id, status: "cancelled" })}>
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </>
                )}
                {order.status === "confirmed" && (
                  <Button size="sm" className="flex-1" onClick={() => handleReady(order.id)}>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Marcar Pronto
                  </Button>
                )}
                {order.status === "ready" && (
                  <Button size="sm" className="flex-1" onClick={() => handleCallDelivery(order)}>
                    <Truck className="w-4 h-4 mr-1" />
                    Chamar Entregador
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
