import { useState, useEffect } from "react";
import { User, Mail, Phone, Loader2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Profile, useProfiles } from "@/hooks/useProfiles";

interface ProfileEditDialogProps {
  profile: Profile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileEditDialog({
  profile,
  open,
  onOpenChange,
}: ProfileEditDialogProps) {
  const { updateProfile, deleteProfile } = useProfiles();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        email: profile.email,
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  if (!profile) return null;

  const handleSave = async () => {
    await updateProfile.mutateAsync({
      id: profile.id,
      name: formData.name,
      phone: formData.phone || null,
    });
    onOpenChange(false);
  };

  const handleDelete = async () => {
    await deleteProfile.mutateAsync(profile.id);
    onOpenChange(false);
    setShowDeleteConfirm(false);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-primary/10 text-primary">Admin</Badge>;
      case "technician":
        return <Badge className="bg-success/10 text-success">Técnico</Badge>;
      case "client":
        return <Badge className="bg-warning/10 text-warning">Cliente</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Editar Perfil
            {getRoleBadge(profile.role)}
          </DialogTitle>
          <DialogDescription>
            Atualize as informações do usuário ou remova-o do sistema.
          </DialogDescription>
        </DialogHeader>

        {!showDeleteConfirm ? (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    value={formData.email}
                    disabled
                    className="pl-9 opacity-60"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  O email não pode ser alterado
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-9"
                    placeholder="+244 9XX XXX XXX"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full sm:w-auto"
              >
                Eliminar Perfil
              </Button>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!formData.name || updateProfile.isPending}
                >
                  {updateProfile.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </div>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="py-6 text-center">
              <p className="text-lg font-medium text-foreground mb-2">
                Tem certeza que deseja eliminar este perfil?
              </p>
              <p className="text-muted-foreground">
                Esta ação não pode ser desfeita. O usuário {profile.name} será removido permanentemente.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteProfile.isPending}
              >
                {deleteProfile.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Confirmar Eliminação"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
