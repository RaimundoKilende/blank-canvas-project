import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ShoppingCart, Store, Package, Minus, Plus, X, Trash2, Tag,
  Star, ArrowRight, Sparkles, Heart, MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter,
} from "@/components/ui/sheet";
import { useProducts, Product, useVendorCategories } from "@/hooks/useProducts";
import { useAllVendors, Vendor } from "@/hooks/useVendorProfile";
import { useCart } from "@/hooks/useCart";
import { useOrders } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ProductDetailDialog } from "@/components/client/ProductDetailDialog";
import { VendorStoreDialog } from "@/components/client/VendorStoreDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function ClientShopTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { products, isLoading } = useProducts();
  const { vendors } = useAllVendors();
  const { items, totalPrice, totalItems, addItem, removeItem, updateQuantity, clearCart, itemsByVendor } = useCart();
  const { createOrder } = useOrders("client");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendorStoreOpen, setVendorStoreOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const { data: allCategories = [] } = useQuery({
    queryKey: ["all-vendor-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_categories")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const visibleCategories = useMemo(() => {
    const catIds = new Set(products.map(p => p.category_id).filter(Boolean));
    return allCategories.filter(c => catIds.has(c.id));
  }, [allCategories, products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (selectedCategoryId && p.category_id !== selectedCategoryId) return false;
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [products, selectedCategoryId, searchQuery]);

  // Featured products (first 4 with photos)
  const featuredProducts = useMemo(
    () => products.filter(p => p.photos && p.photos.length > 0 && p.stock > 0).slice(0, 6),
    [products]
  );

  const getVendorName = (vendorId: string) => {
    const v = vendors.find(v => v.user_id === vendorId);
    return v?.store_name || "Loja";
  };

  const getVendor = (vendorId: string) => vendors.find(v => v.user_id === vendorId) || null;

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const openVendorStore = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setVendorStoreOpen(true);
  };

  const handleCheckout = async () => {
    if (!user || items.length === 0) return;
    try {
      for (const [vendorId, vendorItems] of Object.entries(itemsByVendor)) {
        const vendorTotal = vendorItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
        await createOrder.mutateAsync({
          vendor_id: vendorId,
          items: vendorItems.map(i => ({
            product_id: i.product.id,
            quantity: i.quantity,
            unit_price: i.product.price,
          })),
          delivery_address: deliveryAddress,
          total_price: vendorTotal,
        });
      }
      clearCart();
      setCartOpen(false);
      setDeliveryAddress("");
      toast({ title: "Pedido realizado!", description: "O vendedor será notificado." });
    } catch {}
  };

  const hasFilters = selectedCategoryId || searchQuery;

  return (
    <div className="pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Marketplace
            </h1>
          </div>
          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col">
              <SheetHeader>
                <SheetTitle>Carrinho ({totalItems})</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto space-y-3 py-4">
                {items.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                    <p className="text-muted-foreground">Carrinho vazio</p>
                    <p className="text-xs text-muted-foreground mt-1">Adicione produtos para começar</p>
                  </div>
                ) : (
                  items.map(item => (
                    <motion.div
                      key={item.product.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50"
                    >
                      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item.product.photos?.[0] ? (
                          <img src={item.product.photos[0]} className="w-12 h-12 object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(item.product.price * item.quantity).toLocaleString("pt-AO")} Kz
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => removeItem(item.product.id)}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </motion.div>
                  ))
                )}
                {items.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-border">
                    <Input
                      placeholder="Endereço de entrega..."
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                    />
                  </div>
                )}
              </div>
              {items.length > 0 && (
                <SheetFooter className="border-t border-border pt-4">
                  <div className="w-full space-y-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total:</span>
                      <span className="text-primary">{totalPrice.toLocaleString("pt-AO")} Kz</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Pagamento na entrega</p>
                    <Button className="w-full" onClick={handleCheckout} disabled={createOrder.isPending}>
                      Finalizar Pedido
                    </Button>
                  </div>
                </SheetFooter>
              )}
            </SheetContent>
          </Sheet>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="O que procuras?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-secondary/50 border-0"
          />
        </div>
      </div>

      <div className="px-4 pt-4 space-y-6">
        {/* Active Filters */}
        <AnimatePresence>
          {hasFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center gap-2 flex-wrap overflow-hidden"
            >
              {selectedCategoryId && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {visibleCategories.find(c => c.id === selectedCategoryId)?.name}
                  <button onClick={() => setSelectedCategoryId(null)}><X className="w-3 h-3" /></button>
                </Badge>
              )}
              <button onClick={() => { setSelectedCategoryId(null); setSearchQuery(""); }} className="text-xs text-muted-foreground underline">
                Limpar
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Categories chips */}
        {visibleCategories.length > 0 && !searchQuery && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {visibleCategories.map((cat, i) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedCategoryId(selectedCategoryId === cat.id ? null : cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategoryId === cat.id
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-secondary/50 text-foreground hover:bg-secondary"
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                {cat.name}
              </motion.button>
            ))}
          </div>
        )}

        {/* Featured carousel */}
        {!searchQuery && !selectedCategoryId && featuredProducts.length > 0 && (
          <div>
            <h2 className="font-display text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Destaques
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
              {featuredProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="min-w-[200px] snap-start rounded-2xl overflow-hidden bg-gradient-to-b from-secondary/30 to-background border border-border/50 cursor-pointer group"
                  onClick={() => { setSelectedProduct(product); setDetailOpen(true); }}
                >
                  <div className="relative h-32 overflow-hidden">
                    <img
                      src={product.photos![0]}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      alt={product.name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <button
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/60 backdrop-blur flex items-center justify-center"
                      onClick={e => { e.stopPropagation(); toggleFavorite(product.id); }}
                    >
                      <Heart className={`w-3.5 h-3.5 transition-colors ${favorites.has(product.id) ? "fill-red-500 text-red-500" : "text-foreground"}`} />
                    </button>
                    <span className="absolute bottom-2 left-2 text-white font-bold text-sm drop-shadow">
                      {product.price.toLocaleString("pt-AO")} Kz
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{getVendorName(product.vendor_id)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Vendors Section */}
        {!searchQuery && !selectedCategoryId && vendors.length > 0 && (
          <div>
            <h2 className="font-display text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <Store className="w-4 h-4 text-primary" /> Lojas
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {vendors.map((vendor, i) => (
                <motion.button
                  key={vendor.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => openVendorStore(vendor)}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-secondary/30 hover:bg-secondary/60 border border-border/30 transition-all min-w-[90px] group"
                >
                  <Avatar className="w-14 h-14 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                    {vendor.store_logo ? (
                      <img src={vendor.store_logo} className="w-14 h-14 rounded-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <Store className="w-6 h-6" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="text-xs text-foreground font-medium text-center truncate w-full">
                    {vendor.store_name || "Loja"}
                  </span>
                  {vendor.rating > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      {vendor.rating.toFixed(1)}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div>
          <h2 className="font-display text-base font-semibold text-foreground mb-3">
            {searchQuery ? `Resultados para "${searchQuery}"` : selectedCategoryId ? visibleCategories.find(c => c.id === selectedCategoryId)?.name : "Todos os Produtos"}
          </h2>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-14 h-14 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground font-medium">Nenhum produto encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">Tente outra pesquisa ou categoria</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.25 }}
                  className="rounded-2xl overflow-hidden bg-secondary/20 border border-border/40 cursor-pointer group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                  onClick={() => { setSelectedProduct(product); setDetailOpen(true); }}
                >
                  <div className="relative w-full h-32 bg-secondary overflow-hidden">
                    {product.photos?.[0] ? (
                      <img
                        src={product.photos[0]}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        alt={product.name}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-muted-foreground opacity-30" />
                      </div>
                    )}
                    <button
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/60 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={e => { e.stopPropagation(); toggleFavorite(product.id); }}
                    >
                      <Heart className={`w-3.5 h-3.5 ${favorites.has(product.id) ? "fill-red-500 text-red-500" : "text-foreground"}`} />
                    </button>
                    {product.stock <= 0 && (
                      <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                        <Badge variant="destructive">Esgotado</Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-1.5">
                    <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                    <button
                      className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors"
                      onClick={e => {
                        e.stopPropagation();
                        const v = getVendor(product.vendor_id);
                        if (v) openVendorStore(v);
                      }}
                    >
                      <Store className="w-3 h-3" />
                      {getVendorName(product.vendor_id)}
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm font-bold text-primary">
                        {product.price.toLocaleString("pt-AO")} Kz
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20"
                        onClick={(e) => { e.stopPropagation(); addItem(product); }}
                        disabled={product.stock <= 0}
                      >
                        <Plus className="w-4 h-4 text-primary" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating cart summary */}
      <AnimatePresence>
        {totalItems > 0 && !cartOpen && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 max-w-[420px] w-[calc(100%-2rem)]"
          >
            <Button
              className="w-full h-14 rounded-2xl shadow-xl shadow-primary/20 text-base gap-3"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="flex-1 text-left">Ver Carrinho ({totalItems})</span>
              <span className="font-bold">{totalPrice.toLocaleString("pt-AO")} Kz</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Detail Dialog */}
      <ProductDetailDialog
        product={selectedProduct}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onAddToCart={addItem}
        vendorName={selectedProduct ? getVendorName(selectedProduct.vendor_id) : undefined}
        onViewStore={selectedProduct ? () => {
          const v = getVendor(selectedProduct.vendor_id);
          if (v) { setDetailOpen(false); openVendorStore(v); }
        } : undefined}
      />

      {/* Vendor Store Dialog */}
      <VendorStoreDialog
        vendor={selectedVendor}
        products={products}
        open={vendorStoreOpen}
        onOpenChange={setVendorStoreOpen}
        onAddToCart={addItem}
        onProductClick={p => { setVendorStoreOpen(false); setSelectedProduct(p); setDetailOpen(true); }}
        onChat={(vendorId) => {
          toast({ title: "Chat", description: "Funcionalidade de chat com vendedor em breve!" });
        }}
      />
    </div>
  );
}
