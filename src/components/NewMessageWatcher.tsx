import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";

import {
  focusConversation,
  loadStoredConversations,
  onNewMessage,
  startDemoFeed,
} from "@/lib/conversations-store";
import { networkLabels, priorityLabels } from "@/lib/demo-data";

export function NewMessageWatcher() {
  const navigate = useNavigate();

  useEffect(() => {
    loadStoredConversations();
    const stopFeed = startDemoFeed();
    const off = onNewMessage((c) => {
      toast(`Nuevo mensaje de ${c.person}`, {
        description: `${networkLabels[c.network]} · prioridad ${priorityLabels[c.priority].toLowerCase()} — ${c.messages[0]!.text}`,
        duration: 12000,
        action: {
          label: "Responder",
          onClick: () => {
            focusConversation(c.id);
            void navigate({ to: "/canal/$network", params: { network: c.network } });
          },
        },
      });
    });
    return () => {
      off();
      stopFeed();
    };
  }, [navigate]);

  return null;
}
