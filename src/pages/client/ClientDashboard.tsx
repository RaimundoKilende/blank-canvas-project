import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { SplashScreen } from "@/components/pwa/SplashScreen";
import { OnboardingScreen } from "@/components/pwa/OnboardingScreen";
import { BottomNavigation, ClientTab } from "@/components/pwa/BottomNavigation";
import { ClientHomeTab } from "@/components/client/ClientHomeTab";
import { ClientOrdersTab } from "@/components/client/ClientOrdersTab";
import { ClientProfileTab } from "@/components/client/ClientProfileTab";
import { ClientShopTab } from "@/components/client/ClientShopTab";
import { usePWA } from "@/hooks/usePWA";
import { RealtimeBootstrap } from "@/components/realtime/RealtimeBootstrap";

export default function ClientDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSplash, showOnboarding, isReady, completeOnboarding } = usePWA("client");
  
  // Get initial tab from URL query param
  const tabFromUrl = searchParams.get("tab") as ClientTab | null;
  const [activeTab, setActiveTab] = useState<ClientTab>(tabFromUrl || "home");

  // Sync tab with URL param
  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Update URL when tab changes
  const handleTabChange = (tab: ClientTab) => {
    setActiveTab(tab);
    if (tab === "home") {
      // Remove tab param for home (default)
      searchParams.delete("tab");
    } else {
      searchParams.set("tab", tab);
    }
    setSearchParams(searchParams, { replace: true });
  };
  return (
    <MobileLayout>
      <AnimatePresence>
        {showSplash && <SplashScreen key="splash" />}
        {showOnboarding && (
          <OnboardingScreen 
            key="onboarding" 
            onComplete={completeOnboarding} 
            userType="client" 
          />
        )}
      </AnimatePresence>

      {isReady && (
        <>
          <RealtimeBootstrap />
          {/* Tab Content */}
          {activeTab === "home" && <ClientHomeTab />}
          {activeTab === "orders" && <ClientOrdersTab />}
          {activeTab === "shop" && <ClientShopTab />}
          {activeTab === "profile" && <ClientProfileTab />}

          {/* Bottom Navigation */}
          <BottomNavigation
            activeTab={activeTab}
            onTabChange={(tab) => handleTabChange(tab as ClientTab)}
            variant="client"
          />
        </>
      )}
    </MobileLayout>
  );
}
