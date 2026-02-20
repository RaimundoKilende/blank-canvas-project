import { useEffect, useState } from "react";
import { CheckCircle, User, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ServiceAcceptedAnimationProps {
  technicianName: string;
  onComplete?: () => void;
}

export function ServiceAcceptedAnimation({ 
  technicianName,
  onComplete 
}: ServiceAcceptedAnimationProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => {
      onComplete?.();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-success/10 via-success/5 to-primary/10 border border-success/30 p-8">
      {/* Animated confetti/sparkles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {showConfetti && Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-bounce"
            style={{
              background: i % 2 === 0 ? 'hsl(var(--success))' : 'hsl(var(--primary))',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random()}s`,
              opacity: 0.6,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center space-y-4">
        {/* Success animation */}
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 rounded-full bg-success/20 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-success/30 animate-pulse" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-success to-success/80 flex items-center justify-center shadow-lg shadow-success/30">
            <CheckCircle className="w-12 h-12 text-success-foreground animate-bounce" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-primary animate-pulse" />
          <Sparkles className="absolute -bottom-1 -left-1 w-4 h-4 text-success animate-pulse delay-300" />
        </div>

        {/* Celebration text */}
        <div>
          <h3 className="font-display text-2xl font-bold text-foreground mb-2 animate-fade-in">
            🎉 Pedido Aceite!
          </h3>
          <p className="text-muted-foreground animate-fade-in delay-100">
            Ótima notícia! Um técnico aceitou sua solicitação
          </p>
        </div>

        {/* Technician info */}
        <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-background/50 backdrop-blur-sm animate-scale-in">
          <Avatar className="w-12 h-12 ring-2 ring-success/30">
            <AvatarFallback className="bg-success/10 text-success font-bold">
              {technicianName.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="font-semibold text-foreground">{technicianName}</p>
            <p className="text-sm text-success flex items-center gap-1">
              <User className="w-3 h-3" />
              Está a caminho!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
