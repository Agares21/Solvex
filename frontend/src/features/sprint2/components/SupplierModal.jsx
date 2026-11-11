import Dialog from './Dialog';
export default function SupplierModal({ supplier, onClose }) {
  return <Dialog title="Detalle del proveedor" overlayClass="modal-overlay" className="modal-box" onClose={onClose}>
    <div className="modal-header"><div><span className="eyebrow">INFORMACIÓN</span><h2>Detalle del proveedor</h2></div><button className="close-button" aria-label="Cerrar detalle" onClick={onClose}>×</button></div>
    <div className="details-content"><div className="detail-highlight"><span aria-hidden="true">🏢</span><div><h3>{supplier.name}</h3><small>{supplier.identifier}</small></div></div>
      {[['Persona de contacto', supplier.contactName], ['Teléfono', supplier.phone], ['Correo electrónico', supplier.email], ['Dirección', supplier.address]].map(([label, value]) => <div className="detail-row" key={label}><span>{label}</span><strong>{value || 'Sin registrar'}</strong></div>)}
      <button className="submit-button" onClick={onClose}>Cerrar</button>
    </div>
  </Dialog>;
}
