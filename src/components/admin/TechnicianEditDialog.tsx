import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, X, Plus, Save } from "lucide-react";
import { useSpecialties } from "@/hooks/useSpecialties";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import type { Technician } from "@/hooks/useTechnicians";

interface TechnicianEditDialogProps {
  technician: Technician | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TechnicianEditDialog({
  technician,
  open,
  onOpenChange,
}: TechnicianEditDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { specialties: availableSpecialties } = useSpecialties();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    specialties: [] as string[],
    verified: false,
    active: false,
    rating: 0,
  });

  const [newSpecialty, setNewSpecialty] = useState("");

  useEffect(() => {
    if (technician) {
      setFormData({
        name: technician.profile?.name || "",
        email: technician.profile?.email || "",
        phone: technician.profile?.phone || "",
        bio: technician.bio || "",
        specialties: technician.specialties || [],
        verified: technician.verified,
        active: technician.active,
        rating: technician.rating || 0,
      });
    }
  }, [technician]);

  const addSpecialty = (specialty: string) => {
    if (specialty && !formData.specialties.includes(specialty)) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, specialty],
      });
      setNewSpecialty("");
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.filter((s) => s !== specialty),
    });
  };

  const handleSave = async () => {
    if (!technician) return;

    setLoading(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          name: formData.name,
          phone: formData.phone,
        })
        .eq("user_id", technician.user_id);

      if (profileError) throw profileError;

      // Update technician
      const { error: techError } = await supabase
        .from("technicians")
        .update({
          bio: formData.bio,
          specialties: formData.specialties,
          verified: formData.verified,
          active: formData.active,
        })
        .eq("id", technician.id);

      if (techError) throw techError;

      toast({
        title: "Técnico atualizado!",
        description: "As informações foram salvas com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: ["technicians"] });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!technician) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Técnico</DialogTitle>
          <DialogDescription>
            Atualize as informações do técnico
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email (somente leitura)</Label>
            <Input value={formData.email} disabled />
          </div>

          <div className="space-y-2">
            <Label>Biografia</Label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Sobre o técnico..."
            />
          </div>

          {/* Specialties */}
          <div className="space-y-3">
            <Label>Especialidades</Label>
            <div className="flex flex-wrap gap-2">
              {formData.specialties.map((specialty) => (
                <Badge key={specialty} variant="secondary" className="flex items-center gap-1">
                  {specialty}
                  <button
                    type="button"
                    onClick={() => removeSpecialty(specialty)}
                    className="hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) addSpecialty(e.target.value);
                }}
                className="flex-1 h-10 rounded-md border border-input bg-background px-3"
              >
                <option value="">Adicionar especialidade existente...</option>
                {availableSpecialties
                  .filter((s) => !formData.specialties.includes(s.name))
                  .map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ou adicionar nova especialidade..."
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSpecialty(newSpecialty);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => addSpecialty(newSpecialty)}
                disabled={!newSpecialty}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Status Toggles */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
              <div>
                <Label>Verificado</Label>
                <p className="text-xs text-muted-foreground">Técnico aprovado pela plataforma</p>
              </div>
              <Switch
                checked={formData.verified}
                onCheckedChange={(checked) => setFormData({ ...formData, verified: checked })}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
              <div>
                <Label>Online</Label>
                <p className="text-xs text-muted-foreground">Disponível para receber serviços</p>
              </div>
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
            </div>
          </div>

          {/* Stats (read-only) */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-secondary/50 text-center">
              <p className="text-2xl font-bold text-primary">{technician.completed_jobs || 0}</p>
              <p className="text-xs text-muted-foreground">Serviços</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 text-center">
              <p className="text-2xl font-bold">{technician.rating?.toFixed(1) || "0.0"}</p>
              <p className="text-xs text-muted-foreground">Avaliação</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 text-center">
              <p className="text-2xl font-bold">{technician.review_count || 0}</p>
              <p className="text-xs text-muted-foreground">Reviews</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
