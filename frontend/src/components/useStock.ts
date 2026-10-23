import { useCallback, useEffect, useState } from 'react';
import { inventory } from '../services/inventory';
import type { Stock } from '../types/inventory';

export function useStock() {
  const [items, setItems] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion(v => v + 1), []);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    inventory.list(controller.signal).then(setItems).catch(e => { if (!controller.signal.aborted) setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [version]);
  return { items, loading, error, refresh };
}
