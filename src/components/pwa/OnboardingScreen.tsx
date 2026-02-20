import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Wrench, MapPin, Star, ChevronRight, ArrowRight } from "lucide-react";

interface OnboardingScreenProps {
  onComplete: () => void;
  userType: "client" | "technician";
}

const clientSlides = [
  {
    icon: Wrench,
    title: "Serviços na palma da mão",
    description: "Encontre técnicos qualificados para resolver qualquer problema em sua casa ou empresa.",
    color: "from-primary/20 to-primary/5",
  },
  {
    icon: MapPin,
    title: "Profissionais perto de você",
    description: "Localize técnicos disponíveis na sua região e solicite serviços com apenas alguns toques.",
    color: "from-info/20 to-info/5",
  },
  {
    icon: Star,
    title: "Qualidade garantida",
    description: "Avalie os serviços e ajude outros clientes a escolherem os melhores profissionais.",
    color: "from-success/20 to-success/5",
  },
];

const technicianSlides = [
  {
    icon: Wrench,
    title: "Bem-vindo à equipa",
    description: "Receba solicitações de serviços diretamente no seu telemóvel e aumente a sua renda.",
    color: "from-primary/20 to-primary/5",
  },
  {
    icon: MapPin,
    title: "Clientes próximos",
    description: "Visualize clientes que precisam dos seus serviços na sua área de atuação.",
    color: "from-info/20 to-info/5",
  },
  {
    icon: Star,
    title: "Construa sua reputação",
    description: "Quanto melhor o seu atendimento, mais avaliações positivas e mais trabalho você receberá.",
    color: "from-success/20 to-success/5",
  },
];

export function OnboardingScreen({ onComplete, userType }: OnboardingScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = userType === "client" ? clientSlides : technicianSlides;

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col bg-background"
    >
      {/* Skip button */}
      <div className="absolute top-6 right-6 z-10">
        <Button variant="ghost" size="sm" onClick={handleSkip}>
          Saltar
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center"
          >
            {/* Icon with animated background */}
            <div className={`relative mb-8`}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className={`w-32 h-32 rounded-full bg-gradient-to-br ${slide.color} flex items-center justify-center`}
              >
                <motion.div
                  initial={{ rotate: -20, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center shadow-lg"
                >
                  <Icon className="w-10 h-10 text-primary-foreground" />
                </motion.div>
              </motion.div>
              
              {/* Decorative dots */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-primary/30"
              />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="absolute -bottom-1 -left-3 w-3 h-3 rounded-full bg-primary/20"
              />
            </div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-display text-2xl font-bold text-foreground mb-4"
            >
              {slide.title}
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground text-base max-w-xs leading-relaxed"
            >
              {slide.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <div className="p-8 pb-safe">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted-foreground/30"
              }`}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>

        {/* Next/Get Started button */}
        <Button
          size="lg"
          className="w-full gradient-primary text-primary-foreground h-14 text-lg font-semibold rounded-2xl"
          onClick={handleNext}
        >
          {currentSlide === slides.length - 1 ? (
            <>
              Começar
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          ) : (
            <>
              Próximo
              <ChevronRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
