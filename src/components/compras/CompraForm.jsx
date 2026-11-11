
import { useState } from "react";

function obtenerFechaActual() {
  const fecha = new Date();
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function CompraForm({ suppliers = [], onGuardar, onCancelar }) {
  const [proveedor, setProveedor] = useState("");
  const [fecha, setFecha] = useState(obtenerFechaActual());
  const [estado, setEstado] = useState("Pendiente");

  const [productos, setProductos] = useState([
    { nombre: "", cantidad: 1, costo: "" },
  ]);

  const agregarProducto = () => {
    setProductos((prev) => [
      ...prev,
      { nombre: "", cantidad: 1, costo: "" },
    ]);
  };

  const eliminarProducto = (index) => {
    if (productos.length === 1) return;

    setProductos((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  const actualizarProducto = (index, campo, valor) => {
    setProductos((prev) =>
      prev.map((producto, i) =>
        i === index
          ? { ...producto, [campo]: valor }
          : producto
      )
    );
  };

  // El precio se conserva exactamente como lo escribes.
  const total = productos.reduce((suma, producto) => {
    const cantidad = Number(producto.cantidad) || 0;
    const costo = Number(producto.costo) || 0;

    return suma + cantidad * costo;
  }, 0);

  const formatoBs = (valor) =>
    `Bs ${valor.toFixed(2)}`;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!proveedor) {
      alert("Selecciona un proveedor.");
      return;
    }

    if (!fecha) {
      alert("Selecciona una fecha.");
      return;
    }

    const productosValidos = productos.every(
      (producto) =>
        producto.nombre.trim() &&
        Number(producto.cantidad) > 0 &&
        producto.costo !== "" &&
        Number.isFinite(Number(producto.costo)) &&
        Number(producto.costo) >= 0
    );

    if (!productosValidos) {
      alert("Completa correctamente todos los productos.");
      return;
    }

    const proveedorSeleccionado = suppliers.find(
      (s) => s.id === proveedor
    );

    if (!proveedorSeleccionado) {
      alert("No se encontró el proveedor seleccionado.");
      return;
    }

    onGuardar({
      proveedor: proveedorSeleccionado.name,
      fecha,
      estado,
      productos: productos.map((producto) => ({
        nombre: producto.nombre.trim(),
        cantidad: Number(producto.cantidad),
        costo: Number(producto.costo),
      })),
    });
  };

  return (
    <div className="compra-detail-overlay">
      <form
        className="compra-detail-modal compra-form-modal"
        onSubmit={handleSubmit}
      >
        <div className="compra-detail-header">
          <div>
            <span className="compras-eyebrow">
              ABASTECIMIENTO
            </span>
            <h2>Registrar nueva compra</h2>
          </div>

          <button
            type="button"
            className="compra-close"
            onClick={onCancelar}
          >
            ×
          </button>
        </div>

        <div className="compra-form-grid">
          <div className="compra-field">
            <label>Proveedor *</label>

            <select
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              required
            >
              <option value="">Seleccionar proveedor</option>

              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>

            {suppliers.length === 0 && (
              <small>Primero debes registrar un proveedor.</small>
            )}
          </div>

          <div className="compra-field">
            <label>Fecha de compra *</label>

            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
          </div>

          <div className="compra-field">
            <label>Estado de la compra</label>

            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Recibida">Recibida</option>
            </select>
          </div>
        </div>

        <div className="compra-form-products-header">
          <div>
            <h3>Productos de la compra</h3>
            <p>Agrega los productos adquiridos al proveedor.</p>
          </div>

          <button
            type="button"
            className="compra-add-product"
            onClick={agregarProducto}
          >
            + Agregar producto
          </button>
        </div>

        <div className="compra-form-products">
          {productos.map((producto, index) => (
            <div className="compra-product-row" key={index}>
              <div className="compra-field producto-nombre">
                <label>Producto *</label>

                <input
                  type="text"
                  placeholder="Nombre del producto"
                  value={producto.nombre}
                  onChange={(e) =>
                    actualizarProducto(index, "nombre", e.target.value)
                  }
                  required
                />
              </div>

              <div className="compra-field">
                <label>Cantidad *</label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={producto.cantidad}
                  onChange={(e) =>
                    actualizarProducto(index, "cantidad", e.target.value)
                  }
                  required
                />
              </div>

              <div className="compra-field">
                <label>Costo unitario (Bs) *</label>

                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="15"
                  value={producto.costo}
                  onChange={(e) =>
                    actualizarProducto(index, "costo", e.target.value)
                  }
                  required
                />
              </div>

              <button
                type="button"
                className="compra-remove-product"
                onClick={() => eliminarProducto(index)}
                disabled={productos.length === 1}
                title="Eliminar producto"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="compra-grand-total">
          <span>Total de la compra</span>
          <strong>{formatoBs(total)}</strong>
        </div>

        <div className="compra-form-actions">
          <button
            type="button"
            className="compra-cancel-button"
            onClick={onCancelar}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="compra-modal-button"
            disabled={suppliers.length === 0}
          >
            Registrar compra
          </button>
        </div>
      </form>
    </div>
  );
}

export default CompraForm;
