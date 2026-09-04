export type Network = "instagram" | "facebook" | "x" | "tiktok";

export type Status = "pendiente" | "en_proceso" | "resuelto";

export type Message = {
  id: string;
  from: "cliente" | "yo";
  text: string;
  at: string;
};

export type Priority = "alta" | "media" | "baja";

export type Conversation = {
  id: string;
  network: Network;
  kind: "mensaje" | "comentario" | "mencion";
  person: string;
  handle: string;
  avatarColor: string;
  lastAt: string;
  unread: boolean;
  status: Status;
  priority: Priority;
  assignee: string | null;
  tags: string[];
  campaignId?: string | null;
  messages: Message[];
};

export const networkLabels: Record<Network, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  x: "X",
  tiktok: "TikTok",
};

export const team = ["Antonio", "Camila", "Marco"];

export const allTags = ["venta", "soporte", "queja", "colaboración", "envío"];

export const conversations: Conversation[] = [
  {
    id: "c1",
    network: "instagram",
    kind: "mensaje",
    person: "Lucía Fernández",
    handle: "@luciafdz",
    avatarColor: "var(--net-instagram)",
    lastAt: "hace 4 min",
    unread: true,
    status: "pendiente",
    priority: "alta",
    assignee: null,
    tags: ["venta"],
    messages: [
      { id: "m1", from: "cliente", text: "¡Hola! Vi la chamarra azul en su última publicación, ¿tienen talla M?", at: "12:02" },
      { id: "m2", from: "cliente", text: "Y si la pido hoy, ¿cuánto tarda el envío a La Paz?", at: "12:04" },
    ],
  },
  {
    id: "c2",
    network: "facebook",
    kind: "comentario",
    person: "Rodrigo Peña",
    handle: "Rodrigo P.",
    avatarColor: "var(--net-facebook)",
    lastAt: "hace 22 min",
    unread: true,
    status: "pendiente",
    priority: "alta",
    assignee: "Camila",
    tags: ["queja"],
    messages: [
      { id: "m1", from: "cliente", text: "Hice mi pedido el lunes y todavía no me llega ninguna guía de rastreo.", at: "11:40" },
    ],
  },
  {
    id: "c3",
    network: "x",
    kind: "mencion",
    person: "Marketing Andino",
    handle: "@mkt_andino",
    avatarColor: "var(--net-x)",
    lastAt: "hace 1 h",
    unread: false,
    status: "en_proceso",
    priority: "media",
    assignee: "Antonio",
    tags: ["colaboración"],
    messages: [
      { id: "m1", from: "cliente", text: "Nos encantaría hacer una colaboración con ustedes para la campaña de agosto.", at: "10:55" },
      { id: "m2", from: "yo", text: "¡Suena muy bien! ¿Nos compartes una propuesta con alcance y fechas?", at: "11:10" },
    ],
  },
  {
    id: "c4",
    network: "tiktok",
    kind: "comentario",
    person: "danielaa.ok",
    handle: "@danielaa.ok",
    avatarColor: "var(--net-tiktok)",
    lastAt: "hace 2 h",
    unread: false,
    status: "pendiente",
    priority: "baja",
    assignee: null,
    tags: ["soporte"],
    messages: [
      { id: "m1", from: "cliente", text: "¿El descuento del video también aplica en la tienda física?", at: "09:48" },
    ],
  },
  {
    id: "c5",
    network: "instagram",
    kind: "mensaje",
    person: "Javier Ortiz",
    handle: "@javi.ortiz",
    avatarColor: "var(--net-instagram)",
    lastAt: "ayer",
    unread: false,
    status: "resuelto",
    priority: "baja",
    assignee: "Marco",
    tags: ["envío"],
    messages: [
      { id: "m1", from: "cliente", text: "¿Ya salió mi paquete?", at: "16:20" },
      { id: "m2", from: "yo", text: "Sí, salió esta mañana. Llega mañana antes de las 6 pm.", at: "16:31" },
      { id: "m3", from: "cliente", text: "¡Gracias, excelente servicio!", at: "16:33" },
    ],
  },
  {
    id: "c6",
    network: "facebook",
    kind: "mensaje",
    person: "Ana Villarroel",
    handle: "Ana V.",
    avatarColor: "var(--net-facebook)",
    lastAt: "ayer",
    unread: false,
    status: "en_proceso",
    priority: "media",
    assignee: "Camila",
    tags: ["venta", "envío"],
    messages: [
      { id: "m1", from: "cliente", text: "Quiero pedir 3 unidades para regalo de empresa, ¿hacen factura?", at: "15:02" },
    ],
  },
];

export const priorityLabels: Record<Priority, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

export const priorityRank: Record<Priority, number> = { alta: 0, media: 1, baja: 2 };

export const incomingSamples: Array<{
  network: Network;
  kind: Conversation["kind"];
  person: string;
  handle: string;
  priority: Priority;
  tags: string[];
  text: string;
}> = [
  {
    network: "instagram",
    kind: "mensaje",
    person: "Paola Mendoza",
    handle: "@paomendoza",
    priority: "alta",
    tags: ["venta"],
    text: "¿Todavía tienen la mochila negra? La necesito para mañana.",
  },
  {
    network: "facebook",
    kind: "comentario",
    person: "Luis Carrasco",
    handle: "Luis C.",
    priority: "media",
    tags: ["soporte"],
    text: "¿Atienden los domingos en la sucursal del centro?",
  },
  {
    network: "x",
    kind: "mencion",
    person: "Ruta Digital",
    handle: "@rutadigital",
    priority: "media",
    tags: ["colaboración"],
    text: "Los mencionamos en nuestro top de marcas bolivianas, ¡felicidades!",
  },
  {
    network: "tiktok",
    kind: "comentario",
    person: "kevin.rojas",
    handle: "@kevin.rojas",
    priority: "baja",
    tags: ["venta"],
    text: "¿Cuánto cuesta el combo que sale en el video?",
  },
  {
    network: "instagram",
    kind: "mensaje",
    person: "Gabriela Soto",
    handle: "@gabisoto",
    priority: "alta",
    tags: ["queja"],
    text: "Me llegó el pedido con una pieza dañada, ¿cómo lo solucionamos?",
  },
];

export const weeklyVolume = [
  { day: "Lun", instagram: 32, facebook: 18, x: 9, tiktok: 14 },
  { day: "Mar", instagram: 41, facebook: 22, x: 12, tiktok: 19 },
  { day: "Mié", instagram: 28, facebook: 15, x: 7, tiktok: 21 },
  { day: "Jue", instagram: 47, facebook: 25, x: 14, tiktok: 26 },
  { day: "Vie", instagram: 53, facebook: 30, x: 11, tiktok: 33 },
  { day: "Sáb", instagram: 38, facebook: 17, x: 6, tiktok: 29 },
  { day: "Dom", instagram: 24, facebook: 12, x: 5, tiktok: 18 },
];

export const followerTrend = [
  { week: "S1", seguidores: 12400 },
  { week: "S2", seguidores: 12780 },
  { week: "S3", seguidores: 13150 },
  { week: "S4", seguidores: 13890 },
  { week: "S5", seguidores: 14620 },
  { week: "S6", seguidores: 15310 },
];
