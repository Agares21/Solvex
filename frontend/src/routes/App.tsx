import { useEffect } from 'react';
import { NavLink, Route, Routes, Link, useLocation } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { CatalogPage } from '../pages/CatalogPage';
import { ProductPage } from '../pages/ProductPage';
import { InventoryPage } from '../pages/InventoryPage';
import { AvailabilityPage } from '../pages/AvailabilityPage';
import SuppliersPage from '../features/sprint2/SuppliersPage';
import Compras from '../features/sprint2/components/compras/Compras';

const sections = [
  { to: '/', icon: '🏠', label: 'Inicio', title: 'Panel principal' },
  { to: '/products', icon: '📖', label: 'Productos', title: 'Gestión de productos' },
  { to: '/inventory', icon: '📦', label: 'Inventario', title: 'Control de inventario' },
  { to: '/availability', icon: '🔎', label: 'Disponibilidad', title: 'Disponibilidad de productos' },
  { to: '/suppliers', icon: '🚚', label: 'Proveedores', title: 'Gestión de proveedores' },
  { to: '/purchases', icon: '🛒', label: 'Compras', title: 'Gestión de compras' },
];

function currentSection(pathname: string) {
  if (pathname === '/') return sections[0];
  return sections.find(s => s.to !== '/' && (pathname === s.to || pathname.startsWith(`${s.to}/`)))
    ?? { to: pathname, icon: '', label: 'Página no encontrada', title: 'Página no encontrada' };
}

const today = new Intl.DateTimeFormat('es-BO', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

export function App() {
  const { pathname } = useLocation();
  const section = currentSection(pathname);
  useEffect(() => { document.title = `${section.label} · La Central`; }, [section.label]);
  return <div className="app">
    <aside className="sidebar">
      <Link className="brand" to="/" aria-label="La Central, ir al inicio">
        <span className="brand-icon" aria-hidden="true">📚</span>
        <span className="brand-text"><strong>La Central</strong><small>LIBRERÍA</small></span>
      </Link>
      <p className="menu-label">MENÚ PRINCIPAL</p>
      <nav className="navigation" aria-label="Navegación principal">
        {sections.map(s => <NavLink key={s.to} to={s.to} end={s.to === '/'} className="nav-item"><span aria-hidden="true">{s.icon}</span>{s.label}</NavLink>)}
      </nav>
      <div className="upcoming"><p>PRÓXIMAMENTE</p>{['Pedidos', 'Clientes', 'Maquetas'].map(name => <span key={name}>{name}<small>Pendiente</small></span>)}</div>
      <div className="sidebar-user"><span className="avatar" aria-hidden="true">AD</span><div><strong>Administrador</strong><small>Personal de librería</small></div></div>
    </aside>
    <div className="workspace">
      <header className="topbar">
        <div><span className="breadcrumb">Gestión / {section.label}</span><p className="topbar-title">{section.title}</p></div>
        <div className="topbar-right"><span className="date-label">{today.charAt(0).toUpperCase() + today.slice(1)}</span><span className="top-avatar" aria-hidden="true">AD</span></div>
      </header>
      <main>
        <div className="page-enter" key={pathname}>
          <Routes>
            <Route path="/" element={<HomePage/>}/>
            <Route path="/products" element={<CatalogPage/>}/>
            <Route path="/products/new" element={<ProductPage key="create" mode="create"/>}/>
            <Route path="/products/:id" element={<ProductPage key="detail" mode="detail"/>}/>
            <Route path="/products/:id/edit" element={<ProductPage key="edit" mode="edit"/>}/>
            <Route path="/inventory" element={<InventoryPage/>}/>
            <Route path="/availability" element={<AvailabilityPage/>}/>
            <Route path="/suppliers" element={<SuppliersPage/>}/>
            <Route path="/purchases" element={<Compras/>}/>
            <Route path="*" element={<div className="panel empty"><h1>Página no encontrada</h1><Link to="/">Volver al inicio</Link></div>}/>
          </Routes>
        </div>
      </main>
      <footer className="app-footer">La Central © 2026 · Sistema de gestión de librería · Solvex</footer>
    </div>
  </div>;
}
