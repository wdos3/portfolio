import { useState } from 'react';

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [status, setStatus] = useState<string | null>(null);
  return (
    <button aria-live="polite" onClick={async () => {
      try {
        await navigator.clipboard.writeText(value);
        setStatus('Copied');
      } catch {
        setStatus('Copy unavailable');
      }
    }}>{status ?? label}</button>
  );
}
