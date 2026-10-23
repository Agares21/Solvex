import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Feedback } from '../components/Feedback';
import { ProductForm } from '../components/ProductForm';
import { products } from '../services/products';
import type { Product } from '../types/product';
import { money } from './CatalogPage';

export function ProductPage({ mode }: { mode: 'create' | 'edit' | 'detail' }) {
  const { id } = useParams(); const navigate = useNavigate();
  const [product, setProduct] = useState<Product>(); const [error, setError] = useState('');
  const [loading, setLoading] = useState(mode !== 'create'); const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  useEffect(() => { if (mode === 'create') return;
    const controller = new AbortController(); setLoading(true); setError(''); setProduct(undefined);
    products.get(Number(id), controller.signal).then(setProduct).catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, mode]);
  const title = mode === 'create' ? 'Registrar producto' : mode === 'edit' ? 'Editar producto' : 'Detalle del producto';
  return <><Link className="back" to="/products">← Volver al catálogo</Link><div className="page-heading"><div><p className="eyebrow">CATÁLOGO / PRODUCTOS</p><h1>{title}</h1></div></div>
    <Feedback error={error} loading={loading}/>
    {mode === 'create' && <ProductForm onSave={async input => { await products.create(input); navigate('/products', { state: { message: 'Producto registrado correctamente.' } }); }}/>}
    {!loading && product && mode === 'edit' && <ProductForm key={product.id} initial={product} onSave={async input => { await products.update(product.id, input); navigate('/products', { state: { message: 'Producto actualizado correctamente.' } }); }}/>}
    {!loading && product && mode === 'detail' && <section className="panel detail"><span className={`badge ${product.isActive ? '' : 'inactive'}`}>{product.isActive ? 'Activo' : 'Inactivo'}</span><h2>{product.name}</h2><dl><dt>Código</dt><dd>{product.code}</dd><dt>Precio</dt><dd>{money(product.price)}</dd><dt>Descripción</dt><dd className="description">{product.description || 'Sin descripción.'}</dd></dl><div className="actions"><Link className="button" to={`/products/${product.id}/edit`}>Editar producto</Link>{product.isActive && !confirming && <button className="secondary danger" onClick={() => setConfirming(true)}>Desactivar producto</button>}</div>
      {confirming && <div className="notice" role="group" aria-label="Confirmar desactivación"><p>¿Desactivar «{product.name}»? El producto permanecerá en el catálogo como inactivo.</p><div className="actions"><button disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await products.deactivate(product.id); setProduct({ ...product, isActive: false }); setConfirming(false); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }}>{busy ? 'Desactivando…' : 'Confirmar desactivación'}</button><button className="secondary" disabled={busy} onClick={() => setConfirming(false)}>Cancelar</button></div></div>}
      {!product.isActive && <p className="muted" role="status">Este producto está desactivado. Sus datos se conservan.</p>}
    </section>}
  </>;
}
