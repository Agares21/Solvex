import { useState } from 'react';
import { Feedback } from '../components/Feedback';
import { useStock } from '../components/useStock';
import { inventory } from '../services/inventory';
import type { Availability } from '../types/inventory';

interface Row { key: number; productId: string; quantity: string }
export function AvailabilityPage() {
  const { items, loading, error, refresh } = useStock();
  const [rows, setRows] = useState<Row[]>([{ key: 0, productId: '', quantity: '1' }]);
  const [nextKey, setNextKey] = useState(1); const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState(''); const [result, setResult] = useState<Availability>();
  const change = (key: number, patch: Partial<Row>) => { setRows(values => values.map(r => r.key === key ? { ...r, ...patch } : r)); setResult(undefined); setFormError(''); };
  return <><div className="page-heading"><div><p className="eyebrow">DISPONIBILIDAD DE PRODUCTOS</p><h1>Comprueba antes de atender.</h1><p className="muted">Consulta uno o varios productos. Esta verificación no reserva ni descuenta existencias.</p></div></div>
    <Feedback error={error} loading={loading}/>{error && <button onClick={refresh}>Reintentar</button>}
    {!loading && !error && <form className="panel detail availability-form" onSubmit={async e => {
      e.preventDefault(); if (busy) return;
      const requested = rows.map(r => ({ productId: Number(r.productId), quantity: Number(r.quantity) }));
      if (requested.some(r => !r.productId || !Number.isInteger(r.quantity) || r.quantity <= 0 || r.quantity > 2147483647)) { setFormError('Selecciona productos y cantidades enteras positivas.'); return; }
      if (new Set(requested.map(r => r.productId)).size !== requested.length) { setFormError('Selecciona cada producto una sola vez.'); return; }
      setBusy(true); setResult(undefined); setFormError('');
      try { setResult(await inventory.availability({ items: requested })); } catch (e) { setFormError((e as Error).message); } finally { setBusy(false); }
    }}><h2>Productos solicitados</h2><p className="muted">Selecciona hasta 100 productos activos e indica las unidades necesarias.</p><Feedback error={formError}/>
      {!items.some(p => p.isActive) ? <p className="notice">No hay productos activos para consultar.</p> : <><fieldset disabled={busy}><legend className="sr-only">Lista de productos</legend>{rows.map((row, index) => <div className="availability-row" key={row.key}><label>Producto {index + 1}<select required value={row.productId} onChange={e => change(row.key, { productId: e.target.value })}><option value="">Selecciona un producto</option>{items.filter(p => p.isActive).map(p => <option key={p.productId} value={p.productId} disabled={rows.some(other => other.key !== row.key && other.productId === String(p.productId))}>{p.code} · {p.name}</option>)}</select></label><label>Cantidad solicitada<input required type="number" min="1" max="2147483647" step="1" value={row.quantity} onChange={e => change(row.key, { quantity: e.target.value })}/></label><button type="button" className="secondary" aria-label={`Quitar producto ${index + 1}`} disabled={rows.length === 1} onClick={() => { setRows(r => r.filter(p => p.key !== row.key)); setResult(undefined); }}>Quitar</button></div>)}<div className="actions"><button type="button" className="secondary" disabled={rows.length >= 100} onClick={() => { setRows(r => [...r, { key: nextKey, productId: '', quantity: '1' }]); setNextKey(v => v + 1); setResult(undefined); }}>+ Añadir producto</button><button type="submit">{busy ? 'Consultando…' : 'Comprobar disponibilidad'}</button></div></fieldset></>}
    </form>}
    {result && <section className="panel catalog availability-results"><h2>Resultado de la consulta</h2><p className={`notice ${result.allAvailable ? 'success' : ''}`} role="status">{result.allAvailable ? 'Hay existencias suficientes para todos los productos.' : 'Hay productos que no pueden cubrir la cantidad solicitada.'}</p><div className="table-scroll"><table><thead><tr><th>Producto</th><th>Solicitado</th><th>Existencias</th><th>Resultado</th><th>Faltante</th></tr></thead><tbody>{result.items.map(p => <tr key={p.productId}><td>{p.name}<br/><small>{p.code}</small></td><td>{p.requestedQuantity}</td><td>{p.availableQuantity}</td><td><span className={`badge ${p.isSufficient ? '' : 'inactive'}`}>{!p.isActive ? 'Inactivo' : p.isSufficient ? 'Suficiente' : 'Insuficiente'}</span></td><td>{p.missingQuantity}</td></tr>)}</tbody></table></div><p className="muted">Resultado al momento de consultar. No garantiza disponibilidad para un pedido futuro.</p></section>}
  </>;
}
