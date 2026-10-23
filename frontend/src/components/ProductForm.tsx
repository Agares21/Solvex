import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ProductInput } from '../types/product';
import { Feedback } from './Feedback';

export function ProductForm({ initial, onSave }: { initial?: ProductInput; onSave: (input: ProductInput) => Promise<void> }) {
  const [code, setCode] = useState(initial?.code ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [price, setPrice] = useState(initial?.price.toString() ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <form className="panel form" onSubmit={async event => {
    event.preventDefault(); if (busy) return;
    if (!code.trim() || !name.trim() || !price.trim() || !Number.isFinite(Number(price)) || Number(price) < 0) { setError('Completa el código, el nombre y un precio válido.'); return; }
    setBusy(true); setError('');
    try { await onSave({ code: code.trim(), name: name.trim(), description: description.trim() || null, price: Number(price) }); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar el producto.'); }
    finally { setBusy(false); }
  }}>
    <Feedback error={error}/>
    <fieldset disabled={busy}><legend>Información del producto</legend>
      <p className="muted">Los campos marcados con * son obligatorios.</p>
      <div className="form-grid"><label>Código *<input required maxLength={40} value={code} onChange={e => setCode(e.target.value)} autoComplete="off"/></label>
      <label>Precio (Bs) *<input required type="number" min="0" max="99999999.99" step="0.01" value={price} onChange={e => setPrice(e.target.value)}/></label></div>
      <label>Nombre *<input required maxLength={150} value={name} onChange={e => setName(e.target.value)}/></label>
      <label>Descripción<textarea maxLength={1000} rows={5} value={description} onChange={e => setDescription(e.target.value)}/></label>
    </fieldset><div className="actions"><button disabled={busy} type="submit">{busy ? 'Guardando…' : 'Guardar producto'}</button><Link className="button secondary" to="/products">Cancelar</Link></div>
  </form>;
}
