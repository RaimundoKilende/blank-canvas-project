import { motion } from "framer-motion";
import { Truck, Star, MapPin, LogOut, Phone, Mail, Wallet, Navigation, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function DeliveryProfileTab() {
  const { user, profile, signOut } = useAuth();
  const { completedDeliveries } = useDeliveries("delivery");

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

  return (
    <div className="px-4 pt-6 pb-24 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 text-center">
        <Avatar className="w-14 h-14 mx-auto mb-3">
          <AvatarFallback className="bg-primary/10 text-primary text-2xl">
            <Truck className="w-8 h-8" />
          </AvatarFallback>
        </Avatar>
        <h2 className="font-display text-xl font-bold text-foreground">
          {profile?.name || "Entregador"}
        </h2>
        <p className="text-sm text-muted-foreground">{profile?.email}</p>
        {profile?.phone && <p className="text-sm text-muted-foreground">{profile.phone}</p>}
        <div className="flex items-center justify-center gap-3 mt-3">
          {deliveryPerson?.verified ? (
            <Badge className="bg-success/10 text-success border-success/20">✓ Verificado</Badge>
          ) : (
            <Badge variant="secondary">Pendente</Badge>
          )}
          {deliveryPerson?.rating ? (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="w-4 h-4 text-warning fill-warning" />
              {(deliveryPerson.rating as number).toFixed(1)}
            </div>
          ) : null}
        </div>
      </motion.div>

      {/* Info */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-4">
        <h3 className="font-semibold text-foreground mb-3">Informações</h3>
        <div className="space-y-3">
          {deliveryPerson?.vehicle_type && (
            <div className="flex items-center gap-2 text-sm">
              <Truck className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">Veículo: {deliveryPerson.vehicle_type}</span>
            </div>
          )}
          {profile?.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{profile.email}</span>
            </div>
          )}
          {profile?.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{profile.phone}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-4">
        <h3 className="font-semibold text-foreground mb-3">Estatísticas</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl bg-secondary/50">
            <CheckCircle className="w-5 h-5 mx-auto mb-1 text-success" />
            <p className="text-2xl font-bold text-foreground">{completedDeliveries.length}</p>
            <p className="text-xs text-muted-foreground">Entregas</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-secondary/50">
            <Star className="w-5 h-5 mx-auto mb-1 text-warning" />
            <p className="text-2xl font-bold text-foreground">{deliveryPerson?.rating ? (deliveryPerson.rating as number).toFixed(1) : "0.0"}</p>
            <p className="text-xs text-muted-foreground">Avaliação</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-secondary/50">
            <Wallet className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold text-foreground">{(deliveryPerson?.wallet_balance || 0).toLocaleString("pt-AO")}</p>
            <p className="text-xs text-muted-foreground">Saldo (Kz)</p>
          </div>
        </div>
      </motion.div>

      {/* Work Areas */}
      {deliveryPerson?.work_areas && (deliveryPerson.work_areas as string[]).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-4">
          <h3 className="font-semibold text-foreground mb-3">Zonas de Atuação</h3>
          <div className="flex flex-wrap gap-2">
            {(deliveryPerson.work_areas as string[]).map((area: string) => (
              <Badge key={area} variant="secondary" className="text-xs">
                <MapPin className="w-3 h-3 mr-1" />
                {area}
              </Badge>
            ))}
          </div>
        </motion.div>
      )}

      <Button variant="destructive" className="w-full" onClick={signOut}>
        <LogOut className="w-4 h-4 mr-2" />
        Sair da Conta
      </Button>
    </div>
  );
}
