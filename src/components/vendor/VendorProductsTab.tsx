import { useState, useRef } from "react";
import { Plus, Edit, Trash2, Package, Search, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useVendorCategories, useProducts, Product } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function VendorProductsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { categories } = useVendorCategories();
  const { products, createProduct, updateProduct, deleteProduct } = useProducts(user?.id);

  const [prodDialogOpen, setProdDialogOpen] = useState(false);
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [prodForm, setProdForm] = useState({ name: "", description: "", price: 0, stock: 0, category_id: "" });
  const [prodPhotos, setProdPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const openProdDialog = (prod?: Product) => {
    if (prod) {
      setEditingProd(prod);
      setProdForm({
        name: prod.name,
        description: prod.description || "",
        price: prod.price,
        stock: prod.stock,
        category_id: prod.category_id || "",
      });
      setProdPhotos(prod.photos || []);
    } else {
      setEditingProd(null);
      setProdForm({ name: "", description: "", price: 0, stock: 0, category_id: "" });
      setProdPhotos([]);
    }
    setProdDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploading(true);
    try {
      const newPhotos: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("product-photos").upload(path, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("product-photos").getPublicUrl(path);
        newPhotos.push(urlData.publicUrl);
      }
      setProdPhotos(prev => [...prev, ...newPhotos]);
    } catch (err: any) {
      toast({ title: "Erro ao carregar imagem", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    setProdPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const saveProd = async () => {
    if (!user) return;
    if (editingProd) {
      await updateProduct.mutateAsync({ id: editingProd.id, ...prodForm, photos: prodPhotos });
    } else {
      await createProduct.mutateAsync({
        vendor_id: user.id,
        ...prodForm,
        category_id: prodForm.category_id || null,
        photos: prodPhotos,
      });
    }
    setProdDialogOpen(false);
  };

  const filteredProducts = searchQuery
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : products;

  return (
    <div className="px-4 pt-6 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-foreground">Produtos</h1>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar produtos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button size="icon" onClick={() => openProdDialog()}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum produto cadastrado</p>
          <Button variant="outline" className="mt-3" onClick={() => openProdDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Produto
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map(product => (
            <div key={product.id} className="glass-card rounded-xl p-4 flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg bg-secondary flex items-center justify-center overflow-hidden">
                {product.photos?.[0] ? (
                  <img src={product.photos[0]} className="w-14 h-14 rounded-lg object-cover" />
                ) : (
                  <Package className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.price.toLocaleString("pt-AO")} Kz</p>
                <div className="flex gap-1 mt-1">
                  <Badge variant={product.stock > 0 ? "default" : "destructive"} className="text-[10px]">
                    Stock: {product.stock}
                  </Badge>
                  {product.category && (
                    <Badge variant="secondary" className="text-[10px]">{product.category.name}</Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openProdDialog(product)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteProduct.mutate(product.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Dialog */}
      <Dialog open={prodDialogOpen} onOpenChange={setProdDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProd ? "Editar" : "Novo"} Produto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Fotos do Produto</Label>
              <div className="mt-2 space-y-3">
                {prodPhotos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {prodPhotos.map((photo, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-border">
                        <img src={photo} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removePhoto(i)}
                          className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs"
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
                  onChange={handleImageUpload}
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
                  {uploading ? "Carregando..." : "Adicionar Foto"}
                </Button>
              </div>
            </div>

            <div>
              <Label>Nome</Label>
              <Input value={prodForm.name} onChange={(e) => setProdForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={prodForm.description} onChange={(e) => setProdForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Preço (Kz)</Label>
                <Input type="number" value={prodForm.price} onChange={(e) => setProdForm(p => ({ ...p, price: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Stock</Label>
                <Input type="number" value={prodForm.stock} onChange={(e) => setProdForm(p => ({ ...p, stock: Number(e.target.value) }))} />
              </div>
            </div>
            {categories.length > 0 && (
              <div>
                <Label>Categoria</Label>
                <Select value={prodForm.category_id} onValueChange={(v) => setProdForm(p => ({ ...p, category_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={saveProd} disabled={!prodForm.name || prodForm.price <= 0 || uploading}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
