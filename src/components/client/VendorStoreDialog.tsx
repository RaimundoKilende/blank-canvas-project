import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog, DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Store, Star, Package, MapPin, Clock, ShoppingBag, Plus, MessageCircle, X, ChevronRight,
} from "lucide-react";
import { Vendor } from "@/hooks/useVendorProfile";
import { Product } from "@/hooks/useProducts";
import { VendorChatDialog } from "@/components/chat/VendorChatDialog";
import { useAuth } from "@/hooks/useAuth";

interface VendorStoreDialogProps {
  vendor: Vendor | null;
  products: Product[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
  onChat?: (vendorId: string) => void;
}

export function VendorStoreDialog({
  vendor, products, open, onOpenChange, onAddToCart, onProductClick, onChat,
}: VendorStoreDialogProps) {
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const { user } = useAuth();

  const vendorProducts = useMemo(
    () => products.filter(p => vendor && p.vendor_id === vendor.user_id),
    [products, vendor]
  );

  const categories = useMemo(() => {
    const cats = new Map<string, string>();
    vendorProducts.forEach(p => {
      if (p.category) cats.set(p.category.id, p.category.name);
    });
    return Array.from(cats, ([id, name]) => ({ id, name }));
  }, [vendorProducts]);

  const filtered = useMemo(
    () => selectedCat ? vendorProducts.filter(p => p.category_id === selectedCat) : vendorProducts,
    [vendorProducts, selectedCat]
  );

  if (!vendor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto p-0 gap-0">
        {/* Hero Banner */}
        <div className="relative h-40 bg-gradient-to-br from-primary/30 via-primary/10 to-background overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.2),transparent_70%)]" />
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Store avatar overlapping */}
          <div className="absolute -bottom-10 left-5">
            <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
              {vendor.store_logo ? (
                <img src={vendor.store_logo} className="w-full h-full object-cover" />
              ) : (
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  <Store className="w-8 h-8" />
                </AvatarFallback>
              )}
            </Avatar>
          </div>
        </div>

        <div className="px-5 pt-14 pb-6 space-y-5">
          {/* Store Info */}
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">{vendor.store_name || "Loja"}</h2>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  {vendor.rating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {vendor.rating.toFixed(1)}
                      <span className="text-xs">({vendor.review_count})</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    {vendor.completed_orders} vendas
                  </span>
                </div>
              </div>
              {user && vendor.user_id !== user.id && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setChatOpen(true)}
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat
                </Button>
              )}
            </div>

            {vendor.store_description && (
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                {vendor.store_description}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              {vendor.address && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <MapPin className="w-3 h-3" /> {vendor.address}
                </Badge>
              )}
              {vendor.availability && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Clock className="w-3 h-3" /> {vendor.availability}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs capitalize">
                {vendor.vendor_type === "empresa" ? "Empresa" : "Pessoal"}
              </Badge>
            </div>
          </div>

          {/* Categories filter */}
          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCat(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  !selectedCat ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-foreground hover:bg-secondary"
                }`}
              >
                Todos ({vendorProducts.length})
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(selectedCat === cat.id ? null : cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCat === cat.id ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-foreground hover:bg-secondary"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Products grid */}
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((product, i) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  className="rounded-xl overflow-hidden bg-secondary/30 border border-border/50 cursor-pointer group"
                  onClick={() => onProductClick(product)}
                >
                  <div className="w-full h-28 bg-secondary overflow-hidden">
                    {product.photos?.[0] ? (
                      <img
                        src={product.photos[0]}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        alt={product.name}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="p-2.5 space-y-1">
                    <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-primary">
                        {product.price.toLocaleString("pt-AO")} Kz
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-7 h-7 rounded-full bg-primary/10 hover:bg-primary/20"
                        onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                        disabled={product.stock <= 0}
                      >
                        <Plus className="w-4 h-4 text-primary" />
                      </Button>
                    </div>
                    {product.stock <= 0 && (
                      <Badge variant="destructive" className="text-[10px]">Esgotado</Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-8">
              <Package className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum produto nesta loja</p>
            </div>
          )}
        </div>
      </DialogContent>

      {vendor && user && (
        <VendorChatDialog
          open={chatOpen}
          onOpenChange={setChatOpen}
          vendorUserId={vendor.user_id}
          otherUserName={vendor.store_name || "Vendedor"}
          otherUserAvatar={vendor.store_logo || undefined}
        />
      )}
    </Dialog>
  );
}
