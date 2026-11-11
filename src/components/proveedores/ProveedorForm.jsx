
import { useState } from "react";
import "./ProveedorForm.css";

function ProveedorForm({ onGuardar, onCancelar }) {
  const [formulario, setFormulario] = useState({
    nombre: "",
    nit: "",
    contacto: "",
    telefono: "",
    correo: "",
    direccion: "",
    observaciones: ""
  });

  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const manejarCambio = (e) => {
    const { name, value } = e.target;

    setFormulario({
      ...formulario,
      [name]: value
    });

    setError("");
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setError("");

    if (!formulario.nombre.trim()) {
      setError("El nombre del proveedor es obligatorio.");
      return;
    }

    if (!formulario.nit.trim()) {
      setError("El NIT es obligatorio.");
      return;
    }

    if (!formulario.telefono.trim()) {
      setError("El teléfono es obligatorio.");
      return;
    }

    if (!formulario.correo.trim()) {
      setError("El correo electrónico es obligatorio.");
      return;
    }

    try {
      setGuardando(true);

      await onGuardar(formulario);

      setFormulario({
        nombre: "",
        nit: "",
        contacto: "",
        telefono: "",
        correo: "",
        direccion: "",
        observaciones: ""
      });

    } catch (err) {
      setError(
        err.message || "No se pudo registrar el proveedor."
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="proveedor-overlay">
      <div className="proveedor-modal">

        <div className="proveedor-header">
          <div>
            <span className="proveedor-eyebrow">
              GESTIÓN DE ABASTECIMIENTO
            </span>

            <h2>Registrar proveedor</h2>

            <p>
              Completa la información del nuevo proveedor.
            </p>
          </div>

          <button
            type="button"
            className="proveedor-close"
            onClick={onCancelar}
            aria-label="Cerrar formulario"
          >
            ×
          </button>
        </div>

        <form onSubmit={manejarEnvio}>

          <div className="proveedor-form-grid">

            <label className="proveedor-full">
              Nombre o razón social *
              <input
                type="text"
                name="nombre"
                placeholder="Ej. Distribuidora San José"
                value={formulario.nombre}
                onChange={manejarCambio}
                required
              />
            </label>

            <label>
              NIT *
              <input
                type="text"
                name="nit"
                placeholder="Ingrese el NIT"
                value={formulario.nit}
                onChange={manejarCambio}
                required
              />
            </label>

            <label>
              Persona de contacto
              <input
                type="text"
                name="contacto"
                placeholder="Nombre del contacto"
                value={formulario.contacto}
                onChange={manejarCambio}
              />
            </label>

            <label>
              Teléfono *
              <input
                type="tel"
                name="telefono"
                placeholder="Ej. 70000000"
                value={formulario.telefono}
                onChange={manejarCambio}
                required
              />
            </label>

            <label>
              Correo electrónico *
              <input
                type="email"
                name="correo"
                placeholder="proveedor@correo.com"
                value={formulario.correo}
                onChange={manejarCambio}
                required
              />
            </label>

            <label className="proveedor-full">
              Dirección
              <input
                type="text"
                name="direccion"
                placeholder="Dirección del proveedor"
                value={formulario.direccion}
                onChange={manejarCambio}
              />
            </label>

            <label className="proveedor-full">
              Observaciones
              <textarea
                name="observaciones"
                placeholder="Información adicional del proveedor..."
                rows="3"
                value={formulario.observaciones}
                onChange={manejarCambio}
              />
            </label>

          </div>

          <p className="proveedor-required">
            * Los campos marcados son obligatorios.
          </p>

          {error && (
            <div className="proveedor-error" role="alert">
              ⚠ {error}
            </div>
          )}

          <div className="proveedor-actions">

            <button
              type="button"
              className="proveedor-cancel"
              onClick={onCancelar}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="proveedor-submit"
              disabled={guardando}
            >
              {guardando ? "Registrando..." : "✓ Registrar proveedor"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}

export default ProveedorForm;
