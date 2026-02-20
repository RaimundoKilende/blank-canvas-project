import { useState } from "react";
import { AlertTriangle, MapPin, Clock, UserCog, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ServiceRequest {
  id: string;
  description: string;
  address: string;
  created_at: string;
  category?: {
    id: string;
    name: string;
    icon: string;
    base_price: number;
  };
  client?: {
    name: string;
    email: string;
    phone: string | null;
  };
}

interface UnrespondedRequestsListProps {
  requests: ServiceRequest[];
  onViewDetails: (request: ServiceRequest) => void;
  onSuggestTechnician: (request: ServiceRequest) => void;
}

export function UnrespondedRequestsList({
  requests,
  onViewDetails,
  onSuggestTechnician,
}: UnrespondedRequestsListProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (requests.length === 0) return null;

  return (
    <div className="mb-6 rounded-2xl bg-destructive/10 border border-destructive/30 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-destructive/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-destructive">
              {requests.length} solicitaç{requests.length === 1 ? 'ão' : 'ões'} sem resposta há mais de 30 minutos
            </p>
            <p className="text-sm text-destructive/80">
              Clique para {isExpanded ? 'ocultar' : 'ver'} e sugerir técnicos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="font-mono">
            {requests.length}
          </Badge>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-destructive" />
          ) : (
            <ChevronDown className="w-5 h-5 text-destructive" />
          )}
        </div>
      </button>

      {/* Expandable list */}
      {isExpanded && (
        <div className="border-t border-destructive/20 divide-y divide-destructive/10 max-h-[400px] overflow-y-auto">
          {requests.map((request) => (
            <div
              key={request.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-destructive/5 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-xs">
                    {request.category?.name || "Serviço"}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(request.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
                <p className="font-medium text-foreground text-sm mb-1 truncate">
                  {request.client?.name || "Cliente"} - {request.description}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  {request.address}
                </p>
              </div>
              
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-muted-foreground/30"
                  onClick={() => onViewDetails(request)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Ver
                </Button>
                <Button
                  size="sm"
                  className="gradient-primary text-primary-foreground"
                  onClick={() => onSuggestTechnician(request)}
                >
                  <UserCog className="w-4 h-4 mr-1" />
                  Sugerir Técnico
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
