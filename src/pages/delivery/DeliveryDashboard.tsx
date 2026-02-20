import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { SplashScreen } from "@/components/pwa/SplashScreen";
import { OnboardingScreen } from "@/components/pwa/OnboardingScreen";
import { BottomNavigation } from "@/components/pwa/BottomNavigation";
import { DeliveryHomeTab } from "@/components/delivery/DeliveryHomeTab";
import { DeliveryActiveTab } from "@/components/delivery/DeliveryActiveTab";
import { DeliveryHistoryTab } from "@/components/delivery/DeliveryHistoryTab";
import { DeliveryProfileTab } from "@/components/delivery/DeliveryProfileTab";
import { DeliveryWalletTab } from "@/components/delivery/DeliveryWalletTab";
import { usePWA } from "@/hooks/usePWA";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type DeliveryTab = "home" | "active" | "history" | "wallet" | "profile";

export default function DeliveryDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSplash, showOnboarding, isReady, completeOnboarding } = usePWA("delivery");
  const [activeTab, setActiveTab] = useState<DeliveryTab>("home");

  const { data: deliveryPerson, isLoading } = useQuery({
    queryKey: ["delivery-person-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_persons")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

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
  if (deliveryPerson && !deliveryPerson.verified) {
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
          {activeTab === "home" && <DeliveryHomeTab />}
          {activeTab === "active" && <DeliveryActiveTab />}
          {activeTab === "history" && <DeliveryHistoryTab />}
          {activeTab === "wallet" && <DeliveryWalletTab />}
          {activeTab === "profile" && <DeliveryProfileTab />}

          <BottomNavigation
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as DeliveryTab)}
            variant="delivery"
          />
        </>
      )}
    </MobileLayout>
  );
}
