import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSettings, descargarRespaldo, restaurarRespaldo, useServicios, useBarberos, initStorage } from "@/lib/storage";
import { Plus, Trash2, Copy, Download, Upload } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function SettingsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [settings, setSettings] = useSettings();
  const [servicios, setServicios] = useServicios();
  const [barberos, setBarberos] = useBarberos();
  const { toast } = useToast();

  const handleCopyMessage = () => {
    const msg = `Hola ${settings.nombreBarberia} 💈, quiero agendar un turno para hoy a las ______. Mi nombre es ______ y busco un servicio de ______ ¿Tienen lugar? ✂️⚡`;
    navigator.clipboard.writeText(msg);
    toast({ title: "Mensaje copiado", description: "Pegalo en WhatsApp u otra app." });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (restaurarRespaldo(content)) {
        toast({ title: "Respaldo restaurado", description: "La app se recargará." });
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast({ title: "Error", description: "Archivo inválido.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col border-border bg-background">
        <SheetHeader className="p-6 pb-2 text-left">
          <SheetTitle className="text-xl font-display text-primary">CONFIGURACIÓN</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="space-y-8 mt-4">
            {/* Mi Barbería */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">Mi Barbería</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Nombre del local</Label>
                  <Input 
                    value={settings.nombreBarberia} 
                    onChange={(e) => setSettings(s => ({ ...s, nombreBarberia: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp (Código país + número)</Label>
                  <Input 
                    placeholder="Ej: 5491122334455"
                    value={settings.whatsappNumero} 
                    onChange={(e) => setSettings(s => ({ ...s, whatsappNumero: e.target.value }))}
                  />
                </div>
              </div>
            </section>

            <Separator />

            {/* Servicios y Precios */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">Servicios y Precios</h3>
              <div className="space-y-3">
                {servicios.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <Input 
                      className="flex-1" 
                      value={s.nombre}
                      onChange={(e) => {
                        const newServicios = [...servicios];
                        newServicios[i].nombre = e.target.value;
                        setServicios(newServicios);
                      }}
                    />
                    <div className="relative w-24">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input 
                        className="pl-6"
                        type="number"
                        value={s.precio}
                        onChange={(e) => {
                          const newServicios = [...servicios];
                          newServicios[i].precio = Number(e.target.value);
                          setServicios(newServicios);
                        }}
                      />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setServicios(servicios.filter(x => x.id !== s.id))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-primary border-primary/20 hover:bg-primary/10 hover:text-primary"
                  onClick={() => setServicios([...servicios, { id: crypto.randomUUID(), nombre: "Nuevo Servicio", precio: 0 }])}
                >
                  <Plus className="h-4 w-4 mr-2" /> Agregar Servicio
                </Button>
              </div>
            </section>

            <Separator />

            {/* Barberos */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">Barberos</h3>
              <div className="space-y-3">
                {barberos.map((b, i) => (
                  <div key={b.id} className="flex items-center gap-2">
                    <Input 
                      className="flex-1" 
                      value={b.nombre}
                      onChange={(e) => {
                        const newBarberos = [...barberos];
                        newBarberos[i].nombre = e.target.value;
                        setBarberos(newBarberos);
                      }}
                    />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setBarberos(barberos.filter(x => x.id !== b.id))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-primary border-primary/20 hover:bg-primary/10 hover:text-primary"
                  onClick={() => setBarberos([...barberos, { id: crypto.randomUUID(), nombre: "Nuevo Barbero" }])}
                >
                  <Plus className="h-4 w-4 mr-2" /> Agregar Barbero
                </Button>
              </div>
            </section>

            <Separator />

            {/* Mensaje */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">Mensaje Clientes Nuevos</h3>
              <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground">
                Hola {settings.nombreBarberia} 💈, quiero agendar un turno para hoy a las ______. Mi nombre es ______ y busco un servicio de ______ ¿Tienen lugar? ✂️⚡
              </div>
              <Button onClick={handleCopyMessage} variant="secondary" className="w-full">
                <Copy className="h-4 w-4 mr-2" /> Copiar Mensaje
              </Button>
            </section>

            <Separator />

            {/* Data */}
            <section className="space-y-3 pb-8">
              <Button onClick={() => descargarRespaldo()} variant="default" className="w-full bg-card hover:bg-card/80 border border-border text-foreground">
                <Download className="h-4 w-4 mr-2 text-primary" /> 📥 Descargar Copia de Seguridad (JSON)
              </Button>
              
              <div className="relative">
                <Input 
                  type="file" 
                  accept=".json" 
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                />
                <Button variant="outline" className="w-full border-border">
                  <Upload className="h-4 w-4 mr-2" /> 📤 Restaurar Copia de Seguridad
                </Button>
              </div>

              <div className="text-center pt-8">
                <p className="text-xs text-muted-foreground font-mono">BarberControl MVP v1.0</p>
                <Button variant="link" size="sm" className="text-xs text-muted-foreground" onClick={() => {
                  if (confirm("Resetear app a valores por defecto? Se perderan los datos.")) {
                    localStorage.clear();
                    initStorage();
                    window.location.reload();
                  }
                }}>Resetear a fábrica</Button>
              </div>
            </section>

          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
