import { Link, useLocation } from "wouter";
import { CalendarDays, Users, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border">
      <div className="mx-auto max-w-md h-16 flex items-center justify-around px-4">
        <Link href="/" className="flex-1 flex justify-center">
          <div
            className={cn(
              "flex flex-col items-center justify-center space-y-1 w-full h-full transition-colors",
              location === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarDays className="h-5 w-5" />
            <span className="text-[10px] font-medium tracking-wide">AGENDA</span>
          </div>
        </Link>
        <Link href="/barberos" className="flex-1 flex justify-center">
          <div
            className={cn(
              "flex flex-col items-center justify-center space-y-1 w-full h-full transition-colors",
              location === "/barberos" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Users className="h-5 w-5" />
            <span className="text-[10px] font-medium tracking-wide">BARBEROS</span>
          </div>
        </Link>
        <Link href="/caja" className="flex-1 flex justify-center">
          <div
            className={cn(
              "flex flex-col items-center justify-center space-y-1 w-full h-full transition-colors",
              location === "/caja" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <DollarSign className="h-5 w-5" />
            <span className="text-[10px] font-medium tracking-wide">CAJA</span>
          </div>
        </Link>
      </div>
    </nav>
  );
}
