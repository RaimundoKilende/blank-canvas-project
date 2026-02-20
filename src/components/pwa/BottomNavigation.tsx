import { motion } from "framer-motion";
import { Home, ClipboardList, User, Wallet, Plus, Package, ShoppingBag, Store, Truck, Clock, Navigation, TrendingUp, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

type ClientTab = "home" | "orders" | "shop" | "profile";
type TechnicianTab = "home" | "shop" | "wallet" | "finances" | "history" | "profile";
type VendorTab = "home" | "products" | "orders" | "services" | "messages" | "wallet" | "profile";
type DeliveryTab = "home" | "active" | "history" | "wallet" | "profile";

type AnyTab = ClientTab | TechnicianTab | VendorTab | DeliveryTab;

interface BottomNavigationProps {
  activeTab: AnyTab;
  onTabChange: (tab: AnyTab) => void;
  variant: "client" | "technician" | "vendor" | "delivery";
}

const clientTabs = [
  { id: "home" as const, label: "Início", icon: Home },
  { id: "orders" as const, label: "Pedidos", icon: ClipboardList },
  { id: "shop" as const, label: "Loja", icon: ShoppingBag },
  { id: "profile" as const, label: "Perfil", icon: User },
];

const technicianTabs = [
  { id: "home" as const, label: "Início", icon: Home },
  { id: "shop" as const, label: "Loja", icon: ShoppingBag },
  { id: "wallet" as const, label: "Carteira", icon: Wallet },
  { id: "finances" as const, label: "Finanças", icon: TrendingUp },
  { id: "history" as const, label: "Histórico", icon: Clock },
  { id: "profile" as const, label: "Perfil", icon: User },
];

const vendorTabs = [
  { id: "home" as const, label: "Início", icon: Home },
  { id: "products" as const, label: "Produtos", icon: Package },
  { id: "orders" as const, label: "Pedidos", icon: ClipboardList },
  { id: "messages" as const, label: "Mensagens", icon: MessageCircle },
  { id: "services" as const, label: "Técnicos", icon: Truck },
  { id: "wallet" as const, label: "Carteira", icon: Wallet },
  { id: "profile" as const, label: "Perfil", icon: User },
];

const deliveryTabs = [
  { id: "home" as const, label: "Início", icon: Home },
  { id: "active" as const, label: "Em Curso", icon: Navigation },
  { id: "history" as const, label: "Histórico", icon: Clock },
  { id: "wallet" as const, label: "Carteira", icon: Wallet },
  { id: "profile" as const, label: "Perfil", icon: User },
];

export function BottomNavigation({ activeTab, onTabChange, variant }: BottomNavigationProps) {
  const navigate = useNavigate();
  const tabs = variant === "client" 
    ? clientTabs 
    : variant === "technician" 
    ? technicianTabs 
    : variant === "vendor" 
    ? vendorTabs 
    : deliveryTabs;

  const handleRequestService = () => {
    navigate("/client/request");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Glass background */}
      <div className="absolute inset-0 bg-card/90 backdrop-blur-xl border-t border-border/50" />
      
      <div className="relative flex items-center justify-around px-2 py-2 pb-safe max-w-lg mx-auto">
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          // Insert FAB button after first tab for clients
          if (variant === "client" && index === 1) {
            return (
              <div key="with-fab" className="contents">
                {/* FAB Button */}
                <motion.button
                  onClick={handleRequestService}
                  className="relative -mt-6 w-14 h-14 rounded-full gradient-primary shadow-lg flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    animate={{ rotate: 0 }}
                    whileHover={{ rotate: 90 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Plus className="w-7 h-7 text-primary-foreground" />
                  </motion.div>
                  <div className="absolute inset-0 rounded-full gradient-primary opacity-50 blur-md -z-10" />
                </motion.button>

                {/* Orders tab */}
                <motion.button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "relative flex flex-col items-center justify-center w-16 py-2 rounded-2xl transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                  whileTap={{ scale: 0.9 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary/10 rounded-2xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <motion.div
                    initial={false}
                    animate={isActive ? { y: -2, scale: 1.1 } : { y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.div>
                  <motion.span
                    className={cn(
                      "text-[10px] mt-1 font-medium transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {tab.label}
                  </motion.span>
                </motion.button>
              </div>
            );
          }

          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex flex-col items-center justify-center w-16 py-2 rounded-2xl transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
              whileTap={{ scale: 0.9 }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 rounded-2xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div
                initial={false}
                animate={isActive ? { y: -2, scale: 1.1 } : { y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Icon className="w-5 h-5" />
              </motion.div>
              <motion.span
                className={cn(
                  "text-[10px] mt-1 font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {tab.label}
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}

export type { ClientTab, TechnicianTab, VendorTab, DeliveryTab };
