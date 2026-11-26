// Formato compartido por el listado y el detalle de solicitudes de maquetas (HU-07).

export const ESTADOS_MAQUETA = { Requested: "Pendiente", InProgress: "En proceso", Completed: "Completada" };

export const estadoMaqueta = status => ESTADOS_MAQUETA[status] ?? status;

export const claseEstadoMaqueta = status =>
  `maqueta-estado maqueta-estado-${(ESTADOS_MAQUETA[status] ?? "Pendiente").toLowerCase().replace(" ", "-")}`;

export const codigoMaqueta = id => `MAQ-${String(id).padStart(3, "0")}`;

export const fechaEntrega = value => new Date(value).toLocaleDateString("es-BO");

export const horaEntrega = value => new Date(value).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });

const HORAS_AVISO = 48;

/** Avisa si un trabajo sin terminar ya pasó su entrega o vence en las próximas 48 horas. */
export function alertaEntrega(solicitud, ahora = new Date()) {
  if (solicitud.status === "Completed") return null;
  const horas = (new Date(solicitud.deliveryAt) - ahora) / 3600000;
  if (horas < 0) return { texto: "Atrasada", clase: "maqueta-alerta-atrasada" };
  if (horas <= HORAS_AVISO) return { texto: "Vence pronto", clase: "maqueta-alerta-pronto" };
  return null;
}
