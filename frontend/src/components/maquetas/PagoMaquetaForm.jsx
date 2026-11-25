import { useState } from "react";
import "./PagoMaquetaForm.css";

function PagoMaquetaForm({ saldoPendiente, onGuardar, onCancelar }) {
  const [monto, setMonto] = useState(""), [nota, setNota] = useState(""), [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault(); const amount = Number(monto);
    if (!Number.isFinite(amount) || amount <= 0) return setError("El monto debe ser mayor a cero.");
    if (amount > saldoPendiente) return setError(`El monto supera el saldo disponible de Bs ${saldoPendiente.toFixed(2)}.`);
    try { await onGuardar({ amount, note: nota.trim() || null }); } catch (err) { setError(err.message || "No se pudo registrar el pago."); }
  }
  return <div className="pago-form-container"><form className="pago-form" onSubmit={submit}><div className="pago-form-header"><h2>Registrar nuevo pago</h2><p>Saldo pendiente: Bs {saldoPendiente.toFixed(2)}</p></div><div className="pago-form-group"><label htmlFor="monto-pago">Monto del pago (Bs) *</label><input id="monto-pago" type="number" min="0.01" max={saldoPendiente} step="0.01" value={monto} onChange={e => setMonto(e.target.value)} /></div><div className="pago-form-group"><label htmlFor="nota-pago">Nota</label><input id="nota-pago" maxLength="300" value={nota} onChange={e => setNota(e.target.value)} /></div>{error && <div className="pago-form-error" role="alert">{error}</div>}<div className="pago-form-actions"><button type="button" className="pago-btn-cancelar" onClick={onCancelar}>Cancelar</button><button type="submit" className="pago-btn-guardar">Registrar pago</button></div></form></div>;
}
export default PagoMaquetaForm;
