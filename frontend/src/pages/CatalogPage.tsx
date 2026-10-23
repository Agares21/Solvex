import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Feedback } from '../components/Feedback';
import { products } from '../services/products';
import type { Product } from '../types/product';

export const money = (price: number) => new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(price);
export function CatalogPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState('');
  const location = useLocation();
  useEffect(() => { const controller = new AbortController(); setLoading(true); setError('');
    products.list(controller.signal).then(setItems).catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);
  const visible = items.filter(p => `${p.code} ${p.name}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <><div className="page-heading"><div><p className="eyebrow">GESTIÓN DE PRODUCTOS</p><h1>Tu catálogo, al día.</h1><p className="muted">Organiza los productos de tu librería en un solo lugar.</p></div><Link className="button" to="/products/new">+ Registrar producto</Link></div>
    {location.state?.message && <p className="notice success" role="status">{location.state.message}</p>}
    <div className="stats"><div className="panel"><span>Productos registrados</span><strong>{loading || error ? '—' : items.length}</strong></div><div className="panel"><span>Activos</span><strong>{loading || error ? '—' : items.filter(p => p.isActive).length}</strong></div><div className="panel"><span>Inactivos</span><strong>{loading || error ? '—' : items.filter(p => !p.isActive).length}</strong></div></div>
    <section className="panel catalog"><div className="catalog-heading"><h2>Catálogo de productos</h2><label className="search">Buscar por nombre o código<input type="search" placeholder="Buscar productos…" value={query} onChange={e => setQuery(e.target.value)}/></label></div>
      <Feedback error={error} loading={loading}/>{error && <button className="secondary" onClick={() => setAttempt(v => v + 1)}>Reintentar</button>}
      {!loading && !error && (visible.length ? <div className="table-scroll"><table><thead><tr><th>Producto</th><th>Código</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{visible.map(p => <tr key={p.id}><td><Link className="product-name" to={`/products/${p.id}`}>{p.name}</Link></td><td>{p.code}</td><td>{money(p.price)}</td><td><span className={`badge ${p.isActive ? '' : 'inactive'}`}>{p.isActive ? 'Activo' : 'Inactivo'}</span></td><td className="table-actions"><Link to={`/products/${p.id}`}>Ver detalle</Link><Link to={`/products/${p.id}/edit`}>Editar</Link></td></tr>)}</tbody></table></div> : <div className="empty"><h3>{query ? 'Sin coincidencias' : 'Tu catálogo comienza aquí'}</h3><p>{query ? 'Prueba con otro nombre o código.' : 'Registra tu primer producto para comenzar.'}</p>{!query && <Link to="/products/new">Registrar producto →</Link>}</div>)}
    </section></>;
}
