import { useCallback, useEffect, useRef } from "react";

const STORAGE_KEY = "notification_settings";

interface NotificationSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
};

// Web Audio API for generating notification sounds
// Shared AudioContext for better performance and to handle browser autoplay policies
let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!sharedAudioContext || sharedAudioContext.state === "closed") {
      sharedAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume if suspended (browser autoplay policy)
    if (sharedAudioContext.state === "suspended") {
      sharedAudioContext.resume();
    }
    return sharedAudioContext;
  } catch (error) {
    console.warn("Could not create AudioContext:", error);
    return null;
  }
}

function playNotificationSound(type: "newRequest" | "accepted" | "generic"): void {
  const audioContext = getAudioContext();
  if (!audioContext) return;

  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const now = audioContext.currentTime;

    if (type === "newRequest") {
      // Upbeat notification for new requests (technician)
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(523.25, now); // C5
      oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, now + 0.2); // G5
      gainNode.gain.setValueAtTime(0.4, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      oscillator.start(now);
      oscillator.stop(now + 0.4);
    } else if (type === "accepted") {
      // Celebratory sound for accepted requests (client)
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(440, now); // A4
      oscillator.frequency.setValueAtTime(554.37, now + 0.15); // C#5
      oscillator.frequency.setValueAtTime(659.25, now + 0.3); // E5
      oscillator.frequency.setValueAtTime(880, now + 0.45); // A5
      gainNode.gain.setValueAtTime(0.35, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      oscillator.start(now);
      oscillator.stop(now + 0.6);
    } else {
      // Generic notification sound
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(600, now);
      oscillator.frequency.setValueAtTime(800, now + 0.1);
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      oscillator.start(now);
      oscillator.stop(now + 0.25);
    }
    
    console.log(`🔊 Playing ${type} notification sound`);
  } catch (error) {
    console.warn("Could not play notification sound:", error);
  }
}

function vibrate(pattern: number | number[]): void {
  try {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (error) {
    console.warn("Vibration not supported:", error);
  }
}

export function getNotificationSettings(): NotificationSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_SETTINGS;
}

export function saveNotificationSettings(settings: Partial<NotificationSettings>): void {
  try {
    const current = getNotificationSettings();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...settings }));
  } catch {
    // Ignore storage errors
  }
}

export function useNotificationSound() {
  const settingsRef = useRef<NotificationSettings>(getNotificationSettings());

  // Keep settings in sync
  useEffect(() => {
    const handleStorageChange = () => {
      settingsRef.current = getNotificationSettings();
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const playNewRequestSound = useCallback(() => {
    const settings = getNotificationSettings();
    
    if (settings.soundEnabled) {
      playNotificationSound("newRequest");
    }
    
    if (settings.vibrationEnabled) {
      // Short vibration pattern for new request
      vibrate([100, 50, 100]);
    }
  }, []);

  const playAcceptedSound = useCallback(() => {
    const settings = getNotificationSettings();
    
    if (settings.soundEnabled) {
      playNotificationSound("accepted");
    }
    
    if (settings.vibrationEnabled) {
      // Celebratory vibration pattern
      vibrate([100, 50, 100, 50, 200]);
    }
  }, []);

  const playGenericSound = useCallback(() => {
    const settings = getNotificationSettings();
    
    if (settings.soundEnabled) {
      playNotificationSound("generic");
    }
    
    if (settings.vibrationEnabled) {
      vibrate(100);
    }
  }, []);

  return {
    playNewRequestSound,
    playAcceptedSound,
    playGenericSound,
    getSettings: getNotificationSettings,
    saveSettings: saveNotificationSettings,
  };
}
