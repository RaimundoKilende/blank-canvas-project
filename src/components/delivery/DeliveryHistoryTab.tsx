import { CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDeliveries } from "@/hooks/useDeliveries";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function DeliveryHistoryTab() {
  const { completedDeliveries, isLoading } = useDeliveries("delivery");

  return (
    <div className="px-4 pt-6 pb-24 space-y-6">
      <h1 className="font-display text-xl font-bold text-foreground">Histórico de Entregas</h1>

      {completedDeliveries.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma entrega concluída</p>
        </div>
      ) : (
        <div className="space-y-3">
          {completedDeliveries.map(del => (
            <div key={del.id} className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground text-sm">
                    Entrega #{del.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {del.delivered_at 
                      ? format(new Date(del.delivered_at), "dd MMM yyyy, HH:mm", { locale: ptBR })
                      : format(new Date(del.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })
                    }
                  </p>
                  {del.delivery_address && (
                    <p className="text-xs text-muted-foreground mt-1">{del.delivery_address}</p>
                  )}
                </div>
                <Badge variant="default" className="bg-success/10 text-success border-success/20">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Entregue
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
