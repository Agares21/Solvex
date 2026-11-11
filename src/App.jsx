
import { useState } from "react";
import SupplierModal from "./components/SupplierModal";
import ProveedorForm from "./components/proveedores/ProveedorForm";
import Compras from "./components/compras/Compras";
import "./App.css";

const initialSuppliers = [
  {
    id: "PROV-001",
    name: "Editorial Santillana",
    contact: "María Fernández",
    phone: "70123456",
    email: "contacto@santillana.com",
    address: "Av. Arce, La Paz",
    category: "Libros",
  },
  {
    id: "PROV-002",
    name: "Distribuidora El Escolar",
    contact: "Carlos Mendoza",
    phone: "71234567",
    email: "ventas@elescolar.com",
    address: "Calle 21, La Paz",
    category: "Material escolar",
  },
  {
    id: "PROV-003",
    name: "Papelería Central",
    contact: "Ana Rojas",
    phone: "76543210",
    email: "info@papeleriacentral.com",
    address: "Av. 16 de Julio, La Paz",
    category: "Papelería",
  },
];

function App() {
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [message, setMessage] = useState("");
  const [vista, setVista] = useState("proveedores");

  const filteredSuppliers = suppliers.filter((supplier) =>
    `${supplier.name} ${supplier.id}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const handleSave = (newSupplier) => {
    const supplier = {
      id: `PROV-${String(suppliers.length + 1).padStart(3, "0")}`,
      name: newSupplier.nombre,
      nit: newSupplier.nit,
      contact: newSupplier.contacto,
      phone: newSupplier.telefono,
      email: newSupplier.correo,
      address: newSupplier.direccion,
      observations: newSupplier.observaciones,
      category: "Sin categoría",
    };

    setSuppliers((prev) => [...prev, supplier]);
    setModal(null);
    setMessage("¡Proveedor registrado correctamente!");

    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">📚</div>
          <div>
            <h2>Entre Páginas</h2>
            <span>LIBRERÍA</span>
          </div>
        </div>

        <div className="menu-label">MENÚ PRINCIPAL</div>

        <nav className="navigation">
          <a href="#" className="nav-item">
            <span>🏠</span> Inicio
          </a>

          <a href="#" className="nav-item">
            <span>📖</span> Libros
          </a>

          <a href="#" className="nav-item">
            <span>📦</span> Inventario
          </a>

          <a
            href="#"
            className={`nav-item ${
              vista === "proveedores" ? "active" : ""
            }`}
            onClick={(e) => {
              e.preventDefault();
              setVista("proveedores");
            }}
          >
            <span>🚚</span> Proveedores
          </a>

          <a
            href="#"
            className={`nav-item ${
              vista === "compras" ? "active" : ""
            }`}
            onClick={(e) => {
              e.preventDefault();
              setVista("compras");
            }}
          >
            <span>🛒</span> Compras
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="user-avatar">AD</div>
          <div>
            <strong>Administrador</strong>
            <small>Personal de librería</small>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="breadcrumb">
              Gestión /{" "}
              {vista === "compras" ? "Compras" : "Proveedores"}
            </span>

            <h1>
              {vista === "compras"
                ? "Gestión de compras"
                : "Gestión de proveedores"}
            </h1>
          </div>

          <div className="topbar-right">
            <span className="date-label">Panel administrativo</span>
            <div className="top-avatar">AD</div>
          </div>
        </header>

        {vista === "compras" ? (
          <Compras suppliers={suppliers} />
        ) : (
          <>
            <section className="welcome-section">
              <div>
                <span className="eyebrow">ABASTECIMIENTO</span>
                <h2>Nuestros proveedores</h2>
                <p>
                  Administra y consulta la información de tus proveedores
                  desde un solo lugar.
                </p>
              </div>
              <div className="welcome-decoration">📚</div>
            </section>

            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon yellow">👥</div>
                <div>
                  <span>Total de proveedores</span>
                  <h3>{suppliers.length}</h3>
                  <small>Registrados en el sistema</small>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon blue">📦</div>
                <div>
                  <span>Categorías</span>
                  <h3>
                    {new Set(suppliers.map((s) => s.category)).size}
                  </h3>
                  <small>Tipos de abastecimiento</small>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon orange">📋</div>
                <div>
                  <span>Contactos</span>
                  <h3>{suppliers.length}</h3>
                  <small>Proveedores disponibles</small>
                </div>
              </div>
            </section>

            <section className="supplier-section">
              <div className="section-header">
                <div>
                  <h2>Directorio de proveedores</h2>
                  <p>
                    Consulta y administra tus proveedores habituales.
                  </p>
                </div>

                <button
                  className="add-button"
                  onClick={() => setModal({ mode: "create" })}
                >
                  <span>＋</span> Nuevo proveedor
                </button>
              </div>

              <div className="search-container">
                <span>🔍</span>
                <input
                  type="text"
                  placeholder="Buscar por nombre o identificador..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>IDENTIFICADOR</th>
                      <th>PROVEEDOR</th>
                      <th>CONTACTO</th>
                      <th>TELÉFONO</th>
                      <th>CATEGORÍA</th>
                      <th>ACCIÓN</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredSuppliers.map((supplier) => (
                      <tr key={supplier.id}>
                        <td>
                          <span className="supplier-id">
                            {supplier.id}
                          </span>
                        </td>

                        <td>
                          <strong>{supplier.name}</strong>
                        </td>

                        <td>{supplier.contact}</td>
                        <td>{supplier.phone}</td>

                        <td>
                          <span className="category-tag">
                            {supplier.category}
                          </span>
                        </td>

                        <td>
                          <button
                            className="view-button"
                            onClick={() =>
                              setModal({
                                mode: "view",
                                supplier,
                              })
                            }
                          >
                            Ver detalles →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredSuppliers.length === 0 && (
                  <div className="empty-state">
                    <span>📭</span>
                    <h3>No se encontraron proveedores</h3>
                    <p>
                      Prueba con otro nombre o identificador.
                    </p>
                  </div>
                )}
              </div>

              <div className="table-footer">
                Mostrando {filteredSuppliers.length} de{" "}
                {suppliers.length} proveedores
              </div>
            </section>

            <footer className="footer">
              Entre Páginas © 2026 · Sistema de gestión de librería
            </footer>
          </>
        )}
      </main>

      {modal?.mode === "create" && (
        <ProveedorForm
          onGuardar={handleSave}
          onCancelar={() => setModal(null)}
        />
      )}

      {modal?.mode === "view" && (
        <SupplierModal
          mode={modal.mode}
          supplier={modal.supplier}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {message && <div className="toast">✓ {message}</div>}
    </div>
  );
}

export default App;
