import { useState } from "react";
import { ESTADOS_MAQUETA, esEstadoMaqueta, estadoMaqueta, siguientesEstados } from "../../pages/maquetasFormato";

function mensajeDeError(err, destino) {
  if (err?.status === 400) return `El servidor no aceptó el estado «${estadoMaqueta(destino)}». Verifica que el backend tenga habilitado ese estado.`;
  if (err?.status === 409) return `${err.message} Se muestra el estado actual guardado.`;
  return err?.message || "No se pudo cambiar el estado. Inténtalo nuevamente.";
}

/**
 * Selector del estado de una maqueta (HU-09).
 * Solo habilita los estados a los que se puede pasar desde el actual; cancelar pide confirmación.
 * `onCambiar(status)` debe guardar en la API y lanzar un error si falla.
 */
function SelectorEstadoMaqueta({ estado, onCambiar }) {
  const opciones = siguientesEstados(estado);
  const [nuevo, setNuevo] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  async function guardar(e) {
    e.preventDefault();
    if (guardando) return;
    setExito("");
    if (!esEstadoMaqueta(nuevo) || !opciones.includes(nuevo)) { setError("Selecciona uno de los estados disponibles."); return; }
    if (nuevo === "Cancelled" && !confirmando) { setConfirmando(true); setError(""); return; }
    setGuardando(true); setError("");
    try {
      await onCambiar(nuevo);
      setExito(`Estado actualizado a «${estadoMaqueta(nuevo)}».`);
      setNuevo("");
    } catch (err) {
      setError(mensajeDeError(err, nuevo));
    } finally {
      setGuardando(false); setConfirmando(false);
    }
  }

  const final = estado === "Delivered" ? "Este trabajo ya fue entregado: su estado es final."
    : estado === "Cancelled" ? "Esta solicitud fue cancelada: su estado es final." : "";

  return <div className="maqueta-selector-estado">
    {exito && <p className="maqueta-estado-mensaje exito" role="status">{exito}</p>}
    {final || !opciones.length
      ? <p className="maqueta-estado-final">{final || "No hay cambios de estado disponibles."}</p>
      : <form onSubmit={guardar} noValidate>
        <fieldset disabled={guardando}>
          <legend className="sr-only">Cambiar el estado del trabajo</legend>
          <div className="maqueta-selector-fila">
            <label htmlFor="maqueta-nuevo-estado">Cambiar estado a</label>
            <select id="maqueta-nuevo-estado" value={nuevo} onChange={e => { setNuevo(e.target.value); setError(""); setExito(""); setConfirmando(false); }}>
              <option value="">Selecciona el nuevo estado</option>
              {Object.entries(ESTADOS_MAQUETA).map(([valor, etiqueta]) => (
                <option key={valor} value={valor} disabled={!opciones.includes(valor)}>
                  {etiqueta}{valor === estado ? " (actual)" : ""}
                </option>
              ))}
            </select>
            {!confirmando && <button type="submit" className="maqueta-estado-guardar">{guardando ? "Guardando…" : "Guardar estado"}</button>}
          </div>
          <p className="maqueta-selector-ayuda">
            Desde «{estadoMaqueta(estado)}» puedes pasar a: {opciones.map(estadoMaqueta).join(" o ")}.
          </p>
          {confirmando && <div className="maqueta-estado-confirmar" role="group" aria-label="Confirmar cancelación">
            <p>¿Cancelar esta solicitud? El trabajo quedará como «Cancelada» y no podrá retomarse.</p>
            <div className="maqueta-estado-confirmar-acciones">
              <button type="submit" className="maqueta-estado-cancelar">{guardando ? "Guardando…" : "Sí, cancelar solicitud"}</button>
              <button type="button" className="secondary" onClick={() => setConfirmando(false)}>Volver</button>
            </div>
          </div>}
        </fieldset>
      </form>}
    {error && <p className="maqueta-estado-mensaje error" role="alert">{error}</p>}
  </div>;
}

export default SelectorEstadoMaqueta;
