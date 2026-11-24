
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MaquetaForm from "../components/maquetas/MaquetaForm";
import "./MaquetasPage.css";

function MaquetasPage() {
  const navigate = useNavigate();

  const [solicitudes, setSolicitudes] = useState([
    {
      id: "MAQ-001",
      cliente: "María López",
      institucion: "Colegio San Calixto",
      tipo: "Educativa",
      tamano: "Mediana",
      fechaEntrega: "2026-11-28",
      horaEntrega: "15:00",
      observaciones: "Maqueta del sistema solar",
      estado: "Pendiente",
      fechaRegistro: "23/11/2026",
    },
    {
      id: "MAQ-002",
      cliente: "Carlos Fernández",
      institucion: "Universidad Mayor de San Andrés",
      tipo: "Arquitectónica",
      tamano: "Grande",
      fechaEntrega: "2026-12-02",
      horaEntrega: "10:00",
      observaciones: "Proyecto de vivienda",
      estado: "En proceso",
      fechaRegistro: "23/11/2026",
    },
  ]);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const registrarSolicitud = (nuevaSolicitud) => {
    const solicitud = {
      ...nuevaSolicitud,
      id: `MAQ-${String(solicitudes.length + 1).padStart(3, "0")}`,
      estado: "Pendiente",
      fechaRegistro: new Date().toLocaleDateString("es-BO"),
    };

    setSolicitudes([solicitud, ...solicitudes]);
    setMostrarFormulario(false);
  };

  const solicitudesFiltradas = solicitudes.filter((solicitud) => {
    const texto = busqueda.toLowerCase();

    return (
      solicitud.id.toLowerCase().includes(texto) ||
      solicitud.cliente.toLowerCase().includes(texto) ||
      solicitud.institucion.toLowerCase().includes(texto)
    );
  });

  const pendientes = solicitudes.filter(
    (s) => s.estado === "Pendiente"
  ).length;

  const enProceso = solicitudes.filter(
    (s) => s.estado === "En proceso"
  ).length;

  const completadas = solicitudes.filter(
    (s) => s.estado === "Completada"
  ).length;

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";

    const [year, month, day] = fecha.split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="maquetas-page">
      <div className="maquetas-header">
        <div>
          <h1>Gestión de maquetas</h1>
          <p>Registra y organiza las solicitudes de elaboración de maquetas.</p>
        </div>

        <button
          className="maquetas-btn-nuevo"
          onClick={() => setMostrarFormulario(true)}
        >
          + Nueva solicitud
        </button>
      </div>

      <div className="maquetas-stats">
        <div className="maqueta-stat-card">
          <span>Total de solicitudes</span>
          <strong>{solicitudes.length}</strong>
        </div>

        <div className="maqueta-stat-card">
          <span>Pendientes</span>
          <strong>{pendientes}</strong>
        </div>

        <div className="maqueta-stat-card">
          <span>En proceso</span>
          <strong>{enProceso}</strong>
        </div>

        <div className="maqueta-stat-card">
          <span>Completadas</span>
          <strong>{completadas}</strong>
        </div>
      </div>

      <div className="maquetas-listado">
        <div className="maquetas-listado-header">
          <h2>Solicitudes registradas</h2>

          <input
            type="text"
            placeholder="Buscar cliente, institución o código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="maquetas-busqueda"
          />
        </div>

        <div className="maquetas-table-container">
          <table className="maquetas-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Institución</th>
                <th>Tipo</th>
                <th>Entrega</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {solicitudesFiltradas.map((solicitud) => (
                <tr key={solicitud.id}>
                  <td className="maqueta-codigo">{solicitud.id}</td>
                  <td>{solicitud.cliente}</td>
                  <td>{solicitud.institucion}</td>
                  <td>{solicitud.tipo}</td>
                  <td>
                    {formatearFecha(solicitud.fechaEntrega)}
                    <br />
                    <small>{solicitud.horaEntrega}</small>
                  </td>
                  <td>
                    <span
                      className={`maqueta-estado maqueta-estado-${solicitud.estado
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {solicitud.estado}
                    </span>
                  </td>
                  <td>
                    <button
                      className="maqueta-btn-ver"
                      onClick={() =>
                        navigate(`/maquetas/${solicitud.id}`, {
                          state: { solicitud },
                        })
                      }
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}

              {solicitudesFiltradas.length === 0 && (
                <tr>
                  <td colSpan="7" className="maquetas-vacio">
                    No se encontraron solicitudes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarFormulario && (
        <div className="maqueta-modal-overlay">
          <div className="maqueta-modal">
            <MaquetaForm
              onGuardar={registrarSolicitud}
              onCancelar={() => setMostrarFormulario(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default MaquetasPage;
