import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useBarberos, useTransacciones, type Barbero } from "@/lib/storage";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Users, Pencil } from "lucide-react";
import { motion } from "framer-motion";

const ARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default function Barberos() {
  const [barberos, setBarberos] = useBarberos();
  const [transacciones, setTransacciones] = useTransacciones();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editing, setEditing] = useState<Barbero | null>(null);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const todayTransacciones = useMemo(() => {
    return transacciones.filter((t) => t.fecha.startsWith(todayStr));
  }, [transacciones, todayStr]);

  const barberStats = useMemo(() => {
    return barberos
      .map((barbero) => {
        const txs = todayTransacciones.filter((t) => t.barberoId === barbero.id);
        const totalCortes = txs.length;
        const ingresoTotal = txs.reduce((acc, t) => acc + t.precio, 0);
        const pct = Math.max(0, Math.min(100, barbero.comisionPct ?? 50));
        const paraBarbero = Math.round((ingresoTotal * pct) / 100);
        const paraLocal = ingresoTotal - paraBarbero;
        return { ...barbero, totalCortes, ingresoTotal, paraBarbero, paraLocal };
      })
      .sort((a, b) => b.ingresoTotal - a.ingresoTotal || b.totalCortes - a.totalCortes);
  }, [barberos, todayTransacciones]);

  const totalCortesHoy = barberStats.reduce((acc, curr) => acc + curr.totalCortes, 0);
  const ingresoLocal = barberStats.reduce((acc, curr) => acc + curr.paraLocal, 0);
  const ingresoBruto = barberStats.reduce((acc, curr) => acc + curr.ingresoTotal, 0);

  const handleAddCorteRapido = (barberoId: string) => {
    const nuevaTx = {
      id: crypto.randomUUID(),
      servicioNombre: "Corte (Rápido)",
      precio: 4000,
      barberoId,
      fecha: new Date().toISOString(),
    };
    setTransacciones([...transacciones, nuevaTx]);
  };

  const handleAddBarbero = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nombre = (formData.get("nombre") as string).trim();
    const comisionPct = Number(formData.get("comisionPct") || 50);
    setBarberos([
      ...barberos,
      { id: crypto.randomUUID(), nombre, comisionPct: clampPct(comisionPct) },
    ]);
    setIsAddOpen(false);
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    const formData = new FormData(e.currentTarget);
    const nombre = (formData.get("nombre") as string).trim();
    const comisionPct = clampPct(Number(formData.get("comisionPct") || 50));
    setBarberos(
      barberos.map((b) => (b.id === editing.id ? { ...b, nombre, comisionPct } : b))
    );
    setEditing(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col min-h-screen pb-24"
    >
      <div className="px-4 py-6">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-display text-primary uppercase tracking-wide">Staff</h2>
          <div className="text-right">
            <span className="text-3xl font-display text-foreground leading-none">{totalCortesHoy}</span>
            <p className="text-[10px] uppercase text-muted-foreground font-semibold">Cortes hoy</p>
          </div>
        </div>

        <Card className="bg-card border-border mb-6">
          <CardContent className="p-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">
                Ingreso Bruto
              </p>
              <p className="text-xl font-display text-foreground mt-1">{ARS.format(ingresoBruto)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">
                Ganancia del Local
              </p>
              <p className="text-xl font-display text-primary mt-1">{ARS.format(ingresoLocal)}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {barberStats.map((barbero, index) => (
            <motion.div
              key={barbero.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-card border-border overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary font-display text-lg">
                        {barbero.nombre.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg text-foreground truncate">{barbero.nombre}</h3>
                        {index === 0 && barbero.totalCortes > 0 && (
                          <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                            Líder
                          </span>
                        )}
                        <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                          {barbero.comisionPct ?? 50}% comisión
                        </span>
                      </div>
                      <p className="text-2xl font-display text-primary mt-1">
                        {barbero.totalCortes}{" "}
                        <span className="text-sm text-muted-foreground font-sans">CORTES</span>
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        onClick={() => handleAddCorteRapido(barbero.id)}
                        variant="outline"
                        className="border-primary/20 text-primary hover:bg-primary/10 hover:text-primary h-auto py-2 px-3 flex flex-col gap-0.5 active:scale-95 transition-transform"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="text-[10px] font-bold">CORTE</span>
                      </Button>
                      <Button
                        onClick={() => setEditing(barbero)}
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground h-7 px-2"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">
                        Ingreso
                      </p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">
                        {ARS.format(barbero.ingresoTotal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">
                        Para barbero
                      </p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">
                        {ARS.format(barbero.paraBarbero)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">
                        Local
                      </p>
                      <p className="text-sm font-semibold text-primary mt-0.5">
                        {ARS.format(barbero.paraLocal)}
                      </p>
                    </div>
                  </div>
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
              <Label htmlFor="add-nombre">Nombre</Label>
              <Input id="add-nombre" name="nombre" required autoFocus placeholder="Ej: Maxi" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-comision">Comisión (%)</Label>
              <Input
                id="add-comision"
                name="comisionPct"
                type="number"
                min="0"
                max="100"
                defaultValue={50}
              />
              <p className="text-[11px] text-muted-foreground">
                Porcentaje de cada cobro que se queda el barbero. El resto va al local.
              </p>
            </div>
            <Button
              type="submit"
              className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-transform"
            >
              Guardar
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-[425px] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-primary">EDITAR BARBERO</DialogTitle>
          </DialogHeader>
          {editing && (
            <form onSubmit={handleEdit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nombre">Nombre</Label>
                <Input
                  id="edit-nombre"
                  name="nombre"
                  required
                  autoFocus
                  defaultValue={editing.nombre}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-comision">Comisión (%)</Label>
                <Input
                  id="edit-comision"
                  name="comisionPct"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={editing.comisionPct ?? 50}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setBarberos(barberos.filter((b) => b.id !== editing.id));
                    setEditing(null);
                  }}
                >
                  Eliminar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-transform"
                >
                  Guardar
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsAddOpen(true)}
        className="fixed bottom-20 right-6 w-14 h-14 bg-card text-primary rounded-full shadow-lg flex items-center justify-center border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-40"
      >
        <Plus className="h-6 w-6" />
      </motion.button>
    </motion.div>
  );
}

function clampPct(n: number) {
  if (Number.isNaN(n)) return 50;
  return Math.max(0, Math.min(100, Math.round(n)));
}
