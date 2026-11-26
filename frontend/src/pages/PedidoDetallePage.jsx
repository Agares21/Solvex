import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ordersApi } from "../services/sprint3";
import { claseEstado, codigoPedido, estadoPedido, fecha, money } from "./pedidosFormato";
import "./PedidoDetallePage.css";

function PedidoDetallePage() {
  const { id } = useParams(), navigate = useNavigate();
  const [pedido, setPedido] = useState(null), [error, setError] = useState(null), [version, setVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController(); setPedido(null); setError(null);
    ordersApi.get(id, controller.signal).then(setPedido).catch(e => { if (!controller.signal.aborted) setError(e); });
    return () => controller.abort();
  }, [id, version]);

  const volver = <button onClick={() => navigate("/orders")} className="pedido-detalle-btn-volver">← Volver a pedidos</button>;

  if (error?.status === 404) return <div className="pedido-detalle-page"><div className="pedido-detalle-no-encontrado">
    <h2>Pedido no encontrado</h2><p>No existe un pedido con el código {codigoPedido(id)}.</p>{volver}
  </div></div>;

  if (error) return <div className="pedido-detalle-page"><div className="pedido-detalle-no-encontrado">
    <h2>No se pudo cargar el pedido</h2><p role="alert">{error.message}</p>
    <div className="pedido-detalle-acciones"><button className="pedido-detalle-btn-volver" onClick={() => setVersion(v => v + 1)}>Reintentar</button>{volver}</div>
  </div></div>;

  if (!pedido) return <div className="pedido-detalle-page"><p className="notice" role="status">Cargando pedido…</p></div>;

  const estado = estadoPedido(pedido.status);
  return <div className="pedido-detalle-page">
    <div className="pedido-detalle-header">
      {volver}
      <div className="pedido-detalle-title">
        <div><h1>Detalle del pedido</h1><p>Información completa del pedido registrado.</p></div>
        <span className={claseEstado(pedido.status)}>{estado}</span>
      </div>
    </div>
    <div className="pedido-detalle-grid">
      <section className="pedido-detalle-card"><h2>Información general</h2>
        <div className="pedido-detalle-info">
          <div><span>Código del pedido</span><strong>{codigoPedido(pedido.id)}</strong></div>
          <div><span>Cliente</span><strong><Link to={`/customers/${pedido.customerId}`} title="Ver historial del cliente">{pedido.customerName}</Link></strong></div>
          <div><span>Fecha de registro</span><strong>{fecha(pedido.registeredAt)}</strong></div>
          <div><span>Estado actual</span><strong>{estado}</strong></div>
        </div>
      </section>
      <section className="pedido-detalle-card"><h2>Productos del pedido</h2>
        <div className="pedido-detalle-table-container">
          <table className="pedido-detalle-table">
            <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead>
            <tbody>{pedido.details.map(linea => <tr key={linea.id}>
              <td>{linea.productName}<br /><small>{linea.productCode}</small></td>
              <td>{linea.quantity}</td><td>{money(linea.unitPrice)}</td><td>{money(linea.subtotal)}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <div className="pedido-detalle-total"><span>Total del pedido</span><strong>{money(pedido.total)}</strong></div>
      </section>
      <section className="pedido-detalle-card"><h2>Observaciones</h2>
        <div className="pedido-detalle-observaciones">{pedido.observations || "No se registraron observaciones para este pedido."}</div>
      </section>
    </div>
  </div>;
}

export default PedidoDetallePage;
