import { ESTILO_ESTADO, RECORRIDO_MAQUETA, claseEstadoMaqueta, estadoMaqueta } from "../../pages/maquetasFormato";
import "./EstadoMaqueta.css";

/** Etiqueta de color con ícono para el estado de una maqueta. */
export function EstadoBadge({ status }) {
  return <span className={claseEstadoMaqueta(status)} data-icono={ESTILO_ESTADO[status]?.icono ?? "•"}>{estadoMaqueta(status)}</span>;
}

/** Barra de avance: Pendiente → En proceso → Terminada → Entregada. Una solicitud cancelada se muestra cortada. */
export function EstadoProgreso({ status }) {
  const cancelada = status === "Cancelled";
  const actual = RECORRIDO_MAQUETA.indexOf(status);
  return <ol className={`maqueta-progreso${cancelada ? " is-cancelada" : ""}`} aria-label="Avance del trabajo">
    {RECORRIDO_MAQUETA.map((paso, i) => {
      const fase = cancelada ? "omitido" : i < actual ? "hecho" : i === actual ? "actual" : "pendiente";
      return <li key={paso} className={`maqueta-paso maqueta-paso-${fase}`} aria-current={fase === "actual" ? "step" : undefined}>
        <span className="maqueta-paso-punto" aria-hidden="true">{fase === "hecho" ? "✓" : i + 1}</span>
        <span className="maqueta-paso-nombre">{estadoMaqueta(paso)}</span>
      </li>;
    })}
  </ol>;
}
