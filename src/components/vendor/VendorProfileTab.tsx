import { useState } from "react";
import { motion } from "framer-motion";
import { Store, Edit, Save, MapPin, Star, LogOut, ShoppingBag, Wallet, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useVendorProfile } from "@/hooks/useVendorProfile";

export function VendorProfileTab() {
  const { profile, signOut } = useAuth();
  const { vendor, updateVendor } = useVendorProfile();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    store_name: "",
    store_description: "",
    address: "",
  });

  const startEdit = () => {
    setForm({
      store_name: vendor?.store_name || "",
      store_description: vendor?.store_description || "",
      address: vendor?.address || "",
    });
    setEditing(true);
  };

  const save = async () => {
    await updateVendor.mutateAsync(form);
    setEditing(false);
  };

  return (
    <div className="px-4 pt-6 pb-24 space-y-6">
      {/* Header Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 text-center">
        <Avatar className="w-20 h-20 mx-auto mb-3">
          <AvatarFallback className="bg-primary/10 text-primary text-2xl">
            <Store className="w-8 h-8" />
          </AvatarFallback>
        </Avatar>
        <h2 className="font-display text-xl font-bold text-foreground">
          {vendor?.store_name || profile?.name || "Minha Loja"}
        </h2>
        <p className="text-sm text-muted-foreground">{profile?.email}</p>
        {profile?.phone && <p className="text-sm text-muted-foreground">{profile.phone}</p>}
        <div className="flex items-center justify-center gap-3 mt-3">
          <Badge variant={vendor?.verified ? "default" : "secondary"}>
            {vendor?.verified ? "✓ Verificado" : "Pendente"}
          </Badge>
          {vendor && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="w-4 h-4 text-warning fill-warning" />
              {vendor.rating?.toFixed(1) || "0.0"}
            </div>
          )}
        </div>
      </motion.div>

      {/* Store Info */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Informações da Loja</h3>
          {!editing ? (
            <Button variant="ghost" size="sm" onClick={startEdit}>
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
          ) : (
            <Button size="sm" onClick={save} disabled={updateVendor.isPending}>
              <Save className="w-4 h-4 mr-1" />
              Salvar
            </Button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <Label>Nome da Loja</Label>
              <Input value={form.store_name} onChange={(e) => setForm(p => ({ ...p, store_name: e.target.value }))} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.store_description} onChange={(e) => setForm(p => ({ ...p, store_description: e.target.value }))} />
            </div>
            <div>
              <Label>Endereço</Label>
              <Input value={form.address} onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))} />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Store className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{vendor?.store_name || "Sem nome"}</span>
            </div>
            {vendor?.store_description && (
              <p className="text-sm text-muted-foreground pl-6">{vendor.store_description}</p>
            )}
            {vendor?.address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{vendor.address}</span>
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
        )}
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-4">
        <h3 className="font-semibold text-foreground mb-3">Estatísticas</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl bg-secondary/50">
            <ShoppingBag className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold text-foreground">{vendor?.completed_orders || 0}</p>
            <p className="text-xs text-muted-foreground">Vendas</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-secondary/50">
            <Star className="w-5 h-5 mx-auto mb-1 text-warning" />
            <p className="text-2xl font-bold text-foreground">{vendor?.review_count || 0}</p>
            <p className="text-xs text-muted-foreground">Avaliações</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-secondary/50">
            <Wallet className="w-5 h-5 mx-auto mb-1 text-success" />
            <p className="text-2xl font-bold text-foreground">{(vendor?.wallet_balance || 0).toLocaleString("pt-AO")}</p>
            <p className="text-xs text-muted-foreground">Saldo (Kz)</p>
          </div>
        </div>
      </motion.div>

      {/* Work Areas */}
      {vendor?.work_areas && vendor.work_areas.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-4">
          <h3 className="font-semibold text-foreground mb-3">Zonas de Atendimento</h3>
          <div className="flex flex-wrap gap-2">
            {vendor.work_areas.map((area: string) => (
              <Badge key={area} variant="secondary" className="text-xs">{area}</Badge>
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
