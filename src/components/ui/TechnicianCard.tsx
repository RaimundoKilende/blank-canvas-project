import { Star, MapPin, Clock, CheckCircle, Eye, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Badge } from "./badge";

interface TechnicianCardProps {
  name: string;
  avatar?: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  completedJobs?: number;
  distance: string;
  available: boolean;
  verified: boolean;
  onRequestService?: () => void;
  onViewProfile?: () => void;
  className?: string;
}

export function TechnicianCard({
  name,
  avatar,
  specialty,
  rating,
  reviewCount,
  completedJobs = 0,
  distance,
  available,
  verified,
  onRequestService,
  onViewProfile,
  className,
}: TechnicianCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl p-5",
        "glass-card hover-lift",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="relative">
          <Avatar className="w-12 h-12 border-2 border-border">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="bg-secondary text-lg font-semibold">
              {name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          {available && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full border-2 border-card flex items-center justify-center">
              <div className="w-2 h-2 bg-success-foreground rounded-full" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display font-semibold text-foreground truncate">
              {name}
            </h3>
            {verified && (
              <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
            )}
          </div>

          <Badge variant="secondary" className="mb-2 text-xs">
            {specialty}
          </Badge>

          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-primary fill-primary" />
              <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
              <span>({reviewCount})</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              <span>{completedJobs} serviços</span>
            </div>
            
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{distance}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {available ? (
          <>
            <div className="flex items-center gap-1 text-sm text-success">
              <Clock className="w-4 h-4" />
              <span>Disponível agora</span>
            </div>
            <div className="ml-auto flex gap-2">
              {onViewProfile && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewProfile();
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              )}
              <Button 
                size="sm" 
                className="gradient-primary text-primary-foreground hover:opacity-90"
                onClick={onRequestService}
              >
                Solicitar
              </Button>
            </div>
          </>
        ) : (
          <>
            <span className="text-sm text-muted-foreground">Indisponível no momento</span>
            {onViewProfile && (
              <Button 
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewProfile();
                }}
              >
                <Eye className="w-4 h-4 mr-1" />
                Ver Perfil
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
