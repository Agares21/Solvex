import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PagoMaquetaForm from "../components/maquetas/PagoMaquetaForm";
import { EstadoBadge, EstadoProgreso } from "../components/maquetas/EstadoMaqueta.jsx";
import SelectorEstadoMaqueta from "../components/maquetas/SelectorEstadoMaqueta.jsx";
import { mockupsApi } from "../services/sprint3";
import { alertaEntrega, codigoMaqueta, fechaEntrega, fechaHora, horaEntrega } from "./maquetasFormato";
import "./MaquetaDetallePage.css";

const money = value => `Bs ${Number(value).toFixed(2)}`;

function MaquetaDetallePage() {
  const { id } = useParams(), navigate = useNavigate();
  const [solicitud, setSolicitud] = useState(null), [error, setError] = useState(null), [version, setVersion] = useState(0);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    const controller = new AbortController(); setSolicitud(null); setError(null);
    mockupsApi.get(id, controller.signal).then(setSolicitud).catch(e => { if (!controller.signal.aborted) setError(e); });
    return () => controller.abort();
  }, [id, version]);

  async function pay(input) { const updated = await mockupsApi.pay(id, input); setSolicitud(updated); setShowPayment(false); }

  /** Guarda el nuevo estado; si falla, vuelve a consultar para mostrar el estado real guardado y relanza el error. */
  async function cambiarEstado(status) {
    try {
      setSolicitud(await mockupsApi.updateStatus(id, status));
    } catch (err) {
      mockupsApi.get(id).then(setSolicitud).catch(() => { /* se conserva lo mostrado; el selector ya informa el error */ });
      throw err;
    }
  }

  const volver = <button className="maqueta-detalle-btn-volver" onClick={() => navigate("/maquetas")}>← Volver a solicitudes</button>;

  if (error?.status === 404) return <div className="maqueta-detalle-page"><div className="maqueta-detalle-vacio">
    <h2>Solicitud no encontrada</h2><p>No existe una solicitud con el código {codigoMaqueta(id)}.</p>{volver}
  </div></div>;

  if (error) return <div className="maqueta-detalle-page"><div className="maqueta-detalle-vacio">
    <h2>No se pudo cargar la solicitud</h2><p role="alert">{error.message}</p>
    <div className="maqueta-detalle-acciones"><button className="maqueta-detalle-btn-volver" onClick={() => setVersion(v => v + 1)}>Reintentar</button>{volver}</div>
  </div></div>;

  if (!solicitud) return <div className="maqueta-detalle-page"><p className="notice" role="status">Cargando solicitud…</p></div>;

  const alerta = alertaEntrega(solicitud);
  return <div className="maqueta-detalle-page">{volver}
    <div className="maqueta-detalle-header">
      <div><h1>Detalle de solicitud</h1><p>Información completa del trabajo solicitado.</p></div>
      <EstadoBadge status={solicitud.status} />
    </div>
    <div className="maqueta-detalle-grid">
      <section className="maqueta-detalle-card maqueta-estado-card" aria-labelledby="estado-trabajo"><h2 id="estado-trabajo">Estado del trabajo</h2>
        <div className="maqueta-estado-resumen">
          <span>Estado actual: <EstadoBadge status={solicitud.status} /></span>
          {solicitud.statusUpdatedAt && <span>Última actualización: {fechaHora(solicitud.statusUpdatedAt)}</span>}
        </div>
        <EstadoProgreso status={solicitud.status} />
        <SelectorEstadoMaqueta estado={solicitud.status} onCambiar={cambiarEstado} />
      </section>
      <section className="maqueta-detalle-card"><h2>Información general</h2>
        <div className="maqueta-detalle-info">
          <div><span>Código de solicitud</span><strong>{codigoMaqueta(solicitud.id)}</strong></div>
          <div><span>Cliente</span><strong><Link to={`/customers/${solicitud.customerId}`} title="Ver historial del cliente">{solicitud.customerName}</Link></strong></div>
          <div><span>Institución</span><strong>{solicitud.institution}</strong></div>
          <div><span>Fecha de registro</span><strong>{new Date(solicitud.requestedAt).toLocaleDateString("es-BO")}</strong></div>
        </div>
      </section>
      <section className="maqueta-detalle-card"><h2>Características de la maqueta</h2>
        <div className="maqueta-detalle-info">
          <div><span>Tipo de maqueta</span><strong>{solicitud.type}</strong></div>
          <div><span>Tamaño</span><strong>{solicitud.size}</strong></div>
        </div>
      </section>
      <section className="maqueta-detalle-card"><h2>Fecha de entrega</h2>
        <div className="maqueta-detalle-info">
          <div><span>Fecha</span><strong>{fechaEntrega(solicitud.deliveryAt)}</strong></div>
          <div><span>Hora</span><strong>{horaEntrega(solicitud.deliveryAt)}</strong></div>
        </div>
        {alerta && <p className={`maqueta-alerta ${alerta.clase}`}>{alerta.texto}</p>}
      </section>
      <section className="maqueta-detalle-card"><h2>Observaciones</h2>
        <div className="maqueta-detalle-observaciones">{solicitud.observations || "No se registraron observaciones."}</div>
      </section>
    </div>
    <section className="maqueta-pagos-section"><div className="maqueta-pagos-header"><div><h2>Resumen de pagos</h2><p>Estado económico de la solicitud.</p></div><button className="maqueta-pagos-btn" disabled={solicitud.pendingBalance <= 0} onClick={() => setShowPayment(true)}>+ Registrar pago</button></div><div className="maqueta-resumen-pagos"><div className="maqueta-resumen-item"><span>Precio total</span><strong>{money(solicitud.agreedPrice)}</strong></div><div className="maqueta-resumen-item"><span>Total de anticipos</span><strong>{money(solicitud.totalPaid)}</strong></div><div className="maqueta-resumen-item"><span>Saldo pendiente</span><strong>{money(solicitud.pendingBalance)}</strong></div></div>{solicitud.payments.length ? <ul>{solicitud.payments.map(p => <li key={p.id}>{money(p.amount)} · {new Date(p.paidAt).toLocaleDateString("es-BO")}{p.note ? ` · ${p.note}` : ""}</li>)}</ul> : <p>Sin pagos registrados.</p>}{showPayment && <div className="maqueta-pagos-modal-overlay"><div className="maqueta-pagos-modal"><PagoMaquetaForm saldoPendiente={Number(solicitud.pendingBalance)} onGuardar={pay} onCancelar={() => setShowPayment(false)} /></div></div>}</section>
  </div>;
}

export default MaquetaDetallePage;
