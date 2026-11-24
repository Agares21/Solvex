
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./PedidoDetallePage.css";

function PedidoDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const pedido = location.state?.pedido;

  if (!pedido) {
    return (
      <div className="pedido-detalle-page">
        <div className="pedido-detalle-no-encontrado">
          <h2>Pedido no encontrado</h2>
          <p>No se encontraron los datos del pedido seleccionado.</p>

          <button
            onClick={() => navigate("/orders")}
            className="pedido-detalle-btn-volver"
          >
            Volver a pedidos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pedido-detalle-page">
      <div className="pedido-detalle-header">
        <button
          className="pedido-detalle-btn-volver"
          onClick={() => navigate("/orders")}
        >
          ← Volver a pedidos
        </button>

        <div className="pedido-detalle-title">
          <div>
            <h1>Detalle del pedido</h1>
            <p>Información completa del pedido registrado.</p>
          </div>

          <span
            className={`pedido-estado pedido-estado-${pedido.estado
              .toLowerCase()
              .replace(" ", "-")}`}
          >
            {pedido.estado}
          </span>
        </div>
      </div>

      <div className="pedido-detalle-grid">
        <section className="pedido-detalle-card">
          <h2>Información general</h2>

          <div className="pedido-detalle-info">
            <div>
              <span>Código del pedido</span>
              <strong>{pedido.id || id}</strong>
            </div>

            <div>
              <span>Cliente</span>
              <strong>{pedido.cliente}</strong>
            </div>

            <div>
              <span>Fecha de registro</span>
              <strong>{pedido.fecha}</strong>
            </div>

            <div>
              <span>Estado actual</span>
              <strong>{pedido.estado}</strong>
            </div>
          </div>
        </section>

        <section className="pedido-detalle-card">
          <h2>Productos del pedido</h2>

          <div className="pedido-detalle-table-container">
            <table className="pedido-detalle-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio unitario</th>
                  <th>Subtotal</th>
                </tr>
              </thead>

              <tbody>
                {pedido.productos.map((producto, index) => (
                  <tr key={index}>
                    <td>{producto.nombre}</td>
                    <td>{producto.cantidad}</td>
                    <td>Bs. {producto.precio.toFixed(2)}</td>
                    <td>
                      Bs. {(producto.precio * producto.cantidad).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pedido-detalle-total">
            <span>Total del pedido</span>
            <strong>Bs. {pedido.total.toFixed(2)}</strong>
          </div>
        </section>

        <section className="pedido-detalle-card">
          <h2>Observaciones</h2>

          <div className="pedido-detalle-observaciones">
            {pedido.observaciones?.trim()
              ? pedido.observaciones
              : "No se registraron observaciones para este pedido."}
          </div>
        </section>
      </div>
    </div>
  );
}

export default PedidoDetallePage;
