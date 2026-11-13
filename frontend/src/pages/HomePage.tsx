import { useEffect, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { products } from '../services/products';
import { inventory } from '../services/inventory';
import { purchasesApi, suppliersApi, type PurchaseSummary, type Supplier } from '../services/purchasing';
import type { Product } from '../types/product';
import type { Stock } from '../types/inventory';
import { money } from './CatalogPage';
import '../styles/home.css';

/** Productos activos con estas unidades o menos se muestran como stock bajo. */
export const LOW_STOCK = 5;

interface Snapshot { products?: Product[]; stock?: Stock[]; suppliers?: Supplier[]; purchases?: PurchaseSummary[] }

const books = [
  { h: 140, w: 28, c: '#243b5a' },
  { h: 172, w: 34, c: '#d94b43' },
  { h: 124, w: 24, c: '#315b91' },
  { h: 158, w: 30, c: '#fffaf1', lean: true },
  { h: 150, w: 36, c: '#e99142' },
  { h: 116, w: 26, c: '#344f70' },
  { h: 164, w: 30, c: '#bd6336' },
];

const modules = [
  { to: '/products', icon: '📖', title: 'Productos', text: 'Registra y organiza el catálogo de la librería.', accent: '#f5c542', soft: '#fff1c4' },
  { to: '/inventory', icon: '📦', title: 'Inventario', text: 'Controla entradas, salidas y existencias.', accent: '#315b91', soft: '#e2edfc' },
  { to: '/availability', icon: '🔎', title: 'Disponibilidad', text: 'Comprueba si hay unidades antes de atender.', accent: '#e99142', soft: '#ffeadb' },
  { to: '/suppliers', icon: '🚚', title: 'Proveedores', text: 'Consulta y registra a tus proveedores.', accent: '#d94b43', soft: '#fde4e1' },
  { to: '/purchases', icon: '🛒', title: 'Compras', text: 'Registra compras y recibe la mercadería.', accent: '#243b5a', soft: '#e9edf3' },
];

const vars = (values: Record<string, string | number>) => values as CSSProperties;

function reducedMotion() {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Cuenta desde 0 hasta el valor final; sin animación si el sistema pide menos movimiento. */
function useCountUp(target?: number, duration = 900) {
  const [value, setValue] = useState(0);
  const animate = target !== undefined && target > 0 && typeof requestAnimationFrame === 'function' && !reducedMotion();
  useEffect(() => {
    if (!animate || target === undefined) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate, target, duration]);
  if (target === undefined) return undefined;
  return animate ? value : target;
}

function StatCard({ index, icon, tone, label, hint, value, loading }: { index: number; icon: string; tone: string; label: string; hint: string; value?: number; loading: boolean }) {
  const shown = useCountUp(value);
  return <article className="home-stat" style={vars({ '--i': index })}>
    <span className={`home-stat-icon ${tone}`} aria-hidden="true">{icon}</span>
    <div>
      <span className="home-stat-label">{label}</span>
      <strong className={`home-stat-value ${loading ? 'is-loading' : ''}`} aria-hidden="true">{loading ? '' : shown ?? '—'}</strong>
      <span className="sr-only">{loading ? 'Cargando' : value ?? 'No disponible'}</span>
      <small>{hint}</small>
    </div>
  </article>;
}

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
}

export function HomePage() {
  const [data, setData] = useState<Snapshot>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    Promise.allSettled([products.list(controller.signal), inventory.list(controller.signal), suppliersApi.list(controller.signal), purchasesApi.list(controller.signal)])
      .then(([p, s, sup, pur]) => {
        if (controller.signal.aborted) return;
        setData({
          products: p.status === 'fulfilled' ? p.value : undefined,
          stock: s.status === 'fulfilled' ? s.value : undefined,
          suppliers: sup.status === 'fulfilled' ? sup.value : undefined,
          purchases: pur.status === 'fulfilled' ? pur.value : undefined,
        });
        const failure = [p, s, sup, pur].find(r => r.status === 'rejected');
        if (failure) setError((failure.reason as Error)?.message || 'No se pudo cargar el resumen.');
        setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);

  const recent = data.purchases?.slice(0, 4);
  const lowStock = data.stock?.filter(item => item.isActive && item.stock <= LOW_STOCK).sort((a, b) => a.stock - b.stock).slice(0, 5);
  const stats = [
    { icon: '📚', tone: 'yellow', label: 'Productos activos', hint: 'Disponibles en el catálogo', value: data.products?.filter(p => p.isActive).length },
    { icon: '📦', tone: 'blue', label: 'Unidades en inventario', hint: 'Suma de existencias', value: data.stock?.reduce((sum, item) => sum + item.stock, 0) },
    { icon: '🚚', tone: 'orange', label: 'Proveedores', hint: 'Registrados en el sistema', value: data.suppliers?.length },
    { icon: '🛒', tone: 'red', label: 'Compras pendientes', hint: 'Esperando recepción', value: data.purchases?.filter(p => p.status === 'Pending').length },
  ];

  return <div className="home">
    <section className="home-hero">
      <div className="home-hero-text">
        <span className="eyebrow">{greeting().toUpperCase()} · PANEL PRINCIPAL</span>
        <h1>Te damos la bienvenida a <em>La Central</em></h1>
        <p>Gestiona el catálogo, el inventario, los proveedores y las compras de la librería desde un solo lugar.</p>
        <div className="home-actions">
          <Link className="button home-cta" to="/products">Ver catálogo</Link>
          <Link className="button secondary" to="/purchases">Registrar compra</Link>
        </div>
      </div>
      <div className="shelf" aria-hidden="true">
        <span className="float-icon f1">📖</span>
        <span className="float-icon f2">✏️</span>
        <span className="float-icon f3">⭐</span>
        <div className="books">
          {books.map((book, i) => <span key={i} className={`book ${book.lean ? 'lean' : ''}`} style={vars({ '--i': i, '--h': `${book.h}px`, '--w': `${book.w}px`, '--c': book.c })}/>)}
        </div>
        <div className="shelf-board"/>
      </div>
    </section>

    {error && <div className="notice error" role="alert">Algunos datos del resumen no están disponibles: {error} <button className="secondary" onClick={() => setAttempt(a => a + 1)}>Reintentar</button></div>}

    <section className="home-stats" aria-label="Resumen de la librería">
      {stats.map((stat, i) => <StatCard key={stat.label} index={i} loading={loading} {...stat}/>)}
    </section>

    <section aria-labelledby="accesos">
      <div className="home-section-head"><h2 id="accesos">Accesos rápidos</h2><p className="muted">Entra directo a cada módulo de la librería.</p></div>
      <div className="home-modules">
        {modules.map((m, i) => <Link key={m.to} to={m.to} className="module-card" style={vars({ '--i': i, '--accent': m.accent, '--accent-soft': m.soft })}>
          <span className="module-icon" aria-hidden="true">{m.icon}</span>
          <strong>{m.title}</strong>
          <p>{m.text}</p>
          <span className="module-go" aria-hidden="true">Ir al módulo →</span>
        </Link>)}
      </div>
    </section>

    <div className="home-grid">
      <section className="panel home-panel">
        <div className="home-panel-head"><h2>Últimas compras</h2><Link to="/purchases">Ver todas →</Link></div>
        {loading ? <div className="skeleton" role="status"><span className="sr-only">Cargando compras…</span><i/><i/><i/></div>
          : !recent ? <p className="home-empty">No se pudieron consultar las compras.</p>
          : recent.length ? <ul className="home-list">{recent.map((p, i) => <li key={p.id} style={vars({ '--i': i })}>
            <div><strong>COMP-{p.id}</strong><span className="sub">{p.supplierName}</span></div>
            <div className="home-list-end"><span className={`home-chip ${p.status === 'Received' ? 'ok' : 'pending'}`}>{p.status === 'Received' ? 'Recibida' : 'Pendiente'}</span><b>{money(p.total)}</b></div>
          </li>)}</ul>
          : <p className="home-empty">Todavía no hay compras registradas.</p>}
      </section>
      <section className="panel home-panel">
        <div className="home-panel-head"><h2>Stock bajo</h2><Link to="/inventory">Ir al inventario →</Link></div>
        {loading ? <div className="skeleton" role="status"><span className="sr-only">Cargando existencias…</span><i/><i/><i/></div>
          : !lowStock ? <p className="home-empty">No se pudieron consultar las existencias.</p>
          : lowStock.length ? <ul className="home-list">{lowStock.map((item, i) => <li key={item.productId} style={vars({ '--i': i })}>
            <div><strong>{item.name}</strong><span className="sub">{item.code}</span></div>
            <div className="home-list-end"><span className={`home-chip ${item.stock === 0 ? 'danger' : 'pending'}`}>{item.stock === 0 ? 'Sin stock' : `${item.stock} u.`}</span></div>
          </li>)}</ul>
          : <p className="home-empty">Todo en orden: ningún producto activo tiene {LOW_STOCK} unidades o menos.</p>}
      </section>
    </div>
  </div>;
}
