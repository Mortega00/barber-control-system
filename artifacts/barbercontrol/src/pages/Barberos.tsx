import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useBarberos, useTransacciones, type Barbero } from "@/lib/storage";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function Barberos() {
  const [barberos, setBarberos] = useBarberos();
  const [transacciones, setTransacciones] = useTransacciones();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const todayTransacciones = useMemo(() => {
    return transacciones.filter(t => t.fecha.startsWith(todayStr));
  }, [transacciones, todayStr]);

  const barberStats = useMemo(() => {
    return barberos.map(barbero => {
      const txs = todayTransacciones.filter(t => t.barberoId === barbero.id);
      const totalCortes = txs.length;
      return { ...barbero, totalCortes };
    }).sort((a, b) => b.totalCortes - a.totalCortes);
  }, [barberos, todayTransacciones]);

  const totalCortesHoy = barberStats.reduce((acc, curr) => acc + curr.totalCortes, 0);

  const handleAddCorteRapido = (barberoId: string) => {
    const nuevaTx = {
      id: crypto.randomUUID(),
      servicioNombre: "Corte (Rápido)",
      precio: 4000,
      barberoId,
      fecha: new Date().toISOString()
    };
    setTransacciones([...transacciones, nuevaTx]);
  };

  const handleAddBarbero = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nombre = formData.get("nombre") as string;
    setBarberos([...barberos, { id: crypto.randomUUID(), nombre }]);
    setIsAddOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <div className="px-4 py-6">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-display text-primary uppercase tracking-wide">
            Staff
          </h2>
          <div className="text-right">
            <span className="text-3xl font-display text-foreground leading-none">{totalCortesHoy}</span>
            <p className="text-[10px] uppercase text-muted-foreground font-semibold">Cortes hoy</p>
          </div>
        </div>

        <div className="space-y-4">
          {barberStats.map((barbero, index) => (
            <motion.div
              key={barbero.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-card border-border overflow-hidden">
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar className="h-12 w-12 border border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary font-display text-lg">
                      {barbero.nombre.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-semibold text-lg text-foreground">{barbero.nombre}</h3>
                      {index === 0 && barbero.totalCortes > 0 && (
                        <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded font-bold uppercase tracking-wider">Líder</span>
                      )}
                    </div>
                    <p className="text-2xl font-display text-primary mt-1">
                      {barbero.totalCortes} <span className="text-sm text-muted-foreground font-sans">CORTES</span>
                    </p>
                  </div>

                  <Button 
                    onClick={() => handleAddCorteRapido(barbero.id)}
                    variant="outline" 
                    className="border-primary/20 text-primary hover:bg-primary/10 hover:text-primary h-auto py-2 px-3 flex flex-col gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-[10px] font-bold">CORTE</span>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {barberos.length === 0 && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
              <p className="text-muted-foreground">No hay barberos registrados</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-primary">NUEVO BARBERO</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddBarbero} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" name="nombre" required autoFocus placeholder="Ej: Maxi" />
            </div>
            <Button type="submit" className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
              Guardar
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsAddOpen(true)}
        className="fixed bottom-20 right-6 w-14 h-14 bg-card text-primary rounded-full shadow-lg flex items-center justify-center border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-40"
      >
        <Plus className="h-6 w-6" />
      </motion.button>
    </div>
  );
}
