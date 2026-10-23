export function Feedback({ error, loading, loadingMessage = 'Cargando productos…' }: { error?: string; loading?: boolean; loadingMessage?: string }) {
  if (error) return <div className="notice error" role="alert">{error}</div>;
  if (loading) return <p role="status" className="notice">{loadingMessage}</p>;
  return null;
}
