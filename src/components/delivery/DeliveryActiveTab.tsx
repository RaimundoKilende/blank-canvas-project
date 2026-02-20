import { MapPin, Navigation, CheckCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useEffect } from "react";

export function DeliveryActiveTab() {
  const { activeDeliveries, updateDeliveryStatus, updateLocation, isLoading } = useDeliveries("delivery");
  const { latitude, longitude, getCurrentPosition } = useGeolocation();

  // Auto-update location for active deliveries
  useEffect(() => {
    if (activeDeliveries.length === 0) return;
    getCurrentPosition();
    const interval = setInterval(() => {
      getCurrentPosition();
    }, 15000);
    return () => clearInterval(interval);
  }, [activeDeliveries.length]);

  // Send location update
  useEffect(() => {
    if (!latitude || !longitude || activeDeliveries.length === 0) return;
    activeDeliveries.forEach(del => {
      if (["accepted", "picked_up", "in_transit"].includes(del.status)) {
        updateLocation.mutate({ id: del.id, lat: latitude, lng: longitude });
      }
    });
  }, [latitude, longitude]);

  const handlePickup = async (id: string) => {
    await updateDeliveryStatus.mutateAsync({ id, status: "picked_up" });
  };

  const handleDeliver = async (id: string) => {
    await updateDeliveryStatus.mutateAsync({ id, status: "delivered" });
  };

  return (
    <div className="px-4 pt-6 pb-24 space-y-6">
      <h1 className="font-display text-xl font-bold text-foreground">Entregas em Curso</h1>

      {activeDeliveries.length === 0 ? (
        <div className="text-center py-12">
          <Navigation className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma entrega em curso</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeDeliveries.map(del => (
            <div key={del.id} className="glass-card rounded-xl p-4 space-y-3 border-l-4 border-primary">
              <div className="flex justify-between items-center">
                <p className="font-medium text-foreground">Entrega #{del.id.slice(0, 8)}</p>
                <Badge>{del.status === "accepted" ? "Aceite" : del.status === "picked_up" ? "Recolhido" : "Em trânsito"}</Badge>
              </div>

              <div className="space-y-2">
                {del.pickup_address && (
                  <div className="flex items-start gap-2 text-sm">
                    <Package className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Recolha</p>
                      <p className="text-foreground">{del.pickup_address}</p>
                    </div>
                  </div>
                )}
                {del.delivery_address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-destructive mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Entrega</p>
                      <p className="text-foreground">{del.delivery_address}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Location sharing indicator */}
              {latitude && longitude && (
                <div className="flex items-center gap-1 text-xs text-success">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  Localização a ser partilhada em tempo real
                </div>
              )}

              <div className="flex gap-2">
                {del.status === "accepted" && (
                  <Button size="sm" className="flex-1" onClick={() => handlePickup(del.id)}>
                    <Package className="w-4 h-4 mr-1" />
                    Confirmar Recolha
                  </Button>
                )}
                {del.status === "picked_up" && (
                  <Button size="sm" className="flex-1" onClick={() => handleDeliver(del.id)}>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Confirmar Entrega
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
