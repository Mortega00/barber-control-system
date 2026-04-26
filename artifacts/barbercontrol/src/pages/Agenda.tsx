import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useTurnos, useSettings, useServicios, useBarberos, type Turno } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FaWhatsapp } from "react-icons/fa";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Agenda() {
  const [turnos, setTurnos] = useTurnos();
  const [settings] = useSettings();
  const [servicios] = useServicios();
  const [barberos] = useBarberos();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayTurnos = useMemo(() => {
    return turnos
      .filter(t => t.fecha === todayStr)
      .sort((a, b) => a.hora.localeCompare(b.hora));
  }, [turnos, todayStr]);

  const completados = todayTurnos.filter(t => t.estado === "EN CURSO").length; // Assume en curso or you could add "COMPLETADO" state
  const pendientes = todayTurnos.length - completados;

  const cycleStatus = (id: string, current: Turno["estado"]) => {
    const next: Record<Turno["estado"], Turno["estado"]> = {
      "ESPERANDO": "CONFIRMADO",
      "CONFIRMADO": "EN CURSO",
      "EN CURSO": "ESPERANDO"
    };
    setTurnos(turnos.map(t => t.id === id ? { ...t, estado: next[current] } : t));
  };

  const getStatusColor = (estado: Turno["estado"]) => {
    switch (estado) {
      case "EN CURSO": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "CONFIRMADO": return "bg-primary/20 text-primary border-primary/30";
      case "ESPERANDO": return "bg-muted text-muted-foreground border-border";
    }
  };

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newTurno: Turno = {
      id: crypto.randomUUID(),
      fecha: todayStr,
      nombre: formData.get("nombre") as string,
      hora: formData.get("hora") as string,
      servicio: formData.get("servicio") as string,
      barberoId: formData.get("barberoId") as string,
      estado: "ESPERANDO"
    };
    setTurnos([...turnos, newTurno]);
    setIsAddOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <div className="px-4 py-6">
        <h2 className="text-2xl font-display text-foreground capitalize tracking-wide">
          {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
        </h2>

        <div className="grid grid-cols-3 gap-3 mt-6">
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <span className="text-2xl font-display text-primary">{todayTurnos.length}</span>
              <span className="text-[10px] uppercase text-muted-foreground font-semibold mt-1">Total</span>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <span className="text-2xl font-display text-foreground">{completados}</span>
              <span className="text-[10px] uppercase text-muted-foreground font-semibold mt-1">Completos</span>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <span className="text-2xl font-display text-foreground">{pendientes}</span>
              <span className="text-[10px] uppercase text-muted-foreground font-semibold mt-1">Pendientes</span>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase mb-4">Próximos Turnos</h3>
          
          <div className="space-y-3">
            <AnimatePresence>
              {todayTurnos.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarDays className="h-8 w-8 text-muted-foreground opacity-50" />
                  </div>
                  <p className="text-muted-foreground">No hay turnos para hoy</p>
                  <Button variant="link" className="text-primary mt-2" onClick={() => setIsAddOpen(true)}>Agregá tu primer turno</Button>
                </motion.div>
              ) : (
                todayTurnos.map((turno) => (
                  <motion.div
                    key={turno.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card className="bg-card border-border overflow-hidden">
                      <div className="flex items-stretch">
                        <div className="w-20 bg-muted/30 flex flex-col items-center justify-center p-3 border-r border-border">
                          <span className="text-xl font-display text-primary">{turno.hora}</span>
                        </div>
                        <div className="flex-1 p-3 px-4 flex flex-col justify-center">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-foreground text-lg">{turno.nombre}</h4>
                              <p className="text-xs text-muted-foreground">{turno.servicio} • {barberos.find(b => b.id === turno.barberoId)?.nombre || 'Sin asignar'}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <button 
                                onClick={() => cycleStatus(turno.id, turno.estado)}
                                className={`text-[10px] px-2 py-1 rounded border font-semibold tracking-wide transition-colors ${getStatusColor(turno.estado)}`}
                              >
                                {turno.estado}
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col border-l border-border w-12">
                          <a 
                            href={`https://wa.me/${settings.whatsappNumero}?text=${encodeURIComponent("Hola " + turno.nombre + " 💈, te confirmo tu turno para hoy a las " + turno.hora + ". ¡Te esperamos! ✂️⚡")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center text-green-500 hover:bg-green-500/10 transition-colors border-b border-border"
                          >
                            <FaWhatsapp className="h-5 w-5" />
                          </a>
                          <button 
                            onClick={() => { if(confirm('¿Eliminar turno?')) setTurnos(turnos.filter(t => t.id !== turno.id)) }}
                            className="flex-1 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-primary">NUEVO TURNO</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del cliente</Label>
              <Input id="nombre" name="nombre" required autoFocus placeholder="Ej: Juan Perez" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hora">Hora</Label>
                <Input id="hora" name="hora" type="time" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barberoId">Barbero</Label>
                <Select name="barberoId" required defaultValue={barberos[0]?.id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {barberos.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="servicio">Servicio</Label>
              <Select name="servicio" required defaultValue={servicios[0]?.nombre}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {servicios.map(s => (
                    <SelectItem key={s.id} value={s.nombre}>{s.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
              Guardar Turno
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsAddOpen(true)}
        className="fixed bottom-20 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-40 border-4 border-background"
      >
        <Plus className="h-6 w-6" />
      </motion.button>
    </div>
  );
}

