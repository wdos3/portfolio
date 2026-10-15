import { portfolio } from './data/portfolio';
import { WheelGroup } from './components/WheelGroup';
import { entryHref, usePortfolioRoute } from './routing';

export default function App() {
  const { selection, notFound } = usePortfolioRoute();

  return (
    <main className="portfolio">
      <div className="identity">
        <h1>{portfolio.name}</h1>
        <p>{portfolio.subtitle}</p>
      </div>
      <WheelGroup selection={selection} notFound={notFound}
        onClose={() => { window.location.hash = ''; }}
        onActivate={(section, entry) => { window.location.hash = entryHref(section.id, entry.id); }}
      />
    </main>
  );
}
