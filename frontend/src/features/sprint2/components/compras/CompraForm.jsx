import { useEffect, useState } from 'react';
import { suppliersApi } from '../../../../services/purchasing';
import { products as productsApi } from '../../../../services/products';
import Dialog from '../Dialog';
export default function CompraForm({ onGuardar, onCancelar }) {
  const [suppliers, setSuppliers] = useState([]), [catalog, setCatalog] = useState([]);
  const [supplierId, setSupplierId] = useState(''), [lines, setLines] = useState([{ key: 0, productId: '', quantity: '1', unitCost: '' }]);
  const [nextKey, setNextKey] = useState(1), [busy, setBusy] = useState(false), [loading, setLoading] = useState(true);
  const [error, setError] = useState(''), [version, setVersion] = useState(0);
  useEffect(() => { const controller = new AbortController(); setLoading(true); setError('');
    Promise.all([suppliersApi.list(controller.signal), productsApi.list(controller.signal)]).then(([s, p]) => { setSuppliers(s); setCatalog(p.filter(p => p.isActive)); })
      .catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [version]);
  const update = (key, field, value) => setLines(rows => rows.map(r => r.key === key ? { ...r, [field]: value } : r));
  const estimate = lines.reduce((sum, r) => sum + (Number(r.quantity) || 0) * (Number(r.unitCost) || 0), 0);
  return <Dialog title="Registrar nueva compra" overlayClass="compra-detail-overlay" className="compra-detail-modal compra-form-modal" busy={busy} onClose={onCancelar}>
    <div className="compra-detail-header"><div><span className="compras-eyebrow">ABASTECIMIENTO</span><h2>Registrar nueva compra</h2></div><button type="button" className="compra-close" aria-label="Cerrar formulario" disabled={busy} onClick={onCancelar}>×</button></div>
    {loading && <p role="status">Cargando proveedores y productos…</p>}
    {error && <p className="notice error" role="alert">{error}</p>}
    {!loading && (!suppliers.length || !catalog.length) && <p className="notice">Necesitas al menos un proveedor y un producto activo para registrar una compra.</p>}
    <form onSubmit={async e => { e.preventDefault(); if (busy || loading) return; setError('');
      if (!supplierId || lines.some(r => !r.productId || !Number.isInteger(Number(r.quantity)) || Number(r.quantity) < 1 || Number(r.quantity) > 1000000 || !/^\d+(\.\d{1,2})?$/.test(r.unitCost) || Number(r.unitCost) > 99999999.99)) { setError('Selecciona proveedor y productos, cantidades enteras positivas y costos válidos de hasta dos decimales.'); return; }
      if (new Set(lines.map(r => r.productId)).size !== lines.length) { setError('Selecciona cada producto una sola vez.'); return; }
      setBusy(true);
      try { await onGuardar({ supplierId: Number(supplierId), details: lines.map(r => ({ productId: Number(r.productId), quantity: Number(r.quantity), unitCost: Number(r.unitCost) })) }); }
      catch (e) { setError(e.message || 'No se pudo registrar la compra.'); }
      finally { setBusy(false); }
    }}><fieldset disabled={busy || loading}><legend className="sr-only">Datos de compra</legend><div className="compra-form-grid"><label className="compra-field">Proveedor *<select required value={supplierId} onChange={e => setSupplierId(e.target.value)}><option value="">Seleccionar proveedor</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.identifier} · {s.name}</option>)}</select></label><p className="notice">La compra se registra como pendiente. Se asigna la fecha al guardar y el stock aumenta únicamente al recibirla.</p></div>
    <div className="compra-form-products-header"><div><h3>Productos de la compra</h3><p>Selecciona productos existentes del catálogo.</p></div><button type="button" className="compra-add-product" disabled={lines.length >= 100} onClick={() => { setLines(r => [...r, { key: nextKey, productId: '', quantity: '1', unitCost: '' }]); setNextKey(k => k + 1); }}>+ Agregar producto</button></div>
    <div className="compra-form-products">{lines.map((line, index) => <div className="compra-product-row" key={line.key}>
      <label className="compra-field producto-nombre">Producto {index + 1} *<select required value={line.productId} onChange={e => update(line.key, 'productId', e.target.value)}><option value="">Seleccionar producto</option>{catalog.map(p => <option key={p.id} value={p.id} disabled={lines.some(r => r.key !== line.key && r.productId === String(p.id))}>{p.code} · {p.name}</option>)}</select></label>
      <label className="compra-field">Cantidad {index + 1} *<input required type="number" min="1" max="1000000" step="1" value={line.quantity} onChange={e => update(line.key, 'quantity', e.target.value)}/></label>
      <label className="compra-field">Costo unitario {index + 1} (Bs) *<input required type="number" min="0" max="99999999.99" step="0.01" value={line.unitCost} onChange={e => update(line.key, 'unitCost', e.target.value)}/></label>
      <button type="button" className="compra-remove-product" aria-label={`Quitar producto ${index + 1}`} disabled={lines.length === 1} onClick={() => setLines(rows => rows.filter(r => r.key !== line.key))}>×</button>
    </div>)}</div>
    <div className="compra-grand-total"><span>Total estimado (el servidor calcula el importe final)</span><strong>Bs {estimate.toFixed(2)}</strong></div>
    <div className="compra-form-actions"><button type="button" className="compra-cancel-button" onClick={onCancelar}>Cancelar</button><button type="submit" className="compra-modal-button" disabled={!suppliers.length || !catalog.length}>{busy ? 'Registrando…' : 'Registrar compra'}</button></div></fieldset></form>
    {!loading && error && <button type="button" className="secondary" disabled={busy} onClick={() => setVersion(v => v + 1)}>Recargar opciones</button>}
  </Dialog>;
}
