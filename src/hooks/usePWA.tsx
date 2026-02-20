import { useState, useEffect } from "react";

const ONBOARDING_KEY = "kilende_onboarding_completed";
const SPLASH_SHOWN_KEY = "kilende_splash_shown_session";

export function usePWA(userType: "client" | "technician" | "vendor" | "delivery") {
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if splash was already shown this session
    const splashShown = sessionStorage.getItem(SPLASH_SHOWN_KEY);
    
    if (splashShown) {
      setShowSplash(false);
      checkOnboarding();
    } else {
      // Show splash for 2 seconds
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem(SPLASH_SHOWN_KEY, "true");
        checkOnboarding();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  const checkOnboarding = () => {
    const onboardingKey = `${ONBOARDING_KEY}_${userType}`;
    const completed = localStorage.getItem(onboardingKey);
    
    if (!completed) {
      setShowOnboarding(true);
    } else {
      setIsReady(true);
    }
  };

  const completeOnboarding = () => {
    const onboardingKey = `${ONBOARDING_KEY}_${userType}`;
    localStorage.setItem(onboardingKey, "true");
    setShowOnboarding(false);
    setIsReady(true);
  };

  return {
    showSplash,
    showOnboarding,
    isReady,
    completeOnboarding,
  };
}
