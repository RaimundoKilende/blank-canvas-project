import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, ChevronLeft, Zap, Droplets, Wind, 
  Sparkles, Monitor, Wrench, ArrowRight 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useServiceCategories } from "@/hooks/useServiceCategories";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap: Record<string, any> = {
  "zap": Zap,
  "droplets": Droplets,
  "wind": Wind,
  "sparkles": Sparkles,
  "monitor": Monitor,
  "wrench": Wrench,
};

const getIcon = (iconName: string) => iconMap[iconName.toLowerCase()] || Wrench;

export default function AllCategories() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { categories, isLoading } = useServiceCategories();

  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      cat.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/client/category/${categoryId}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.04 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring" as const, damping: 20, stiffness: 300 }
    }
  };

  return (
    <MobileLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50"
        >
          <div className="px-4 py-4">
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="h-10 w-10 rounded-xl bg-secondary/50 hover:bg-secondary"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-display text-xl font-bold text-foreground">
                  Todas as Categorias
                </h1>
                <p className="text-sm text-muted-foreground">
                  {categories.length} categorias disponíveis
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar categoria..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 py-6 rounded-2xl bg-card border-border/50 text-base focus:border-primary/50 transition-all"
              />
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <div className="px-4 py-6 pb-8">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 rounded-3xl bg-secondary mx-auto mb-6 flex items-center justify-center">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                Nenhuma categoria encontrada
              </h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                Tente pesquisar com outro termo
              </p>
            </motion.div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              <AnimatePresence mode="popLayout">
                {filteredCategories.map((category, index) => {
                  const IconComponent = getIcon(category.icon);
                  return (
                    <motion.button
                      key={category.id}
                      variants={itemVariants}
                      layout
                      onClick={() => handleCategoryClick(category.id)}
                      className="group w-full relative overflow-hidden text-left p-5 rounded-2xl transition-all duration-300 bg-card border border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 active:scale-[0.98]"
                    >
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-secondary group-hover:gradient-primary transition-all duration-300 flex-shrink-0">
                          <IconComponent className="w-7 h-7 text-muted-foreground group-hover:text-primary-foreground transition-colors duration-300" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-base mb-1 group-hover:text-primary transition-colors">
                            {category.name}
                          </h3>
                          {category.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {category.description}
                            </p>
                          )}
                          <p className="text-xs text-primary/70 mt-1 font-medium">
                            A partir de {category.base_price.toLocaleString()} Kz
                          </p>
                        </div>

                        <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center group-hover:bg-primary/10 transition-all flex-shrink-0">
                          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
