import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ordersApi } from "../services/sprint3";
import "./PedidoDetallePage.css";

const labels = { Pending: "Pendiente", InProgress: "En proceso", Delivered: "Entregado" };
const money = value => `Bs. ${Number(value).toFixed(2)}`;

function PedidoDetallePage() {
  const { id } = useParams(), navigate = useNavigate();
  const [pedido, setPedido] = useState(null), [error, setError] = useState("");
  useEffect(() => { const controller = new AbortController(); ordersApi.get(id, controller.signal).then(setPedido).catch(e => { if (!controller.signal.aborted) setError(e.message); }); return () => controller.abort(); }, [id]);
  if (error) return <div className="pedido-detalle-page"><div className="pedido-detalle-no-encontrado"><h2>Pedido no encontrado</h2><p>{error}</p><button onClick={() => navigate("/orders")} className="pedido-detalle-btn-volver">Volver a pedidos</button></div></div>;
  if (!pedido) return <div className="pedido-detalle-page">Cargando pedido...</div>;
  const state = labels[pedido.status] || pedido.status;
  return <div className="pedido-detalle-page"><div className="pedido-detalle-header"><button className="pedido-detalle-btn-volver" onClick={() => navigate("/orders")}>← Volver a pedidos</button><div className="pedido-detalle-title"><div><h1>Detalle del pedido</h1><p>Información completa del pedido registrado.</p></div><span className={`pedido-estado pedido-estado-${state.toLowerCase().replace(" ", "-")}`}>{state}</span></div></div>
    <div className="pedido-detalle-grid"><section className="pedido-detalle-card"><h2>Información general</h2><div className="pedido-detalle-info"><div><span>Código del pedido</span><strong>PED-{String(pedido.id).padStart(3, "0")}</strong></div><div><span>Cliente</span><strong>{pedido.customerName}</strong></div><div><span>Fecha de registro</span><strong>{new Date(pedido.registeredAt).toLocaleDateString("es-BO")}</strong></div><div><span>Estado actual</span><strong>{state}</strong></div></div></section>
      <section className="pedido-detalle-card"><h2>Productos del pedido</h2><div className="pedido-detalle-table-container"><table className="pedido-detalle-table"><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead><tbody>{pedido.details.map(producto => <tr key={producto.id}><td>{producto.productName}</td><td>{producto.quantity}</td><td>{money(producto.unitPrice)}</td><td>{money(producto.subtotal)}</td></tr>)}</tbody></table></div><div className="pedido-detalle-total"><span>Total del pedido</span><strong>{money(pedido.total)}</strong></div></section>
      <section className="pedido-detalle-card"><h2>Observaciones</h2><div className="pedido-detalle-observaciones">{pedido.observations || "No se registraron observaciones para este pedido."}</div></section></div>
  </div>;
}
export default PedidoDetallePage;
