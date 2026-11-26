import { CLIENTE_NUEVO } from "./clientes";
import "./ClienteSelector.css";

/** Lista de clientes registrados con la opción de registrar uno nuevo (nombre y teléfono). */
function ClienteSelector({ idPrefix, grupoClase, clientes, clienteId, onClienteId, nuevoCliente, onNuevoCliente }) {
  return <>
    <div className={grupoClase}>
      <label htmlFor={`${idPrefix}-cliente`}>Cliente *</label>
      <select id={`${idPrefix}-cliente`} value={clienteId} onChange={e => onClienteId(e.target.value)}>
        <option value="">Selecciona un cliente</option>
        {clientes.map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ""}</option>)}
        <option value={CLIENTE_NUEVO}>+ Registrar cliente nuevo</option>
      </select>
    </div>

    {clienteId === CLIENTE_NUEVO && (
      <div className="cliente-nuevo">
        <div className={grupoClase}>
          <label htmlFor={`${idPrefix}-cliente-nombre`}>Nombre del cliente nuevo *</label>
          <input id={`${idPrefix}-cliente-nombre`} type="text" maxLength={150} placeholder="Ej.: María López" value={nuevoCliente.name}
            onChange={e => onNuevoCliente({ ...nuevoCliente, name: e.target.value })} />
        </div>
        <div className={grupoClase}>
          <label htmlFor={`${idPrefix}-cliente-telefono`}>Teléfono</label>
          <input id={`${idPrefix}-cliente-telefono`} type="tel" maxLength={40} placeholder="Opcional" value={nuevoCliente.phone}
            onChange={e => onNuevoCliente({ ...nuevoCliente, phone: e.target.value })} />
        </div>
      </div>
    )}
  </>;
}

export default ClienteSelector;
