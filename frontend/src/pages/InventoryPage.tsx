import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Feedback } from '../components/Feedback';
import { useStock } from '../components/useStock';
import { inventory } from '../services/inventory';
import type { Movement, MovementType } from '../types/inventory';

export function InventoryPage() {
  const { items, loading, error, refresh } = useStock();
  const [query, setQuery] = useState(''); const [selectedId, setSelectedId] = useState<number>();
  const [type, setType] = useState<MovementType>('Entry'); const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState(''); const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState(''); const [success, setSuccess] = useState('');
  const [movements, setMovements] = useState<Movement[]>([]); const [historyError, setHistoryError] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false); const [historyVersion, setHistoryVersion] = useState(0);
  const selected = items.find(p => p.productId === selectedId);
  useEffect(() => {
    if (!selectedId) return;
    const controller = new AbortController(); setHistoryLoading(true); setHistoryError(''); setMovements([]);
    inventory.movements(selectedId, controller.signal).then(setMovements).catch(e => { if (!controller.signal.aborted) setHistoryError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setHistoryLoading(false); });
    return () => controller.abort();
  }, [selectedId, historyVersion]);
  return <><div className="page-heading"><div><p className="eyebrow">CONTROL DE INVENTARIO</p><h1>Existencias claras.</h1><p className="muted">Registra entradas y salidas con su motivo y consulta el historial.</p></div><button className="secondary" disabled={loading || busy} onClick={refresh}>Actualizar existencias</button></div>
    <Feedback error={error} loading={loading} loadingMessage="Consultando existencias…"/>
    {error && <button onClick={refresh}>Reintentar</button>}
    {success && <p className="notice success" role="status">{success}</p>}
    {!error && !loading && <section className="panel catalog"><div className="catalog-heading"><h2>Stock por producto</h2><label className="search">Buscar por nombre o código<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar productos…"/></label></div>
      {items.length ? <div className="table-scroll"><table><thead><tr><th>Producto</th><th>Código</th><th>Estado</th><th>Existencias</th><th>Acción</th></tr></thead><tbody>{items.filter(p => `${p.name} ${p.code}`.toLowerCase().includes(query.toLowerCase())).map(p => <tr key={p.productId}><td>{p.name}</td><td>{p.code}</td><td><span className={`badge ${p.isActive ? '' : 'inactive'}`}>{p.isActive ? 'Activo' : 'Inactivo'}</span></td><td><strong>{p.stock}</strong></td><td><button className="secondary" disabled={busy} onClick={() => { setSelectedId(p.productId); setFormError(''); setQuantity(''); setReason(''); setSuccess(''); }}>Gestionar</button></td></tr>)}</tbody></table>{!items.some(p => `${p.name} ${p.code}`.toLowerCase().includes(query.toLowerCase())) && <p className="empty">Sin coincidencias.</p>}</div> : <div className="empty"><p>Registra productos para comenzar a controlar sus existencias.</p><Link to="/products/new">Registrar producto →</Link></div>}
    </section>}
    {selected && <div className="inventory-grid"><section className="panel detail"><h2>{selected.name}</h2><p className="muted">Código {selected.code} · Saldo consultado: <strong>{selected.stock}</strong></p>
      {!selected.isActive && <p className="notice">Producto inactivo: conserva su historial, pero no admite nuevos movimientos.</p>}
      <form onSubmit={async e => {
        e.preventDefault(); if (busy) return;
        const amount = Number(quantity);
        if (!Number.isInteger(amount) || amount <= 0 || amount > 2147483647 || !reason.trim()) { setFormError('Ingresa una cantidad entera positiva y un motivo.'); return; }
        if (type === 'Exit' && amount > selected.stock) { setFormError('La salida supera las existencias consultadas. Actualiza el saldo si cambió.'); return; }
        setBusy(true); setFormError(''); setSuccess('');
        try { const result = await inventory.adjust(selected.productId, { type, quantity: amount, reason: reason.trim() }); setSuccess(`Movimiento registrado. Nuevo saldo guardado: ${result.currentStock} unidades.`); setQuantity(''); setReason(''); refresh(); setHistoryVersion(v => v + 1); }
        catch (e) { setFormError((e as Error).message); refresh(); }
        finally { setBusy(false); }
      }}><Feedback error={formError}/><fieldset disabled={busy || loading || !selected.isActive}><legend>Registrar ajuste</legend><label>Tipo de movimiento<select value={type} onChange={e => setType(e.target.value as MovementType)}><option value="Entry">Entrada</option><option value="Exit">Salida</option></select></label><label>Cantidad *<input required type="number" min="1" max="2147483647" step="1" value={quantity} onChange={e => setQuantity(e.target.value)}/></label><label>Motivo *<textarea required maxLength={300} rows={3} value={reason} onChange={e => setReason(e.target.value)}/></label><button type="submit">{busy ? 'Guardando…' : 'Guardar movimiento'}</button></fieldset></form>
    </section><section className="panel detail"><h2>Movimientos recientes</h2><p className="muted">Últimos 50 registros de {selected.code}.</p><Feedback error={historyError} loading={historyLoading} loadingMessage="Consultando movimientos…"/>{historyError && <button className="secondary" onClick={() => setHistoryVersion(v => v + 1)}>Reintentar historial</button>}{!historyError && !historyLoading && (movements.length ? <ol className="movement-list">{movements.map(m => <li key={m.id}><div><span className={`badge ${m.type === 'Entry' ? '' : 'inactive'}`}>{m.type === 'Entry' ? 'Entrada' : 'Salida'} · {m.quantity}</span><time dateTime={m.registeredAt}>{new Date(m.registeredAt).toLocaleString('es-BO')}</time></div><p>{m.reason}</p></li>)}</ol> : <p className="empty">Este producto todavía no tiene movimientos.</p>)}</section></div>}
  </>;
}
