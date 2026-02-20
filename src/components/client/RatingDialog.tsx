import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Loader2, CheckCircle, Receipt, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ServiceExtra {
  name: string;
  price: number;
}

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceName: string;
  technicianName: string;
  basePrice: number;
  extras?: ServiceExtra[];
  urgency?: string;
  totalPrice: number;
  description?: string;
  address?: string;
  completedAt?: string;
  onSubmit: (rating: number, feedback: string) => void;
  isPending?: boolean;
}

export function RatingDialog({
  open,
  onOpenChange,
  serviceName,
  technicianName,
  basePrice,
  extras = [],
  urgency,
  totalPrice,
  description,
  address,
  completedAt,
  onSubmit,
  isPending,
}: RatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating, feedback);
    }
  };

  const urgencyMultiplier = urgency === "urgent" ? 1.2 : 1;
  const baseWithUrgency = basePrice * urgencyMultiplier;
  const extrasTotal = extras.reduce((sum, extra) => sum + (extra.price || 0), 0);

  const getRatingLabel = (value: number) => {
    switch (value) {
      case 1: return "Muito ruim";
      case 2: return "Ruim";
      case 3: return "Regular";
      case 4: return "Bom";
      case 5: return "Excelente";
      default: return "";
    }
  };

  const getRatingEmoji = (value: number) => {
    switch (value) {
      case 1: return "😞";
      case 2: return "😕";
      case 3: return "😐";
      case 4: return "😊";
      case 5: return "🤩";
      default: return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw] max-h-[85vh] p-0 overflow-hidden bg-card border-border flex flex-col rounded-3xl">
        {/* Header - Compact */}
        <div className="relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 gradient-primary opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
          <div className="relative px-4 pt-4 pb-2 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full gradient-primary flex items-center justify-center shadow-lg glow-effect">
              <CheckCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                Serviço Concluído! 🎉
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Avalie o serviço de <span className="text-foreground font-medium">{technicianName}</span>
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-4 pb-3 space-y-3">
            {/* Star Rating */}
            <div className="space-y-2">
              <Label className="text-foreground font-semibold text-sm block text-center">
                Como você avalia o serviço?
              </Label>
              
              <div className="flex justify-center items-center gap-1 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onTouchStart={() => setRating(star)}
                    className="p-1.5 rounded-xl transition-all active:scale-90 touch-manipulation"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <Star
                      className={`w-9 h-9 transition-all duration-200 ${
                        star <= (hoveredRating || rating)
                          ? "text-primary fill-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.6)]"
                          : "text-muted-foreground/40 stroke-[1.5]"
                      }`}
                    />
                  </button>
                ))}
              </div>
              
              <AnimatePresence mode="wait">
                {rating > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.9 }}
                    className="text-center py-1.5 px-3 rounded-2xl bg-primary/10 mx-auto w-fit flex items-center gap-2"
                  >
                    <span className="text-xl">{getRatingEmoji(rating)}</span>
                    <p className="text-sm font-semibold text-primary">
                      {getRatingLabel(rating)}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Feedback */}
            <div className="space-y-1.5">
              <Label className="text-foreground font-medium text-sm">Comentário (opcional)</Label>
              <Textarea
                placeholder="Conte como foi sua experiência..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[60px] bg-background border-border/50 resize-none rounded-xl text-sm"
              />
            </div>

            {/* Service History / Receipt - Collapsed */}
            <details className="rounded-2xl bg-secondary/50 border border-border overflow-hidden group">
              <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-secondary/80 transition-colors list-none">
                <Receipt className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm text-foreground flex-1">Resumo do Serviço</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              
              <div className="p-4 pt-2 space-y-3 border-t border-border/50">
                {/* Service Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Serviço</span>
                    <span className="font-medium text-foreground">{serviceName}</span>
                  </div>
                  
                  {description && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Descrição</span>
                      <span className="font-medium text-foreground text-right max-w-[60%] line-clamp-2">
                        {description}
                      </span>
                    </div>
                  )}
                  
                  {address && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Local</span>
                      <span className="font-medium text-foreground text-right max-w-[60%] line-clamp-1">
                        {address}
                      </span>
                    </div>
                  )}
                  
                  {completedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Concluído em</span>
                      <span className="font-medium text-foreground">
                        {new Date(completedAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                </div>

                <Separator className="bg-border/50" />

                {/* Price Breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preço Base</span>
                    <span className="font-medium text-foreground">
                      {basePrice.toLocaleString()} Kz
                    </span>
                  </div>
                  
                  {urgency === "urgent" && (
                    <div className="flex justify-between text-warning">
                      <span>Taxa de Urgência (+20%)</span>
                      <span className="font-medium">
                        +{(basePrice * 0.2).toLocaleString()} Kz
                      </span>
                    </div>
                  )}

                  {extras.length > 0 && (
                    <>
                      <Separator className="bg-border/30" />
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        Trabalhos Adicionais
                      </p>
                      {extras.map((extra, index) => (
                        <div key={index} className="flex justify-between pl-2">
                          <span className="text-muted-foreground">• {extra.name}</span>
                          <span className="font-medium text-foreground">
                            +{extra.price.toLocaleString()} Kz
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <Separator className="bg-border" />

                {/* Total */}
                <div className="flex justify-between items-center pt-1">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="text-xl font-display font-bold text-primary">
                    {totalPrice.toLocaleString()} Kz
                  </span>
                </div>
              </div>
            </details>
          </div>
        </ScrollArea>

        <div className="px-4 py-3 bg-secondary/30 border-t border-border flex-shrink-0 space-y-1.5">
          <Button 
            onClick={handleSubmit}
            disabled={rating === 0 || isPending}
            className="gradient-primary text-primary-foreground w-full h-11 text-sm rounded-xl font-semibold"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Star className="w-4 h-4 mr-2" />
            )}
            {rating === 0 ? "Selecione uma avaliação" : "Enviar Avaliação"}
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground w-full rounded-xl h-9 text-sm"
          >
            Avaliar depois
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
