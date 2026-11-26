// Lógica compartida para elegir o registrar el cliente de un pedido o de una maqueta.

export const CLIENTE_NUEVO = "nuevo";

const normalizar = texto => texto.trim().toLocaleLowerCase("es");

/** Devuelve el mensaje de error del cliente elegido, o "" si es válido. */
export function validarCliente(clienteId, nuevoCliente, clientes) {
  if (clienteId === "") return "Selecciona un cliente o registra uno nuevo.";
  if (clienteId !== CLIENTE_NUEVO) return "";
  if (!nuevoCliente.name.trim()) return "Ingresa el nombre del cliente nuevo.";
  const repetido = clientes.find(c => normalizar(c.name) === normalizar(nuevoCliente.name));
  return repetido ? `Ya existe un cliente llamado «${repetido.name}». Selecciónalo en la lista de clientes.` : "";
}

/**
 * Devuelve el id del cliente. Si es nuevo, lo crea en la API y llama a `onCreado` con su id,
 * para que un reintento use ese cliente y no registre uno duplicado.
 */
export async function resolverCliente(clienteId, nuevoCliente, onCrearCliente, onCreado) {
  if (clienteId !== CLIENTE_NUEVO) return Number(clienteId);
  const creado = await onCrearCliente({ name: nuevoCliente.name.trim(), phone: nuevoCliente.phone.trim() || null });
  onCreado(String(creado.id));
  return creado.id;
}
