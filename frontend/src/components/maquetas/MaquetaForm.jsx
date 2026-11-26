import { useState } from "react";
import ClienteSelector from "../clientes/ClienteSelector.jsx";
import { CLIENTE_NUEVO, resolverCliente, validarCliente } from "../clientes/clientes";
import "./MaquetaForm.css";

const TIPOS = ["Arquitectónica", "Educativa", "Escolar", "Industrial", "Paisajística", "Otra"];
const TAMANOS = ["Pequeña", "Mediana", "Grande", "Personalizada"];
const PRECIO_MAXIMO = 99999999.99;
const ANIOS_MAXIMOS = 10;

const dosDigitos = n => String(n).padStart(2, "0");
const hoyLocal = () => { const d = new Date(); return `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`; };

/** Convierte fecha (aaaa-mm-dd) y hora (hh:mm) locales en una fecha real, o null si no existen (p. ej. 31 de febrero). */
function construirEntrega(fecha, hora) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const [horas, minutos] = hora.split(":").map(Number);
  if ([anio, mes, dia, horas, minutos].some(n => !Number.isInteger(n)) || horas > 23 || minutos > 59) return null;
  const entrega = new Date(anio, mes - 1, dia, horas, minutos);
  return entrega.getFullYear() === anio && entrega.getMonth() === mes - 1 && entrega.getDate() === dia ? entrega : null;
}

/**
 * Formulario de solicitud de maqueta conectado a la API.
 * El cliente se elige de los registrados o se crea uno nuevo una sola vez; los errores del servidor se muestran sin perder lo escrito.
 */
function MaquetaForm({ clientes, onCrearCliente, onGuardar, onCancelar }) {
  const [clienteId, setClienteId] = useState(clientes.length ? "" : CLIENTE_NUEVO);
  const [nuevoCliente, setNuevoCliente] = useState({ name: "", phone: "" });
  const [datos, setDatos] = useState({ institucion: "", tipo: "", tamano: "", fecha: "", hora: "", precio: "", observaciones: "" });
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cambiar = setter => valor => { setter(valor); setError(""); };
  const campo = nombre => e => { setDatos(actual => ({ ...actual, [nombre]: e.target.value })); setError(""); };

  function validar() {
    const problemaCliente = validarCliente(clienteId, nuevoCliente, clientes);
    if (problemaCliente) return { problema: problemaCliente };
    if (!datos.institucion.trim()) return { problema: "Ingresa la institución del cliente." };
    if (!datos.tipo) return { problema: "Selecciona el tipo de maqueta." };
    if (!datos.tamano) return { problema: "Selecciona el tamaño de la maqueta." };
    if (!datos.fecha || !datos.hora) return { problema: "Indica la fecha y la hora de entrega." };
    const entrega = construirEntrega(datos.fecha, datos.hora);
    if (!entrega) return { problema: "La fecha y hora de entrega no son válidas." };
    const ahora = new Date();
    if (entrega <= ahora) return { problema: "La fecha y hora de entrega deben ser posteriores a este momento." };
    if (entrega.getFullYear() > ahora.getFullYear() + ANIOS_MAXIMOS) return { problema: "Revisa el año de entrega: está demasiado lejos." };
    const precio = Number(datos.precio);
    if (!/^\d+(\.\d{1,2})?$/.test(datos.precio) || precio <= 0 || precio > PRECIO_MAXIMO) {
      return { problema: "Ingresa un precio acordado mayor a cero, con hasta dos decimales." };
    }
    return { entrega, precio };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (guardando) return;
    const { problema, entrega, precio } = validar();
    if (problema) { setError(problema); return; }
    setGuardando(true); setError("");
    try {
      const customerId = await resolverCliente(clienteId, nuevoCliente, onCrearCliente, setClienteId);
      await onGuardar({
        customerId,
        institution: datos.institucion.trim(),
        type: datos.tipo,
        size: datos.tamano,
        deliveryAt: entrega.toISOString(),
        observations: datos.observaciones.trim() || null,
        agreedPrice: precio,
      });
    } catch (err) {
      setError(err?.message || "No se pudo registrar la solicitud. Inténtalo nuevamente.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="maqueta-form-container">
      <form className="maqueta-form" onSubmit={handleSubmit} noValidate>
        <div className="maqueta-form-header">
          <h2>Nueva solicitud de maqueta</h2>
          <p>Complete los datos para registrar el trabajo solicitado.</p>
        </div>

        <fieldset disabled={guardando}>
          <legend className="sr-only">Datos de la solicitud</legend>

          <ClienteSelector idPrefix="maqueta" grupoClase="maqueta-form-group" clientes={clientes}
            clienteId={clienteId} onClienteId={cambiar(setClienteId)} nuevoCliente={nuevoCliente} onNuevoCliente={cambiar(setNuevoCliente)} />

          <div className="maqueta-form-grid">
            <div className="maqueta-form-group">
              <label htmlFor="maqueta-institucion">Institución *</label>
              <input id="maqueta-institucion" type="text" maxLength={150} placeholder="Nombre de la institución" value={datos.institucion} onChange={campo("institucion")} />
            </div>

            <div className="maqueta-form-group">
              <label htmlFor="maqueta-tipo">Tipo de maqueta *</label>
              <select id="maqueta-tipo" value={datos.tipo} onChange={campo("tipo")}>
                <option value="">Seleccione el tipo</option>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="maqueta-form-group">
              <label htmlFor="maqueta-tamano">Tamaño *</label>
              <select id="maqueta-tamano" value={datos.tamano} onChange={campo("tamano")}>
                <option value="">Seleccione el tamaño</option>
                {TAMANOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="maqueta-form-group">
              <label htmlFor="maqueta-precio">Precio acordado (Bs) *</label>
              <input id="maqueta-precio" type="number" min="0.01" max={PRECIO_MAXIMO} step="0.01" placeholder="0.00" value={datos.precio} onChange={campo("precio")} />
            </div>

            <div className="maqueta-form-group">
              <label htmlFor="maqueta-fecha">Fecha de entrega *</label>
              <input id="maqueta-fecha" type="date" min={hoyLocal()} value={datos.fecha} onChange={campo("fecha")} />
            </div>

            <div className="maqueta-form-group">
              <label htmlFor="maqueta-hora">Hora de entrega *</label>
              <input id="maqueta-hora" type="time" value={datos.hora} onChange={campo("hora")} />
            </div>
          </div>

          <div className="maqueta-form-group maqueta-observaciones">
            <label htmlFor="maqueta-observaciones">Observaciones</label>
            <textarea id="maqueta-observaciones" placeholder="Detalles adicionales, materiales, características..." rows="4" maxLength={1000}
              value={datos.observaciones} onChange={campo("observaciones")} />
          </div>

          {error && <div className="maqueta-form-error" role="alert">{error}</div>}

          <div className="maqueta-form-actions">
            <button type="button" className="maqueta-btn-cancelar" onClick={onCancelar}>Cancelar</button>
            <button type="submit" className="maqueta-btn-guardar">{guardando ? "Registrando…" : "Registrar solicitud"}</button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}

export default MaquetaForm;
