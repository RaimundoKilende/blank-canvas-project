import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { SplashScreen } from "@/components/pwa/SplashScreen";
import { OnboardingScreen } from "@/components/pwa/OnboardingScreen";
import { BottomNavigation } from "@/components/pwa/BottomNavigation";
import { VendorHomeTab } from "@/components/vendor/VendorHomeTab";
import { VendorProductsTab } from "@/components/vendor/VendorProductsTab";
import { VendorOrdersTab } from "@/components/vendor/VendorOrdersTab";
import { VendorProfileTab } from "@/components/vendor/VendorProfileTab";
import { VendorWalletTab } from "@/components/vendor/VendorWalletTab";
import { VendorServicesTab } from "@/components/vendor/VendorServicesTab";
import { VendorMessagesTab } from "@/components/vendor/VendorMessagesTab";
import { usePWA } from "@/hooks/usePWA";
import { useVendorProfile } from "@/hooks/useVendorProfile";
import { useNavigate } from "react-router-dom";
import { Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type VendorTab = "home" | "products" | "orders" | "services" | "messages" | "wallet" | "profile";

export default function VendorDashboard() {
  const navigate = useNavigate();
  const { showSplash, showOnboarding, isReady, completeOnboarding } = usePWA("vendor");
  const [activeTab, setActiveTab] = useState<VendorTab>("home");
  const { vendor, isLoading } = useVendorProfile();

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  // Show pending verification screen
  if (vendor && !vendor.verified) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <div className="glass-card p-8 rounded-2xl">
            <Clock className="w-16 h-16 text-warning mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              Aguardando Aprovação
            </h1>
            <p className="text-muted-foreground mb-6">
              Seu cadastro está sendo analisado pela nossa equipe.
              Você receberá uma notificação quando for aprovado.
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>
              Voltar para Início
            </Button>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <AnimatePresence>
        {showSplash && <SplashScreen key="splash" />}
        {showOnboarding && (
          <OnboardingScreen key="onboarding" onComplete={completeOnboarding} userType="client" />
        )}
      </AnimatePresence>

      {isReady && (
        <>
          {activeTab === "home" && <VendorHomeTab />}
          {activeTab === "products" && <VendorProductsTab />}
          {activeTab === "orders" && <VendorOrdersTab />}
          {activeTab === "services" && <VendorServicesTab />}
          {activeTab === "messages" && <VendorMessagesTab />}
          {activeTab === "wallet" && <VendorWalletTab />}
          {activeTab === "profile" && <VendorProfileTab />}

          <BottomNavigation
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as VendorTab)}
            variant="vendor"
          />
        </>
      )}
    </MobileLayout>
  );
}
