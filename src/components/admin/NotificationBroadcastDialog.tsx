import { useState } from "react";
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
import { Loader2, Send, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTechnicians } from "@/hooks/useTechnicians";

interface NotificationBroadcastDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationBroadcastDialog({
  open,
  onOpenChange,
}: NotificationBroadcastDialogProps) {
  const { toast } = useToast();
  const { technicians } = useTechnicians();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "system" as "system" | "service_request" | "payment",
  });

  const handleSend = async () => {
    if (!formData.title || !formData.message) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e a mensagem.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Send notification to all verified technicians
      const notifications = technicians
        .filter((t) => t.verified)
        .map((t) => ({
          user_id: t.user_id,
          title: formData.title,
          message: formData.message,
          type: formData.type,
          data: { broadcast: true },
        }));

      if (notifications.length === 0) {
        toast({
          title: "Nenhum destinatário",
          description: "Não há técnicos verificados para enviar a notificação.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("notifications").insert(notifications);

      if (error) throw error;

      toast({
        title: "Notificações enviadas!",
        description: `${notifications.length} técnicos foram notificados.`,
      });

      setFormData({ title: "", message: "", type: "system" });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao enviar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Enviar Notificação
          </DialogTitle>
          <DialogDescription>
            Envie uma notificação para todos os técnicos verificados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full h-10 rounded-md border border-input bg-background px-3"
            >
              <option value="system">Sistema</option>
              <option value="service_request">Serviço</option>
              <option value="payment">Pagamento</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              placeholder="Ex: Novidade na plataforma!"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea
              placeholder="Escreva a mensagem..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="min-h-[100px]"
            />
          </div>

          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-sm text-muted-foreground">
              <strong>{technicians.filter((t) => t.verified).length}</strong> técnicos verificados
              receberão esta notificação.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Enviar para Todos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
