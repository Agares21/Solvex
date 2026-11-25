import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PagoMaquetaForm from "../components/maquetas/PagoMaquetaForm";
import { mockupsApi } from "../services/sprint3";
import "./MaquetaDetallePage.css";

const labels = { Requested: "Pendiente", InProgress: "En proceso", Completed: "Completada" };
const money = value => `Bs ${Number(value).toFixed(2)}`;

function MaquetaDetallePage() {
  const { id } = useParams(), navigate = useNavigate();
  const [solicitud, setSolicitud] = useState(null), [error, setError] = useState(""), [showPayment, setShowPayment] = useState(false);
  const load = signal => mockupsApi.get(id, signal).then(setSolicitud).catch(e => { if (!signal?.aborted) setError(e.message); });
  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort(); }, [id]);
  async function pay(input) { const updated = await mockupsApi.pay(id, input); setSolicitud(updated); setShowPayment(false); }
  if (error) return <div className="maqueta-detalle-page"><div className="maqueta-detalle-vacio"><h2>Solicitud no encontrada</h2><p>{error}</p><button className="maqueta-detalle-btn-volver" onClick={() => navigate("/maquetas")}>Volver al listado</button></div></div>;
  if (!solicitud) return <div className="maqueta-detalle-page">Cargando solicitud...</div>;
  const state = labels[solicitud.status] || solicitud.status, delivery = new Date(solicitud.deliveryAt);
  return <div className="maqueta-detalle-page"><button className="maqueta-detalle-btn-volver" onClick={() => navigate("/maquetas")}>← Volver a solicitudes</button><div className="maqueta-detalle-header"><div><h1>Detalle de solicitud</h1><p>Información completa del trabajo solicitado.</p></div><span className={`maqueta-estado maqueta-estado-${state.toLowerCase().replace(" ", "-")}`}>{state}</span></div>
    <div className="maqueta-detalle-grid"><section className="maqueta-detalle-card"><h2>Información general</h2><div className="maqueta-detalle-info"><div><span>Código de solicitud</span><strong>MAQ-{String(solicitud.id).padStart(3, "0")}</strong></div><div><span>Cliente</span><strong>{solicitud.customerName}</strong></div><div><span>Institución</span><strong>{solicitud.institution}</strong></div><div><span>Fecha de registro</span><strong>{new Date(solicitud.requestedAt).toLocaleDateString("es-BO")}</strong></div></div></section>
      <section className="maqueta-detalle-card"><h2>Características de la maqueta</h2><div className="maqueta-detalle-info"><div><span>Tipo de maqueta</span><strong>{solicitud.type}</strong></div><div><span>Tamaño</span><strong>{solicitud.size}</strong></div></div></section>
      <section className="maqueta-detalle-card"><h2>Fecha de entrega</h2><div className="maqueta-detalle-info"><div><span>Fecha</span><strong>{delivery.toLocaleDateString("es-BO")}</strong></div><div><span>Hora</span><strong>{delivery.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}</strong></div></div></section><section className="maqueta-detalle-card"><h2>Observaciones</h2><div className="maqueta-detalle-observaciones">{solicitud.observations || "No se registraron observaciones."}</div></section></div>
    <section className="maqueta-pagos-section"><div className="maqueta-pagos-header"><div><h2>Resumen de pagos</h2><p>Estado económico de la solicitud.</p></div><button className="maqueta-pagos-btn" disabled={solicitud.pendingBalance <= 0} onClick={() => setShowPayment(true)}>+ Registrar pago</button></div><div className="maqueta-resumen-pagos"><div className="maqueta-resumen-item"><span>Precio total</span><strong>{money(solicitud.agreedPrice)}</strong></div><div className="maqueta-resumen-item"><span>Total de anticipos</span><strong>{money(solicitud.totalPaid)}</strong></div><div className="maqueta-resumen-item"><span>Saldo pendiente</span><strong>{money(solicitud.pendingBalance)}</strong></div></div>{solicitud.payments.length ? <ul>{solicitud.payments.map(p => <li key={p.id}>{money(p.amount)} · {new Date(p.paidAt).toLocaleDateString("es-BO")}{p.note ? ` · ${p.note}` : ""}</li>)}</ul> : <p>Sin pagos registrados.</p>}{showPayment && <div className="maqueta-pagos-modal-overlay"><div className="maqueta-pagos-modal"><PagoMaquetaForm saldoPendiente={Number(solicitud.pendingBalance)} onGuardar={pay} onCancelar={() => setShowPayment(false)} /></div></div>}</section>
  </div>;
}
export default MaquetaDetallePage;
