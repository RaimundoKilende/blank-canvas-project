import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Trash2, Play, Pause, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { useState, useRef, useEffect } from "react";

interface AudioRecorderProps {
  onAudioReady: (url: string | null) => void;
  disabled?: boolean;
}

export function AudioRecorder({ onAudioReady, disabled }: AudioRecorderProps) {
  const {
    isRecording,
    duration,
    audioBlob,
    audioUrl,
    uploading,
    startRecording,
    stopRecording,
    clearRecording,
    uploadAudio,
    formatDuration,
  } = useAudioRecording();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  // Upload audio when recording is ready
  useEffect(() => {
    if (audioBlob && !uploadedUrl) {
      uploadAudio().then(url => {
        setUploadedUrl(url);
        onAudioReady(url);
      });
    }
  }, [audioBlob, uploadedUrl, uploadAudio, onAudioReady]);

  const handleClear = () => {
    clearRecording();
    setUploadedUrl(null);
    onAudioReady(null);
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      console.error("Microphone access denied:", error);
    }
  };

  return (
    <div className="space-y-3">
      <AnimatePresence mode="wait">
        {!audioUrl ? (
          // Recording State
          <motion.div
            key="recording"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {isRecording ? (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-destructive/5 border border-destructive/20">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center"
                >
                  <Mic className="w-5 h-5 text-destructive" />
                </motion.div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Gravando...</p>
                  <p className="text-xs text-muted-foreground">{formatDuration(duration)}</p>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  onClick={stopRecording}
                  className="rounded-full"
                >
                  <Square className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={handleStartRecording}
                disabled={disabled}
                className="w-full h-14 rounded-2xl border-dashed border-2 hover:bg-secondary/50 gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mic className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Gravar áudio</p>
                  <p className="text-xs text-muted-foreground">Descreva o problema com sua voz</p>
                </div>
              </Button>
            )}
          </motion.div>
        ) : (
          // Playback State
          <motion.div
            key="playback"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/20"
          >
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={handleAudioEnded}
              className="hidden"
            />
            
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={togglePlayback}
              className="rounded-full bg-primary/10 hover:bg-primary/20"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-primary" />
              ) : (
                <Play className="w-5 h-5 text-primary" />
              )}
            </Button>
            
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Áudio gravado</p>
              <p className="text-xs text-muted-foreground">
                {uploading ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Enviando...
                  </span>
                ) : uploadedUrl ? (
                  "✓ Pronto para enviar"
                ) : (
                  formatDuration(duration)
                )}
              </p>
            </div>
            
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={handleClear}
              disabled={uploading}
              className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
