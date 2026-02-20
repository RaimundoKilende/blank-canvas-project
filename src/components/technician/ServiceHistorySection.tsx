import { useState, useMemo } from "react";
import { useServiceRequests } from "@/hooks/useServiceRequests";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { 
  History, MapPin, Calendar, Star, ChevronRight, 
  Loader2, DollarSign, CheckCircle, XCircle, Filter, X, CalendarIcon, TrendingUp
} from "lucide-react";
import { ServiceHistoryDialog } from "@/components/client/ServiceHistoryDialog";

export function ServiceHistorySection() {
  const { profile } = useAuth();
  const { requests, isLoading } = useServiceRequests();
  const [selectedService, setSelectedService] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const allHistoryRequests = useMemo(() => 
    requests
      .filter(r => r.technician_id === profile?.user_id && ["completed", "cancelled"].includes(r.status))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [requests, profile?.user_id]
  );

  const filteredRequests = useMemo(() => {
    return allHistoryRequests.filter(r => {
      // Status filter
      if (statusFilter !== "all" && r.status !== statusFilter) return false;

      // Date range filter
      const createdAt = new Date(r.created_at);
      if (dateFrom && createdAt < new Date(dateFrom.setHours(0, 0, 0, 0))) return false;
      if (dateTo && createdAt > new Date(new Date(dateTo).setHours(23, 59, 59, 999))) return false;

      // Value range filter
      const minVal = parseFloat(minValue);
      const maxVal = parseFloat(maxValue);
      if (!isNaN(minVal) && (r.total_price || 0) < minVal) return false;
      if (!isNaN(maxVal) && (r.total_price || 0) > maxVal) return false;

      return true;
    });
  }, [allHistoryRequests, statusFilter, dateFrom, dateTo, minValue, maxValue]);

  const hasActiveFilters = statusFilter !== "all" || dateFrom || dateTo || minValue || maxValue;

  const clearFilters = () => {
    setStatusFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setMinValue("");
    setMaxValue("");
  };

  // Summary stats
  const totalValue = filteredRequests
    .filter(r => r.status === "completed")
    .reduce((sum, r) => sum + (r.total_price || 0), 0);
  const completedCount = filteredRequests.filter(r => r.status === "completed").length;
  const cancelledCount = filteredRequests.filter(r => r.status === "cancelled").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Concluído
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelado
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (allHistoryRequests.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
        <h3 className="font-semibold text-lg mb-2">Nenhum histórico ainda</h3>
        <p className="text-muted-foreground">
          Seus serviços concluídos aparecerão aqui
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass-card p-3 rounded-xl text-center">
          <CheckCircle className="w-4 h-4 text-success mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{completedCount}</p>
          <p className="text-[10px] text-muted-foreground">Concluídos</p>
        </div>
        <div className="glass-card p-3 rounded-xl text-center">
          <XCircle className="w-4 h-4 text-destructive mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{cancelledCount}</p>
          <p className="text-[10px] text-muted-foreground">Cancelados</p>
        </div>
        <div className="glass-card p-3 rounded-xl text-center">
          <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{(totalValue / 1000).toFixed(0)}k</p>
          <p className="text-[10px] text-muted-foreground">Kz Total</p>
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant={showFilters ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-1.5"
        >
          <Filter className="w-3.5 h-3.5" />
          Filtros
          {hasActiveFilters && (
            <Badge className="bg-primary-foreground/20 text-primary-foreground text-[10px] ml-1 px-1.5">
              Activos
            </Badge>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground gap-1">
            <X className="w-3 h-3" /> Limpar
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="glass-card p-4 rounded-xl space-y-4 border border-border/50">
          {/* Status Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Período</label>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("h-9 text-sm justify-start font-normal", !dateFrom && "text-muted-foreground")}
                  >
                    <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                    {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "De"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("h-9 text-sm justify-start font-normal", !dateTo && "text-muted-foreground")}
                  >
                    <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                    {dateTo ? format(dateTo, "dd/MM/yyyy") : "Até"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Value Range */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Valor (Kz)</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Mín"
                  value={minValue}
                  onChange={e => setMinValue(e.target.value)}
                  className="h-9 text-sm pl-8"
                />
              </div>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Máx"
                  value={maxValue}
                  onChange={e => setMaxValue(e.target.value)}
                  className="h-9 text-sm pl-8"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        {filteredRequests.length} de {allHistoryRequests.length} serviço{allHistoryRequests.length !== 1 ? "s" : ""}
      </p>

      {/* Request List */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-8">
          <Filter className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-sm text-muted-foreground">Nenhum serviço encontrado com os filtros aplicados</p>
        </div>
      ) : (
        filteredRequests.map((request) => (
          <div
            key={request.id}
            className="glass-card p-4 rounded-xl cursor-pointer hover:bg-secondary/50 transition-colors"
            onClick={() => {
              setSelectedService(request);
              setDialogOpen(true);
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-foreground">
                    {request.category?.name || "Serviço"}
                  </h4>
                  {getStatusBadge(request.status)}
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                  {request.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(request.created_at).toLocaleDateString("pt-BR")}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {request.address?.split(",")[0]}
                  </span>
                  {request.rating && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-primary fill-primary" />
                      {request.rating}/5
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className="font-semibold text-primary flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {(request.total_price || 0).toLocaleString()} Kz
                </p>
                <ChevronRight className="w-5 h-5 text-muted-foreground mt-2" />
              </div>
            </div>
          </div>
        ))
      )}

      <ServiceHistoryDialog
        service={selectedService}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
