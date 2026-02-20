import { useState } from "react";
import { useSupportTickets, SupportTicket } from "@/hooks/useSupportTickets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, Eye, MessageSquare, CheckCircle, Clock, AlertTriangle, Shield, Camera, Gavel, Ban, Gift } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function SupportTicketsList() {
  const { tickets, isLoading, updateTicket } = useSupportTickets();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [resolution, setResolution] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [verdict, setVerdict] = useState("");
  const [verdictNotes, setVerdictNotes] = useState("");
  const [suspendTechnician, setSuspendTechnician] = useState(false);
  const [transferCredits, setTransferCredits] = useState(false);
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountReason, setDiscountReason] = useState("");

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (typeFilter !== "all" && t.ticket_type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.subject.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.reporter?.name?.toLowerCase().includes(q) ||
        t.against?.name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const openDetail = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setAdminNotes(ticket.admin_notes || "");
    setResolution(ticket.resolution || "");
    setNewStatus(ticket.status);
    setVerdict(ticket.verdict || "");
    setVerdictNotes(ticket.verdict_notes || "");
    setSuspendTechnician(false);
    setTransferCredits(false);
    setDiscountAmount("");
    setDiscountReason("");
    setDetailOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedTicket) return;
    await updateTicket.mutateAsync({
      id: selectedTicket.id,
      status: newStatus,
      admin_notes: adminNotes,
      resolution: resolution || undefined,
      verdict: verdict || undefined,
      verdict_notes: verdictNotes || undefined,
      suspend_technician: suspendTechnician,
      transfer_credits: transferCredits,
      discount_amount: discountAmount ? Number(discountAmount) : undefined,
      discount_reason: discountReason || undefined,
    });
    setDetailOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-warning/10 text-warning border-warning/20"><Clock className="w-3 h-3 mr-1" />Aberto</Badge>;
      case "awaiting_response":
        return <Badge className="bg-warning/10 text-warning border-warning/20"><Shield className="w-3 h-3 mr-1" />Aguard. Defesa</Badge>;
      case "under_review":
        return <Badge className="bg-primary/10 text-primary border-primary/20"><Gavel className="w-3 h-3 mr-1" />Em Análise</Badge>;
      case "in_progress":
        return <Badge className="bg-primary/10 text-primary border-primary/20"><MessageSquare className="w-3 h-3 mr-1" />Em Análise</Badge>;
      case "resolved":
        return <Badge className="bg-success/10 text-success border-success/20"><CheckCircle className="w-3 h-3 mr-1" />Resolvido</Badge>;
      case "closed":
        return <Badge variant="secondary">Fechado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    if (type === "dispute") {
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">⚖️ Disputa</Badge>;
    }
    return <Badge variant="outline" className="text-[10px]">📩 Suporte</Badge>;
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case "client": return "Cliente";
      case "technician": return "Técnico";
      case "vendor": return "Vendedor";
      case "delivery": return "Entregador";
      default: return role;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar ticket..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="dispute">Disputas</SelectItem>
            <SelectItem value="support">Suporte</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="open">Aberto</SelectItem>
            <SelectItem value="awaiting_response">Aguard. Defesa</SelectItem>
            <SelectItem value="under_review">Em Análise</SelectItem>
            <SelectItem value="resolved">Resolvido</SelectItem>
            <SelectItem value="closed">Fechado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredTickets.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Nenhum ticket encontrado</p>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <div key={ticket.id} className={`p-4 rounded-xl transition-colors ${ticket.ticket_type === "dispute" ? "bg-destructive/5 hover:bg-destructive/10 border border-destructive/10" : "bg-secondary/50 hover:bg-secondary/70"}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {ticket.reporter?.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-foreground text-sm truncate">{ticket.subject}</p>
                      {getTypeBadge(ticket.ticket_type)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {ticket.reporter?.name || "Usuário"} ({roleLabel(ticket.reporter_role)})
                      {ticket.against && ` → ${ticket.against.name}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {getStatusBadge(ticket.status)}
                  <Button variant="ghost" size="sm" onClick={() => openDetail(ticket)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 ml-11">{ticket.description}</p>
              {ticket.ticket_type === "dispute" && ticket.evidence_photos && ticket.evidence_photos.length > 0 && (
                <div className="flex items-center gap-1 ml-11 mt-1">
                  <Camera className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{ticket.evidence_photos.length} evidência(s)</span>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mt-2 ml-11">
                {format(new Date(ticket.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTicket?.ticket_type === "dispute" ? (
                <><Gavel className="w-5 h-5 text-warning" /> Disputa</>
              ) : (
                <><AlertTriangle className="w-5 h-5 text-warning" /> Ticket de Suporte</>
              )}
            </DialogTitle>
            <DialogDescription>{selectedTicket?.subject}</DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              {/* Reporter & Against */}
              <div className="p-3 rounded-xl bg-secondary/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Reportado por</span>
                  {getStatusBadge(selectedTicket.status)}
                </div>
                <p className="text-sm font-medium">
                  {selectedTicket.reporter?.name} ({roleLabel(selectedTicket.reporter_role)})
                </p>
                <p className="text-xs text-muted-foreground">{selectedTicket.reporter?.email}</p>
                {selectedTicket.against && (
                  <div className="pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">Contra</span>
                    <p className="text-sm font-medium">{selectedTicket.against.name}</p>
                  </div>
                )}
              </div>

              {/* Complaint */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Descrição do Problema</Label>
                <div className="p-3 rounded-xl bg-muted/50 text-sm">{selectedTicket.description}</div>
              </div>

              {/* Evidence Photos */}
              {selectedTicket.evidence_photos && selectedTicket.evidence_photos.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Camera className="w-3 h-3" /> Evidências ({selectedTicket.evidence_photos.length})
                  </Label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {selectedTicket.evidence_photos.map((photo, i) => (
                      <a key={i} href={photo} target="_blank" rel="noopener noreferrer">
                        <img src={photo} alt={`Evidência ${i + 1}`} className="flex-shrink-0 w-24 h-24 rounded-xl object-cover ring-2 ring-border hover:ring-primary transition-all" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Technician Response */}
              {selectedTicket.ticket_type === "dispute" && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Defesa do Técnico
                  </Label>
                  {selectedTicket.technician_response ? (
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-sm">
                      {selectedTicket.technician_response}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-warning/5 border border-warning/10 text-sm text-warning">
                      {selectedTicket.response_deadline && new Date(selectedTicket.response_deadline) > new Date()
                        ? `Aguardando resposta (prazo: ${formatDistanceToNow(new Date(selectedTicket.response_deadline), { locale: ptBR, addSuffix: true })})`
                        : "Prazo expirado sem resposta"}
                    </div>
                  )}
                </div>
              )}

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Aberto</SelectItem>
                    <SelectItem value="awaiting_response">Aguardando Defesa</SelectItem>
                    <SelectItem value="under_review">Em Análise</SelectItem>
                    <SelectItem value="resolved">Resolvido</SelectItem>
                    <SelectItem value="closed">Fechado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Verdict (for disputes) */}
              {selectedTicket.ticket_type === "dispute" && (
                <div className="p-4 rounded-xl bg-warning/5 border border-warning/20 space-y-3">
                  <Label className="font-semibold flex items-center gap-2">
                    <Gavel className="w-4 h-4 text-warning" />
                    Veredito
                  </Label>
                  <Select value={verdict} onValueChange={setVerdict}>
                    <SelectTrigger><SelectValue placeholder="Selecione o veredito..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technician_fault">Culpa do Técnico — Reparar gratuitamente</SelectItem>
                      <SelectItem value="client_misuse">Mau uso do Cliente — Encerrar reclamação</SelectItem>
                      <SelectItem value="partial">Parcial — Ambas as partes</SelectItem>
                    </SelectContent>
                  </Select>
                  {verdict && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Justificação do Veredito</Label>
                        <Textarea
                          value={verdictNotes}
                          onChange={(e) => setVerdictNotes(e.target.value)}
                          placeholder={
                            verdict === "technician_fault"
                              ? "O técnico deve voltar ao local e reparar o problema sem custo adicional..."
                              : verdict === "client_misuse"
                              ? "A reclamação não procede porque..."
                              : "Descreva a resolução parcial..."
                          }
                          className="min-h-[60px]"
                        />
                      </div>

                      {/* Suspension toggle */}
                      {(verdict === "technician_fault" || verdict === "partial") && (
                        <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20 space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2 text-sm">
                              <Ban className="w-4 h-4 text-destructive" />
                              Suspender Técnico
                            </Label>
                            <Switch checked={suspendTechnician} onCheckedChange={setSuspendTechnician} />
                          </div>
                          {suspendTechnician && (
                            <div className="flex items-center justify-between">
                              <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Gift className="w-3 h-3" />
                                Transferir créditos do técnico como desconto ao cliente
                              </Label>
                              <Switch checked={transferCredits} onCheckedChange={setTransferCredits} />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Admin Discount */}
                      <div className="p-3 rounded-xl bg-success/5 border border-success/20 space-y-2">
                        <Label className="flex items-center gap-2 text-sm">
                          <Gift className="w-4 h-4 text-success" />
                          Desconto ao Cliente (Kz)
                        </Label>
                        <Input
                          type="number"
                          value={discountAmount}
                          onChange={(e) => setDiscountAmount(e.target.value)}
                          placeholder="Ex: 5000"
                        />
                        {discountAmount && (
                          <Input
                            value={discountReason}
                            onChange={(e) => setDiscountReason(e.target.value)}
                            placeholder="Motivo do desconto..."
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Admin Discount (for non-dispute tickets too) */}
              {selectedTicket.ticket_type !== "dispute" && (
                <div className="p-3 rounded-xl bg-success/5 border border-success/20 space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Gift className="w-4 h-4 text-success" />
                    Desconto ao Cliente (Kz)
                  </Label>
                  <Input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    placeholder="Ex: 5000"
                  />
                  {discountAmount && (
                    <Input
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      placeholder="Motivo do desconto..."
                    />
                  )}
                </div>
              )}

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label>Notas do Admin</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Notas internas sobre este caso..."
                  className="min-h-[60px]"
                />
              </div>

              {/* Resolution */}
              <div className="space-y-2">
                <Label>Resolução</Label>
                <Textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Descreva como o caso foi resolvido..."
                  className="min-h-[60px]"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Fechar</Button>
            <Button onClick={handleUpdate} disabled={updateTicket.isPending}>
              {updateTicket.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
