import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { SplashScreen } from "@/components/pwa/SplashScreen";
import { OnboardingScreen } from "@/components/pwa/OnboardingScreen";
import { BottomNavigation, TechnicianTab } from "@/components/pwa/BottomNavigation";
import { TechnicianHomeTab } from "@/components/technician/TechnicianHomeTab";
import { TechnicianWalletTab } from "@/components/technician/TechnicianWalletTab";
import { TechnicianFinancesTab } from "@/components/technician/TechnicianFinancesTab";
import { TechnicianProfileTab } from "@/components/technician/TechnicianProfileTab";
import { ClientShopTab } from "@/components/client/ClientShopTab";
import { ServiceHistorySection } from "@/components/technician/ServiceHistorySection";
import { usePWA } from "@/hooks/usePWA";
import { useTechnicians } from "@/hooks/useTechnicians";
import { useNavigate } from "react-router-dom";
import { Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RealtimeBootstrap } from "@/components/realtime/RealtimeBootstrap";

export default function TechnicianDashboard() {
  const navigate = useNavigate();
  const { showSplash, showOnboarding, isReady, completeOnboarding } = usePWA("technician");
  const [activeTab, setActiveTab] = useState<TechnicianTab>("home");
  const { myTechnicianProfile, loadingMyProfile } = useTechnicians();

  // Show loading state while checking profile
  if (loadingMyProfile) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  // Show rejection screen if application was rejected
  if (myTechnicianProfile && myTechnicianProfile.rejected) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <div className="glass-card p-8 rounded-2xl border-destructive/20">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              Candidatura Reprovada
            </h1>
            <p className="text-muted-foreground mb-6">
              Lamentamos informar que sua candidatura como técnico foi reprovada.
              Agradecemos seu interesse na nossa plataforma.
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>
              Voltar para Início
            </Button>
          </div>
        </div>
      </MobileLayout>
    );
  }

  // Show pending verification screen if not verified
  if (myTechnicianProfile && !myTechnicianProfile.verified) {
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
          <OnboardingScreen 
            key="onboarding" 
            onComplete={completeOnboarding} 
            userType="technician" 
          />
        )}
      </AnimatePresence>

      {isReady && (
        <>
          <RealtimeBootstrap />
          {/* Tab Content */}
          {activeTab === "home" && <TechnicianHomeTab />}
          {activeTab === "shop" && <ClientShopTab />}
          {activeTab === "wallet" && <TechnicianWalletTab />}
          {activeTab === "finances" && <TechnicianFinancesTab />}
          {activeTab === "history" && (
            <div className="px-4 pb-24 pt-6">
              <h1 className="font-display text-xl font-bold text-foreground mb-1">Histórico de Serviços</h1>
              <p className="text-sm text-muted-foreground mb-6">Registo de todos os trabalhos realizados</p>
              <ServiceHistorySection />
            </div>
          )}
          {activeTab === "profile" && <TechnicianProfileTab />}

          {/* Bottom Navigation */}
          <BottomNavigation
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as TechnicianTab)}
            variant="technician"
          />
        </>
      )}
    </MobileLayout>
  );
}
