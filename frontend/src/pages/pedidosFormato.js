// Formato compartido por el listado y el detalle de pedidos (HU-05).

export const ESTADOS_PEDIDO = { Pending: "Pendiente", InProgress: "En proceso", Delivered: "Entregado" };

export const estadoPedido = status => ESTADOS_PEDIDO[status] ?? status;

export const claseEstado = status =>
  `pedido-estado pedido-estado-${(ESTADOS_PEDIDO[status] ?? "Pendiente").toLowerCase().replace(" ", "-")}`;

export const codigoPedido = id => `PED-${String(id).padStart(3, "0")}`;

export const money = value => `Bs. ${Number(value).toFixed(2)}`;

export const fecha = value => new Date(value).toLocaleDateString("es-BO");
