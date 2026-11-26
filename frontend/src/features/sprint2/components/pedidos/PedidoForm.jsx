import { useState } from "react";
import ClienteSelector from "../../../../components/clientes/ClienteSelector.jsx";
import { CLIENTE_NUEVO, resolverCliente, validarCliente } from "../../../../components/clientes/clientes";
import "./PedidoForm.css";

const MAX_CANTIDAD = 1000000;

/**
 * Formulario de registro de pedidos conectado a la API.
 * - El cliente se elige de los registrados o se crea uno nuevo (una sola vez, aunque el pedido falle).
 * - Los productos salen del catálogo activo y no se pueden repetir.
 * - Los errores del servidor se muestran sin perder lo escrito.
 */
function PedidoForm({ clientes, productosDisponibles, onCrearCliente, onGuardar, onCancelar }) {
  const [clienteId, setClienteId] = useState(clientes.length ? "" : CLIENTE_NUEVO);
  const [nuevoCliente, setNuevoCliente] = useState({ name: "", phone: "" });
  const [lineas, setLineas] = useState([]);
  const [siguiente, setSiguiente] = useState(0);
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cambiar = setter => valor => { setter(valor); setError(""); };
  const agregarProducto = () => { setLineas(actual => [...actual, { key: siguiente, productoId: "", cantidad: "1" }]); setSiguiente(k => k + 1); setError(""); };
  const actualizarLinea = (key, campo, valor) => { setLineas(actual => actual.map(l => (l.key === key ? { ...l, [campo]: valor } : l))); setError(""); };
  const quitarLinea = key => setLineas(actual => actual.filter(l => l.key !== key));

  const totalEstimado = lineas.reduce((total, linea) => {
    const producto = productosDisponibles.find(p => p.id === Number(linea.productoId));
    return total + (producto ? producto.price * (Number(linea.cantidad) || 0) : 0);
  }, 0);

  function validar() {
    const problemaCliente = validarCliente(clienteId, nuevoCliente, clientes);
    if (problemaCliente) return problemaCliente;
    if (lineas.length === 0) return "El pedido debe contener al menos un producto.";
    if (lineas.some(l => !l.productoId)) return "Selecciona el producto de cada fila o quita las filas vacías.";
    if (lineas.some(l => !/^\d+$/.test(l.cantidad) || Number(l.cantidad) < 1 || Number(l.cantidad) > MAX_CANTIDAD)) {
      return "Las cantidades deben ser números enteros entre 1 y 1.000.000.";
    }
    if (new Set(lineas.map(l => l.productoId)).size !== lineas.length) return "Selecciona cada producto una sola vez.";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (guardando) return;
    const problema = validar();
    if (problema) { setError(problema); return; }
    setGuardando(true); setError("");
    try {
      const customerId = await resolverCliente(clienteId, nuevoCliente, onCrearCliente, setClienteId);
      await onGuardar({
        customerId,
        observations: observaciones.trim() || null,
        details: lineas.map(l => ({ productId: Number(l.productoId), quantity: Number(l.cantidad) })),
      });
    } catch (err) {
      setError(err?.message || "No se pudo registrar el pedido. Inténtalo nuevamente.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="pedido-form-container">
      <form className="pedido-form" onSubmit={handleSubmit} noValidate>
        <div className="pedido-form-header">
          <h2>Registrar nuevo pedido</h2>
          <p>Elige al cliente y los productos que solicita.</p>
        </div>

        <fieldset disabled={guardando}>
          <legend className="sr-only">Datos del pedido</legend>

          <ClienteSelector idPrefix="pedido" grupoClase="pedido-form-group" clientes={clientes}
            clienteId={clienteId} onClienteId={cambiar(setClienteId)} nuevoCliente={nuevoCliente} onNuevoCliente={cambiar(setNuevoCliente)} />

          <div className="pedido-productos-header">
            <h3>Productos del pedido</h3>
            <button type="button" className="pedido-btn-agregar" onClick={agregarProducto}
              disabled={!productosDisponibles.length || lineas.length >= Math.min(100, productosDisponibles.length)}>
              + Agregar producto
            </button>
          </div>

          {!productosDisponibles.length && (
            <div className="pedido-productos-vacio"><p>No hay productos activos en el catálogo.</p><p>Registra o activa productos para poder tomar pedidos.</p></div>
          )}

          {productosDisponibles.length > 0 && lineas.length === 0 && (
            <div className="pedido-productos-vacio">
              <p>Aún no se agregaron productos.</p>
              <p>Presione "Agregar producto" para comenzar.</p>
            </div>
          )}

          {lineas.map((linea, index) => (
            <div className="pedido-producto-row" key={linea.key}>
              <div className="pedido-form-group pedido-producto-select">
                <label htmlFor={`pedido-producto-${linea.key}`}>Producto {index + 1}</label>
                <select id={`pedido-producto-${linea.key}`} value={linea.productoId} onChange={e => actualizarLinea(linea.key, "productoId", e.target.value)}>
                  <option value="">Seleccione un producto</option>
                  {productosDisponibles.map(p => (
                    <option key={p.id} value={p.id} disabled={lineas.some(l => l.key !== linea.key && l.productoId === String(p.id))}>
                      {p.name} - Bs. {Number(p.price).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pedido-form-group pedido-cantidad">
                <label htmlFor={`pedido-cantidad-${linea.key}`}>Cantidad {index + 1}</label>
                <input id={`pedido-cantidad-${linea.key}`} type="number" min="1" max={MAX_CANTIDAD} step="1" value={linea.cantidad}
                  onChange={e => actualizarLinea(linea.key, "cantidad", e.target.value)} />
              </div>

              <button type="button" className="pedido-btn-eliminar" onClick={() => quitarLinea(linea.key)}
                aria-label={`Quitar producto ${index + 1}`} title="Quitar producto">
                ×
              </button>
            </div>
          ))}

          <div className="pedido-form-group">
            <label htmlFor="pedido-observaciones">Observaciones</label>
            <textarea id="pedido-observaciones" placeholder="Notas adicionales del pedido..." maxLength={1000} rows="3"
              value={observaciones} onChange={e => setObservaciones(e.target.value)} />
          </div>

          <div className="pedido-total">
            <span>Total estimado <small>(el servidor confirma el importe final)</small></span>
            <strong>Bs. {totalEstimado.toFixed(2)}</strong>
          </div>

          {error && <div className="pedido-form-error" role="alert">{error}</div>}

          <div className="pedido-form-actions">
            <button type="button" className="pedido-btn-cancelar" onClick={onCancelar}>Cancelar</button>
            <button type="submit" className="pedido-btn-guardar">{guardando ? "Registrando…" : "Registrar pedido"}</button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}

export default PedidoForm;
