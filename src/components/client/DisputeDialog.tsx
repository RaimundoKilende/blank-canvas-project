import { useState, useRef } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle, Camera, X, Upload } from "lucide-react";
import { useSupportTickets } from "@/hooks/useSupportTickets";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DisputeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceRequestId: string;
  technicianId: string;
  technicianName?: string;
  serviceName?: string;
}

export function DisputeDialog({ open, onOpenChange, serviceRequestId, technicianId, technicianName, serviceName }: DisputeDialogProps) {
  const { createTicket } = useSupportTickets();
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        
        const { error } = await supabase.storage
          .from("dispute-evidence")
          .upload(fileName, file, { cacheControl: "3600", upsert: false });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from("dispute-evidence")
          .getPublicUrl(fileName);

        uploaded.push(urlData.publicUrl);
      }
      setPhotos(prev => [...prev, ...uploaded]);
    } catch (err: any) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) return;
    await createTicket.mutateAsync({
      subject,
      description,
      service_request_id: serviceRequestId,
      against_id: technicianId,
      ticket_type: "dispute",
      evidence_photos: photos,
    });
    setSubject("");
    setDescription("");
    setPhotos([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Reportar Problema
          </DialogTitle>
          <DialogDescription>
            {serviceName && technicianName
              ? `Disputa sobre "${serviceName}" com ${technicianName}. O técnico terá 24h para responder.`
              : "Descreva o problema. O técnico terá 24h para apresentar a sua versão."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          <div className="space-y-2">
            <Label>Assunto *</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Serviço mal executado, Dano no imóvel..."
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição detalhada *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o problema com o máximo de detalhes possível..."
              className="min-h-[100px]"
            />
          </div>

          {/* Evidence Photos */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Evidências (fotos/vídeo)
            </Label>
            <p className="text-xs text-muted-foreground">
              Envie fotos ou vídeos que comprovem o problema
            </p>

            {photos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden ring-2 ring-border">
                    <img src={photo} alt={`Evidência ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {uploading ? "Enviando..." : "Adicionar Evidências"}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={!subject.trim() || !description.trim() || createTicket.isPending}
            className="bg-warning text-warning-foreground hover:bg-warning/90"
          >
            {createTicket.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Abrir Disputa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
