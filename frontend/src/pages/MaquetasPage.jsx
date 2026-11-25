import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MaquetaForm from "../components/maquetas/MaquetaForm";
import { customersApi, mockupsApi } from "../services/sprint3";
import "./MaquetasPage.css";

const labels = { Requested: "Pendiente", InProgress: "En proceso", Completed: "Completada" };

function MaquetasPage() {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState([]), [mostrarFormulario, setMostrarFormulario] = useState(false), [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState(""), [loading, setLoading] = useState(true);
  const load = signal => mockupsApi.list(signal).then(setSolicitudes).catch(e => { if (!signal?.aborted) setError(e.message); }).finally(() => { if (!signal?.aborted) setLoading(false); });
  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort(); }, []);
  async function registrarSolicitud(input) {
    setError("");
    const customer = await customersApi.create({ name: input.cliente });
    const created = await mockupsApi.create({ customerId: customer.id, institution: input.institucion, type: input.tipo, size: input.tamano, deliveryAt: `${input.fechaEntrega}T${input.horaEntrega}:00-04:00`, observations: input.observaciones || null, agreedPrice: Number(input.precioTotal) });
    setSolicitudes(current => [created, ...current]); setMostrarFormulario(false);
  }
  const filtered = solicitudes.filter(s => `${s.id} ${s.customerName} ${s.institution}`.toLowerCase().includes(busqueda.toLowerCase()));
  const count = status => solicitudes.filter(s => s.status === status).length;
  return <div className="maquetas-page"><div className="maquetas-header"><div><h1>Gestión de maquetas</h1><p>Registra y organiza las solicitudes de elaboración de maquetas.</p></div><button className="maquetas-btn-nuevo" onClick={() => setMostrarFormulario(true)}>+ Nueva solicitud</button></div>
    {error && <p className="notice error" role="alert">{error}</p>}
    <div className="maquetas-stats">{[["Total de solicitudes", solicitudes.length], ["Pendientes", count("Requested")], ["En proceso", count("InProgress")], ["Completadas", count("Completed")]].map(([label, value]) => <div className="maqueta-stat-card" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    <div className="maquetas-listado"><div className="maquetas-listado-header"><h2>Solicitudes registradas</h2><input type="text" placeholder="Buscar cliente, institución o código..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="maquetas-busqueda" /></div><div className="maquetas-table-container"><table className="maquetas-table"><thead><tr><th>Código</th><th>Cliente</th><th>Institución</th><th>Tipo</th><th>Entrega</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{loading ? <tr><td colSpan="7">Cargando solicitudes...</td></tr> : filtered.map(s => <tr key={s.id}><td className="maqueta-codigo">MAQ-{String(s.id).padStart(3, "0")}</td><td>{s.customerName}</td><td>{s.institution}</td><td>{s.type}</td><td>{new Date(s.deliveryAt).toLocaleDateString("es-BO")}<br/><small>{new Date(s.deliveryAt).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}</small></td><td><span className={`maqueta-estado maqueta-estado-${labels[s.status].toLowerCase().replace(" ", "-")}`}>{labels[s.status]}</span></td><td><button className="maqueta-btn-ver" onClick={() => navigate(`/maquetas/${s.id}`)}>Ver</button></td></tr>)}{!loading && !filtered.length && <tr><td colSpan="7" className="maquetas-vacio">No se encontraron solicitudes.</td></tr>}</tbody></table></div></div>
    {mostrarFormulario && <div className="maqueta-modal-overlay"><div className="maqueta-modal"><MaquetaForm onGuardar={registrarSolicitud} onCancelar={() => setMostrarFormulario(false)} /></div></div>}
  </div>;
}
export default MaquetasPage;
