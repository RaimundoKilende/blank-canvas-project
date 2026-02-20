import { useState, useRef } from "react";
import { Plus, Trash2, Camera, X, Loader2, ImagePlus, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ServiceExtra {
  name: string;
  description?: string;
  price: number;
}

interface ServiceExtraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extras: ServiceExtra[];
  onComplete: (extras: ServiceExtra[], completionPhotos?: string[], completionCode?: string) => void;
  isPending?: boolean;
}

export function ServiceExtraDialog({
  open,
  onOpenChange,
  extras: initialExtras,
  onComplete,
  isPending,
}: ServiceExtraDialogProps) {
  const { user } = useAuth();
  const [extras, setExtras] = useState<ServiceExtra[]>(initialExtras);
  const [newExtra, setNewExtra] = useState<ServiceExtra>({ name: "", price: 0 });
  const [completionCode, setCompletionCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  
  // Photo upload state
  const [photos, setPhotos] = useState<File[]>([]);
  const [photosPreviews, setPhotosPreviews] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addExtra = () => {
    if (newExtra.name && newExtra.price > 0) {
      setExtras([...extras, newExtra]);
      setNewExtra({ name: "", price: 0 });
    }
  };

  const removeExtra = (index: number) => {
    setExtras(extras.filter((_, i) => i !== index));
  };

  // Handle photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos = Array.from(files).slice(0, 5 - photos.length);
    
    newPhotos.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotosPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setPhotos(prev => [...prev, ...newPhotos]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotosPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Upload photos to storage
  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0 || !user) return [];
    
    setUploadingPhotos(true);
    const uploadedUrls: string[] = [];

    try {
      for (const photo of photos) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${user.id}/completion/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('service-photos')
          .upload(fileName, photo, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Upload error:', error);
          continue;
        }

        const { data: publicUrl } = supabase.storage
          .from('service-photos')
          .getPublicUrl(data.path);

        uploadedUrls.push(publicUrl.publicUrl);
      }
    } finally {
      setUploadingPhotos(false);
    }

    return uploadedUrls;
  };

  const handleComplete = async () => {
    if (completionCode.length !== 4) {
      setCodeError(true);
      return;
    }
    setCodeError(false);
    const photoUrls = await uploadPhotos();
    onComplete(extras, photoUrls.length > 0 ? photoUrls : undefined, completionCode);
  };

  const totalExtras = extras.reduce((sum, e) => sum + e.price, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Concluir Serviço</DialogTitle>
          <DialogDescription>
            Introduza o código de finalização fornecido pelo cliente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Completion Code Input */}
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 space-y-3">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <h4 className="font-medium text-foreground">Código de Finalização</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Solicite o código de 4 dígitos ao cliente para confirmar a conclusão do serviço.
            </p>
            <div className="flex justify-center">
              <InputOTP
                maxLength={4}
                value={completionCode}
                onChange={(val) => { setCompletionCode(val); setCodeError(false); }}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            {codeError && (
              <p className="text-xs text-destructive text-center font-medium">
                {completionCode.length < 4 
                  ? "Introduza o código completo de 4 dígitos"
                  : "Código inválido. Confirme com o cliente."
                }
              </p>
            )}
          </div>

          {/* Completion Photos Section */}
          <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" />
                Fotos do Serviço Concluído
              </h4>
              <span className="text-xs text-muted-foreground">{photos.length}/5</span>
            </div>

            {/* Photos Preview */}
            {photosPreviews.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                <AnimatePresence>
                  {photosPreviews.map((preview, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative flex-shrink-0"
                    >
                      <img
                        src={preview}
                        alt={`Foto ${index + 1}`}
                        className="w-20 h-20 rounded-xl object-cover ring-2 ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center shadow-lg"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Add Photo Button */}
            {photos.length < 5 && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full gap-2"
                >
                  <ImagePlus className="w-4 h-4" />
                  Adicionar Foto
                </Button>
              </>
            )}

            <p className="text-xs text-muted-foreground">
              Documente o trabalho realizado com fotos do antes e depois
            </p>
          </div>

          {/* Add New Extra */}
          <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
            <h4 className="font-medium text-foreground">Adicionar Trabalho Extra</h4>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                placeholder="Ex: Troca de disjuntor adicional"
                value={newExtra.name}
                onChange={(e) => setNewExtra({ ...newExtra, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Preço (Kz)</Label>
              <Input
                type="number"
                placeholder="5000"
                value={newExtra.price || ""}
                onChange={(e) => setNewExtra({ ...newExtra, price: Number(e.target.value) })}
              />
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addExtra}
              disabled={!newExtra.name || newExtra.price <= 0}
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
          </div>

          {/* Extras List */}
          {extras.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Trabalhos Extras</h4>
              {extras.map((extra, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{extra.name}</p>
                    <p className="text-xs text-muted-foreground">{extra.price.toLocaleString()} Kz</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExtra(index)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
              
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="font-medium">Total Extras:</span>
                <span className="font-bold text-primary">{totalExtras.toLocaleString()} Kz</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleComplete}
            disabled={isPending || uploadingPhotos || completionCode.length !== 4}
            className="gradient-primary text-primary-foreground"
          >
            {uploadingPhotos ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando fotos...
              </>
            ) : isPending ? (
              "Concluindo..."
            ) : (
              "Concluir Serviço"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
