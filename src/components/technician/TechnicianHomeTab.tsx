import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  DollarSign, CheckCircle, Star, TrendingUp, 
  MapPin, Clock, Power, PowerOff, Loader2, Play, User,
  ChevronDown, ChevronUp, Phone, XCircle, Camera, X, Volume2, AlertTriangle, FileText, Shield
} from "lucide-react";
import { formatAKZShort } from "@/lib/formatCurrency";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useTechnicians } from "@/hooks/useTechnicians";
import { useServiceRequests } from "@/hooks/useServiceRequests";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useNotifications } from "@/hooks/useNotifications";
import { useSpecialties } from "@/hooks/useSpecialties";
import { useServices } from "@/hooks/useServices";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ServiceExtraDialog, ServiceExtra } from "@/components/client/ServiceExtraDialog";
import { ChatButton } from "@/components/chat/ChatButton";
import { RatingNotificationToast } from "@/components/technician/RatingNotificationToast";
import { CancelServiceDialog } from "@/components/client/CancelServiceDialog";
import { NotificationsSheet } from "@/components/notifications/NotificationsSheet";
import { SendQuoteDialog } from "@/components/technician/SendQuoteDialog";
import { DisputeDefenseDialog } from "@/components/technician/DisputeDefenseDialog";
import { LowBalanceAlert } from "@/components/shared/LowBalanceAlert";
import { useSupportTickets, SupportTicket } from "@/hooks/useSupportTickets";

