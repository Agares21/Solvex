
import { useState } from "react";
import CompraForm from "./CompraForm";
import "./Compras.css";

const comprasIniciales = [
  {
    id: "COMP-001",
    proveedor: "Editorial Santillana",
    fecha: "2026-11-05",
    estado: "Recibida",
    productos: [
      { nombre: "Cien años de soledad", cantidad: 10, costo: 65 },
      { nombre: "El principito", cantidad: 15, costo: 35 },
    ],
  },
  {
    id: "COMP-002",
    proveedor: "Distribuidora El Escolar",
    fecha: "2026-11-07",
    estado: "Pendiente",
    productos: [
      { nombre: "Cuadernos universitarios", cantidad: 30, costo: 18 },
      { nombre: "Bolígrafos azules", cantidad: 50, costo: 3.5 },
    ],
  },
  {
    id: "COMP-003",
    proveedor: "Papelería Central",
    fecha: "2026-11-09",
    estado: "Recibida",
    productos: [
      { nombre: "Resmas de papel", cantidad: 12, costo: 42 },
    ],
  },
];

function calcularTotal(productos) {
  return productos.reduce(
    (total, producto) =>
      total + producto.cantidad * producto.costo,
    0
  );
}

function Compras({ suppliers = [] }) {
  const [compras, setCompras] = useState(comprasIniciales);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todas");
  const [compraSeleccionada, setCompraSeleccionada] = useState(null);

  // Registrar una nueva compra
  const registrarCompra = (nuevaCompra) => {
    const siguienteNumero =
      Math.max(
        0,
        ...compras.map(
          (compra) => Number(compra.id.split("-")[1]) || 0
        )
      ) + 1;

    const compra = {
      id: `COMP-${String(siguienteNumero).padStart(3, "0")}`,
      ...nuevaCompra,
    };

    setCompras((prev) => [...prev, compra]);
    setMostrarFormulario(false);
  };

  // Filtrar compras
  const comprasFiltradas = compras.filter((compra) => {
    const coincideBusqueda =
      `${compra.id} ${compra.proveedor}`
        .toLowerCase()
        .includes(busqueda.toLowerCase());

    const coincideEstado =
      filtroEstado === "Todas" ||
      compra.estado === filtroEstado;

    return coincideBusqueda && coincideEstado;
  });

  // Estadísticas
  const gastoTotal = compras.reduce(
    (total, compra) =>
      total + calcularTotal(compra.productos),
    0
  );

  const totalProductos = compras.reduce(
    (total, compra) =>
      total +
      compra.productos.reduce(
        (suma, producto) => suma + producto.cantidad,
        0
      ),
    0
  );

  const formatoBs = (valor) =>
    `Bs ${valor.toLocaleString("es-BO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatoFecha = (fecha) => {
    const [anio, mes, dia] = fecha.split("-");
    return `${dia}/${mes}/${anio}`;
  };

  return (
    <div className="compras-page">

      {/* BIENVENIDA */}
      <section className="compras-welcome">
        <div>
          <span className="compras-eyebrow">
            ABASTECIMIENTO
          </span>

          <h2>Control de compras</h2>

          <p>
            Consulta las compras realizadas y mantén organizado
            el historial de abastecimiento de tu librería.
          </p>
        </div>

        <div className="compras-decoration">🛒</div>
      </section>

      {/* ESTADÍSTICAS */}
      <section className="compras-stats">

        <article className="compra-stat-card">
          <div className="compra-stat-icon amarillo">🧾</div>
          <div>
            <span>Total de compras</span>
            <h3>{compras.length}</h3>
            <small>Operaciones registradas</small>
          </div>
        </article>

        <article className="compra-stat-card">
          <div className="compra-stat-icon azul">💰</div>
          <div>
            <span>Gasto acumulado</span>
            <h3>{formatoBs(gastoTotal)}</h3>
            <small>Valor de las compras</small>
          </div>
        </article>

        <article className="compra-stat-card">
          <div className="compra-stat-icon naranja">📦</div>
          <div>
            <span>Unidades adquiridas</span>
            <h3>{totalProductos}</h3>
            <small>Productos comprados</small>
          </div>
        </article>

      </section>

      {/* HISTORIAL */}
      <section className="compras-panel">

        <div className="compras-panel-header">
          <div>
            <h2>Historial de compras</h2>
            <p>
              Consulta las operaciones de abastecimiento realizadas.
            </p>
          </div>

          <button
            className="compra-modal-button"
            onClick={() => setMostrarFormulario(true)}
          >
            + Nueva compra
          </button>
        </div>

        {/* BUSCADOR Y FILTROS */}
        <div className="compras-tools">

          <div className="compras-search">
            <span>🔍</span>

            <input
              type="text"
              placeholder="Buscar por código o proveedor..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <select
            className="compras-filter"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="Todas">Todos los estados</option>
            <option value="Recibida">Recibidas</option>
            <option value="Pendiente">Pendientes</option>
          </select>

        </div>

        {/* TABLA */}
        <div className="compras-table-wrap">

          <table className="compras-table">

            <thead>
              <tr>
                <th>CÓDIGO</th>
                <th>PROVEEDOR</th>
                <th>FECHA</th>
                <th>PRODUCTOS</th>
                <th>TOTAL</th>
                <th>ESTADO</th>
                <th>DETALLE</th>
              </tr>
            </thead>

            <tbody>

              {comprasFiltradas.map((compra) => (
                <tr key={compra.id}>

                  <td>
                    <span className="compra-code">
                      {compra.id}
                    </span>
                  </td>

                  <td>
                    <strong>{compra.proveedor}</strong>
                  </td>

                  <td>{formatoFecha(compra.fecha)}</td>

                  <td>{compra.productos.length} tipos</td>

                  <td className="compra-total">
                    {formatoBs(calcularTotal(compra.productos))}
                  </td>

                  <td>
                    <span
                      className={`compra-status ${
                        compra.estado === "Recibida"
                          ? "status-recibida"
                          : "status-pendiente"
                      }`}
                    >
                      {compra.estado}
                    </span>
                  </td>

                  <td>
                    <button
                      className="compra-detail-button"
                      onClick={() => setCompraSeleccionada(compra)}
                    >
                      Ver detalle →
                    </button>
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

          {comprasFiltradas.length === 0 && (
            <div className="compras-empty">
              <span>📭</span>
              <h3>No se encontraron compras</h3>
              <p>
                Prueba con otro código, proveedor o estado.
              </p>
            </div>
          )}

        </div>

      </section>

      {/* FORMULARIO DE REGISTRO */}
      {mostrarFormulario && (
        <CompraForm
          suppliers={suppliers}
          onGuardar={registrarCompra}
          onCancelar={() => setMostrarFormulario(false)}
        />
      )}

      {/* MODAL DE DETALLES */}
      {compraSeleccionada && (
        <div
          className="compra-detail-overlay"
          onClick={() => setCompraSeleccionada(null)}
        >

          <div
            className="compra-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="compra-detail-header">
              <div>
                <span className="compras-eyebrow">
                  INFORMACIÓN DE COMPRA
                </span>

                <h2>{compraSeleccionada.id}</h2>
              </div>

              <button
                className="compra-close"
                onClick={() => setCompraSeleccionada(null)}
              >
                ×
              </button>
            </div>

            <div className="compra-detail-info">

              <div>
                <span>Proveedor</span>
                <strong>{compraSeleccionada.proveedor}</strong>
              </div>

              <div>
                <span>Fecha de compra</span>
                <strong>
                  {formatoFecha(compraSeleccionada.fecha)}
                </strong>
              </div>

              <div>
                <span>Estado</span>
                <strong>{compraSeleccionada.estado}</strong>
              </div>

            </div>

            <h3 className="compra-products-title">
              Productos adquiridos
            </h3>

            <div className="compras-table-wrap">

              <table className="compras-table">

                <thead>
                  <tr>
                    <th>PRODUCTO</th>
                    <th>CANTIDAD</th>
                    <th>COSTO UNITARIO</th>
                    <th>SUBTOTAL</th>
                  </tr>
                </thead>

                <tbody>

                  {compraSeleccionada.productos.map(
                    (producto, index) => (
                      <tr key={index}>
                        <td>{producto.nombre}</td>
                        <td>{producto.cantidad}</td>
                        <td>{formatoBs(producto.costo)}</td>

                        <td className="compra-total">
                          {formatoBs(
                            producto.cantidad * producto.costo
                          )}
                        </td>
                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>

            <div className="compra-grand-total">
              <span>Total de la compra</span>

              <strong>
                {formatoBs(
                  calcularTotal(compraSeleccionada.productos)
                )}
              </strong>
            </div>

            <button
              className="compra-modal-button"
              onClick={() => setCompraSeleccionada(null)}
            >
              Cerrar detalle
            </button>

          </div>

        </div>
      )}

    </div>
  );
}

export default Compras;
