import { useState, useEffect } from "react";
import { Wrench, Clock, Sparkles, Heart, Star, Zap, Lock, ShieldCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface InProgressAnimationProps {
  serviceName: string;
  technicianName: string;
  startedAt: string;
  completionCode?: string | null;
}

const inspirationalQuotes = [
  "Seu problema está em boas mãos 🛠️",
  "Profissionalismo e dedicação para você ⭐",
  "Cada detalhe importa para nós 💎",
  "Trabalhando com amor pelo que fazemos ❤️",
  "Excelência em cada serviço ✨",
  "Seu conforto é nossa prioridade 🏠",
  "Qualidade que você pode confiar 🏆",
  "Cuidando do seu lar com carinho 🌟",
  "Soluções inteligentes para você 💡",
  "Compromisso com sua satisfação 🤝",
];

export function InProgressAnimation({ 
  serviceName, 
  technicianName,
  startedAt,
  completionCode
}: InProgressAnimationProps) {
  const [currentQuote, setCurrentQuote] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [fadeClass, setFadeClass] = useState("opacity-100");

  // Rotate quotes with fade animation
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeClass("opacity-0");
      setTimeout(() => {
        setCurrentQuote((prev) => (prev + 1) % inspirationalQuotes.length);
        setFadeClass("opacity-100");
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Update elapsed time
  useEffect(() => {
    const startTime = new Date(startedAt).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.floor((now - startTime) / 1000);
      setElapsed(diff);
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins.toString().padStart(2, "0")}m`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/20 border border-primary/30 p-6">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-4 right-4 opacity-20">
          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <div className="absolute bottom-4 left-4 opacity-20">
          <Star className="w-6 h-6 text-primary animate-pulse delay-500" />
        </div>
        <div className="absolute top-1/2 left-4 opacity-10">
          <Heart className="w-5 h-5 text-primary animate-bounce" />
        </div>
        
        {/* Moving gradient orbs */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 space-y-6">
        {/* Header with animated icon */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30">
                <Wrench className="w-7 h-7 text-primary-foreground animate-pulse" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center border-2 border-background">
                <Zap className="w-3 h-3 text-success-foreground" />
              </div>
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                Serviço em Andamento
              </h3>
              <p className="text-sm text-muted-foreground">{serviceName}</p>
            </div>
          </div>
          
          {/* Timer */}
          <div className="text-right">
            <div className="flex items-center gap-1 text-primary">
              <Clock className="w-4 h-4" />
              <span className="font-mono text-lg font-bold">{formatTime(elapsed)}</span>
            </div>
            <p className="text-xs text-muted-foreground">decorrido</p>
          </div>
        </div>

        {/* Working animation bar */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-3 rounded-full bg-primary/20 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary animate-[shimmer_2s_infinite]"
                style={{
                  width: '100%',
                  background: 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.6) 50%, hsl(var(--primary)) 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s infinite linear',
                }}
              />
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            {technicianName} está trabalhando no seu serviço
          </p>
        </div>

        {/* Inspirational quotes slider */}
        <div className="min-h-[60px] flex items-center justify-center p-4 rounded-xl bg-background/50 backdrop-blur-sm">
          <p 
            className={`text-center font-medium text-foreground transition-opacity duration-300 ${fadeClass}`}
          >
            {inspirationalQuotes[currentQuote]}
          </p>
        </div>

        {/* Completion Code */}
        {completionCode && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-primary">Código de Finalização</span>
              </div>
              <div className="flex justify-center gap-2">
                {completionCode.split("").map((digit, i) => (
                  <div
                    key={i}
                    className="w-12 h-14 rounded-xl bg-background border-2 border-primary/50 flex items-center justify-center shadow-md"
                  >
                    <span className="text-2xl font-bold text-foreground">{digit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-warning/10 border border-warning/30">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                <p className="text-xs text-warning font-medium leading-relaxed">
                  Só forneça o código após o serviço estar pronto. Isso ativa a sua <strong>Garantia de 7 dias</strong> e o seu <strong>seguro contra danos</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Animated dots */}
        <div className="flex justify-center gap-1">
          {inspirationalQuotes.slice(0, 5).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === currentQuote % 5 
                  ? 'bg-primary scale-125' 
                  : 'bg-primary/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Add keyframes for shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
