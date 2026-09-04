CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network text NOT NULL,
  kind text NOT NULL DEFAULT 'mensaje',
  person text NOT NULL,
  handle text NOT NULL DEFAULT '',
  avatar_color text NOT NULL DEFAULT 'var(--net-instagram)',
  unread boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'pendiente',
  priority text NOT NULL DEFAULT 'media',
  assignee text,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO anon, authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Demo abierta conversations" ON public.conversations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender text NOT NULL DEFAULT 'cliente',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX messages_conversation_idx ON public.messages (conversation_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO anon, authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Demo abierta messages" ON public.messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.priority_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  network text,
  keywords text[] NOT NULL DEFAULT '{}',
  sender_kind text,
  priority text NOT NULL DEFAULT 'media',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.priority_rules TO anon, authenticated;
GRANT ALL ON public.priority_rules TO service_role;
ALTER TABLE public.priority_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Demo abierta priority_rules" ON public.priority_rules FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

INSERT INTO public.priority_rules (name, enabled, network, keywords, sender_kind, priority, position) VALUES
  ('Quejas y reclamos', true, NULL, ARRAY['queja','reclamo','dañado','roto','no llega','demora','molesto','pésimo'], NULL, 'alta', 1),
  ('Intención de compra', true, NULL, ARRAY['precio','comprar','stock','talla','cuánto cuesta','disponible','factura'], NULL, 'alta', 2),
  ('Comentarios públicos', true, NULL, ARRAY[]::text[], 'comentario', 'baja', 3);

WITH nuevos AS (
  INSERT INTO public.conversations (network, kind, person, handle, avatar_color, unread, status, priority, assignee, tags)
  VALUES
    ('instagram','mensaje','Lucía Fernández','@luciafdz','var(--net-instagram)', true,'pendiente','alta',NULL,ARRAY['venta']),
    ('facebook','comentario','Rodrigo Peña','Rodrigo P.','var(--net-facebook)', true,'pendiente','alta','Camila',ARRAY['queja']),
    ('x','mencion','Marketing Andino','@mkt_andino','var(--net-x)', false,'en_proceso','media','Antonio',ARRAY['colaboración']),
    ('tiktok','comentario','danielaa.ok','@danielaa.ok','var(--net-tiktok)', false,'pendiente','baja',NULL,ARRAY['soporte']),
    ('instagram','mensaje','Javier Ortiz','@javi.ortiz','var(--net-instagram)', false,'resuelto','baja','Marco',ARRAY['envío']),
    ('facebook','mensaje','Ana Villarroel','Ana V.','var(--net-facebook)', false,'en_proceso','media','Camila',ARRAY['venta','envío'])
  RETURNING id, person
)
INSERT INTO public.messages (conversation_id, sender, body, created_at)
SELECT n.id, m.sender, m.body, now() - (m.ago || ' minutes')::interval
FROM nuevos n
JOIN (VALUES
  ('Lucía Fernández','cliente','¡Hola! Vi la chamarra azul en su última publicación, ¿tienen talla M?', 8),
  ('Lucía Fernández','cliente','Y si la pido hoy, ¿cuánto tarda el envío a La Paz?', 4),
  ('Rodrigo Peña','cliente','Hice mi pedido el lunes y todavía no me llega ninguna guía de rastreo.', 22),
  ('Marketing Andino','cliente','Nos encantaría hacer una colaboración con ustedes para la campaña de agosto.', 90),
  ('Marketing Andino','yo','¡Suena muy bien! ¿Nos compartes una propuesta con alcance y fechas?', 75),
  ('danielaa.ok','cliente','¿El descuento del video también aplica en la tienda física?', 130),
  ('Javier Ortiz','cliente','¿Ya salió mi paquete?', 1500),
  ('Javier Ortiz','yo','Sí, salió esta mañana. Llega mañana antes de las 6 pm.', 1490),
  ('Javier Ortiz','cliente','¡Gracias, excelente servicio!', 1488),
  ('Ana Villarroel','cliente','Quiero pedir 3 unidades para regalo de empresa, ¿hacen factura?', 1600)
) AS m(person, sender, body, ago) ON m.person = n.person;