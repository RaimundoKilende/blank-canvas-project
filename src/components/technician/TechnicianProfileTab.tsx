import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { 
  User, Mail, Phone, Star, Briefcase, Award,
  LogOut, Settings, ChevronRight, MapPin, CheckCircle,
  Edit3, Shield, Clock, Wrench, Car, FileText,
  Sparkles, TrendingUp, Wallet, Image, Camera, HelpCircle, Loader2
} from "lucide-react";
import { SupportTicketDialog } from "@/components/client/SupportTicketDialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useTechnicians } from "@/hooks/useTechnicians";
import { useServiceRequests } from "@/hooks/useServiceRequests";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { TechnicianProfileEditDialog } from "@/components/technician/TechnicianProfileEditDialog";
import { NotificationsSheet } from "@/components/notifications/NotificationsSheet";
import { NotificationSettingsCard } from "@/components/settings/NotificationSettingsCard";
import { formatAKZShort } from "@/lib/formatCurrency";


const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 }
  },
};

const availabilityLabels: Record<string, string> = {
  "full-time": "Tempo Integral",
  "part-time": "Meio Período",
  "weekends": "Fins de Semana",
  "flexible": "Horário Flexível",
};

export function TechnicianProfileTab() {
  const { profile, signOut } = useAuth();
  const { myTechnicianProfile } = useTechnicians();
  const { requests } = useServiceRequests();
  const { uploadAvatar, uploading: avatarUploading } = useAvatarUpload();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null);
  const completedJobs = myTechnicianProfile?.completed_jobs || 0;
  const rating = myTechnicianProfile?.rating || 0;
  const reviewCount = myTechnicianProfile?.review_count || 0;
  const specialties = myTechnicianProfile?.specialties || [];
  const credits = myTechnicianProfile?.credits || 0;

  const totalEarnings = requests
    .filter(r => r.technician_id === profile?.user_id && r.status === "completed")
    .reduce((sum, r) => sum + (r.total_price || 0), 0);

  const menuItems = [
    { icon: Edit3, label: "Editar Perfil", desc: "Atualize suas informações", action: () => setProfileEditOpen(true) },
    { icon: MapPin, label: "Área de Atuação", desc: "Defina onde trabalha", action: () => {} },
    { icon: FileText, label: "Meus Documentos", desc: "Gerencie certificados", action: () => {} },
    { icon: Shield, label: "Segurança", desc: "Senha e privacidade", action: () => {} },
    { icon: HelpCircle, label: "Ajuda & Suporte", desc: "Reportar problema ou disputa", action: () => setSupportDialogOpen(true) },
  ];

  return (
    <motion.div 
      className="px-4 pb-24"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Premium Header Card */}
      <motion.div variants={itemVariants} className="pt-6 mb-6">
        <div className="relative">
          {/* Glow Effects */}
          <div className="absolute -top-4 -left-4 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-warning/20 rounded-full blur-2xl" />
          
          <div className="relative glass-card p-6 rounded-3xl border border-primary/10 overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent" />
            <Sparkles className="absolute top-4 right-4 w-5 h-5 text-primary/40" />
            
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="relative cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await uploadAvatar(file);
                        if (url) setAvatarUrl(url);
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-warning/50 rounded-full blur-md opacity-50" />
                  <Avatar className="w-18 h-18 border-4 border-primary/30 relative">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-warning/10 text-primary text-xl font-display font-bold">
                      {profile?.name?.charAt(0) || "T"}
                    </AvatarFallback>
                  </Avatar>
                  <motion.div 
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary border-2 border-background flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                  >
                    {avatarUploading ? (
                      <Loader2 className="w-3.5 h-3.5 text-primary-foreground animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5 text-primary-foreground" />
                    )}
                  </motion.div>
                </motion.div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-xl font-bold text-foreground truncate">
                      {profile?.name || "Técnico"}
                    </h1>
                    {myTechnicianProfile?.verified && (
                      <Badge className="bg-success/10 text-success text-[10px] border-success/20">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verificado
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{profile?.email}</p>
                  {myTechnicianProfile?.active && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      <span className="text-xs text-success">Online</span>
                    </div>
                  )}
                </div>
              </div>
              <NotificationsSheet />
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-4 gap-2">
              <motion.div 
                className="relative group"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="bg-gradient-to-br from-primary/10 to-transparent p-3 rounded-xl border border-primary/20 text-center">
                  <Briefcase className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{completedJobs}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Serviços</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="relative group"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="bg-gradient-to-br from-warning/10 to-transparent p-3 rounded-xl border border-warning/20 text-center">
                  <Star className="w-4 h-4 text-warning mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{rating > 0 ? rating.toFixed(1) : "—"}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{reviewCount} aval.</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="relative group"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="bg-gradient-to-br from-success/10 to-transparent p-3 rounded-xl border border-success/20 text-center">
                  <TrendingUp className="w-4 h-4 text-success mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{formatAKZShort(totalEarnings)}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Kz Total</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="relative group"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="bg-gradient-to-br from-info/10 to-transparent p-3 rounded-xl border border-info/20 text-center">
                  <Award className="w-4 h-4 text-info mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{credits}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Créditos</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Specialties */}
      {specialties.length > 0 && (
        <motion.div variants={itemVariants} className="mb-6">
          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wrench className="w-4 h-4 text-primary" />
              </div>
              <h2 className="font-semibold text-foreground">Especialidades</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {specialties.map((specialty, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Badge 
                    variant="secondary" 
                    className="px-3 py-1.5 text-xs bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    {specialty}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Professional Info */}
      {(myTechnicianProfile?.years_experience || myTechnicianProfile?.availability || myTechnicianProfile?.work_areas?.length) && (
        <motion.div variants={itemVariants} className="mb-6">
          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
                <User className="w-4 h-4 text-info" />
              </div>
              <h2 className="font-semibold text-foreground">Informações Profissionais</h2>
            </div>
            <div className="space-y-3">
              {myTechnicianProfile?.years_experience && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <span className="text-xs text-muted-foreground">Experiência</span>
                    <p className="text-foreground text-sm font-medium">{myTechnicianProfile.years_experience}</p>
                  </div>
                </div>
              )}
              {myTechnicianProfile?.availability && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <span className="text-xs text-muted-foreground">Disponibilidade</span>
                    <p className="text-foreground text-sm font-medium">
                      {availabilityLabels[myTechnicianProfile.availability] || myTechnicianProfile.availability}
                    </p>
                  </div>
                </div>
              )}
              {myTechnicianProfile?.work_areas && myTechnicianProfile.work_areas.length > 0 && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="text-xs text-muted-foreground">Áreas de Atuação</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {myTechnicianProfile.work_areas.map((area, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                {myTechnicianProfile?.has_own_tools && (
                  <div className="flex-1 flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/20">
                    <Wrench className="w-4 h-4 text-success" />
                    <span className="text-xs text-success font-medium">Ferramentas Próprias</span>
                  </div>
                )}
                {myTechnicianProfile?.has_transport && (
                  <div className="flex-1 flex items-center gap-2 p-3 rounded-xl bg-info/10 border border-info/20">
                    <Car className="w-4 h-4 text-info" />
                    <span className="text-xs text-info font-medium">Transporte Próprio</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Certifications */}
      {myTechnicianProfile?.certifications && (
        <motion.div variants={itemVariants} className="mb-6">
          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <Award className="w-4 h-4 text-warning" />
              </div>
              <h2 className="font-semibold text-foreground">Certificações</h2>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {myTechnicianProfile.certifications}
            </p>
          </div>
        </motion.div>
      )}

      {/* Previous Experience */}
      {myTechnicianProfile?.previous_experience && (
        <motion.div variants={itemVariants} className="mb-6">
          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-primary" />
              </div>
              <h2 className="font-semibold text-foreground">Experiência Profissional</h2>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {myTechnicianProfile.previous_experience}
            </p>
          </div>
        </motion.div>
      )}

      {/* Portfolio Gallery */}
      {myTechnicianProfile?.portfolio_photos && myTechnicianProfile.portfolio_photos.length > 0 && (
        <motion.div variants={itemVariants} className="mb-6">
          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <Camera className="w-4 h-4 text-success" />
              </div>
              <h2 className="font-semibold text-foreground">Portfólio</h2>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {myTechnicianProfile.portfolio_photos.map((photo, index) => (
                <div key={index} className="aspect-square rounded-xl overflow-hidden border border-border">
                  <img src={photo} className="w-full h-full object-cover" alt={`Portfólio ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Contact Info */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <Mail className="w-4 h-4 text-muted-foreground" />
            </div>
            <h2 className="font-semibold text-foreground">Contato</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground text-sm">{profile?.email}</span>
            </div>
            {profile?.phone && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground text-sm">{profile.phone}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>


      {/* Notification Settings */}
      <motion.div variants={itemVariants} className="mb-6">
        <NotificationSettingsCard />
      </motion.div>

      {/* Menu Items */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="glass-card rounded-2xl overflow-hidden">
          {menuItems.map((item, index) => (
            <motion.button
              key={index}
              onClick={item.action}
              className="w-full flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors relative"
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <span className="text-foreground font-medium block">{item.label}</span>
                <span className="text-muted-foreground text-xs">{item.desc}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
              {index < menuItems.length - 1 && (
                <Separator className="absolute bottom-0 left-16 right-4" />
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Logout Button */}
      <motion.div variants={itemVariants}>
        <Button
          variant="outline"
          className="w-full h-14 rounded-2xl text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 hover:border-destructive/40 transition-all"
          onClick={() => signOut()}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sair da Conta
        </Button>
      </motion.div>

      <TechnicianProfileEditDialog
        open={profileEditOpen}
        onOpenChange={setProfileEditOpen}
      />

      <SupportTicketDialog
        open={supportDialogOpen}
        onOpenChange={setSupportDialogOpen}
      />
    </motion.div>
  );
}
