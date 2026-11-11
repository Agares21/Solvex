
import { useState } from "react";

function SupplierModal({ mode, supplier, onClose, onSave }) {
  const isView = mode === "view";

  const [form, setForm] = useState({
    name: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
    category: "Libros",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">
              {isView ? "INFORMACIÓN" : "NUEVO REGISTRO"}
            </span>
            <h2>
              {isView ? "Detalle del proveedor" : "Registrar proveedor"}
            </h2>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {isView ? (
          <div className="details-content">
            <div className="detail-highlight">
              <span>🏢</span>
              <div>
                <h3>{supplier.name}</h3>
                <small>{supplier.id}</small>
              </div>
            </div>

            {[
              ["Persona de contacto", supplier.contact],
              ["Teléfono", supplier.phone],
              ["Correo electrónico", supplier.email],
              ["Dirección", supplier.address],
              ["Categoría", supplier.category],
            ].map(([label, value]) => (
              <div className="detail-row" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}

            <button className="submit-button" onClick={onClose}>
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                Nombre del proveedor *
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ej. Editorial Santillana"
                  required
                />
              </label>

              <label>
                Persona de contacto *
                <input
                  name="contact"
                  value={form.contact}
                  onChange={handleChange}
                  placeholder="Nombre completo"
                  required
                />
              </label>

              <label>
                Teléfono *
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Ej. 70123456"
                  required
                />
              </label>

              <label>
                Correo electrónico *
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="correo@ejemplo.com"
                  required
                />
              </label>

              <label className="full-width">
                Dirección *
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Dirección del proveedor"
                  required
                />
              </label>

              <label className="full-width">
                Categoría *
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                >
                  <option>Libros</option>
                  <option>Material escolar</option>
                  <option>Papelería</option>
                  <option>Otros</option>
                </select>
              </label>
            </div>

            <p className="required-note">* Campos obligatorios</p>

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button type="submit" className="submit-button">
                Guardar proveedor
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default SupplierModal;
