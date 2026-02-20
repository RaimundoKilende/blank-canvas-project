import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle, XCircle, Play, History, Loader2, Package, ShoppingBag, Store, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useServiceRequests } from "@/hooks/useServiceRequests";
import { QuoteApprovalCard } from "@/components/client/QuoteApprovalCard";
import { useOrders } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import { RatingDialog } from "@/components/client/RatingDialog";
import { CancelServiceDialog } from "@/components/client/CancelServiceDialog";
import { WaitingAnimation } from "@/components/client/WaitingAnimation";
import { ServiceAcceptedAnimation } from "@/components/client/ServiceAcceptedAnimation";
import { InProgressAnimation } from "@/components/client/InProgressAnimation";
import { ServiceHistoryDialog } from "@/components/client/ServiceHistoryDialog";
import { ChatButton } from "@/components/chat/ChatButton";
import { DisputeDialog } from "@/components/client/DisputeDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function ClientOrdersTab() {
  const { requests, isLoading, rateService, cancelRequest, approveQuote, rejectQuote } = useServiceRequests();
  const { orders, isLoading: ordersLoading } = useOrders("client");
  const { profile } = useAuth();
  
  const [ratingRequest, setRatingRequest] = useState<any>(null);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellingServiceId, setCancellingServiceId] = useState<string | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedHistoryService, setSelectedHistoryService] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [mainTab, setMainTab] = useState<"services" | "shop">("services");
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [disputeService, setDisputeService] = useState<any>(null);

  // Check for completed services that need rating
  useEffect(() => {
    const completedWithoutRating = requests.find(
      r => r.status === "completed" && !r.rating && r.technician
    );
    if (completedWithoutRating && !ratingDialogOpen) {
      setRatingRequest(completedWithoutRating);
      setRatingDialogOpen(true);
    }
  }, [requests]);

  const activeServices = requests.filter(r => ["pending", "accepted", "in_progress"].includes(r.status));
  const completedServices = requests.filter(r => r.status === "completed");

  // Shop orders
  const activeOrders = orders.filter(o => ["pending", "confirmed", "preparing", "ready"].includes(o.status));
  const completedOrders = orders.filter(o => ["delivered", "cancelled"].includes(o.status));

  const handleCancelService = async (reason: string) => {
    if (!cancellingServiceId) return;
    await cancelRequest.mutateAsync({ requestId: cancellingServiceId, reason });
    setCancelDialogOpen(false);
    setCancellingServiceId(null);
  };

  const handleRatingSubmit = (rating: number, feedback: string) => {
    if (ratingRequest) {
      rateService.mutate({ requestId: ratingRequest.id, rating, feedback });
      setRatingDialogOpen(false);
      setRatingRequest(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "delivered":
        return <Badge className="bg-success/10 text-success border-0">Concluído</Badge>;
      case "in_progress":
      case "preparing":
        return <Badge className="bg-primary/10 text-primary border-0">Em Andamento</Badge>;
      case "accepted":
      case "confirmed":
        return <Badge className="bg-warning/10 text-warning border-0">Confirmado</Badge>;
      case "ready":
        return <Badge className="bg-primary/10 text-primary border-0">Pronto</Badge>;
      case "pending":
        return <Badge variant="secondary" className="border-0">Aguardando</Badge>;
      case "cancelled":
        return <Badge className="bg-destructive/10 text-destructive border-0">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28 min-h-screen">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-4 pb-4 sticky top-0 z-20 bg-background/95 backdrop-blur-lg"
      >
        <div className="mb-4">
          <h1 className="font-display text-2xl font-bold text-foreground">Meus Pedidos</h1>
          <p className="text-muted-foreground text-sm">Acompanhe seus serviços e compras</p>
        </div>

        {/* Main Tabs: Services vs Shop */}
        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as "services" | "shop")} className="mb-3">
          <TabsList className="w-full">
            <TabsTrigger value="services" className="flex-1 gap-2">
              <Package className="w-4 h-4" />
              Serviços
            </TabsTrigger>
            <TabsTrigger value="shop" className="flex-1 gap-2">
              <ShoppingBag className="w-4 h-4" />
              Compras
              {activeOrders.length > 0 && (
                <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary border-0 text-[10px]">
                  {activeOrders.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Sub-tabs */}
        <div className="flex gap-2 p-1 bg-secondary/50 rounded-2xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("active")}
            className={`flex-1 rounded-xl h-11 transition-all ${
              activeTab === "active" 
                ? "bg-card shadow-sm text-foreground font-medium" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Play className="w-4 h-4 mr-2" />
            Ativos
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("completed")}
            className={`flex-1 rounded-xl h-11 transition-all ${
              activeTab === "completed" 
                ? "bg-card shadow-sm text-foreground font-medium" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="w-4 h-4 mr-2" />
            Histórico
          </Button>
        </div>
      </motion.div>

      {/* Content */}
      <div className="px-4">
        <AnimatePresence mode="wait">
          {mainTab === "services" ? (
            /* ========== SERVICES TAB ========== */
            activeTab === "active" ? (
              <motion.div
                key="service-active"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {activeServices.length === 0 ? (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
                    <div className="w-20 h-20 rounded-3xl bg-secondary mx-auto mb-4 flex items-center justify-center">
                      <Package className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Nenhum serviço ativo</h3>
                    <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">
                      Seus serviços em andamento aparecerão aqui
                    </p>
                  </motion.div>
                ) : (
                  activeServices.map((service, index) => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      layout
                      className="bg-card border border-border/50 rounded-3xl overflow-hidden"
                    >
                      {service.status === "pending" && (
                        <div className="p-5">
                          <WaitingAnimation 
                            createdAt={service.created_at} 
                            serviceName={service.category?.name || "Serviço"}
                          />
                          <div className="mt-5 flex justify-center">
                            <Button
                              variant="outline" size="sm"
                              onClick={(e) => { e.stopPropagation(); setCancellingServiceId(service.id); setCancelDialogOpen(true); }}
                              className="text-destructive border-destructive/30 hover:bg-destructive/10 rounded-xl"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Cancelar Solicitação
                            </Button>
                          </div>
                        </div>
                      )}
                      {service.status === "accepted" && service.technician && (request => {
                        const svc = service as any;
                        if (svc.quote_status === "sent") {
                          return (
                            <QuoteApprovalCard
                              serviceId={service.id}
                              technicianName={service.technician!.name}
                              serviceName={service.category?.name || "Serviço"}
                              quoteAmount={svc.quote_amount}
                              quoteDescription={svc.quote_description}
                              quoteSentAt={svc.quote_sent_at}
                              onApprove={() => approveQuote.mutateAsync(service.id)}
                              onReject={() => rejectQuote.mutateAsync(service.id)}
                              isApproving={approveQuote.isPending}
                              isRejecting={rejectQuote.isPending}
                            />
                          );
                        }
                        return (
                          <div className="p-5">
                            <ServiceAcceptedAnimation technicianName={service.technician!.name} />
                            <div className="mt-5 flex gap-3">
                              <ChatButton serviceRequestId={service.id} otherUserName={service.technician!.name} />
                              <Button
                                variant="outline" size="sm"
                                onClick={(e) => { e.stopPropagation(); setCancellingServiceId(service.id); setCancelDialogOpen(true); }}
                                className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10 rounded-xl"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        );
                      })(service)}
                      {service.status === "in_progress" && service.technician && (
                        <div className="p-5">
                          <InProgressAnimation
                            startedAt={service.started_at || service.accepted_at || service.created_at}
                            technicianName={service.technician.name}
                            serviceName={service.category?.name || "Serviço"}
                            completionCode={(service as any).completion_code}
                          />
                          <div className="mt-5 flex gap-2">
                            <ChatButton serviceRequestId={service.id} otherUserName={service.technician.name} />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); setDisputeService(service); setDisputeDialogOpen(true); }}
                              className="flex-1 text-warning border-warning/30 hover:bg-warning/10 rounded-xl"
                            >
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              Reportar Problema
                            </Button>
                          </div>
                          <div className="mt-2 flex justify-center">
                            <Button
                              variant="outline" size="sm"
                              onClick={(e) => { e.stopPropagation(); setCancellingServiceId(service.id); setCancelDialogOpen(true); }}
                              className="text-destructive border-destructive/30 hover:bg-destructive/10 rounded-xl text-xs"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Cancelar Serviço
                            </Button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </motion.div>
            ) : (
              <motion.div
                key="service-completed"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {completedServices.length === 0 ? (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
                    <div className="w-20 h-20 rounded-3xl bg-secondary mx-auto mb-4 flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Nenhum serviço concluído</h3>
                    <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">
                      Seu histórico de serviços aparecerá aqui
                    </p>
                  </motion.div>
                ) : (
                  completedServices.map((service, index) => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="bg-card border border-border/50 p-4 rounded-2xl cursor-pointer hover:border-primary/30 transition-all duration-300 active:scale-[0.98]"
                      onClick={() => { setSelectedHistoryService(service); setHistoryDialogOpen(true); }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-foreground">{service.category?.name || "Serviço"}</h3>
                        {getStatusBadge(service.status)}
                      </div>
                      <div className="flex items-center gap-3">
                        {service.technician && (
                          <>
                            <Avatar className="w-10 h-10 border-2 border-border">
                              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                {service.technician.name?.charAt(0) || "T"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{service.technician.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(service.completed_at || service.created_at).toLocaleDateString("pt-BR", {
                                  day: "2-digit", month: "short", year: "numeric"
                                })}
                              </p>
                            </div>
                          </>
                        )}
                        {service.rating && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/10">
                            <span className="text-sm font-semibold text-warning">{service.rating}</span>
                            <span>⭐</span>
                          </div>
                        )}
                      </div>
                      {service.technician && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); setDisputeService(service); setDisputeDialogOpen(true); }}
                            className="w-full text-warning hover:bg-warning/10 text-xs"
                          >
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Reportar Problema
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </motion.div>
            )
          ) : (
            /* ========== SHOP ORDERS TAB ========== */
            activeTab === "active" ? (
              <motion.div
                key="shop-active"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {activeOrders.length === 0 ? (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
                    <div className="w-20 h-20 rounded-3xl bg-secondary mx-auto mb-4 flex items-center justify-center">
                      <ShoppingBag className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Nenhuma compra ativa</h3>
                    <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">
                      Suas compras em andamento aparecerão aqui
                    </p>
                  </motion.div>
                ) : (
                  activeOrders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-card border border-border/50 p-4 rounded-2xl"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-primary" />
                          <h3 className="font-semibold text-foreground text-sm">Pedido #{order.id.slice(0, 8)}</h3>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="space-y-1.5">
                        {order.items?.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {item.quantity}x {item.product?.name || "Produto"}
                            </span>
                            <span className="text-foreground">{(item.unit_price * item.quantity).toLocaleString("pt-AO")} Kz</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-3 pt-3 border-t border-border">
                        <span className="font-medium text-foreground">Total</span>
                        <span className="font-bold text-primary">{order.total_price.toLocaleString("pt-AO")} Kz</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(order.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                      </p>
                    </motion.div>
                  ))
                )}
              </motion.div>
            ) : (
              <motion.div
                key="shop-completed"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {completedOrders.length === 0 ? (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
                    <div className="w-20 h-20 rounded-3xl bg-secondary mx-auto mb-4 flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Nenhuma compra concluída</h3>
                    <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">
                      Seu histórico de compras aparecerá aqui
                    </p>
                  </motion.div>
                ) : (
                  completedOrders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="bg-card border border-border/50 p-4 rounded-2xl"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-foreground text-sm">Pedido #{order.id.slice(0, 8)}</h3>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="space-y-1.5">
                        {order.items?.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {item.quantity}x {item.product?.name || "Produto"}
                            </span>
                            <span className="text-foreground">{(item.unit_price * item.quantity).toLocaleString("pt-AO")} Kz</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-3 pt-3 border-t border-border">
                        <span className="font-medium text-foreground">Total</span>
                        <span className="font-bold text-primary">{order.total_price.toLocaleString("pt-AO")} Kz</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(order.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                      </p>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>

      {/* Dialogs */}
      {ratingRequest && (
        <RatingDialog
          open={ratingDialogOpen}
          onOpenChange={setRatingDialogOpen}
          serviceName={ratingRequest.category?.name || "Serviço"}
          technicianName={ratingRequest.technician?.name || "Técnico"}
          basePrice={ratingRequest.base_price || 0}
          extras={ratingRequest.extras as any[] || []}
          urgency={ratingRequest.urgency}
          totalPrice={ratingRequest.total_price || 0}
          description={ratingRequest.description}
          address={ratingRequest.address}
          completedAt={ratingRequest.completed_at}
          onSubmit={handleRatingSubmit}
          isPending={rateService.isPending}
        />
      )}

      <CancelServiceDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleCancelService}
        isPending={cancelRequest.isPending}
        technicianArrived={
          cancellingServiceId
            ? requests.find(r => r.id === cancellingServiceId)?.status === "in_progress"
            : false
        }
      />

      <ServiceHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        service={selectedHistoryService}
      />

      {disputeService && (
        <DisputeDialog
          open={disputeDialogOpen}
          onOpenChange={setDisputeDialogOpen}
          serviceRequestId={disputeService.id}
          technicianId={disputeService.technician_id || ""}
          technicianName={disputeService.technician?.name}
          serviceName={disputeService.category?.name}
        />
      )}
    </div>
  );
}
