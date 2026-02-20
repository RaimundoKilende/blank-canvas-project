import { ReactNode } from "react";

interface MobileLayoutProps {
  children: ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop: Centered container styled like mobile phone */}
      <div className="hidden lg:flex items-center justify-center min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/50 p-4">
        <div className="relative w-[420px] h-[90vh] max-h-[900px] bg-background rounded-[2.5rem] shadow-2xl overflow-hidden border-[6px] border-secondary/80">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-secondary rounded-b-2xl z-50 flex items-center justify-center">
            <div className="w-12 h-1 bg-muted-foreground/20 rounded-full" />
          </div>
          
          {/* Content area with mobile scrolling */}
          <div className="h-full overflow-y-auto overflow-x-hidden scrollbar-hide pt-2">
            {children}
          </div>
          
          {/* Bottom home indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-muted-foreground/20 rounded-full" />
        </div>
      </div>

      {/* Mobile: Full screen */}
      <div className="lg:hidden min-h-screen overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