export function TechnicianHomeTab() {
  const { profile } = useAuth();
  const { myTechnicianProfile, updateStatus, updateLocation, loadingMyProfile } = useTechnicians();
  const { requests, acceptRequest, startService, completeService, cancelRequest, sendQuote, isLoading, refetch } = useServiceRequests();
  const { latitude, longitude, getCurrentPosition, calculateDistance, formatDistance } = useGeolocation();
  const { notifications, markAsRead } = useNotifications();
  const { specialties: allSpecialties } = useSpecialties();
  const { services: allServices } = useServices();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellingRequestId, setCancellingRequestId] = useState<string | null>(null);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [quotingRequest, setQuotingRequest] = useState<any>(null);
  const [defenseDialogOpen, setDefenseDialogOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<SupportTicket | null>(null);
  const { pendingDefense } = useSupportTickets();

  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [extrasDialogOpen, setExtrasDialogOpen] = useState(false);
  const [completingRequestId, setCompletingRequestId] = useState<string | null>(null);
  const [ratingNotification, setRatingNotification] = useState<{
    rating: number;
    clientName: string;
    feedback?: string;
    notificationId: string;
  } | null>(null);

  useEffect(() => { getCurrentPosition(); }, []);

  useEffect(() => {
    if (latitude && longitude && myTechnicianProfile) {
      updateLocation.mutate({ latitude, longitude });
    }
  }, [latitude, longitude, myTechnicianProfile?.id]);

  // Rating notification listener
  useEffect(() => {
    const ratingNotifications = notifications.filter(n => n.type === "rating" && !n.read);
    if (ratingNotifications.length > 0 && !ratingNotification) {
      const latest = ratingNotifications[0];
      const data = latest.data as { rating: number; client_name: string; feedback?: string } | null;
      if (data) {
        setRatingNotification({
          rating: data.rating,
          clientName: data.client_name || "Cliente",
          feedback: data.feedback,
          notificationId: latest.id,
        });
      }
    }
  }, [notifications, ratingNotification]);

  const handleCloseRatingNotification = useCallback(() => {
    if (ratingNotification) {
      markAsRead.mutate(ratingNotification.notificationId);
      setRatingNotification(null);
    }
  }, [ratingNotification, markAsRead]);

  const isOnline = myTechnicianProfile?.active ?? false;
  const walletBalance = myTechnicianProfile?.wallet_balance ?? 0;
  const isWalletBlocked = walletBalance <= 0;
  const technicianSpecialties = myTechnicianProfile?.specialties || [];

  // Map technician specialties to their category IDs
  const technicianCategoryIds = useMemo(() => {
    if (technicianSpecialties.length === 0) return [];
    
    // Find all categories that the technician's specialties belong to
    const categoryIds: string[] = [];
    for (const techSpec of technicianSpecialties) {
      const matchingSpecialty = allSpecialties.find(
        s => s.name.toLowerCase() === techSpec.toLowerCase()
      );
      if (matchingSpecialty?.category_id) {
        categoryIds.push(matchingSpecialty.category_id);
      }
    }
    return [...new Set(categoryIds)]; // Remove duplicates
  }, [technicianSpecialties, allSpecialties]);

  const filterBySpecialty = useCallback((request: any) => {
    // Direct requests to this technician always show
    if (request.technician_id === profile?.user_id) return true;
    
    // Broadcast requests (technician_id is null) - filter by category
    if (request.technician_id === null) {
      // If technician has no specialties, show all broadcast requests
      if (technicianSpecialties.length === 0) return true;
      
      // Check if the request's category matches any of the technician's specialties' categories
      const requestCategoryId = request.category_id;
      return technicianCategoryIds.includes(requestCategoryId);
    }
    
    // Direct request to another technician - don't show
    return false;
  }, [profile?.user_id, technicianSpecialties.length, technicianCategoryIds]);

  const pendingRequests = requests
    .filter(r => r.status === "pending")
    .filter(r => filterBySpecialty(r));

  const myActiveRequests = requests.filter(
    r => r.technician_id === profile?.user_id && ["accepted", "in_progress"].includes(r.status)
  );

  const completedToday = requests.filter(
    r => r.technician_id === profile?.user_id && r.status === "completed" &&
      new Date(r.completed_at || "").toDateString() === new Date().toDateString()
  );

  const todayEarnings = completedToday.reduce((sum, r) => sum + (r.total_price || 0), 0);
  const monthlyRequests = requests.filter(
    r => r.technician_id === profile?.user_id && r.status === "completed" &&
      new Date(r.completed_at || "").getMonth() === new Date().getMonth()
  );
  const monthlyEarnings = monthlyRequests.reduce((sum, r) => sum + (r.total_price || 0), 0);

  const stats = [
    { icon: DollarSign, label: "Hoje", value: formatAKZShort(todayEarnings) },
    { icon: CheckCircle, label: "Serviços", value: `${completedToday.length}` },
    { icon: Star, label: "Avaliação", value: `${myTechnicianProfile?.rating?.toFixed(1) || "0"}` },
    { icon: TrendingUp, label: "Mês", value: formatAKZShort(monthlyEarnings) },
  ];

  const getDistanceFromClient = (request: any) => {
    if (latitude && longitude && request.latitude && request.longitude) {
      const distance = calculateDistance(latitude, longitude, request.latitude, request.longitude);
      return formatDistance(distance);
    }
    return "N/A";
  };

  const handleCompleteWithExtras = async (extras: ServiceExtra[], completionPhotos?: string[], completionCode?: string) => {
    if (completingRequestId) {
      await completeService.mutateAsync({ 
        requestId: completingRequestId, 
        extras: extras.length > 0 ? extras : undefined,
        completionPhotos,
        completionCode
      });
      setExtrasDialogOpen(false);
      setCompletingRequestId(null);
    }
  };

  const handleCancelService = async (reason: string) => {
    if (!cancellingRequestId) return;
    await cancelRequest.mutateAsync({ requestId: cancellingRequestId, reason });
    setCancelDialogOpen(false);
    setCancellingRequestId(null);
  };

  const openPhotoViewer = (photoUrl: string) => {
    setSelectedPhoto(photoUrl);
    setPhotoViewerOpen(true);
  };

  const PhotoGallery = ({ photos }: { photos: string[] | null }) => {
    if (!photos || photos.length === 0) return null;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Camera className="w-3 h-3" />
          <span>Fotos do problema ({photos.length})</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {photos.map((photo, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openPhotoViewer(photo)}
              className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden ring-2 ring-primary/20 hover:ring-primary/50 transition-all"
            >
              <img
                src={photo}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </motion.button>
          ))}
        </div>
      </div>
    );
  };

  const AudioPlayer = ({ audioUrl }: { audioUrl: string | null | undefined }) => {
    if (!audioUrl) return null;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Volume2 className="w-3 h-3" />
          <span>Áudio do cliente</span>
        </div>
        <audio 
          controls 
          className="w-full h-10 rounded-lg"
          preload="metadata"
        >
          <source src={audioUrl} type="audio/webm" />
          <source src={audioUrl} type="audio/mp4" />
          Seu navegador não suporta áudio.
        </audio>
      </div>
    );
  };

  if (loadingMyProfile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pb-24">
      {/* Rating Toast */}
      {ratingNotification && (
        <RatingNotificationToast
          rating={ratingNotification.rating}
          clientName={ratingNotification.clientName}
          feedback={ratingNotification.feedback}
          onClose={handleCloseRatingNotification}
        />
      )}

      {/* Low Balance Alert */}
      <LowBalanceAlert walletBalance={walletBalance} entityType="técnico" />

      {/* Header with Status */}
      <div className="pt-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Olá, {profile?.name?.split(" ")[0]}!
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <NotificationsSheet />
            <motion.div 
              className={`flex items-center gap-2 px-3 py-2 rounded-full ${isOnline ? 'bg-success/10' : 'bg-muted'}`}
              whileTap={{ scale: 0.95 }}
            >
              {isOnline ? <Power className="w-4 h-4 text-success" /> : <PowerOff className="w-4 h-4 text-muted-foreground" />}
              <Switch
                checked={isOnline}
                onCheckedChange={(checked) => updateStatus.mutate(checked)}
                disabled={updateStatus.isPending}
              />
            </motion.div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-3 rounded-xl text-center"
            >
              <stat.icon className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Pending Disputes */}
      {pendingDefense.length > 0 && (
        <div className="mb-6">
          <h2 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Disputas Pendentes ({pendingDefense.length})
          </h2>
          <div className="space-y-3">
            {pendingDefense.map((dispute) => (
              <motion.div
                key={dispute.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 rounded-2xl border-l-4 border-l-warning"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground text-sm">{dispute.subject}</h3>
                  <Badge className="bg-warning/10 text-warning text-xs">Aguardando Defesa</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{dispute.description}</p>
                <p className="text-[10px] text-muted-foreground mb-3">
                  Reportado por: {dispute.reporter?.name || "Cliente"}
                </p>
                <Button
                  size="sm"
                  onClick={() => { setSelectedDispute(dispute); setDefenseDialogOpen(true); }}
                  className="w-full"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Apresentar Defesa
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Active Jobs */}
      {myActiveRequests.length > 0 && (
        <div className="mb-6">
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">Em Andamento</h2>
          <div className="space-y-3">
            {myActiveRequests.map((request) => (
              <motion.div
                key={request.id}
                layout
                className="glass-card p-4 rounded-2xl border-l-4 border-l-primary"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">
                      {(request as any).service?.name || request.category?.name}
                    </h3>
                    {(request as any).service?.name && request.category?.name && (
                      <p className="text-[10px] text-muted-foreground">{request.category.name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(request as any).quote_status === "sent" && (
                      <Badge className="bg-warning/10 text-warning text-[10px]">
                        <FileText className="w-2.5 h-2.5 mr-0.5" /> Orçamento Enviado
                      </Badge>
                    )}
                    {(request as any).quote_status === "approved" && (
                      <Badge className="bg-success/10 text-success text-[10px]">
                        <CheckCircle className="w-2.5 h-2.5 mr-0.5" /> Orçamento Aprovado
                      </Badge>
                    )}
                    {(request as any).quote_status === "rejected" && (
                      <Badge className="bg-destructive/10 text-destructive text-[10px]">
                        <XCircle className="w-2.5 h-2.5 mr-0.5" /> Orçamento Recusado
                      </Badge>
                    )}
                    <Badge className={request.status === "in_progress" ? "bg-primary/10 text-primary text-xs" : "bg-warning/10 text-warning text-xs"}>
                      {request.status === "in_progress" ? "Em Andamento" : "Aceito"}
                    </Badge>
                  </div>
                </div>
                
                {/* Client Info */}
                {request.client && (
                  <div className="flex items-center gap-3 mb-3 p-2 bg-secondary/50 rounded-xl">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={request.client.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {request.client.name?.charAt(0) || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{request.client.name}</p>
                      {request.client.phone && (
                        <p className="text-xs text-muted-foreground">{request.client.phone}</p>
                      )}
                    </div>
                    {request.client.phone && (
                      <a 
                        href={`tel:${request.client.phone}`}
                        className="p-2 rounded-full bg-success/10 text-success"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}
                
                {/* Photos Gallery for Active Jobs */}
                {request.photos && request.photos.length > 0 && (
                  <div className="mb-3">
                    <PhotoGallery photos={request.photos} />
                  </div>
                )}
                
                {/* Audio Player for Active Jobs */}
                {(request as any).audio_url && (
                  <div className="mb-3">
                    <AudioPlayer audioUrl={(request as any).audio_url} />
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{request.address}</p>
                <div className="flex gap-2 flex-wrap">
                   {request.status === "accepted" && (
                    <>
                      {(request as any).quote_status === "sent" ? (
                        <p className="flex-1 text-xs text-center text-muted-foreground py-2">
                          Aguardando aprovação do cliente...
                        </p>
                      ) : (request as any).quote_status === "rejected" && allServices.some(s => s.category_id === request.category_id && s.price_type === "quote") ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-primary/30 text-primary hover:bg-primary/10"
                          onClick={() => { setQuotingRequest(request); setQuoteDialogOpen(true); }}
                        >
                          <FileText className="w-4 h-4 mr-1" /> Novo Orçamento
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => startService.mutateAsync(request.id)} className="flex-1">
                          <Play className="w-4 h-4 mr-1" /> Iniciar
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => { setCancellingRequestId(request.id); setCancelDialogOpen(true); }}
                        className="text-destructive hover:text-destructive"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {request.status === "in_progress" && (
                    <Button size="sm" onClick={() => { setCompletingRequestId(request.id); setExtrasDialogOpen(true); }} className="flex-1">
                      <CheckCircle className="w-4 h-4 mr-1" /> Concluir
                    </Button>
                  )}
                  <ChatButton serviceRequestId={request.id} otherUserName={request.client?.name || "Cliente"} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Requests */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold text-foreground">Novas Solicitações</h2>
          {pendingRequests.length > 0 && (
            <Badge variant="secondary" className="pulse-glow text-xs">{pendingRequests.length} novas</Badge>
          )}
        </div>

        {isWalletBlocked ? (
          <div className="glass-card p-6 rounded-2xl text-center border border-destructive/20">
            <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
            <p className="text-sm font-medium text-destructive mb-1">Carteira sem saldo</p>
            <p className="text-xs text-muted-foreground">Carregue sua carteira para receber e aceitar solicitações de clientes.</p>
          </div>
        ) : !isOnline ? (
          <div className="glass-card p-6 rounded-2xl text-center">
            <PowerOff className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Ative o status online para receber solicitações</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="glass-card p-6 rounded-2xl text-center">
            <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.slice(0, 5).map((request) => (
              <Collapsible 
                key={request.id}
                open={expandedRequest === request.id}
                onOpenChange={() => setExpandedRequest(expandedRequest === request.id ? null : request.id)}
              >
                <motion.div 
                  layout
                  className={`glass-card p-4 rounded-2xl border-l-4 ${
                    request.technician_id === profile?.user_id ? "border-l-warning" : "border-l-primary"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground text-sm">
                          {(request as any).service?.name || request.category?.name}
                        </h3>
                        {request.technician_id === profile?.user_id && (
                          <Badge className="bg-warning/10 text-warning text-[10px]">
                            <User className="w-2.5 h-2.5 mr-0.5" /> Direto
                          </Badge>
                        )}
                      </div>
                      {(request as any).service?.name && request.category?.name && (
                        <p className="text-[10px] text-muted-foreground mb-1">{request.category.name}</p>
                      )}
                      {(request as any).service?.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{(request as any).service.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{getDistanceFromClient(request)}</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(request.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full h-8 text-xs mb-2">
                      {expandedRequest === request.id ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                      {expandedRequest === request.id ? "Menos" : "Detalhes"}
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="py-2 border-t border-border/50 text-xs text-muted-foreground space-y-2">
                      {/* Client Info in pending requests */}
                      {request.client && (
                        <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={request.client.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {request.client.name?.charAt(0) || "C"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-foreground text-sm">{request.client.name}</p>
                            {request.client.phone && (
                              <p className="text-xs text-muted-foreground">{request.client.phone}</p>
                            )}
                          </div>
                        </div>
                      )}
                      <p>{request.description}</p>
                      
                      {/* Scheduling Info */}
                      {(request as any).scheduling_type === "scheduled" && (
                        <div className="flex items-center gap-2 p-2 bg-warning/10 rounded-lg border border-warning/20 mt-2">
                          <Clock className="w-3.5 h-3.5 text-warning" />
                          <span className="text-xs font-medium text-warning">
                            Agendado: {(request as any).scheduled_date ? new Date((request as any).scheduled_date + "T00:00:00").toLocaleDateString("pt-BR") : ""} 
                            {(request as any).scheduled_time ? ` às ${(request as any).scheduled_time.slice(0, 5)}` : ""}
                          </span>
                        </div>
                      )}
                      {(request as any).scheduling_type === "now" && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="bg-success/10 text-success text-[10px] border-success/20">
                            <Play className="w-2.5 h-2.5 mr-0.5" /> Atendimento Imediato
                          </Badge>
                        </div>
                      )}
                      
                      {/* Photos Gallery for Pending Requests */}
                      {request.photos && request.photos.length > 0 && (
                        <div className="mt-2">
                          <PhotoGallery photos={request.photos} />
                        </div>
                      )}
                      
                      {/* Audio Player for Pending Requests */}
                      {(request as any).audio_url && (
                        <div className="mt-2">
                          <AudioPlayer audioUrl={(request as any).audio_url} />
                        </div>
                      )}
                      
                      <p className="truncate">{request.address}</p>
                      <p className="font-medium text-primary mt-2">{formatAKZShort(request.total_price || 0)}</p>
                    </div>
                  </CollapsibleContent>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1 gradient-primary"
                      onClick={() => acceptRequest.mutateAsync(request.id)}
                      disabled={acceptRequest.isPending || sendQuote.isPending}
                    >
                      {acceptRequest.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aceitar"}
                    </Button>
                    {/* Only show quote button for quote-type services */}
                    {allServices.some(s => s.category_id === request.category_id && s.price_type === "quote") && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1 border-primary/30 text-primary hover:bg-primary/10"
                        onClick={() => { setQuotingRequest(request); setQuoteDialogOpen(true); }}
                        disabled={acceptRequest.isPending || sendQuote.isPending}
                      >
                        <FileText className="w-4 h-4 mr-1" /> Orçamento
                      </Button>
                    )}
                  </div>
                </motion.div>
              </Collapsible>
            ))}
          </div>
        )}
      </div>

      <ServiceExtraDialog
        open={extrasDialogOpen}
        onOpenChange={setExtrasDialogOpen}
        extras={[]}
        onComplete={handleCompleteWithExtras}
        isPending={completeService.isPending}
      />

      <CancelServiceDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleCancelService}
        isPending={cancelRequest.isPending}
      />

      {quotingRequest && (
        <SendQuoteDialog
          open={quoteDialogOpen}
          onOpenChange={setQuoteDialogOpen}
          onSubmit={async (amount, description) => {
            await sendQuote.mutateAsync({ requestId: quotingRequest.id, amount, description });
            setQuoteDialogOpen(false);
            setQuotingRequest(null);
          }}
          isPending={sendQuote.isPending}
          serviceName={quotingRequest.category?.name || "Serviço"}
          clientName={quotingRequest.client?.name || "Cliente"}
          suggestedPriceMin={allServices.find(s => s.category_id === quotingRequest.category_id && s.price_type === "quote")?.suggested_price_min}
          suggestedPriceMax={allServices.find(s => s.category_id === quotingRequest.category_id && s.price_type === "quote")?.suggested_price_max}
        />
      )}

      {/* Photo Viewer Dialog */}
      <Dialog open={photoViewerOpen} onOpenChange={setPhotoViewerOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
          <DialogTitle className="sr-only">Visualizar foto</DialogTitle>
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <button
              onClick={() => setPhotoViewerOpen(false)}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <AnimatePresence mode="wait">
              {selectedPhoto && (
                <motion.img
                  key={selectedPhoto}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  src={selectedPhoto}
                  alt="Foto do problema"
                  className="max-w-full max-h-[85vh] object-contain rounded-lg"
                />
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>

      <DisputeDefenseDialog
        open={defenseDialogOpen}
        onOpenChange={setDefenseDialogOpen}
        ticket={selectedDispute}
      />
    </div>
  );
}
