import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Dialog from "../features/sprint2/components/Dialog.jsx";
import MaquetaForm from "../components/maquetas/MaquetaForm";
import { EstadoBadge } from "../components/maquetas/EstadoMaqueta.jsx";
import { customersApi, mockupsApi } from "../services/sprint3";
import { ESTADOS_MAQUETA, alertaEntrega, codigoMaqueta, fechaEntrega, horaEntrega } from "./maquetasFormato";
import "./MaquetasPage.css";

const TONO_TARJETA = { Todos: "#c9c3b8", Requested: "#f5c542", InProgress: "#315b91", Completed: "#4f9d69", Delivered: "#243b5a", Cancelled: "#b3aca2" };

function MaquetasPage() {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState([]), [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [version, setVersion] = useState(0);
  const [busqueda, setBusqueda] = useState(""), [estado, setEstado] = useState("Todos");
  const [mostrarFormulario, setMostrarFormulario] = useState(false), [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);
  // Mientras se guarda, la ventana no se puede cerrar con Escape ni con clic afuera.
  const bloquear = accion => async input => { setGuardando(true); try { return await accion(input); } finally { setGuardando(false); } };

  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    Promise.all([mockupsApi.list(controller.signal), customersApi.list(controller.signal)])
      .then(([mockups, customers]) => { setSolicitudes(mockups); setClientes(customers); })
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

  async function registrarSolicitud(input) {
    const creada = await mockupsApi.create(input);
    setSolicitudes(actual => [creada, ...actual.filter(s => s.id !== creada.id)]);
    setMostrarFormulario(false);
    setMensaje(`Solicitud ${codigoMaqueta(creada.id)} registrada para ${creada.customerName}. Entrega: ${fechaEntrega(creada.deliveryAt)} a las ${horaEntrega(creada.deliveryAt)}.`);
  }

  const texto = busqueda.trim().toLowerCase();
  const filtradas = solicitudes.filter(s => (estado === "Todos" || s.status === estado)
    && `${codigoMaqueta(s.id)} ${s.id} ${s.customerName} ${s.institution}`.toLowerCase().includes(texto));
  const contar = status => solicitudes.filter(s => s.status === status).length;
  const stat = valor => (loading || error ? "—" : valor);

  return <div className="maquetas-page">
    <div className="maquetas-header">
      <div><h1>Gestión de maquetas</h1><p>Registra y organiza las solicitudes de elaboración de maquetas.</p></div>
      <button className="maquetas-btn-nuevo" disabled={loading || Boolean(error)} onClick={() => { setMensaje(""); setMostrarFormulario(true); }}>+ Nueva solicitud</button>
    </div>

    {mensaje && <p className="notice success" role="status">{mensaje}</p>}
    {error && <div className="notice error" role="alert">{error} <button className="secondary maquetas-reintentar" onClick={() => setVersion(v => v + 1)}>Reintentar</button></div>}

    <div className="maquetas-stats" role="group" aria-label="Solicitudes por estado (pulsa una tarjeta para filtrar)">
      {[["Todos", "Total de solicitudes", solicitudes.length], ...Object.entries(ESTADOS_MAQUETA).map(([valor, etiqueta]) => [valor, etiqueta, contar(valor)])]
        .map(([valor, label, value]) => <button type="button" key={valor} className="maqueta-stat-card es-filtro" aria-pressed={estado === valor}
          style={{ "--tono": TONO_TARJETA[valor] }} onClick={() => setEstado(valor)}>
          <span>{label}</span><strong>{stat(value)}</strong>
        </button>)}
    </div>

    <div className="maquetas-listado">
      <div className="maquetas-listado-header">
        <h2>Solicitudes registradas</h2>
        <div className="maquetas-filtros">
          <label className="sr-only" htmlFor="maquetas-busqueda">Buscar solicitudes</label>
          <input id="maquetas-busqueda" type="search" placeholder="Buscar cliente, institución o código..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="maquetas-busqueda" />
          <label className="sr-only" htmlFor="maquetas-estado">Filtrar por estado</label>
          <select id="maquetas-estado" className="maquetas-busqueda maquetas-estado-filtro" value={estado} onChange={e => setEstado(e.target.value)}>
            <option value="Todos">Todos los estados</option>
            {Object.entries(ESTADOS_MAQUETA).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
          </select>
        </div>
      </div>

      {!error && <div className="maquetas-table-container">
        <table className="maquetas-table">
          <thead><tr><th>Código</th><th>Cliente</th><th>Institución</th><th>Tipo</th><th>Entrega</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {loading
              ? <tr><td colSpan="7" role="status">Cargando solicitudes…</td></tr>
              : filtradas.map(s => {
                const alerta = alertaEntrega(s);
                return <tr key={s.id}>
                  <td className="maqueta-codigo">{codigoMaqueta(s.id)}</td>
                  <td>{s.customerName}</td>
                  <td>{s.institution}</td>
                  <td>{s.type}<br /><small>{s.size}</small></td>
                  <td>{fechaEntrega(s.deliveryAt)}<br /><small>{horaEntrega(s.deliveryAt)}</small>{alerta && <span className={`maqueta-alerta ${alerta.clase}`}>{alerta.texto}</span>}</td>
                  <td><EstadoBadge status={s.status} /></td>
                  <td><button className="maqueta-btn-ver" aria-label={`Ver solicitud ${codigoMaqueta(s.id)}`} onClick={() => navigate(`/maquetas/${s.id}`)}>Ver</button></td>
                </tr>;
              })}
            {!loading && !filtradas.length && <tr><td colSpan="7" className="maquetas-vacio">
              {solicitudes.length ? "No se encontraron solicitudes con esos filtros." : "Todavía no hay solicitudes de maquetas."}
            </td></tr>}
          </tbody>
        </table>
      </div>}
    </div>

    {mostrarFormulario && <Dialog title="Nueva solicitud de maqueta" overlayClass="maqueta-modal-overlay" className="maqueta-modal" busy={guardando} onClose={() => setMostrarFormulario(false)}>
      <MaquetaForm clientes={clientes} onCrearCliente={bloquear(crearCliente)} onGuardar={bloquear(registrarSolicitud)} onCancelar={() => setMostrarFormulario(false)} />
    </Dialog>}
  </div>;
}

export default MaquetasPage;
