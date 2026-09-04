import { createServerFn } from "@tanstack/react-start";
import { streamText } from "ai";
import { z } from "zod";

const SuggestInput = z.object({
  network: z.string(),
  person: z.string(),
  history: z
    .array(z.object({ from: z.enum(["cliente", "yo"]), text: z.string() }))
    .min(1),
  tone: z.enum(["cordial", "breve", "empático"]).default("cordial"),
});

export const suggestReply = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SuggestInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Falta la clave de IA");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const transcript = data.history
      .map((m) => `${m.from === "cliente" ? "Cliente" : "Nosotros"}: ${m.text}`)
      .join("\n");

    const result = streamText({
      model: gateway("google/gemini-3.7-flash"),
      system:
        "Eres el community manager de una tienda. Redacta UNA respuesta lista para enviar por redes sociales, en español, sin saludos genéricos vacíos, máximo 45 palabras, tono " +
        data.tone +
        ". No uses comillas ni firmes el mensaje. Si falta información, pídela de forma concreta.",
      prompt: `Red social: ${data.network}\nPersona: ${data.person}\nConversación:\n${transcript}`,
    });

    return { reply: (await result.text).trim() };
  });
