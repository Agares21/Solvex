import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PedidoForm from "../features/sprint2/components/pedidos/PedidoForm.jsx";
import "./PedidosPage.css";

function PedidosPage() {
    const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([
    {
      id: "PED-001",
      cliente: "María López",
      productos: [
        {
          nombre: "El principito",
          cantidad: 2,
          precio: 45,
        },
      ],
      total: 90,
      estado: "Pendiente",
      fecha: "23/11/2026",
    },
    {
      id: "PED-002",
      cliente: "Carlos Fernández",
      productos: [
        {
          nombre: "Cien años de soledad",
          cantidad: 1,
          precio: 85,
        },
        {
          nombre: "Orgullo y prejuicio",
          cantidad: 1,
          precio: 60,
        },
      ],
      total: 145,
      estado: "En proceso",
      fecha: "23/11/2026",
    },
    {
      id: "PED-003",
      cliente: "Ana Martínez",
      productos: [
        {
          nombre: "Harry Potter",
          cantidad: 1,
          precio: 95,
        },
      ],
      total: 95,
      estado: "Entregado",
      fecha: "22/11/2026",
    },
  ]);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const registrarPedido = (nuevoPedido) => {
    const pedido = {
      ...nuevoPedido,
      id: `PED-${String(pedidos.length + 1).padStart(3, "0")}`,
      fecha: new Date().toLocaleDateString("es-BO"),
      estado: "Pendiente",
    };

    setPedidos([pedido, ...pedidos]);
    setMostrarFormulario(false);
  };

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const texto = busqueda.toLowerCase();

    return (
      pedido.id.toLowerCase().includes(texto) ||
      pedido.cliente.toLowerCase().includes(texto)
    );
  });

  const totalPedidos = pedidos.length;

  const pendientes = pedidos.filter(
    (pedido) => pedido.estado === "Pendiente"
  ).length;

  const enProceso = pedidos.filter(
    (pedido) => pedido.estado === "En proceso"
  ).length;

  const entregados = pedidos.filter(
    (pedido) => pedido.estado === "Entregado"
  ).length;

  return (
    <div className="pedidos-page">
      <div className="pedidos-header">
        <div>
          <h1>Gestión de pedidos</h1>
          <p>Registra y consulta los pedidos de tus clientes.</p>
        </div>

        <button
          className="pedidos-btn-nuevo"
          onClick={() => setMostrarFormulario(true)}
        >
          + Nuevo pedido
        </button>
      </div>

      <div className="pedidos-stats">
        <div className="pedido-stat-card">
          <span className="pedido-stat-label">Total de pedidos</span>
          <strong>{totalPedidos}</strong>
        </div>

        <div className="pedido-stat-card">
          <span className="pedido-stat-label">Pendientes</span>
          <strong>{pendientes}</strong>
        </div>

        <div className="pedido-stat-card">
          <span className="pedido-stat-label">En proceso</span>
          <strong>{enProceso}</strong>
        </div>

        <div className="pedido-stat-card">
          <span className="pedido-stat-label">Entregados</span>
          <strong>{entregados}</strong>
        </div>
      </div>

      <div className="pedidos-listado-container">
        <div className="pedidos-listado-header">
          <h2>Pedidos registrados</h2>

          <input
            type="text"
            placeholder="Buscar por cliente o código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pedidos-busqueda"
          />
        </div>

        <div className="pedidos-table-container">
          <table className="pedidos-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Productos</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {pedidosFiltrados.map((pedido) => (
                <tr key={pedido.id}>
                  <td className="pedido-codigo">{pedido.id}</td>

                  <td>{pedido.cliente}</td>

                  <td>{pedido.fecha}</td>

                  <td>
                    {pedido.productos.reduce(
                      (cantidad, producto) =>
                        cantidad + producto.cantidad,
                      0
                    )}
                  </td>

                  <td>Bs. {pedido.total.toFixed(2)}</td>

                  <td>
                    <span
                      className={`pedido-estado pedido-estado-${pedido.estado
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {pedido.estado}
                    </span>
                  </td>

                  <td>
                   <button
                        className="pedido-btn-ver"
                        title="Ver pedido"
                        onClick={() =>
                            navigate(`/orders/${pedido.id}`, {
                            state: { pedido },
                            })
                        }
                        >
                        Ver
                    </button>
                  </td>
                </tr>
              ))}

              {pedidosFiltrados.length === 0 && (
                <tr>
                  <td colSpan="7" className="pedidos-sin-resultados">
                    No se encontraron pedidos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarFormulario && (
        <div className="pedido-modal-overlay">
          <div className="pedido-modal">
            <PedidoForm
              onGuardar={registrarPedido}
              onCancelar={() => setMostrarFormulario(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default PedidosPage;
