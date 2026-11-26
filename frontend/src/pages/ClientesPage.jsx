import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { customersApi } from "../services/sprint3";
import { codigoCliente, coincideCliente, iniciales } from "./clientesFormato";
import "./ClientesPage.css";

/** Buscador de clientes registrados; cada tarjeta abre el historial del cliente (HU-10). */
function ClientesPage() {
  const [clientes, setClientes] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState(""), [version, setVersion] = useState(0);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    customersApi.list(controller.signal).then(setClientes)
      .catch(e => { if (!controller.signal.aborted) setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [version]);

  const filtrados = clientes.filter(c => coincideCliente(c, busqueda));

  return <div className="clientes-page">
    <div className="page-heading" data-icon="👥">
      <div><p className="eyebrow">HISTORIAL DE CLIENTES</p><h1>Conoce a tus clientes.</h1><p className="muted">Busca un cliente y consulta sus pedidos y trabajos de maquetas.</p></div>
    </div>

    {error && <div className="notice error" role="alert">{error} <button className="secondary clientes-reintentar" onClick={() => setVersion(v => v + 1)}>Reintentar</button></div>}

    <section className="panel catalog clientes-listado" aria-labelledby="clientes-titulo">
      <div className="catalog-heading">
        <h2 id="clientes-titulo">Clientes registrados</h2>
        <label className="search">Buscar por nombre, teléfono o correo
          <input type="search" placeholder="Ej.: María, 70000000…" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </label>
      </div>

      {loading && <p className="notice" role="status">Cargando clientes…</p>}

      {!loading && !error && (filtrados.length
        ? <ul className="clientes-grid">
          {filtrados.map((c, i) => <li key={c.id} style={{ "--i": Math.min(i, 12) }}>
            <Link className="cliente-card" to={`/customers/${c.id}`} aria-label={`Ver historial de ${c.name}`}>
              <span className="cliente-avatar" aria-hidden="true">{iniciales(c.name)}</span>
              <span className="cliente-info">
                <strong>{c.name}</strong>
                <small>{codigoCliente(c.id)}</small>
                <span>{c.phone || "Sin teléfono"} · {c.email || "Sin correo"}</span>
              </span>
              <span className="cliente-ver" aria-hidden="true">Ver historial →</span>
            </Link>
          </li>)}
        </ul>
        : <div className="empty">
          <h3>{busqueda ? "Sin coincidencias" : "Todavía no hay clientes"}</h3>
          <p>{busqueda ? "Prueba con otro nombre, teléfono o correo." : "Los clientes se registran al tomar un pedido o una solicitud de maqueta."}</p>
        </div>)}

      {!loading && !error && clientes.length > 0 && <p className="clientes-total">Mostrando {filtrados.length} de {clientes.length} clientes</p>}
    </section>
  </div>;
}

export default ClientesPage;
