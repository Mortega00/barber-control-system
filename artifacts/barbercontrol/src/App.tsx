import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { TopHeader } from "@/components/layout/TopHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import Agenda from "@/pages/Agenda";
import Barberos from "@/pages/Barberos";
import Caja from "@/pages/Caja";
import NotFound from "@/pages/not-found";
import { initStorage } from "@/lib/storage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Agenda} />
      <Route path="/barberos" component={Barberos} />
      <Route path="/caja" component={Caja} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    initStorage();
  }, []);

  return (
    <TooltipProvider>
      <div className="min-h-[100dvh] bg-background text-foreground flex justify-center">
        {/* Main Mobile Container */}
        <div className="w-full max-w-md bg-background min-h-[100dvh] relative shadow-2xl shadow-black">
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <TopHeader />
            <main>
              <Router />
            </main>
            <BottomNav />
          </WouterRouter>
        </div>
      </div>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
