import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Mail, Phone, MapPin, Building2, 
  LogOut, Settings, ChevronRight, Star, Clock, CheckCircle,
  Edit3, Shield, CreditCard, HelpCircle, Sparkles, Camera, Loader2
} from "lucide-react";
import { SupportTicketDialog } from "@/components/client/SupportTicketDialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useServiceRequests } from "@/hooks/useServiceRequests";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { NotificationsSheet } from "@/components/notifications/NotificationsSheet";
import { NotificationSettingsCard } from "@/components/settings/NotificationSettingsCard";
import { Separator } from "@/components/ui/separator";
import { formatAKZShort } from "@/lib/formatCurrency";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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

export function ClientProfileTab() {
  const { profile, signOut } = useAuth();
  const { requests } = useServiceRequests();
  const { uploadAvatar, uploading: avatarUploading } = useAvatarUpload();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const completedServices = requests.filter(r => r.status === "completed").length;
  const totalSpent = requests
    .filter(r => r.status === "completed")
    .reduce((sum, r) => sum + (r.total_price || 0), 0);
  const avgRating = requests
    .filter(r => r.rating)
    .reduce((sum, r, _, arr) => sum + (r.rating || 0) / arr.length, 0);

  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null);

  const [supportDialogOpen, setSupportDialogOpen] = useState(false);

  const menuItems = [
    { icon: Edit3, label: "Editar Perfil", desc: "Atualize suas informações", action: () => {} },
    { icon: MapPin, label: "Endereços Salvos", desc: "Gerencie seus endereços", action: () => {} },
    { icon: CreditCard, label: "Pagamentos", desc: "Métodos de pagamento", action: () => {} },
    { icon: Shield, label: "Segurança", desc: "Senha e privacidade", action: () => {} },
    { icon: HelpCircle, label: "Ajuda & Suporte", desc: "Reportar problema ou disputa", action: () => setSupportDialogOpen(true) },
  ];

  const isOrganization = profile?.client_type && profile.client_type !== "personal";

  return (
    <motion.div 
      className="px-4 pb-24"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Premium Header */}
      <motion.div variants={itemVariants} className="pt-6 mb-6">
        <div className="relative">
          {/* Glow Effect */}
          <div className="absolute -top-4 -left-4 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
          
          <div className="relative glass-card p-6 rounded-3xl border border-primary/10 overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/10 to-transparent" />
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
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/50 rounded-full blur-md opacity-50" />
                  <Avatar className="w-18 h-18 border-4 border-primary/30 relative">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xl font-display font-bold">
                      {profile?.name?.charAt(0) || "U"}
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
                  <h1 className="font-display text-xl font-bold text-foreground truncate">
                    {profile?.name || "Usuário"}
                  </h1>
                  <p className="text-sm text-muted-foreground truncate">{profile?.email}</p>
                  {isOrganization && (
                    <Badge variant="outline" className="mt-2 border-primary/30 text-primary">
                      <Building2 className="w-3 h-3 mr-1" />
                      {profile.client_type === "company" ? "Empresa" : 
                       profile.client_type === "institution" ? "Instituição" : "Organização"}
                    </Badge>
                  )}
                </div>
              </div>
              <NotificationsSheet />
            </div>

            {/* Premium Stats */}
            <div className="grid grid-cols-3 gap-3">
              <motion.div 
                className="relative group"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-success/20 to-success/5 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-gradient-to-br from-success/10 to-transparent p-4 rounded-2xl border border-success/20">
                  <CheckCircle className="w-5 h-5 text-success mx-auto mb-2" />
                  <p className="text-xl font-bold text-foreground text-center">{completedServices}</p>
                  <p className="text-[10px] text-muted-foreground text-center uppercase tracking-wider">Serviços</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="relative group"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-warning/20 to-warning/5 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-gradient-to-br from-warning/10 to-transparent p-4 rounded-2xl border border-warning/20">
                  <Star className="w-5 h-5 text-warning mx-auto mb-2" />
                  <p className="text-xl font-bold text-foreground text-center">
                    {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground text-center uppercase tracking-wider">Avaliação</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="relative group"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-gradient-to-br from-primary/10 to-transparent p-4 rounded-2xl border border-primary/20">
                  <CreditCard className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="text-xl font-bold text-foreground text-center">
                    {formatAKZShort(totalSpent)}
                  </p>
                  <p className="text-[10px] text-muted-foreground text-center uppercase tracking-wider">Kz Gastos</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Contact Info Card */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">Informações de Contato</h2>
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
            {isOrganization && profile?.nif && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <span className="text-foreground text-sm block">{profile.company_name}</span>
                  <span className="text-muted-foreground text-xs">NIF: {profile.nif}</span>
                </div>
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

      <SupportTicketDialog
        open={supportDialogOpen}
        onOpenChange={setSupportDialogOpen}
      />
    </motion.div>
  );
}
