import { useEffect, useState } from 'react';
import { suppliersApi } from '../../services/purchasing';
import ProveedorForm from './components/proveedores/ProveedorForm';
import SupplierModal from './components/SupplierModal';
import './App.css';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [search, setSearch] = useState(''), [version, setVersion] = useState(0);
  const [modal, setModal] = useState(null), [detailBusy, setDetailBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    suppliersApi.list(controller.signal).then(setSuppliers).catch(e => { if (!controller.signal.aborted) setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [version]);
  const visible = suppliers.filter(s => `${s.name} ${s.identifier}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  async function view(id) {
    setDetailBusy(true); setError('');
    try { setModal({ mode: 'view', supplier: await suppliersApi.get(id) }); }
    catch (e) { setError(e.message); } finally { setDetailBusy(false); }
  }
  return <div className="sprint2">
    <section className="welcome-section"><div><span className="eyebrow">ABASTECIMIENTO</span><h2>Nuestros proveedores</h2><p>Consulta y registra los contactos de tu librería.</p></div><div className="welcome-decoration" aria-hidden="true">📚</div></section>
    {message && <p className="notice success" role="status">{message}</p>}
    {error && <div className="notice error" role="alert">{error} <button onClick={() => setVersion(v => v + 1)}>Reintentar</button></div>}
    <section className="stats-grid"><div className="stat-card"><div className="stat-icon yellow">👥</div><div><span>Total de proveedores</span><h3>{loading || error ? '—' : suppliers.length}</h3><small>Registrados en SQL Server</small></div></div><div className="stat-card"><div className="stat-icon blue">✉</div><div><span>Con correo</span><h3>{loading || error ? '—' : suppliers.filter(s => s.email).length}</h3><small>Contactos por correo</small></div></div><div className="stat-card"><div className="stat-icon orange">☎</div><div><span>Con teléfono</span><h3>{loading || error ? '—' : suppliers.filter(s => s.phone).length}</h3><small>Contactos telefónicos</small></div></div></section>
    <section className="supplier-section"><div className="section-header"><div><h2>Directorio de proveedores</h2><p>Busca por nombre o identificador.</p></div><button className="add-button" onClick={() => setModal({ mode: 'create' })}>＋ Nuevo proveedor</button></div>
      <label className="search-container"><span className="sr-only">Buscar proveedores</span><input type="search" placeholder="Buscar por nombre o identificador..." value={search} onChange={e => setSearch(e.target.value)}/></label>
      {loading && <p className="notice" role="status">Cargando proveedores…</p>}
      {detailBusy && <p role="status">Consultando detalle…</p>}
      {!loading && !error && <div className="table-container"><table><thead><tr><th>IDENTIFICADOR</th><th>PROVEEDOR</th><th>CONTACTO</th><th>TELÉFONO</th><th>CORREO</th><th>ACCIÓN</th></tr></thead><tbody>{visible.map(s => <tr key={s.id}><td><span className="supplier-id">{s.identifier}</span></td><td><strong>{s.name}</strong></td><td>{s.contactName || '—'}</td><td>{s.phone || '—'}</td><td>{s.email || '—'}</td><td><button className="view-button" disabled={detailBusy} onClick={() => view(s.id)}>Ver detalles →</button></td></tr>)}</tbody></table>{visible.length === 0 && <div className="empty-state"><h3>{search ? 'Sin coincidencias' : 'Todavía no hay proveedores'}</h3><p>{search ? 'Prueba otro nombre o identificador.' : 'Registra tu primer proveedor para comenzar.'}</p></div>}</div>}
      {!loading && !error && <div className="table-footer">Mostrando {visible.length} de {suppliers.length} proveedores</div>}
    </section>
    {modal?.mode === 'create' && <ProveedorForm onGuardar={async input => { await suppliersApi.create(input); setModal(null); setMessage('Proveedor registrado correctamente.'); setVersion(v => v + 1); }} onCancelar={() => setModal(null)}/>}
    {modal?.mode === 'view' && <SupplierModal supplier={modal.supplier} onClose={() => setModal(null)}/>}
  </div>;
}
