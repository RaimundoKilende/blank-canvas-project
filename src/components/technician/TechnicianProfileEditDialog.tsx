import { useState, useEffect, useRef } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Plus, Save, Upload, Image } from "lucide-react";
import { useSpecialties } from "@/hooks/useSpecialties";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useTechnicians } from "@/hooks/useTechnicians";
import type { Technician } from "@/hooks/useTechnicians";

interface TechnicianProfileEditDialogProps {
  technician?: Technician | null;
  profile?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TechnicianProfileEditDialog({
  technician: propTechnician,
  profile: propProfile,
  open,
  onOpenChange,
}: TechnicianProfileEditDialogProps) {
  const { toast } = useToast();
  const { user, profile: authProfile } = useAuth();
  const { myTechnicianProfile } = useTechnicians();
  const queryClient = useQueryClient();
  const { specialties: availableSpecialties } = useSpecialties();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const profile = propProfile || authProfile;
  const techProfile = propTechnician || myTechnicianProfile;

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    bio: "",
    specialties: [] as string[],
    certifications: "",
    previous_experience: "",
    portfolio_photos: [] as string[],
  });

  const [newSpecialty, setNewSpecialty] = useState("");

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        phone: profile.phone || "",
        bio: techProfile?.bio || "",
        specialties: techProfile?.specialties || [],
        certifications: techProfile?.certifications || "",
        previous_experience: techProfile?.previous_experience || "",
        portfolio_photos: techProfile?.portfolio_photos || [],
      });
    }
  }, [techProfile, profile]);

  const addSpecialty = (specialty: string) => {
    if (specialty && !formData.specialties.includes(specialty)) {
      setFormData({ ...formData, specialties: [...formData.specialties, specialty] });
      setNewSpecialty("");
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData({ ...formData, specialties: formData.specialties.filter((s) => s !== specialty) });
  };

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploading(true);
    try {
      const newPhotos: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("technician-portfolio").upload(path, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("technician-portfolio").getPublicUrl(path);
        newPhotos.push(urlData.publicUrl);
      }
      setFormData(prev => ({ ...prev, portfolio_photos: [...prev.portfolio_photos, ...newPhotos] }));
    } catch (err: any) {
      toast({ title: "Erro ao carregar foto", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removePortfolioPhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      portfolio_photos: prev.portfolio_photos.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ name: formData.name, phone: formData.phone })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      const { error: techError } = await supabase
        .from("technicians")
        .update({
          bio: formData.bio,
          specialties: formData.specialties,
          certifications: formData.certifications,
          previous_experience: formData.previous_experience,
          portfolio_photos: formData.portfolio_photos,
        })
        .eq("user_id", user.id);

      if (techError) throw techError;

      toast({ title: "Perfil atualizado!", description: "Suas informações foram salvas com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["technician-profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Meu Perfil</DialogTitle>
          <DialogDescription>Atualize suas informações, CV e portfólio</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sobre Mim</Label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Descreva sua experiência e qualificações..."
              className="min-h-[80px]"
            />
          </div>

          {/* Certifications */}
          <div className="space-y-2">
            <Label>Certificações</Label>
            <Textarea
              value={formData.certifications}
              onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
              placeholder="Liste suas certificações profissionais..."
              className="min-h-[80px]"
            />
          </div>

          {/* Previous Experience */}
          <div className="space-y-2">
            <Label>Experiência Profissional</Label>
            <Textarea
              value={formData.previous_experience}
              onChange={(e) => setFormData({ ...formData, previous_experience: e.target.value })}
              placeholder="Descreva sua experiência anterior..."
              className="min-h-[80px]"
            />
          </div>

          {/* Portfolio Gallery */}
          <div className="space-y-3">
            <Label>Portfólio (Galeria de Fotos)</Label>
            {formData.portfolio_photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {formData.portfolio_photos.map((photo, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border">
                    <img src={photo} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePortfolioPhoto(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePortfolioUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {uploading ? "Carregando..." : "Adicionar Fotos ao Portfólio"}
            </Button>
          </div>

          {/* Specialties */}
          <div className="space-y-3">
            <Label>Minhas Especialidades</Label>
            <div className="flex flex-wrap gap-2">
              {formData.specialties.map((specialty) => (
                <Badge key={specialty} variant="secondary" className="flex items-center gap-1">
                  {specialty}
                  <button type="button" onClick={() => removeSpecialty(specialty)} className="hover:bg-destructive/20 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              {formData.specialties.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma especialidade</p>
              )}
            </div>
            
            <select
              value=""
              onChange={(e) => { if (e.target.value) addSpecialty(e.target.value); }}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Adicionar da lista...</option>
              {availableSpecialties
                .filter((s) => !formData.specialties.includes(s.name))
                .map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
            </select>
            
            <div className="flex gap-2">
              <Input
                placeholder="Ou digite uma nova especialidade..."
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSpecialty(newSpecialty); } }}
              />
              <Button type="button" variant="outline" size="icon" onClick={() => addSpecialty(newSpecialty)} disabled={!newSpecialty}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
