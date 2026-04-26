import { useState } from "react";
import { SettingsSheet } from "@/components/settings/SettingsSheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSettings } from "@/lib/storage";

export function TopHeader() {
  const [settings] = useSettings();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="mx-auto max-w-md h-16 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-display text-primary tracking-wider">
              {settings.nombreBarberia.toUpperCase()}
            </h1>
          </div>
          <button 
            onClick={() => setOpen(true)}
            className="rounded-full ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Avatar className="h-9 w-9 border border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-display">M</AvatarFallback>
            </Avatar>
          </button>
        </div>
      </header>

      <SettingsSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
