import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Zap, Droplets, Wind, Sparkles, Monitor, Wrench, ChevronRight } from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

interface AllCategoriesDialogProps {
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (categoryId: string) => void;
}

const iconMap: Record<string, any> = {
  "zap": Zap,
  "droplets": Droplets,
  "wind": Wind,
  "sparkles": Sparkles,
  "monitor": Monitor,
  "wrench": Wrench,
};

const getIcon = (iconName: string) => {
  return iconMap[iconName.toLowerCase()] || Wrench;
};

export function AllCategoriesDialog({
  categories,
  open,
  onOpenChange,
  onSelect,
}: AllCategoriesDialogProps) {
  const [search, setSearch] = useState("");

  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      cat.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (categoryId: string) => {
    onSelect(categoryId);
    onOpenChange(false);
    setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] p-0 overflow-hidden">
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Todas as Categorias</DialogTitle>
            <DialogDescription>
              Selecione uma categoria de serviço
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 py-6 rounded-xl bg-secondary/50 border-0"
            />
          </div>
        </div>

        {/* Categories Grid */}
        <div className="p-6 pt-4 max-h-[50vh] overflow-y-auto scrollbar-hide">
          {filteredCategories.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-14 h-14 rounded-2xl bg-secondary mx-auto mb-4 flex items-center justify-center">
                <Search className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Nenhuma categoria encontrada</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <AnimatePresence mode="popLayout">
                {filteredCategories.map((category, index) => {
                  const IconComponent = getIcon(category.icon);
                  return (
                    <motion.button
                      key={category.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => handleSelect(category.id)}
                      className="group relative overflow-hidden text-left p-4 rounded-2xl transition-all duration-300 bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]"
                    >
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="relative z-10">
                        <div className="w-11 h-11 rounded-xl mb-3 flex items-center justify-center bg-secondary group-hover:gradient-primary transition-all duration-300">
                          <IconComponent className="w-5 h-5 text-muted-foreground group-hover:text-primary-foreground transition-colors duration-300" />
                        </div>
                        <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                          {category.name}
                        </p>
                      </div>

                      {/* Arrow indicator */}
                      <ChevronRight className="absolute bottom-4 right-3 w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
