import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";

import { focusConversation, onNewMessage, startSync } from "@/lib/conversations-store";
import { networkLabels, priorityLabels } from "@/lib/demo-data";

export function NewMessageWatcher() {
  const navigate = useNavigate();

  useEffect(() => {
    const stopSync = startSync();
    const off = onNewMessage((c) => {
      const ultimo = c.messages[c.messages.length - 1]?.text ?? "";
      const titulo = `Nuevo mensaje de ${c.person}`;
      const detalle = `${networkLabels[c.network]} · prioridad ${priorityLabels[c.priority].toLowerCase()} — ${ultimo}`;

      toast(titulo, {
        description: detalle,
        duration: 12000,
        action: {
          label: "Responder",
          onClick: () => {
            focusConversation(c.id);
            void navigate({ to: "/canal/$network", params: { network: c.network } });
          },
        },
      });

      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          const aviso = new Notification(titulo, { body: detalle, tag: c.id });
          aviso.onclick = () => {
            window.focus();
            focusConversation(c.id);
            void navigate({ to: "/canal/$network", params: { network: c.network } });
          };
        } catch {
          /* el navegador bloqueó el aviso */
        }
      }
    });
    return () => {
      off();
      stopSync();
    };
  }, [navigate]);

  return null;
}
