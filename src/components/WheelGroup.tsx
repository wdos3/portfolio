import { useEffect, useState } from 'react';
import type { PortfolioEntry, PortfolioSection } from '../data/portfolio';
import { sections } from '../data/portfolio';
import { Wheel } from './Wheel';
import { Icon } from './Icon';
import type { DetailSelection } from '../routing';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface WheelGroupProps {
  onActivate: (section: PortfolioSection, entry: PortfolioEntry) => void;
  selection: DetailSelection | null;
  notFound: boolean;
  onClose: () => void;
}

export function WheelGroup({ onActivate, selection, notFound, onClose }: WheelGroupProps) {
  const [mobileSection, setMobileSection] = useState(selection?.section.id ?? 'work');
  const [retainedSelection, setRetainedSelection] = useState(selection);
  const reducedMotion = useReducedMotion();
  const shownSelection = selection ?? retainedSelection;
  const visibleSection = shownSelection?.section.id ?? mobileSection;
  const parkedSections = sections.filter((section) => section.id !== selection?.section.id);

  // Keep the content mounted while the rails return to their curved shape.
  // Reduced motion has no transition-end event, so it releases it immediately.
  useEffect(() => {
    if (!selection && !reducedMotion) return;
    const frame = requestAnimationFrame(() => {
      setRetainedSelection(selection);
      if (selection) setMobileSection(selection.section.id);
    });
    return () => cancelAnimationFrame(frame);
  }, [selection, reducedMotion]);

  return (
    <div className={`wheel-layout${selection ? ' wheel-layout--expanded' : ''}`}>
      <div className="mobile-sections" role="group" aria-label="Choose a section" inert={!!selection}>
        {sections.map((section) => (
          <button key={section.id} aria-label={section.title} aria-pressed={section.id === visibleSection} onClick={() => setMobileSection(section.id)}>
            <Icon name={section.icon} />
            <span className="section-label" aria-hidden="true">{section.title}</span>
          </button>
        ))}
      </div>
      <p id="wheel-instructions" className="sr-only">
        Scroll or drag vertically to select. Use up and down arrow keys, Home, or End.
        Click an icon to bring it forward, then click the selected icon or press Enter to open details.
        On mobile, swipe horizontally to change sections.
      </p>
      <div className="wheel-group">
        {sections.map((section) => (
          <Wheel key={section.id} section={section} mobileActive={section.id === visibleSection}
            expanded={selection?.section.id === section.id} hasExpansion={!!selection}
            parkSide={selection && selection.section.id !== section.id ? parkedSections[0].id === section.id ? 'left' : 'right' : undefined}
            detail={shownSelection?.section.id === section.id ? shownSelection : null}
            onClose={onClose} onCollapseComplete={() => { if (!selection) setRetainedSelection(null); }}
            onActivate={(target, entry) => { setMobileSection(target.id); onActivate(target, entry); }}
            onHorizontalSwipe={(direction) => {
              if (!window.matchMedia('(max-width: 900px)').matches) return;
              const index = sections.findIndex((candidate) => candidate.id === section.id);
              setMobileSection(sections[Math.max(0, Math.min(sections.length - 1, index + (direction === 'next' ? 1 : -1)))].id);
            }}
          />
        ))}
      </div>
      {notFound ? <p className="interaction-hint" role="status">This entry is unavailable. <a href="#">Return to wheels</a></p> : <p className="interaction-hint" aria-hidden="true">
        <span className="desktop-hint">Scroll to explore</span>
        <span className="mobile-hint">Swipe to explore</span>
        <span className="hint-separator">·</span> Open the focused icon
      </p>}
    </div>
  );
}
