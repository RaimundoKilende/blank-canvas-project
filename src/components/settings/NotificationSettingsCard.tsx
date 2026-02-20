import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX, Vibrate, Bell } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  getNotificationSettings, 
  saveNotificationSettings,
  useNotificationSound 
} from "@/hooks/useNotificationSound";

export function NotificationSettingsCard() {
  const { playGenericSound } = useNotificationSound();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  // Load settings on mount
  useEffect(() => {
    const settings = getNotificationSettings();
    setSoundEnabled(settings.soundEnabled);
    setVibrationEnabled(settings.vibrationEnabled);
  }, []);

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    saveNotificationSettings({ soundEnabled: enabled });
    
    // Play a test sound when enabling
    if (enabled) {
      setTimeout(() => playGenericSound(), 100);
    }
  };

  const handleVibrationToggle = (enabled: boolean) => {
    setVibrationEnabled(enabled);
    saveNotificationSettings({ vibrationEnabled: enabled });
    
    // Test vibration when enabling
    if (enabled && "vibrate" in navigator) {
      navigator.vibrate(100);
    }
  };

  const supportsVibration = "vibrate" in navigator;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 rounded-2xl"
    >
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">Notificações</h3>
      </div>

      <div className="space-y-4">
        {/* Sound Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-muted-foreground" />
            ) : (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            )}
            <Label htmlFor="sound-toggle" className="text-sm text-foreground cursor-pointer">
              Som de notificação
            </Label>
          </div>
          <Switch
            id="sound-toggle"
            checked={soundEnabled}
            onCheckedChange={handleSoundToggle}
          />
        </div>

        {/* Vibration Toggle */}
        {supportsVibration && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Vibrate className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="vibration-toggle" className="text-sm text-foreground cursor-pointer">
                Vibração
              </Label>
            </div>
            <Switch
              id="vibration-toggle"
              checked={vibrationEnabled}
              onCheckedChange={handleVibrationToggle}
            />
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Receba alertas sonoros e vibração ao receber novas solicitações ou atualizações.
        </p>
      </div>
    </motion.div>
  );
}
