import { motion } from "framer-motion";
import { Wrench } from "lucide-react";

export function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-hero-pattern opacity-50" />
      
      {/* Glow effect */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.2, opacity: 0.3 }}
        transition={{ 
          duration: 1.5,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
        className="absolute w-64 h-64 rounded-full bg-primary/30 blur-3xl"
      />
      
      {/* Logo container */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 0.6,
          ease: [0.34, 1.56, 0.64, 1]
        }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* Logo icon */}
        <motion.div
          animate={{ 
            rotate: [0, -10, 10, -10, 0],
          }}
          transition={{ 
            duration: 1,
            delay: 0.5,
            ease: "easeInOut"
          }}
          className="w-24 h-24 rounded-3xl gradient-primary flex items-center justify-center shadow-lg glow-effect mb-6"
        >
          <Wrench className="w-12 h-12 text-primary-foreground" />
        </motion.div>
        
        {/* Brand name */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="font-display text-4xl font-bold text-gradient mb-2"
        >
          Kilende
        </motion.h1>
        
        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-muted-foreground text-sm"
        >
          Serviços na palma da mão
        </motion.p>
        
        {/* Loading indicator */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 120 }}
          transition={{ delay: 0.8, duration: 1.2, ease: "easeInOut" }}
          className="h-1 bg-primary rounded-full mt-8"
        />
      </motion.div>
    </motion.div>
  );
}
