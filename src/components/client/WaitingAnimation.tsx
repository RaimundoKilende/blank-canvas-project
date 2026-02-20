import { useState, useEffect } from "react";
import { Loader2, Radio, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface WaitingAnimationProps {
  createdAt: string;
  serviceName: string;
}

export function WaitingAnimation({ createdAt, serviceName }: WaitingAnimationProps) {
  const [elapsed, setElapsed] = useState(0);
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const startTime = new Date(createdAt).getTime();
    
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.floor((now - startTime) / 1000);
      setElapsed(diff);
      setDots((prev) => (prev + 1) % 4);
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate progress (max 10 minutes for visual purposes)
  const maxTime = 10 * 60; // 10 minutes
  const progress = Math.min((elapsed / maxTime) * 100, 100);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border border-primary/20 p-6">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-primary/10 rounded-full animate-pulse" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-primary/5 rounded-full animate-pulse delay-150" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-primary/10 rounded-full animate-ping opacity-20" />
      </div>

      <div className="relative z-10 text-center space-y-4">
        {/* Animated radar/pulse icon */}
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-primary/30 animate-ping delay-100" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30">
            <Radio className="w-8 h-8 text-primary-foreground animate-pulse" />
          </div>
        </div>

        {/* Status text with animated dots */}
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground mb-1">
            Buscando Técnicos{".".repeat(dots)}
          </h3>
          <p className="text-sm text-muted-foreground">
            Procurando profissionais de {serviceName} próximos a você
          </p>
        </div>

        {/* Timer */}
        <div className="flex items-center justify-center gap-2 text-primary">
          <Clock className="w-5 h-5" />
          <span className="font-mono text-2xl font-bold">{formatTime(elapsed)}</span>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2 bg-primary/20" />
          <p className="text-xs text-muted-foreground">
            Aguardando resposta de um técnico...
          </p>
        </div>

        {/* Animated loading dots */}
        <div className="flex justify-center gap-2 pt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
