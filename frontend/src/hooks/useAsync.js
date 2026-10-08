import { useEffect, useState } from 'react';
import { getErrorMessage } from '../services/api';

/** Runs an async function when deps change. Returns { data, loading, error, reload }. */
export default function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: '' }));
    fn()
      .then((data) => alive && setState({ data, loading: false, error: '' }))
      .catch((e) => alive && setState({ data: null, loading: false, error: getErrorMessage(e) }));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { ...state, reload: () => setTick((t) => t + 1) };
}
