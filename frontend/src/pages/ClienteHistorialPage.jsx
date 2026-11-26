import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EstadoBadge } from "../components/maquetas/EstadoMaqueta.jsx";
import { customersApi } from "../services/sprint3";
import { codigoCliente, iniciales } from "./clientesFormato";
import { claseEstado, codigoPedido, estadoPedido, fecha, money } from "./pedidosFormato";
import { codigoMaqueta, fechaEntrega, horaEntrega } from "./maquetasFormato";
import "./ClientesPage.css";

/** Historial de un cliente: datos básicos, pedidos y trabajos de maquetas (HU-10). */
function ClienteHistorialPage() {
  const { id } = useParams();
  const [historial, setHistorial] = useState(null), [error, setError] = useState(null), [version, setVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController(); setHistorial(null); setError(null);
    customersApi.history(id, controller.signal).then(setHistorial).catch(e => { if (!controller.signal.aborted) setError(e); });
    return () => controller.abort();
  }, [id, version]);

  const volver = <Link className="back" to="/customers">← Volver a clientes</Link>;

  if (error?.status === 404) return <div className="cliente-historial">{volver}
    <div className="panel empty"><h3>Cliente no encontrado</h3><p>No existe un cliente con el código {codigoCliente(id)}.</p></div>
  </div>;

  if (error) return <div className="cliente-historial">{volver}
    <div className="notice error" role="alert">No se pudo cargar el historial: {error.message} <button className="secondary clientes-reintentar" onClick={() => setVersion(v => v + 1)}>Reintentar</button></div>
  </div>;

  if (!historial) return <div className="cliente-historial">{volver}<p className="notice" role="status">Cargando historial…</p></div>;

  const { customer, orders, mockups } = historial;
  const totalPedidos = orders.reduce((suma, o) => suma + Number(o.total), 0);
  // Una maqueta cancelada ya no se cobra: su saldo no cuenta como pendiente.
  const saldoMaquetas = mockups.filter(m => m.status !== "Cancelled").reduce((suma, m) => suma + Number(m.pendingBalance), 0);
  const sinSolicitudes = orders.length === 0 && mockups.length === 0;

  return <div className="cliente-historial">
    {volver}

    <section className="cliente-ficha" aria-labelledby="cliente-nombre">
      <span className="cliente-avatar grande" aria-hidden="true">{iniciales(customer.name)}</span>
      <div className="cliente-ficha-datos">
        <p className="eyebrow">{codigoCliente(customer.id)} · DATOS DEL CLIENTE</p>
        <h1 id="cliente-nombre">{customer.name}</h1>
        <dl>
          <div><dt>Teléfono</dt><dd>{customer.phone || "Sin registrar"}</dd></div>
          <div><dt>Correo electrónico</dt><dd>{customer.email || "Sin registrar"}</dd></div>
        </dl>
      </div>
    </section>

    <div className="cliente-resumen">
      {[["📋", "Pedidos", orders.length], ["💰", "Total en pedidos", money(totalPedidos)], ["🧩", "Maquetas", mockups.length], ["⏳", "Saldo pendiente en maquetas", money(saldoMaquetas)]]
        .map(([icono, etiqueta, valor], i) => <div className="cliente-resumen-item" key={etiqueta} style={{ "--i": i }}>
          <span aria-hidden="true">{icono}</span><div><small>{etiqueta}</small><strong>{valor}</strong></div>
        </div>)}
    </div>

    {sinSolicitudes
      ? <div className="panel empty cliente-vacio">
        <h3>Este cliente todavía no tiene solicitudes</h3>
        <p>Cuando registre un pedido o una maqueta, aparecerá aquí.</p>
        <div className="actions"><Link className="button" to="/orders">Ir a pedidos</Link><Link className="button secondary" to="/maquetas">Ir a maquetas</Link></div>
      </div>
      : <>
        <section className="panel cliente-seccion" aria-labelledby="cliente-pedidos">
          <h2 id="cliente-pedidos">Pedidos <span className="cliente-contador">{orders.length}</span></h2>
          {orders.length
            ? <div className="table-scroll"><table>
              <thead><tr><th>Código</th><th>Fecha</th><th>Estado</th><th>Total</th></tr></thead>
              <tbody>{orders.map(o => <tr key={o.id}>
                <td><Link to={`/orders/${o.id}`} className="cliente-enlace">{codigoPedido(o.id)}</Link></td>
                <td>{fecha(o.registeredAt)}</td>
                <td><span className={claseEstado(o.status)}>{estadoPedido(o.status)}</span></td>
                <td><strong>{money(o.total)}</strong></td>
              </tr>)}</tbody>
            </table></div>
            : <p className="cliente-seccion-vacia">Este cliente no tiene pedidos registrados.</p>}
        </section>

        <section className="panel cliente-seccion" aria-labelledby="cliente-maquetas">
          <h2 id="cliente-maquetas">Trabajos de maquetas <span className="cliente-contador">{mockups.length}</span></h2>
          {mockups.length
            ? <div className="table-scroll"><table>
              <thead><tr><th>Código</th><th>Institución</th><th>Tipo</th><th>Entrega</th><th>Estado</th><th>Saldo</th></tr></thead>
              <tbody>{mockups.map(m => <tr key={m.id}>
                <td><Link to={`/maquetas/${m.id}`} className="cliente-enlace">{codigoMaqueta(m.id)}</Link></td>
                <td>{m.institution}</td>
                <td>{m.type}</td>
                <td>{fechaEntrega(m.deliveryAt)}<br /><small>{horaEntrega(m.deliveryAt)}</small></td>
                <td><EstadoBadge status={m.status} /></td>
                <td>{m.status === "Cancelled" ? <small>No aplica</small> : <strong>{money(m.pendingBalance)}</strong>}</td>
              </tr>)}</tbody>
            </table></div>
            : <p className="cliente-seccion-vacia">Este cliente no tiene trabajos de maquetas registrados.</p>}
        </section>
      </>}
  </div>;
}

export default ClienteHistorialPage;
