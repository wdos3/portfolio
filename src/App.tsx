import { useState } from 'react';
import { portfolio } from './data/portfolio';
import { WheelGroup } from './components/WheelGroup';
import { DetailView } from './components/DetailView';
import type { DetailSelection } from './components/DetailView';

export default function App() {
  const [selection, setSelection] = useState<DetailSelection | null>(null);

  return (
    <main className={`portfolio${selection ? ' portfolio--detail-open' : ''}`}>
      <div className="identity">
        <h1>{portfolio.name}</h1>
        <p>{portfolio.subtitle}</p>
      </div>
      <WheelGroup onActivate={(section, entry, index) => {
        if (entry.kind === 'contact' && entry.type === 'external' && entry.value) {
          window.open(entry.value, '_blank', 'noopener,noreferrer');
          return;
        }
        setSelection({ section, entry, index });
      }} />
      {selection && <DetailView selection={selection} onClose={() => setSelection(null)} />}
    </main>
  );
}
