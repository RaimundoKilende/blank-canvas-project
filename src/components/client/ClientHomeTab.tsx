import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, Wrench, Droplets, Wind, Sparkles, Monitor,
  Search, MapPin, Loader2, ChevronRight, Sparkle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useServiceCategories } from "@/hooks/useServiceCategories";
import { useGeolocation } from "@/hooks/useGeolocation";
import { NotificationsSheet } from "@/components/notifications/NotificationsSheet";

// Icon mapping
const iconMap: Record<string, any> = {
  "zap": Zap,
  "droplets": Droplets,
  "wind": Wind,
  "sparkles": Sparkles,
  "monitor": Monitor,
  "wrench": Wrench,
};

const getIcon = (iconName: string) => iconMap[iconName.toLowerCase()] || Wrench;

export function ClientHomeTab() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { profile } = useAuth();
  const { categories, isLoading: loadingCategories } = useServiceCategories();
  const { address, loading: loadingLocation, getCurrentPosition } = useGeolocation();

  const userName = profile?.name || "Usuário";
  const CATEGORIES_LIMIT = 6;

  const allFilteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cat.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const filteredCategories = searchQuery 
    ? allFilteredCategories 
    : allFilteredCategories.slice(0, CATEGORIES_LIMIT);
  const hasMoreCategories = !searchQuery && allFilteredCategories.length > CATEGORIES_LIMIT;

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/client/category/${categoryId}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring" as const, damping: 20, stiffness: 300 }
    }
  };

  return (
    <div className="pb-28 min-h-screen">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-4 pb-3 sticky top-0 z-30 bg-background/95 backdrop-blur-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display text-2xl font-bold text-foreground"
            >
              Olá, {userName.split(" ")[0]}! 👋
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="text-muted-foreground text-sm"
            >
              O que você precisa hoje?
            </motion.p>
          </div>
          <NotificationsSheet />
        </div>

        {/* Search */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar serviço ou categoria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-6 rounded-2xl bg-card border-border/50 text-base focus:border-primary/50 transition-all"
          />
        </motion.div>
      </motion.div>

      {/* Location Card */}
      <div className="px-4 mb-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-4 rounded-2xl flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            {loadingLocation ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <MapPin className="w-5 h-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Sua localização</p>
            <p className="font-semibold text-foreground truncate">
              {address || "Toque para obter localização"}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={getCurrentPosition} 
            className="flex-shrink-0 h-10 w-10 p-0 rounded-xl hover:bg-primary/10"
          >
            📍
          </Button>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="px-4">
        {/* Categories Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-foreground">Categorias</h2>
            {hasMoreCategories && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/client/categories")}
                className="text-sm text-primary h-8 px-3 rounded-xl hover:bg-primary/10"
              >
                Ver todas
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
          
          {loadingCategories ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 gap-3"
            >
              <AnimatePresence mode="popLayout">
                {filteredCategories.map((category) => {
                  const IconComponent = getIcon(category.icon);
                  return (
                    <motion.button
                      key={category.id}
                      variants={itemVariants}
                      layout
                      onClick={() => handleCategoryClick(category.id)}
                      className="group relative overflow-hidden text-left p-4 rounded-2xl transition-all duration-300 bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]"
                    >
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="relative z-10">
                        <div className="w-12 h-12 rounded-xl mb-3 flex items-center justify-center bg-secondary group-hover:gradient-primary transition-all duration-300">
                          <IconComponent className="w-6 h-6 text-muted-foreground group-hover:text-primary-foreground transition-colors duration-300" />
                        </div>
                        <h3 className="font-semibold text-foreground text-sm mb-1 group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {category.description}
                          </p>
                        )}
                      </div>

                      {/* Arrow indicator */}
                      <ChevronRight className="absolute bottom-4 right-4 w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>

        {/* Quick Action Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <div 
            onClick={() => navigate("/client/request")}
            className="relative overflow-hidden p-6 rounded-3xl gradient-primary cursor-pointer hover:opacity-95 transition-opacity active:scale-[0.99]"
          >
            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkle className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-primary-foreground text-lg mb-1">
                  Pesquisa Rápida
                </h3>
                <p className="text-primary-foreground/80 text-sm">
                  Encontre técnicos próximos agora
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <ChevronRight className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Empty state for search */}
        {searchQuery && filteredCategories.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto mb-4 flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Nenhum resultado</h3>
            <p className="text-sm text-muted-foreground">
              Não encontramos categorias para "{searchQuery}"
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
