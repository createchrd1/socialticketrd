import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type Estado = "sin-soporte" | "pendiente" | "activo" | "bloqueado";

export function NotificationsButton() {
  const [estado, setEstado] = useState<Estado>("pendiente");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setEstado("sin-soporte");
      return;
    }
    setEstado(
      Notification.permission === "granted"
        ? "activo"
        : Notification.permission === "denied"
          ? "bloqueado"
          : "pendiente",
    );
  }, []);

  if (estado === "sin-soporte") return null;

  const activar = async () => {
    if (window.top !== window.self) {
      toast("Abre la app en su propia pestaña", {
        description:
          "Los avisos del sistema no se pueden activar desde la vista previa incrustada. Abre la aplicación en una pestaña nueva y vuelve a intentarlo.",
      });
      return;
    }
    const permiso = await Notification.requestPermission();
    if (permiso === "granted") {
      setEstado("activo");
      new Notification("Avisos activados", {
        body: "Te avisaremos aquí cuando llegue un mensaje nuevo.",
      });
    } else {
      setEstado(permiso === "denied" ? "bloqueado" : "pendiente");
      toast("No se activaron los avisos", {
        description: "Puedes permitirlos desde la configuración del navegador para este sitio.",
      });
    }
  };

  if (estado === "activo") {
    return (
      <span className="hidden items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-2.5 py-1 text-xs text-success sm:flex">
        <Bell className="h-3.5 w-3.5" />
        Avisos activos
      </span>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={() => void activar()}>
      {estado === "bloqueado" ? (
        <BellOff className="mr-1.5 h-3.5 w-3.5" />
      ) : (
        <Bell className="mr-1.5 h-3.5 w-3.5" />
      )}
      {estado === "bloqueado" ? "Avisos bloqueados" : "Activar avisos"}
    </Button>
  );
}
