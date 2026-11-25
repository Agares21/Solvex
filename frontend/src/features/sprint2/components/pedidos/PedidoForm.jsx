
import { useState } from "react";
import "./PedidoForm.css";

function PedidoForm({ productosDisponibles, onGuardar, onCancelar }) {
  const [cliente, setCliente] = useState("");
  const [productos, setProductos] = useState([]);
  const [observaciones, setObservaciones] = useState("");

  const agregarProducto = () => {
    setProductos([
      ...productos,
      { productoId: "", cantidad: 1 },
    ]);
  };

  const actualizarProducto = (index, campo, valor) => {
    const nuevosProductos = [...productos];

    nuevosProductos[index][campo] = valor;

    setProductos(nuevosProductos);
  };

  const eliminarProducto = (index) => {
    setProductos(productos.filter((_, i) => i !== index));
  };

  const calcularTotal = () => {
    return productos.reduce((total, item) => {
      const producto = productosDisponibles.find(
        (p) => p.id === Number(item.productoId)
      );

      return total + (producto ? producto.price * item.cantidad : 0);
    }, 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!cliente.trim()) {
      alert("Debe ingresar el nombre del cliente.");
      return;
    }

    const productosValidos = productos.filter(
      (p) => p.productoId !== "" && Number(p.cantidad) > 0
    );

    if (productosValidos.length === 0) {
      alert("El pedido debe contener al menos un producto.");
      return;
    }

    const pedido = {
      cliente: cliente.trim(),
      productos: productosValidos.map((item) => {
        const producto = productosDisponibles.find(
          (p) => p.id === Number(item.productoId)
        );

        return {
          productoId: producto.id,
          nombre: producto.name,
          precio: producto.price,
          cantidad: Number(item.cantidad),
        };
      }),
      observaciones,
      total: calcularTotal(),
    };

    onGuardar(pedido);
  };

  return (
    <div className="pedido-form-container">
      <form className="pedido-form" onSubmit={handleSubmit}>
        <div className="pedido-form-header">
          <h2>Registrar nuevo pedido</h2>
          <p>Complete la información solicitada</p>
        </div>

        <div className="pedido-form-group">
          <label htmlFor="cliente">Nombre del cliente *</label>

          <input
            id="cliente"
            type="text"
            placeholder="Ingrese el nombre del cliente"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
          />
        </div>

        <div className="pedido-productos-header">
          <h3>Productos del pedido</h3>

          <button
            type="button"
            className="pedido-btn-agregar"
            onClick={agregarProducto}
          >
            + Agregar producto
          </button>
        </div>

        {productos.length === 0 && (
          <div className="pedido-productos-vacio">
            <p>Aún no se agregaron productos.</p>
            <p>Presione "Agregar producto" para comenzar.</p>
          </div>
        )}

        {productos.map((item, index) => (
          <div className="pedido-producto-row" key={index}>
            <div className="pedido-form-group pedido-producto-select">
              <label>Producto</label>

              <select
                value={item.productoId}
                onChange={(e) =>
                  actualizarProducto(
                    index,
                    "productoId",
                    e.target.value
                  )
                }
              >
                <option value="">Seleccione un producto</option>

                {productosDisponibles.map((producto) => (
                  <option key={producto.id} value={producto.id}>
                  {producto.name} - Bs. {producto.price}
                  </option>
                ))}
              </select>
            </div>

            <div className="pedido-form-group pedido-cantidad">
              <label>Cantidad</label>

              <input
                type="number"
                min="1"
                value={item.cantidad}
                onChange={(e) =>
                  actualizarProducto(
                    index,
                    "cantidad",
                    Number(e.target.value)
                  )
                }
              />
            </div>

            <button
              type="button"
              className="pedido-btn-eliminar"
              onClick={() => eliminarProducto(index)}
              title="Eliminar producto"
            >
              ×
            </button>
          </div>
        ))}

        <div className="pedido-form-group">
          <label htmlFor="observaciones">Observaciones</label>

          <textarea
            id="observaciones"
            placeholder="Notas adicionales del pedido..."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows="3"
          />
        </div>

        <div className="pedido-total">
          <span>Total del pedido</span>
          <strong>Bs. {calcularTotal().toFixed(2)}</strong>
        </div>

        <div className="pedido-form-actions">
          <button
            type="button"
            className="pedido-btn-cancelar"
            onClick={onCancelar}
          >
            Cancelar
          </button>

          <button type="submit" className="pedido-btn-guardar">
            Registrar pedido
          </button>
        </div>
      </form>
    </div>
  );
}

export default PedidoForm;
