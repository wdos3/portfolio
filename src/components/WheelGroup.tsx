import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { PortfolioEntry, PortfolioSection } from '../data/portfolio';
import { sections } from '../data/portfolio';
import { Wheel } from './Wheel';
import { Icon } from './Icon';
import type { DetailSelection } from '../routing';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { focusBounds, wheelGeometry } from './wheelGeometry';

const markerGeometry = {
  '--side-focus-end': focusBounds('left').right,
  '--center-focus-start': focusBounds('center').left,
  '--focus-y': `${wheelGeometry.focusY / wheelGeometry.height * 100}%`,
} as CSSProperties;

interface WheelGroupProps {
  onActivate: (section: PortfolioSection, entry: PortfolioEntry) => void;
  selection: DetailSelection | null;
  notFound: boolean;
  onClose: () => void;
}

export function WheelGroup({ onActivate, selection, notFound, onClose }: WheelGroupProps) {
  const [mobileSection, setMobileSection] = useState(selection?.section.id ?? 'work');
  const [slideDirection, setSlideDirection] = useState(1);
  const [retainedSelection, setRetainedSelection] = useState(selection);
  const [hasInteracted, setHasInteracted] = useState(false);
  const reducedMotion = useReducedMotion();
  const shownSelection = selection ?? retainedSelection;
  const visibleSection = shownSelection?.section.id ?? mobileSection;
  const parkedSections = sections.filter((section) => section.id !== selection?.section.id);

  function changeMobileSection(sectionId: PortfolioSection['id']) {
    const current = sections.findIndex((section) => section.id === visibleSection);
    const next = sections.findIndex((section) => section.id === sectionId);
    if (current === next) return;
    setSlideDirection(next > current ? 1 : -1);
    setMobileSection(sectionId);
  }

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
    <div className={`wheel-layout${selection ? ' wheel-layout--expanded' : ''}`}
      onPointerDownCapture={() => setHasInteracted(true)}
      onWheelCapture={(event) => {
        if (!event.ctrlKey && !event.metaKey && Math.abs(event.deltaY) > Math.abs(event.deltaX)) setHasInteracted(true);
      }}
      onKeyDownCapture={(event) => {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', 'Enter', ' '].includes(event.key)) setHasInteracted(true);
      }}
    >
      <div className="mobile-sections" role="group" aria-label="Choose a section" inert={!!selection}>
        {sections.map((section) => (
          <button key={section.id} aria-label={section.title} aria-pressed={section.id === visibleSection} onClick={() => changeMobileSection(section.id)}>
            <Icon name={section.icon} />
            <span className="section-label" aria-hidden="true">{section.title}</span>
          </button>
        ))}
      </div>
      <p id="wheel-instructions" className="sr-only">
        Scroll or drag vertically to select. Use up and down arrow keys, Home, or End.
        Click or tap any labeled entry to open its details. Press Enter or Space to open the focused entry.
        On mobile, swipe horizontally to change sections.
      </p>
      <div className="wheel-group" style={{ ...markerGeometry, '--section-slide-from': `${slideDirection * 24}px` } as CSSProperties}>
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
              changeMobileSection(sections[Math.max(0, Math.min(sections.length - 1, index + (direction === 'next' ? 1 : -1)))].id);
            }}
          />
        ))}
      </div>
      {notFound ? <p className="interaction-hint" role="status">This entry is unavailable. <a href="#">Return to wheels</a></p> : <p className={`interaction-hint${hasInteracted ? ' interaction-hint--dismissed' : ''}`} aria-hidden="true">
        <span className="desktop-hint">Scroll or ↑ ↓ to rotate<span className="hint-separator">·</span>Click or Enter to explore</span>
        <span className="mobile-hint">Swipe ↔ sections · ↕ rotate · Tap to explore</span>
      </p>}
    </div>
  );
}
