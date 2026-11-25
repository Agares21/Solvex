import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PedidoForm from "../features/sprint2/components/pedidos/PedidoForm.jsx";
import { customersApi, ordersApi } from "../services/sprint3";
import { products } from "../services/products";
import "./PedidosPage.css";

const labels = { Pending: "Pendiente", InProgress: "En proceso", Delivered: "Entregado" };
const money = value => `Bs. ${Number(value).toFixed(2)}`;

function PedidosPage() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]), [catalogo, setCatalogo] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false), [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState(""), [loading, setLoading] = useState(true);
  const load = signal => Promise.all([ordersApi.list(signal), products.list(signal)]).then(([orders, items]) => { setPedidos(orders); setCatalogo(items.filter(p => p.isActive)); }).catch(e => { if (!signal?.aborted) setError(e.message); }).finally(() => { if (!signal?.aborted) setLoading(false); });
  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort(); }, []);
  async function registrarPedido(input) {
    setError("");
    const customer = await customersApi.create({ name: input.cliente });
    const created = await ordersApi.create({ customerId: customer.id, observations: input.observaciones || null, details: input.productos.map(p => ({ productId: Number(p.productoId), quantity: Number(p.cantidad) })) });
    setPedidos(current => [created, ...current]); setMostrarFormulario(false);
  }
  const filtered = pedidos.filter(p => `${p.id} ${p.customerName}`.toLowerCase().includes(busqueda.toLowerCase()));
  const count = status => pedidos.filter(p => p.status === status).length;
  return <div className="pedidos-page">
    <div className="pedidos-header"><div><h1>Gestión de pedidos</h1><p>Registra y consulta los pedidos de tus clientes.</p></div><button className="pedidos-btn-nuevo" onClick={() => setMostrarFormulario(true)}>+ Nuevo pedido</button></div>
    {error && <p className="notice error" role="alert">{error}</p>}
    <div className="pedidos-stats">{[["Total de pedidos", pedidos.length], ["Pendientes", count("Pending")], ["En proceso", count("InProgress")], ["Entregados", count("Delivered")]].map(([label, value]) => <div className="pedido-stat-card" key={label}><span className="pedido-stat-label">{label}</span><strong>{value}</strong></div>)}</div>
    <div className="pedidos-listado-container"><div className="pedidos-listado-header"><h2>Pedidos registrados</h2><input type="text" placeholder="Buscar por cliente o código..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pedidos-busqueda" /></div>
      <div className="pedidos-table-container"><table className="pedidos-table"><thead><tr><th>Código</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{loading ? <tr><td colSpan="6">Cargando pedidos...</td></tr> : filtered.map(p => <tr key={p.id}><td className="pedido-codigo">PED-{String(p.id).padStart(3, "0")}</td><td>{p.customerName}</td><td>{new Date(p.registeredAt).toLocaleDateString("es-BO")}</td><td>{money(p.total)}</td><td><span className={`pedido-estado pedido-estado-${labels[p.status].toLowerCase().replace(" ", "-")}`}>{labels[p.status]}</span></td><td><button className="pedido-btn-ver" onClick={() => navigate(`/orders/${p.id}`)}>Ver</button></td></tr>)}{!loading && !filtered.length && <tr><td colSpan="6" className="pedidos-sin-resultados">No se encontraron pedidos.</td></tr>}</tbody></table></div>
    </div>
    {mostrarFormulario && <div className="pedido-modal-overlay"><div className="pedido-modal"><PedidoForm productosDisponibles={catalogo} onGuardar={registrarPedido} onCancelar={() => setMostrarFormulario(false)} /></div></div>}
  </div>;
}
export default PedidosPage;
