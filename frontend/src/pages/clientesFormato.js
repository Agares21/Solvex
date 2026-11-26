// Formato y búsqueda de clientes (HU-10).

export const codigoCliente = id => `CLI-${String(id).padStart(3, "0")}`;

const sinAcentos = texto => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Busca por nombre, teléfono, correo o código, sin distinguir mayúsculas ni acentos ("maria" encuentra "María"). */
export function coincideCliente(cliente, busqueda) {
  const texto = sinAcentos(busqueda);
  if (!texto) return true;
  return [cliente.name, cliente.phone, cliente.email, codigoCliente(cliente.id)].some(valor => valor && sinAcentos(valor).includes(texto));
}

export const iniciales = nombre => nombre.trim().split(/\s+/).slice(0, 2).map(parte => parte[0]).join("").toUpperCase();
