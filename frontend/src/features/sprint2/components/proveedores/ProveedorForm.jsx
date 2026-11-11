import { useState } from 'react';
import Dialog from '../Dialog';
import './ProveedorForm.css';
export default function ProveedorForm({ onGuardar, onCancelar }) {
  const [form, setForm] = useState({ identifier: '', name: '', contactName: '', phone: '', email: '', address: '' });
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const fields = [['name', 'Nombre o razón social *', 150, 'text'], ['identifier', 'Identificador del proveedor *', 40, 'text'], ['contactName', 'Persona de contacto', 150, 'text'], ['phone', 'Teléfono', 40, 'tel'], ['email', 'Correo electrónico', 254, 'email'], ['address', 'Dirección', 300, 'text']];
  return <Dialog title="Registrar proveedor" overlayClass="proveedor-overlay" className="proveedor-modal" busy={busy} onClose={onCancelar}>
    <div className="proveedor-header"><div><span className="proveedor-eyebrow">GESTIÓN DE ABASTECIMIENTO</span><h2>Registrar proveedor</h2><p>Completa los datos para identificarlo y contactarlo.</p></div><button className="proveedor-close" disabled={busy} onClick={onCancelar} aria-label="Cerrar formulario">×</button></div>
    <form onSubmit={async e => { e.preventDefault(); if (busy) return; setError('');
      if (!form.identifier.trim() || !form.name.trim()) { setError('El identificador y el nombre son obligatorios.'); return; }
      if (!form.phone.trim() && !form.email.trim()) { setError('Registra al menos un teléfono o correo de contacto.'); return; }
      setBusy(true);
      try { await onGuardar(Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim() || null]))); }
      catch (e) { setError(e.message || 'No se pudo registrar el proveedor.'); }
      finally { setBusy(false); }
    }}><fieldset disabled={busy}><legend className="sr-only">Datos del proveedor</legend><div className="proveedor-form-grid">{fields.map(([key, label, max, type]) => <label key={key} className={key === 'name' || key === 'address' ? 'proveedor-full' : ''}>{label}<input type={type} required={key === 'identifier' || key === 'name'} maxLength={max} value={form[key]} onChange={e => { setForm(v => ({ ...v, [key]: e.target.value })); setError(''); }}/></label>)}</div><p className="proveedor-required">Nombre e identificador obligatorios. Indica teléfono, correo o ambos.</p>
    {error && <div className="proveedor-error" role="alert">{error}</div>}
    <div className="proveedor-actions"><button type="button" className="proveedor-cancel" onClick={onCancelar}>Cancelar</button><button type="submit" className="proveedor-submit">{busy ? 'Registrando…' : 'Registrar proveedor'}</button></div></fieldset></form>
  </Dialog>;
}
