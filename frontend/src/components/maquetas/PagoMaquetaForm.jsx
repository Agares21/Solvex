
import { useState } from "react";
import "./PagoMaquetaForm.css";

function PagoMaquetaForm({ solicitud, onGuardar, onCancelar }) {
  const tienePrecio = Number(solicitud.precioTotal) > 0;

  const totalPagado = (solicitud.pagos || []).reduce(
    (total, pago) => total + Number(pago.monto),
    0
  );

  const saldoPendiente = tienePrecio
    ? Number(solicitud.precioTotal) - totalPagado
    : 0;

  const [precio, setPrecio] = useState(
    tienePrecio ? String(solicitud.precioTotal) : ""
  );

  const [monto, setMonto] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const nuevoPrecio = tienePrecio ? Number(precio) : Number(precio);
    const nuevoMonto = Number(monto);

    if (!tienePrecio && (!precio || !Number.isFinite(nuevoPrecio) || nuevoPrecio <= 0)) {
      setError("Ingrese un precio acordado mayor a cero.");
      return;
    }

    if (monto.trim() === "" || !Number.isFinite(nuevoMonto) || nuevoMonto < 0) {
      setError("Ingrese un monto válido. No se permiten valores negativos.");
      return;
    }

    if (tienePrecio && nuevoMonto <= 0) {
      setError("El monto del pago debe ser mayor a cero.");
      return;
    }

    const precioFinal = tienePrecio
      ? Number(solicitud.precioTotal)
      : nuevoPrecio;

    const saldoDisponible = tienePrecio
      ? saldoPendiente
      : precioFinal;

    if (nuevoMonto > saldoDisponible) {
      setError(
        `El monto supera el saldo disponible de Bs ${saldoDisponible.toFixed(2)}.`
      );
      return;
    }

    const pagosActualizados = [...(solicitud.pagos || [])];

    if (nuevoMonto > 0) {
      pagosActualizados.push({
        id: Date.now(),
        monto: nuevoMonto,
        tipo: tienePrecio ? "Pago" : "Anticipo",
        fecha: new Date().toLocaleDateString("es-BO"),
      });
    }

    onGuardar({
      ...solicitud,
      precioTotal: precioFinal,
      pagos: pagosActualizados,
    });
  };

  return (
    <div className="pago-form-container">
      <form className="pago-form" onSubmit={handleSubmit}>
        <div className="pago-form-header">
          <h2>
            {tienePrecio
              ? "Registrar nuevo pago"
              : "Registrar precio y anticipo"}
          </h2>
          <p>
            {tienePrecio
              ? "Registre el nuevo pago realizado por el cliente."
              : "Establezca el precio acordado y el anticipo inicial."}
          </p>
        </div>

        {!tienePrecio && (
          <div className="pago-form-group">
            <label htmlFor="precio-maqueta">
              Precio acordado (Bs) *
            </label>
            <input
              id="precio-maqueta"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Ej. 500"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
            />
          </div>
        )}

        <div className="pago-form-group">
          <label htmlFor="monto-pago">
            {tienePrecio ? "Monto del pago (Bs) *" : "Anticipo inicial (Bs)"}
          </label>

          <input
            id="monto-pago"
            type="number"
            min="0"
            step="0.01"
            placeholder="Ej. 150"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
          />

          {!tienePrecio && (
            <small>Si el cliente todavía no realizó un anticipo, puede dejarlo en 0.</small>
          )}
        </div>

        {error && (
          <div className="pago-form-error" role="alert">
            {error}
          </div>
        )}

        <div className="pago-form-actions">
          <button
            type="button"
            className="pago-btn-cancelar"
            onClick={onCancelar}
          >
            Cancelar
          </button>

          <button type="submit" className="pago-btn-guardar">
            Registrar pago
          </button>
        </div>
      </form>
    </div>
  );
}

export default PagoMaquetaForm;