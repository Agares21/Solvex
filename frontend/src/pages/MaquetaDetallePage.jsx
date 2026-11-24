
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./MaquetaDetallePage.css";

function MaquetaDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const solicitud = location.state?.solicitud;

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";

    const [year, month, day] = fecha.split("-");
    return `${day}/${month}/${year}`;
  };

  if (!solicitud) {
    return (
      <div className="maqueta-detalle-page">
        <div className="maqueta-detalle-vacio">
          <h2>Solicitud no encontrada</h2>
          <p>No se encontraron los datos de la solicitud.</p>

          <button
            className="maqueta-detalle-btn-volver"
            onClick={() => navigate("/maquetas")}
          >
            Volver al listado
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="maqueta-detalle-page">
      <button
        className="maqueta-detalle-btn-volver"
        onClick={() => navigate("/maquetas")}
      >
        ← Volver a solicitudes
      </button>

      <div className="maqueta-detalle-header">
        <div>
          <h1>Detalle de solicitud</h1>
          <p>Información completa del trabajo solicitado.</p>
        </div>

        <span
          className={`maqueta-estado maqueta-estado-${solicitud.estado
            .toLowerCase()
            .replace(" ", "-")}`}
        >
          {solicitud.estado}
        </span>
      </div>

      <div className="maqueta-detalle-grid">
        <section className="maqueta-detalle-card">
          <h2>Información general</h2>

          <div className="maqueta-detalle-info">
            <div>
              <span>Código de solicitud</span>
              <strong>{solicitud.id || id}</strong>
            </div>

            <div>
              <span>Cliente</span>
              <strong>{solicitud.cliente}</strong>
            </div>

            <div>
              <span>Institución</span>
              <strong>{solicitud.institucion}</strong>
            </div>

            <div>
              <span>Fecha de registro</span>
              <strong>{solicitud.fechaRegistro || "-"}</strong>
            </div>
          </div>
        </section>

        <section className="maqueta-detalle-card">
          <h2>Características de la maqueta</h2>

          <div className="maqueta-detalle-info">
            <div>
              <span>Tipo de maqueta</span>
              <strong>{solicitud.tipo}</strong>
            </div>

            <div>
              <span>Tamaño</span>
              <strong>{solicitud.tamano}</strong>
            </div>
          </div>
        </section>

        <section className="maqueta-detalle-card">
          <h2>Fecha de entrega</h2>

          <div className="maqueta-detalle-info">
            <div>
              <span>Fecha</span>
              <strong>{formatearFecha(solicitud.fechaEntrega)}</strong>
            </div>

            <div>
              <span>Hora</span>
              <strong>{solicitud.horaEntrega}</strong>
            </div>
          </div>
        </section>

        <section className="maqueta-detalle-card">
          <h2>Observaciones</h2>

          <div className="maqueta-detalle-observaciones">
            {solicitud.observaciones?.trim()
              ? solicitud.observaciones
              : "No se registraron observaciones."}
          </div>
        </section>
      </div>
    </div>
  );
}

export default MaquetaDetallePage;
