import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  useTransacciones,
  useServicios,
  useBarberos,
  descargarRespaldo,
  type Transaccion,
} from "@/lib/storage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Lock,
  DollarSign,
  Receipt,
  Pencil,
  Trash2,
  Download,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

type CierreStep = "summary" | "backup" | "confirm";

export default function Caja() {
  const [transacciones, setTransacciones] = useTransacciones();
  const [servicios] = useServicios();
  const [barberos] = useBarberos();

  const [isCobrarOpen, setIsCobrarOpen] = useState(false);
  const [selectedServicio, setSelectedServicio] = useState<string | null>(null);
  const [selectedBarbero, setSelectedBarbero] = useState<string | null>(null);

  const [editing, setEditing] = useState<Transaccion | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [cierreStep, setCierreStep] = useState<CierreStep | null>(null);
  const [backupDone, setBackupDone] = useState(false);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const todayTransacciones = useMemo(() => {
    return transacciones
      .filter((t) => t.fecha.startsWith(todayStr))
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [transacciones, todayStr]);

  const totalRecaudado = todayTransacciones.reduce((acc, curr) => acc + curr.precio, 0);

  const breakdownPorBarbero = useMemo(() => {
    return barberos
      .map((b) => {
        const txs = todayTransacciones.filter((t) => t.barberoId === b.id);
        const ingreso = txs.reduce((acc, t) => acc + t.precio, 0);
        const pct = Math.max(0, Math.min(100, b.comisionPct ?? 50));
        const paraBarbero = Math.round((ingreso * pct) / 100);
        const paraLocal = ingreso - paraBarbero;
        return {
          id: b.id,
          nombre: b.nombre,
          cortes: txs.length,
          ingreso,
          paraBarbero,
          paraLocal,
          pct,
        };
      })
      .filter((b) => b.cortes > 0)
      .sort((a, b) => b.ingreso - a.ingreso);
  }, [barberos, todayTransacciones]);

  const totalParaLocal = breakdownPorBarbero.reduce((acc, b) => acc + b.paraLocal, 0);
  const totalParaBarberos = breakdownPorBarbero.reduce((acc, b) => acc + b.paraBarbero, 0);

  const handleCobrar = () => {
    if (!selectedServicio || !selectedBarbero) return;
    const servicio = servicios.find((s) => s.id === selectedServicio);
    if (!servicio) return;
    const nuevaTx: Transaccion = {
      id: crypto.randomUUID(),
      servicioNombre: servicio.nombre,
      precio: servicio.precio,
      barberoId: selectedBarbero,
      fecha: new Date().toISOString(),
    };
    setTransacciones([...transacciones, nuevaTx]);
    setIsCobrarOpen(false);
    setSelectedServicio(null);
    setSelectedBarbero(null);
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    const formData = new FormData(e.currentTarget);
    const servicioNombre = (formData.get("servicioNombre") as string).trim();
    const precio = Math.max(0, Number(formData.get("precio") || 0));
    const barberoId = formData.get("barberoId") as string;
    setTransacciones(
      transacciones.map((t) =>
        t.id === editing.id ? { ...t, servicioNombre, precio, barberoId } : t
      )
    );
    setEditing(null);
  };

  const confirmDelete = () => {
    if (!pendingDeleteId) return;
    setTransacciones(transacciones.filter((t) => t.id !== pendingDeleteId));
    setPendingDeleteId(null);
  };

  const startCierre = () => {
    setBackupDone(false);
    setCierreStep("summary");
  };

  const handleDownloadBackup = () => {
    descargarRespaldo();
    setBackupDone(true);
  };

  const finalizarCierre = () => {
    setTransacciones(transacciones.filter((t) => !t.fecha.startsWith(todayStr)));
    setCierreStep(null);
    setBackupDone(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col min-h-screen pb-32"
    >
      <div className="px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display text-foreground tracking-wide">CAJA</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={startCierre}
            disabled={todayTransacciones.length === 0}
            className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 disabled:opacity-40"
          >
            <Lock className="h-4 w-4 mr-2" />
            Cerrar caja
          </Button>
        </div>

        <Card className="bg-primary border-none shadow-lg shadow-primary/20 overflow-hidden relative">
          <div className="absolute -right-4 -top-4 opacity-10">
            <DollarSign className="w-32 h-32 text-primary-foreground" />
          </div>
          <CardContent className="p-6 relative z-10">
            <p className="text-primary-foreground/80 text-sm font-semibold tracking-wider uppercase mb-1">
              Total Recaudado Hoy
            </p>
            <p className="text-4xl font-display text-primary-foreground tracking-tight">
              {ARS.format(totalRecaudado)}
            </p>
            {breakdownPorBarbero.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-primary-foreground/20">
                <div>
                  <p className="text-[10px] uppercase text-primary-foreground/70 font-semibold tracking-wider">
                    Ganancia local
                  </p>
                  <p className="text-lg font-display text-primary-foreground mt-0.5">
                    {ARS.format(totalParaLocal)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-primary-foreground/70 font-semibold tracking-wider">
                    Para barberos
                  </p>
                  <p className="text-lg font-display text-primary-foreground mt-0.5">
                    {ARS.format(totalParaBarberos)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8">
          <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase mb-4">
            Movimientos del día
          </h3>

          <div className="space-y-3">
            <AnimatePresence>
              {todayTransacciones.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-12 text-center"
                >
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Receipt className="h-8 w-8 text-muted-foreground opacity-50" />
                  </div>
                  <p className="text-muted-foreground">No hay cobros registrados hoy</p>
                </motion.div>
              ) : (
                todayTransacciones.map((tx, index) => (
                  <motion.div
                    key={tx.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <Card className="bg-card border-border">
                      <CardContent className="p-3 pl-4 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground truncate">{tx.servicioNombre}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {format(new Date(tx.fecha), "HH:mm")} •{" "}
                            {barberos.find((b) => b.id === tx.barberoId)?.nombre || "Desconocido"}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-display text-primary text-lg leading-none">
                            {ARS.format(tx.precio)}
                          </p>
                        </div>
                        <div className="flex flex-col gap-0.5 shrink-0 ml-1">
                          <button
                            onClick={() => setEditing(tx)}
                            className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            aria-label="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setPendingDeleteId(tx.id)}
                            className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            aria-label="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
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

      {/* Cobrar bottom button */}
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

      {/* Cobrar Sheet */}
      <Sheet open={isCobrarOpen} onOpenChange={setIsCobrarOpen}>
        <SheetContent
          side="bottom"
          className="h-[85vh] rounded-t-[20px] bg-background border-border p-0 flex flex-col"
        >
          <SheetHeader className="p-6 pb-2 text-left border-b border-border">
            <SheetTitle className="font-display text-primary text-xl">NUEVO COBRO</SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                  1. SELECCIONAR SERVICIO
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {servicios.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedServicio(s.id)}
                      className={`text-left p-3 rounded-md border transition-all active:scale-[0.98] ${
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
                <Label className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                  2. SELECCIONAR BARBERO
                </Label>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 snap-x">
                  {barberos.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBarbero(b.id)}
                      className={`flex-shrink-0 snap-start w-20 flex flex-col items-center justify-center p-3 rounded-md border transition-all ${
                        selectedBarbero === b.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-muted-foreground"
                      }`}
                    >
                      <Avatar
                        className={`h-10 w-10 mb-2 ${
                          selectedBarbero === b.id
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                            : ""
                        }`}
                      >
                        <AvatarFallback className="bg-muted text-foreground font-display">
                          {b.nombre.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`text-xs font-semibold truncate w-full text-center ${
                          selectedBarbero === b.id ? "text-primary" : "text-foreground"
                        }`}
                      >
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
              className="w-full h-14 text-lg font-display active:scale-[0.98] transition-transform"
              disabled={!selectedServicio || !selectedBarbero}
              onClick={handleCobrar}
            >
              CONFIRMAR COBRO
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit transaction dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-[425px] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-primary">EDITAR MOVIMIENTO</DialogTitle>
          </DialogHeader>
          {editing && (
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="tx-servicio">Servicio</Label>
                <Input
                  id="tx-servicio"
                  name="servicioNombre"
                  required
                  defaultValue={editing.servicioNombre}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="tx-precio">Precio</Label>
                  <Input
                    id="tx-precio"
                    name="precio"
                    type="number"
                    min="0"
                    required
                    defaultValue={editing.precio}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tx-barbero">Barbero</Label>
                  <Select name="barberoId" defaultValue={editing.barberoId}>
                    <SelectTrigger id="tx-barbero">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {barberos.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-transform"
              >
                Guardar cambios
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete transaction alert */}
      <AlertDialog
        open={!!pendingDeleteId}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
      >
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-primary">
              ELIMINAR MOVIMIENTO
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar este cobro y el total de la caja se va a recalcular automáticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cierre de caja flow */}
      <Dialog
        open={!!cierreStep}
        onOpenChange={(open) => {
          if (!open) {
            setCierreStep(null);
            setBackupDone(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[460px] bg-background border-border">
          {cierreStep === "summary" && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-primary">CIERRE DE CAJA</DialogTitle>
                <DialogDescription>
                  Resumen del día {format(new Date(), "dd/MM/yyyy")}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted/40 rounded-md p-3">
                    <p className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">
                      Movimientos
                    </p>
                    <p className="text-xl font-display text-foreground mt-1">
                      {todayTransacciones.length}
                    </p>
                  </div>
                  <div className="bg-muted/40 rounded-md p-3">
                    <p className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">
                      Bruto
                    </p>
                    <p className="text-xl font-display text-foreground mt-1">
                      {ARS.format(totalRecaudado)}
                    </p>
                  </div>
                  <div className="bg-primary/10 rounded-md p-3">
                    <p className="text-[9px] uppercase text-primary font-semibold tracking-wider">
                      Local
                    </p>
                    <p className="text-xl font-display text-primary mt-1">
                      {ARS.format(totalParaLocal)}
                    </p>
                  </div>
                </div>

                {breakdownPorBarbero.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">
                      Por barbero
                    </p>
                    <div className="space-y-1.5">
                      {breakdownPorBarbero.map((b) => (
                        <div
                          key={b.id}
                          className="flex justify-between items-center bg-card border border-border rounded-md px-3 py-2 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">
                              {b.nombre}{" "}
                              <span className="text-[10px] text-muted-foreground font-normal">
                                · {b.cortes} cortes · {b.pct}%
                              </span>
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-semibold text-foreground">
                              {ARS.format(b.ingreso)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Local {ARS.format(b.paraLocal)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="mt-4 gap-2 sm:gap-2">
                <Button variant="outline" onClick={() => setCierreStep(null)}>
                  Cancelar
                </Button>
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => setCierreStep("backup")}
                >
                  Continuar
                </Button>
              </DialogFooter>
            </>
          )}

          {cierreStep === "backup" && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-primary">RESPALDO OBLIGATORIO</DialogTitle>
                <DialogDescription>
                  Antes de borrar los cobros del día tenés que descargar la copia de seguridad.
                  Guardala en un lugar seguro.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <Button
                  onClick={handleDownloadBackup}
                  className="w-full bg-card hover:bg-card/80 border border-border text-foreground h-12"
                  variant="default"
                >
                  <Download className="h-4 w-4 mr-2 text-primary" />
                  Descargar respaldo (JSON)
                </Button>
                {backupDone && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-sm text-primary bg-primary/10 border border-primary/20 rounded-md p-3"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Respaldo descargado. Ya podés continuar.
                  </motion.div>
                )}
              </div>
              <DialogFooter className="mt-4 gap-2 sm:gap-2">
                <Button variant="outline" onClick={() => setCierreStep("summary")}>
                  Volver
                </Button>
                <Button
                  disabled={!backupDone}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  onClick={() => setCierreStep("confirm")}
                >
                  Continuar
                </Button>
              </DialogFooter>
            </>
          )}

          {cierreStep === "confirm" && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-destructive">
                  CONFIRMAR CIERRE
                </DialogTitle>
                <DialogDescription>
                  Se eliminarán los <strong>{todayTransacciones.length}</strong> movimientos de hoy
                  por un total de <strong>{ARS.format(totalRecaudado)}</strong>. Esta acción no se
                  puede deshacer.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4 gap-2 sm:gap-2">
                <Button variant="outline" onClick={() => setCierreStep("backup")}>
                  Volver
                </Button>
                <Button
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={finalizarCierre}
                >
                  Cerrar caja
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
