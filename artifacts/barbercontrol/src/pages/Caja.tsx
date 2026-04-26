import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useTransacciones, useServicios, useBarberos } from "@/lib/storage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RotateCcw, DollarSign, Receipt } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { es } from "date-fns/locale";

const ARS = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0
});

export default function Caja() {
  const [transacciones, setTransacciones] = useTransacciones();
  const [servicios] = useServicios();
  const [barberos] = useBarberos();
  const [isCobrarOpen, setIsCobrarOpen] = useState(false);
  
  const [selectedServicio, setSelectedServicio] = useState<string | null>(null);
  const [selectedBarbero, setSelectedBarbero] = useState<string | null>(null);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const todayTransacciones = useMemo(() => {
    return transacciones
      .filter(t => t.fecha.startsWith(todayStr))
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [transacciones, todayStr]);

  const totalRecaudado = todayTransacciones.reduce((acc, curr) => acc + curr.precio, 0);

  const handleCobrar = () => {
    if (!selectedServicio || !selectedBarbero) return;
    
    const servicio = servicios.find(s => s.id === selectedServicio);
    if (!servicio) return;

    const nuevaTx = {
      id: crypto.randomUUID(),
      servicioNombre: servicio.nombre,
      precio: servicio.precio,
      barberoId: selectedBarbero,
      fecha: new Date().toISOString()
    };

    setTransacciones([...transacciones, nuevaTx]);
    setIsCobrarOpen(false);
    setSelectedServicio(null);
    setSelectedBarbero(null);
  };

  const handleReiniciar = () => {
    if (confirm("¿Estás seguro de reiniciar la caja de hoy? Esto eliminará todas las transacciones de la fecha actual.")) {
      setTransacciones(transacciones.filter(t => !t.fecha.startsWith(todayStr)));
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-32">
      <div className="px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display text-foreground tracking-wide">CAJA</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleReiniciar}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reiniciar día
          </Button>
        </div>

        <Card className="bg-primary border-none shadow-lg shadow-primary/20 overflow-hidden relative">
          <div className="absolute -right-4 -top-4 opacity-10">
            <DollarSign className="w-32 h-32 text-primary-foreground" />
          </div>
          <CardContent className="p-6 relative z-10">
            <p className="text-primary-foreground/80 text-sm font-semibold tracking-wider uppercase mb-1">Total Recaudado Hoy</p>
            <p className="text-4xl font-display text-primary-foreground tracking-tight">
              {ARS.format(totalRecaudado)}
            </p>
          </CardContent>
        </Card>

        <div className="mt-8">
          <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase mb-4">Servicios Cobrados</h3>
          
          <div className="space-y-3">
            <AnimatePresence>
              {todayTransacciones.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Receipt className="h-8 w-8 text-muted-foreground opacity-50" />
                  </div>
                  <p className="text-muted-foreground">No hay cobros registrados hoy</p>
                </motion.div>
              ) : (
                todayTransacciones.map((tx, index) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-card border-border">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{tx.servicioNombre}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(tx.fecha), "HH:mm")} • {barberos.find(b => b.id === tx.barberoId)?.nombre || "Desconocido"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-primary text-lg">{ARS.format(tx.precio)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border z-40">
        <div className="mx-auto max-w-md">
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button 
              size="lg" 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-14 text-lg font-display tracking-wider"
              onClick={() => setIsCobrarOpen(true)}
            >
              COBRAR SERVICIO
            </Button>
          </motion.div>
        </div>
      </div>

      <Sheet open={isCobrarOpen} onOpenChange={setIsCobrarOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-[20px] bg-background border-border p-0 flex flex-col">
          <SheetHeader className="p-6 pb-2 text-left border-b border-border">
            <SheetTitle className="font-display text-primary text-xl">NUEVO COBRO</SheetTitle>
          </SheetHeader>
          
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              
              <div className="space-y-3">
                <Label className="text-muted-foreground uppercase tracking-wider text-xs font-bold">1. SELECCIONAR SERVICIO</Label>
                <div className="grid grid-cols-2 gap-2">
                  {servicios.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedServicio(s.id)}
                      className={`text-left p-3 rounded-md border transition-all ${
                        selectedServicio === s.id 
                          ? "border-primary bg-primary/10 text-primary" 
                          : "border-border bg-card text-foreground hover:border-muted-foreground"
                      }`}
                    >
                      <div className="font-semibold text-sm truncate">{s.nombre}</div>
                      <div className="font-display mt-1">{ARS.format(s.precio)}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-muted-foreground uppercase tracking-wider text-xs font-bold">2. SELECCIONAR BARBERO</Label>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 snap-x">
                  {barberos.map(b => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBarbero(b.id)}
                      className={`flex-shrink-0 snap-start w-20 flex flex-col items-center justify-center p-3 rounded-md border transition-all ${
                        selectedBarbero === b.id 
                          ? "border-primary bg-primary/10" 
                          : "border-border bg-card hover:border-muted-foreground"
                      }`}
                    >
                      <Avatar className={`h-10 w-10 mb-2 ${selectedBarbero === b.id ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}>
                        <AvatarFallback className="bg-muted text-foreground font-display">
                          {b.nombre.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className={`text-xs font-semibold truncate w-full text-center ${selectedBarbero === b.id ? "text-primary" : "text-foreground"}`}>
                        {b.nombre}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </ScrollArea>
          
          <div className="p-6 border-t border-border bg-card">
            <Button 
              size="lg" 
              className="w-full h-14 text-lg font-display" 
              disabled={!selectedServicio || !selectedBarbero}
              onClick={handleCobrar}
            >
              CONFIRMAR COBRO
            </Button>
          </div>

        </SheetContent>
      </Sheet>
    </div>
  );
}
