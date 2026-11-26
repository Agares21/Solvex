// Formato y estados compartidos por el listado y el detalle de solicitudes de maquetas (HU-07 y HU-09).

/**
 * Estados definidos para una maqueta (HU-09). La clave es el valor que viaja en la API (`MockupStatus` del backend);
 * ningún otro valor se ofrece ni se envía. Las transiciones de abajo son las mismas que valida `MockupService.IsAllowed`.
 */
export const ESTADOS_MAQUETA = {
  Requested: "Pendiente",
  InProgress: "En proceso",
  Completed: "Terminada",
  Delivered: "Entregada",
  Cancelled: "Cancelada",
};

/** Ícono y tono de cada estado para los indicadores visuales. */
export const ESTILO_ESTADO = {
  Requested: { icono: "⏳", tono: "pendiente" },
  InProgress: { icono: "🛠️", tono: "en-proceso" },
  Completed: { icono: "✔", tono: "terminada" },
  Delivered: { icono: "📦", tono: "entregada" },
  Cancelled: { icono: "✖", tono: "cancelada" },
};

/** Recorrido normal de un trabajo; `Cancelled` queda fuera porque corta el recorrido. */
export const RECORRIDO_MAQUETA = ["Requested", "InProgress", "Completed", "Delivered"];

/** A qué estados se puede pasar desde cada uno: siempre hacia adelante; cancelar solo antes de terminar. */
export const TRANSICIONES_MAQUETA = {
  Requested: ["InProgress", "Cancelled"],
  InProgress: ["Completed", "Cancelled"],
  Completed: ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

export const esEstadoMaqueta = status => Object.hasOwn(ESTADOS_MAQUETA, status);

export const siguientesEstados = status => TRANSICIONES_MAQUETA[status] ?? [];

export const estadoMaqueta = status => ESTADOS_MAQUETA[status] ?? status;

export const claseEstadoMaqueta = status =>
  `maqueta-estado maqueta-estado-${(ESTILO_ESTADO[status] ?? ESTILO_ESTADO.Requested).tono}`;

export const codigoMaqueta = id => `MAQ-${String(id).padStart(3, "0")}`;

export const fechaEntrega = value => new Date(value).toLocaleDateString("es-BO");

export const horaEntrega = value => new Date(value).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });

export const fechaHora = value => new Date(value).toLocaleString("es-BO", { dateStyle: "short", timeStyle: "short" });

const HORAS_AVISO = 48;

/** Avisa si un trabajo aún no entregado ya pasó su fecha o vence en las próximas 48 horas. */
export function alertaEntrega(solicitud, ahora = new Date()) {
  if (solicitud.status === "Delivered" || solicitud.status === "Cancelled") return null;
  const horas = (new Date(solicitud.deliveryAt) - ahora) / 3600000;
  if (horas < 0) return { texto: "Atrasada", clase: "maqueta-alerta-atrasada" };
  if (horas <= HORAS_AVISO) return { texto: "Vence pronto", clase: "maqueta-alerta-pronto" };
  return null;
}
