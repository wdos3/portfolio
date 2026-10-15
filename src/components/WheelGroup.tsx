import { useRef, useState } from 'react';
import type { PortfolioEntry, PortfolioSection } from '../data/portfolio';
import { sections } from '../data/portfolio';
import { Wheel } from './Wheel';

interface WheelGroupProps {
  onActivate: (section: PortfolioSection, entry: PortfolioEntry, index: number) => void;
}

export function WheelGroup({ onActivate }: WheelGroupProps) {
  const [mobileSection, setMobileSection] = useState(0);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClickUntil = useRef(0);

  return (
    <div className="wheel-layout">
      <div className="mobile-sections" role="group" aria-label="Choose a section">
        {sections.map((section, index) => (
          <button key={section.id} aria-pressed={index === mobileSection} onClick={() => setMobileSection(index)}>
            {section.title}
          </button>
        ))}
      </div>
      <p id="wheel-instructions" className="sr-only">
        Scroll or drag vertically to select. Use up and down arrow keys, Home, or End.
        Click an item or press Enter to open it. On mobile, swipe horizontally to change sections.
      </p>
      <div
        className="wheel-group"
        onClickCapture={(event) => {
          if (performance.now() < suppressClickUntil.current) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
        onPointerDown={(event) => {
          if (event.isPrimary) swipeStart.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={(event) => {
          const start = swipeStart.current;
          swipeStart.current = null;
          if (!start || !window.matchMedia('(max-width: 900px)').matches) return;
          const dx = event.clientX - start.x;
          const dy = event.clientY - start.y;
          if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            suppressClickUntil.current = performance.now() + 300;
            setMobileSection((current) => Math.max(0, Math.min(sections.length - 1, current + (dx < 0 ? 1 : -1))));
          }
        }}
        onPointerCancel={() => { swipeStart.current = null; }}
      >
        {sections.map((section, index) => (
          <Wheel key={section.id} section={section} mobileActive={index === mobileSection} onActivate={onActivate} />
        ))}
      </div>
      <p className="interaction-hint" aria-hidden="true">
        <span className="desktop-hint">Scroll to explore</span>
        <span className="mobile-hint">Swipe to explore</span>
        <span className="hint-separator">·</span> Select to open
      </p>
    </div>
  );
}
