import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog, DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package, ShoppingCart, Store, Heart, Share2, ChevronLeft, ChevronRight, Minus, Plus, ArrowRight,
} from "lucide-react";
import { Product } from "@/hooks/useProducts";

interface ProductDetailDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  vendorName?: string;
  onViewStore?: () => void;
}

export function ProductDetailDialog({ product, open, onOpenChange, onAddToCart, vendorName, onViewStore }: ProductDetailDialogProps) {
  const [activePhoto, setActivePhoto] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [liked, setLiked] = useState(false);

  if (!product) return null;

  const photos = product.photos && product.photos.length > 0 ? product.photos : [];
  const hasMultiplePhotos = photos.length > 1;

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setQuantity(1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) { setActivePhoto(0); setQuantity(1); } }}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto p-0 gap-0">
        {/* Image section */}
        <div className="relative w-full h-64 bg-secondary overflow-hidden">
          {photos.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.img
                key={activePhoto}
                src={photos[activePhoto]}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full object-cover"
                alt={product.name}
              />
            </AnimatePresence>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-16 h-16 text-muted-foreground opacity-30" />
            </div>
          )}

          {/* Photo nav */}
          {hasMultiplePhotos && (
            <>
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/70 backdrop-blur flex items-center justify-center"
                onClick={() => setActivePhoto(p => (p - 1 + photos.length) % photos.length)}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/70 backdrop-blur flex items-center justify-center"
                onClick={() => setActivePhoto(p => (p + 1) % photos.length)}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === activePhoto ? "bg-white w-5" : "bg-white/50"}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Top actions */}
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={() => setLiked(!liked)}
              className="w-9 h-9 rounded-full bg-background/70 backdrop-blur flex items-center justify-center"
            >
              <Heart className={`w-4 h-4 transition-colors ${liked ? "fill-red-500 text-red-500" : "text-foreground"}`} />
            </button>
          </div>
        </div>

        {/* Photo thumbnails */}
        {hasMultiplePhotos && (
          <div className="flex gap-2 px-5 pt-3 overflow-x-auto">
            {photos.map((photo, i) => (
              <button
                key={i}
                onClick={() => setActivePhoto(i)}
                className={`w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                  i === activePhoto ? "border-primary" : "border-transparent opacity-60"
                }`}
              >
                <img src={photo} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>
        )}

        <div className="px-5 py-5 space-y-4">
          {/* Title and price */}
          <div>
            <h2 className="text-xl font-bold text-foreground">{product.name}</h2>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-bold text-primary">
                {product.price.toLocaleString("pt-AO")} Kz
              </span>
              <Badge variant={product.stock > 0 ? "default" : "destructive"} className="text-xs">
                {product.stock > 0 ? `${product.stock} em stock` : "Esgotado"}
              </Badge>
            </div>
          </div>

          {/* Vendor */}
          {vendorName && (
            <button
              onClick={onViewStore}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors w-full text-left group"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Store className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{vendorName}</p>
                <p className="text-xs text-muted-foreground">Ver loja completa</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          )}

          {/* Description */}
          {product.description && (
            <div>
              <h4 className="font-medium text-foreground mb-1 text-sm">Descrição</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Category */}
          {product.category && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Categoria:</span>
              <Badge variant="secondary" className="text-xs">{product.category.name}</Badge>
            </div>
          )}

          {/* Quantity selector + Add to cart */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Quantidade</span>
              <div className="flex items-center gap-3 bg-secondary/50 rounded-full px-2 py-1">
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                  <Minus className="w-3.5 h-3.5" />
                </Button>
                <span className="text-base font-semibold w-8 text-center">{quantity}</span>
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <Button
              className="w-full h-12 text-base rounded-xl"
              onClick={handleAdd}
              disabled={product.stock <= 0}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Adicionar — {(product.price * quantity).toLocaleString("pt-AO")} Kz
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
