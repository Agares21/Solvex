import { useEffect, useState } from 'react';
import { purchasesApi } from '../../../../services/purchasing';
import CompraForm from './CompraForm';
import Dialog from '../Dialog';
import '../../App.css';
import './Compras.css';
const money = n => new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(n);
const date = value => new Date(value).toLocaleString('es-BO');
export default function Compras() {
  const [items, setItems] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [version, setVersion] = useState(0), [search, setSearch] = useState(''), [status, setStatus] = useState('All');
  const [showForm, setShowForm] = useState(false), [selected, setSelected] = useState(null), [detailBusy, setDetailBusy] = useState(false);
  const [receiveBusy, setReceiveBusy] = useState(false), [confirming, setConfirming] = useState(false), [detailError, setDetailError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => { const controller = new AbortController(); setLoading(true); setError('');
    purchasesApi.list(controller.signal).then(setItems).catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [version]);
  const visible = items.filter(p => `${p.id} ${p.supplierName}`.toLowerCase().includes(search.toLowerCase()) && (status === 'All' || p.status === status));
  async function detail(id) { setDetailBusy(true); setError(''); setDetailError(''); setConfirming(false);
    try { setSelected(await purchasesApi.get(id)); } catch (e) { setError(e.message); } finally { setDetailBusy(false); }
  }
  async function receive() {
    if (receiveBusy || !selected) return; setReceiveBusy(true); setDetailError('');
    try { setSelected(await purchasesApi.receive(selected.id)); setConfirming(false); setMessage('Compra recibida. Las existencias y los movimientos se guardaron correctamente.'); setVersion(v => v + 1); }
    catch (e) { setDetailError(e.message); setConfirming(false); try { setSelected(await purchasesApi.get(selected.id)); setVersion(v => v + 1); } catch { /* Mantener el error original y permitir cerrar. */ } }
    finally { setReceiveBusy(false); }
  }
  return <div className="sprint2"><div className="compras-page">
    <section className="compras-welcome"><div><span className="compras-eyebrow">ABASTECIMIENTO</span><h2>Control de compras</h2><p>Registra las compras y recibe sus productos en inventario.</p></div><div className="compras-decoration" aria-hidden="true">🛒</div></section>
    {message && <p className="notice success" role="status">{message}</p>}
    {error && <div className="notice error" role="alert">{error} <button onClick={() => setVersion(v => v + 1)}>Reintentar</button></div>}
    <section className="compras-stats">{[['Total de compras', items.length], ['Importe registrado', money(items.reduce((s, p) => s + p.total, 0))], ['Pendientes de recepción', items.filter(p => p.status === 'Pending').length]].map(([label, value]) => <article className="compra-stat-card" key={label}><div><span>{label}</span><h3>{loading || error ? '—' : value}</h3></div></article>)}</section>
    <section className="compras-panel"><div className="compras-panel-header"><div><h2>Historial de compras</h2><p>Información guardada en la base de datos.</p></div><button className="compra-modal-button" onClick={() => setShowForm(true)}>+ Nueva compra</button></div>
    <div className="compras-tools"><label className="compras-search"><span className="sr-only">Buscar compras</span><input type="search" placeholder="Buscar por código o proveedor..." value={search} onChange={e => setSearch(e.target.value)}/></label><label><span className="sr-only">Filtrar por estado</span><select className="compras-filter" value={status} onChange={e => setStatus(e.target.value)}><option value="All">Todos los estados</option><option value="Pending">Pendientes</option><option value="Received">Recibidas</option></select></label></div>
    {loading && <p className="notice" role="status">Cargando compras…</p>}{detailBusy && <p role="status">Consultando compra…</p>}
    {!loading && !error && <div className="compras-table-wrap"><table className="compras-table"><thead><tr><th>CÓDIGO</th><th>PROVEEDOR</th><th>REGISTRO</th><th>TOTAL</th><th>ESTADO</th><th>DETALLE</th></tr></thead><tbody>{visible.map(p => <tr key={p.id}><td><span className="compra-code">COMP-{p.id}</span></td><td><strong>{p.supplierName}</strong></td><td>{date(p.registeredAt)}</td><td className="compra-total">{money(p.total)}</td><td><span className={`compra-status ${p.status === 'Received' ? 'status-recibida' : 'status-pendiente'}`}>{p.status === 'Received' ? 'Recibida' : 'Pendiente'}</span></td><td><button className="compra-detail-button" disabled={detailBusy} onClick={() => detail(p.id)}>Ver detalle →</button></td></tr>)}</tbody></table>{!visible.length && <div className="compras-empty"><h3>{search || status !== 'All' ? 'Sin coincidencias' : 'Todavía no hay compras'}</h3><p>Registra una compra o ajusta los filtros.</p></div>}</div>}</section>
    {showForm && <CompraForm onGuardar={async input => { const result = await purchasesApi.create(input); setShowForm(false); setMessage(`Compra COMP-${result.id} registrada como pendiente. El stock no cambió.`); setVersion(v => v + 1); }} onCancelar={() => setShowForm(false)}/>}
    {selected && <Dialog title={`Detalle de compra COMP-${selected.id}`} overlayClass="compra-detail-overlay" className="compra-detail-modal" busy={receiveBusy} onClose={() => setSelected(null)}>
      <div className="compra-detail-header"><div><span className="compras-eyebrow">INFORMACIÓN DE COMPRA</span><h2>COMP-{selected.id}</h2></div><button className="compra-close" disabled={receiveBusy} aria-label="Cerrar detalle" onClick={() => setSelected(null)}>×</button></div>
      <div className="compra-detail-info"><div><span>Proveedor</span><strong>{selected.supplierName}</strong></div><div><span>Registro</span><strong>{date(selected.registeredAt)}</strong></div><div><span>Estado</span><strong>{selected.status === 'Received' ? 'Recibida' : 'Pendiente'}</strong></div></div>
      {selected.receivedAt && <p className="muted">Recibida: {date(selected.receivedAt)}</p>}
      <div className="compras-table-wrap"><table className="compras-table"><thead><tr><th>PRODUCTO</th><th>CANTIDAD</th><th>COSTO UNITARIO</th><th>SUBTOTAL</th></tr></thead><tbody>{selected.details.map(line => <tr key={line.id}><td>{line.productCode} · {line.productName}</td><td>{line.quantity}</td><td>{money(line.unitCost)}</td><td>{money(line.subtotal)}</td></tr>)}</tbody></table></div><div className="compra-grand-total"><span>Total de la compra</span><strong>{money(selected.total)}</strong></div>
      {detailError && <p className="notice error" role="alert">{detailError}</p>}
      {selected.status === 'Pending' && (confirming ? <div className="notice" role="group" aria-label="Confirmar recepción"><p>¿Recibir toda la compra? Se incrementará el stock de todos sus productos una sola vez.</p><div className="actions"><button disabled={receiveBusy} onClick={receive}>{receiveBusy ? 'Recibiendo…' : 'Confirmar recepción'}</button><button className="secondary" disabled={receiveBusy} onClick={() => setConfirming(false)}>Cancelar</button></div></div> : <button className="compra-modal-button" onClick={() => setConfirming(true)}>Recibir compra</button>)}
      {selected.status === 'Received' && <p className="notice success" role="status">Esta compra ya fue recibida y no puede recibirse nuevamente.</p>}
    </Dialog>}
  </div></div>;
}
