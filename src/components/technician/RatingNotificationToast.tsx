import { useEffect, useState, forwardRef } from "react";
import { Star, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RatingNotificationToastProps {
  rating: number;
  clientName: string;
  feedback?: string;
  onClose: () => void;
}

export const RatingNotificationToast = forwardRef<HTMLDivElement, RatingNotificationToastProps>(
  function RatingNotificationToast({ rating, clientName, feedback, onClose }, ref) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 8000);

      return () => clearTimeout(timer);
    }, [onClose]);

    const getRatingMessage = (value: number) => {
      switch (value) {
        case 5: return "Excelente trabalho! 🎉";
        case 4: return "Muito bom! 👏";
        case 3: return "Bom trabalho! 👍";
        case 2: return "Continue melhorando! 💪";
        case 1: return "Oportunidade de melhoria 📈";
        default: return "";
      }
    };

    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: -100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
          >
            <div className="relative overflow-hidden rounded-2xl shadow-2xl border border-primary/20">
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary to-primary/80" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
              
              {/* Floating Stars Background */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      x: [0, Math.random() * 40 - 20],
                      y: [0, Math.random() * 40 - 20],
                    }}
                    transition={{
                      duration: 2,
                      delay: i * 0.2,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                    className="absolute"
                    style={{
                      top: `${20 + Math.random() * 60}%`,
                      left: `${10 + Math.random() * 80}%`,
                    }}
                  >
                    <Sparkles className="w-3 h-3 text-white/40" />
                  </motion.div>
                ))}
              </div>

              {/* Content */}
              <div className="relative p-5">
                {/* Close Button */}
                <button
                  onClick={() => {
                    setIsVisible(false);
                    setTimeout(onClose, 300);
                  }}
                  className="absolute top-3 right-3 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4 text-white/80" />
                </button>

                {/* Header */}
                <div className="text-center mb-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="inline-block"
                  >
                    <p className="text-white/80 text-sm font-medium mb-1">
                      Nova Avaliação Recebida!
                    </p>
                  </motion.div>
                </div>

                {/* Stars */}
                <div className="flex justify-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star, index) => (
                    <motion.div
                      key={star}
                      initial={{ opacity: 0, scale: 0, rotate: -180 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        delay: 0.3 + index * 0.1,
                        damping: 10,
                      }}
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating
                            ? "text-yellow-300 fill-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.5)]"
                            : "text-white/30"
                        }`}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Rating Message */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="text-center text-white font-semibold text-lg mb-2"
                >
                  {getRatingMessage(rating)}
                </motion.p>

                {/* Client Name */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-center text-white/80 text-sm mb-3"
                >
                  De: <span className="font-medium text-white">{clientName}</span>
                </motion.p>

                {/* Feedback */}
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="bg-white/10 rounded-xl p-3 backdrop-blur-sm"
                  >
                    <p className="text-white/90 text-sm text-center italic">
                      "{feedback}"
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);
