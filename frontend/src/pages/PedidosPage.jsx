import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Dialog from "../features/sprint2/components/Dialog.jsx";
import PedidoForm from "../features/sprint2/components/pedidos/PedidoForm.jsx";
import { customersApi, ordersApi } from "../services/sprint3";
import { products } from "../services/products";
import { ESTADOS_PEDIDO, claseEstado, codigoPedido, estadoPedido, fecha, money } from "./pedidosFormato";
import "./PedidosPage.css";

function PedidosPage() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]), [clientes, setClientes] = useState([]), [catalogo, setCatalogo] = useState([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [version, setVersion] = useState(0);
  const [busqueda, setBusqueda] = useState(""), [estado, setEstado] = useState("Todos");
  const [mostrarFormulario, setMostrarFormulario] = useState(false), [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);
  // Mientras se guarda, la ventana no se puede cerrar con Escape ni con clic afuera.
  const bloquear = accion => async input => { setGuardando(true); try { return await accion(input); } finally { setGuardando(false); } };

  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    Promise.all([ordersApi.list(controller.signal), customersApi.list(controller.signal), products.list(controller.signal)])
      .then(([orders, customers, items]) => { setPedidos(orders); setClientes(customers); setCatalogo(items.filter(p => p.isActive)); })
      .catch(e => { if (!controller.signal.aborted) setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [version]);

  useEffect(() => {
    if (!mensaje) return;
    const timer = setTimeout(() => setMensaje(""), 6000);
    return () => clearTimeout(timer);
  }, [mensaje]);

  async function crearCliente(input) {
    const cliente = await customersApi.create(input);
    setClientes(actual => [...actual, cliente]);
    return cliente;
  }

  async function registrarPedido(input) {
    const creado = await ordersApi.create(input);
    setPedidos(actual => [creado, ...actual.filter(p => p.id !== creado.id)]);
    setMostrarFormulario(false);
    setMensaje(`Pedido ${codigoPedido(creado.id)} registrado para ${creado.customerName}. Total: ${money(creado.total)}.`);
  }

  const texto = busqueda.trim().toLowerCase();
  const filtrados = pedidos.filter(p => (estado === "Todos" || p.status === estado)
    && `${codigoPedido(p.id)} ${p.id} ${p.customerName}`.toLowerCase().includes(texto));
  const contar = status => pedidos.filter(p => p.status === status).length;
  const stat = valor => (loading || error ? "—" : valor);

  return <div className="pedidos-page">
    <div className="pedidos-header">
      <div><h1>Gestión de pedidos</h1><p>Registra y consulta los pedidos de tus clientes.</p></div>
      <button className="pedidos-btn-nuevo" disabled={loading || Boolean(error)} onClick={() => { setMensaje(""); setMostrarFormulario(true); }}>+ Nuevo pedido</button>
    </div>

    {mensaje && <p className="notice success" role="status">{mensaje}</p>}
    {error && <div className="notice error" role="alert">{error} <button className="secondary pedidos-reintentar" onClick={() => setVersion(v => v + 1)}>Reintentar</button></div>}

    <div className="pedidos-stats">
      {[["Total de pedidos", pedidos.length], ["Pendientes", contar("Pending")], ["En proceso", contar("InProgress")], ["Entregados", contar("Delivered")]]
        .map(([label, value]) => <div className="pedido-stat-card" key={label}><span className="pedido-stat-label">{label}</span><strong>{stat(value)}</strong></div>)}
    </div>

    <div className="pedidos-listado-container">
      <div className="pedidos-listado-header">
        <h2>Pedidos registrados</h2>
        <div className="pedidos-filtros">
          <label className="sr-only" htmlFor="pedidos-busqueda">Buscar pedidos</label>
          <input id="pedidos-busqueda" type="search" placeholder="Buscar por cliente o código..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pedidos-busqueda" />
          <label className="sr-only" htmlFor="pedidos-estado">Filtrar por estado</label>
          <select id="pedidos-estado" className="pedidos-busqueda pedidos-estado-filtro" value={estado} onChange={e => setEstado(e.target.value)}>
            <option value="Todos">Todos los estados</option>
            {Object.entries(ESTADOS_PEDIDO).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
          </select>
        </div>
      </div>

      {!error && <div className="pedidos-table-container">
        <table className="pedidos-table">
          <thead><tr><th>Código</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {loading
              ? <tr><td colSpan="6" role="status">Cargando pedidos…</td></tr>
              : filtrados.map(p => <tr key={p.id}>
                <td className="pedido-codigo">{codigoPedido(p.id)}</td>
                <td>{p.customerName}</td>
                <td>{fecha(p.registeredAt)}</td>
                <td>{money(p.total)}</td>
                <td><span className={claseEstado(p.status)}>{estadoPedido(p.status)}</span></td>
                <td><button className="pedido-btn-ver" aria-label={`Ver pedido ${codigoPedido(p.id)}`} onClick={() => navigate(`/orders/${p.id}`)}>Ver</button></td>
              </tr>)}
            {!loading && !filtrados.length && <tr><td colSpan="6" className="pedidos-sin-resultados">
              {pedidos.length ? "No se encontraron pedidos con esos filtros." : "Todavía no hay pedidos registrados."}
            </td></tr>}
          </tbody>
        </table>
      </div>}
    </div>

    {mostrarFormulario && <Dialog title="Registrar nuevo pedido" overlayClass="pedido-modal-overlay" className="pedido-modal" busy={guardando} onClose={() => setMostrarFormulario(false)}>
      <PedidoForm clientes={clientes} productosDisponibles={catalogo} onCrearCliente={bloquear(crearCliente)} onGuardar={bloquear(registrarPedido)} onCancelar={() => setMostrarFormulario(false)} />
    </Dialog>}
  </div>;
}

export default PedidosPage;
