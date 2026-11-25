
import { useState } from "react";
import "./MaquetaForm.css";

function MaquetaForm({ onGuardar, onCancelar }) {
  const [cliente, setCliente] = useState("");
  const [institucion, setInstitucion] = useState("");
  const [tipo, setTipo] = useState("");
  const [tamano, setTamano] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [horaEntrega, setHoraEntrega] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const obtenerFechaMinima = () => {
    const ahora = new Date();
    const offset = ahora.getTimezoneOffset() * 60000;

    return new Date(ahora.getTime() - offset)
      .toISOString()
      .slice(0, 16);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !cliente.trim() ||
      !institucion.trim() ||
      !tipo ||
      !tamano ||
      !fechaEntrega ||
      !horaEntrega
    ) {
      alert("Por favor, complete todos los campos obligatorios.");
      return;
    }

    const fechaCompleta = new Date(
      `${fechaEntrega}T${horaEntrega}`
    );

    if (isNaN(fechaCompleta.getTime())) {
      alert("La fecha y hora de entrega no son válidas.");
      return;
    }

    if (fechaCompleta <= new Date()) {
      alert("La fecha y hora de entrega deben ser futuras.");
      return;
    }

    const solicitud = {
      cliente: cliente.trim(),
      institucion: institucion.trim(),
      tipo,
      tamano,
      fechaEntrega,
      horaEntrega,
      observaciones: observaciones.trim(),
    };

    onGuardar(solicitud);
  };

  return (
    <div className="maqueta-form-container">
      <form className="maqueta-form" onSubmit={handleSubmit}>
        <div className="maqueta-form-header">
          <h2>Nueva solicitud de maqueta</h2>
          <p>Complete los datos para registrar el trabajo solicitado.</p>
        </div>

        <div className="maqueta-form-grid">
          <div className="maqueta-form-group">
            <label htmlFor="maqueta-cliente">
              Nombre del cliente *
            </label>

            <input
              id="maqueta-cliente"
              type="text"
              placeholder="Nombre completo del cliente"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
            />
          </div>

          <div className="maqueta-form-group">
            <label htmlFor="maqueta-institucion">
              Institución *
            </label>

            <input
              id="maqueta-institucion"
              type="text"
              placeholder="Nombre de la institución"
              value={institucion}
              onChange={(e) => setInstitucion(e.target.value)}
            />
          </div>

          <div className="maqueta-form-group">
            <label htmlFor="maqueta-tipo">
              Tipo de maqueta *
            </label>

            <select
              id="maqueta-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="">Seleccione el tipo</option>
              <option value="Arquitectónica">Arquitectónica</option>
              <option value="Educativa">Educativa</option>
              <option value="Escolar">Escolar</option>
              <option value="Industrial">Industrial</option>
              <option value="Paisajística">Paisajística</option>
              <option value="Otra">Otra</option>
            </select>
          </div>

          <div className="maqueta-form-group">
            <label htmlFor="maqueta-tamano">
              Tamaño *
            </label>

            <select
              id="maqueta-tamano"
              value={tamano}
              onChange={(e) => setTamano(e.target.value)}
            >
              <option value="">Seleccione el tamaño</option>
              <option value="Pequeña">Pequeña</option>
              <option value="Mediana">Mediana</option>
              <option value="Grande">Grande</option>
              <option value="Personalizada">Personalizada</option>
            </select>
          </div>

          <div className="maqueta-form-group">
            <label htmlFor="maqueta-fecha">
              Fecha de entrega *
            </label>

            <input
              id="maqueta-fecha"
              type="date"
              min={obtenerFechaMinima().slice(0, 10)}
              value={fechaEntrega}
              onChange={(e) => setFechaEntrega(e.target.value)}
            />
          </div>

          <div className="maqueta-form-group">
            <label htmlFor="maqueta-hora">
              Hora de entrega *
            </label>

            <input
              id="maqueta-hora"
              type="time"
              value={horaEntrega}
              onChange={(e) => setHoraEntrega(e.target.value)}
            />
          </div>
        </div>

        <div className="maqueta-form-group maqueta-observaciones">
          <label htmlFor="maqueta-observaciones">
            Observaciones
          </label>

          <textarea
            id="maqueta-observaciones"
            placeholder="Detalles adicionales, materiales, características..."
            rows="4"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </div>

        <div className="maqueta-form-actions">
          <button
            type="button"
            className="maqueta-btn-cancelar"
            onClick={onCancelar}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="maqueta-btn-guardar"
          >
            Registrar solicitud
          </button>
        </div>
      </form>
    </div>
  );
}

export default MaquetaForm;
