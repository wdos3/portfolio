import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { PortfolioEntry, PortfolioSection, WheelVariant } from '../data/portfolio';
import { useWheel } from '../hooks/useWheel';
import { WheelSegment } from './WheelSegment';
import { centerBack, centerRail, innerRail, mirrorRail, outerBack, outerRail, railPath, railX, rowGeometry, wheelGeometry } from './wheelGeometry';
import { DetailView } from './DetailView';
import type { DetailSelection } from '../routing';

interface WheelProps {
  section: PortfolioSection;
  mobileActive: boolean;
  expanded: boolean;
  hasExpansion: boolean;
  parkSide?: 'left' | 'right';
  detail: DetailSelection | null;
  onActivate: (section: PortfolioSection, entry: PortfolioEntry) => void;
  onClose: () => void;
  onCollapseComplete: () => void;
  onHorizontalSwipe: (direction: 'previous' | 'next') => void;
}

const { itemAngle, radius, focusY, headingY, entriesTop } = wheelGeometry;

function RailFrame({ variant }: { variant: WheelVariant }) {
  if (variant === 'center') {
    return (
      <g>
        <path className="rail-back" d={`${railPath(centerBack)} ${railPath(mirrorRail(centerBack))}`} />
        <path className="rail-front rail-start" d={railPath(centerRail)} />
        <path className="rail-front rail-end" d={railPath(mirrorRail(centerRail))} />
      </g>
    );
  }
  return (
    <g transform={variant === 'right' ? 'translate(360 0) scale(-1 1)' : undefined}>
      <path className="rail-back" d={railPath(outerBack)} />
      <path className="rail-front rail-start" d={railPath(outerRail)} />
      <path className="rail-inner rail-end" d={railPath(innerRail)} />
    </g>
  );
}

export function Wheel({ section, mobileActive, expanded, hasExpansion, parkSide, detail, onActivate, onClose, onCollapseComplete, onHorizontalSwipe }: WheelProps) {
  const { ref, position, selected, dragging, select, canActivate, isTap, consumeClick, handlers } = useWheel(section.entries.length, {
    dragStepRatio: radius * itemAngle / wheelGeometry.height,
    enabled: !hasExpansion,
    initialIndex: section.id === 'work' ? 0 : 1,
    requestedIndex: expanded && detail ? section.entries.findIndex((entry) => entry.id === detail.entry.id) : undefined,
    onHorizontalSwipe,
  });
  const [size, setSize] = useState({ width: wheelGeometry.width, height: wheelGeometry.height });
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      // Mobile hides inactive wheels with display:none; retain their last
      // usable projection until they become visible again.
      if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(ref.current!);
    return () => observer.disconnect();
  }, [ref]);
  const hadDetail = useRef(!!detail);
  useEffect(() => {
    if (hadDetail.current && !detail) {
      ref.current?.querySelector<HTMLButtonElement>(`[data-index="${selected}"]`)?.focus({ preventScroll: true });
    }
    hadDetail.current = !!detail;
  }, [detail, ref, selected]);
  const heading = rowGeometry(headingY, section.variant);
  const focus = rowGeometry(focusY, section.variant);
  const backX = railX(section.variant === 'center' ? centerBack : outerBack, focusY);
  const wheelStyle = {
    '--heading-x': `${(heading.left + heading.right) / 7.2}%`,
    '--heading-y': `${headingY / 6.4}%`,
    '--heading-skew': `${heading.skew}deg`,
    '--entries-top': `${entriesTop / 6.4}%`,
    '--focus-y': `${focusY / 6.4}%`,
    '--focus-left': `${(section.variant === 'right' ? focus.left : backX) / 3.6}%`,
    '--focus-right': `${(section.variant === 'left' ? focus.right : 360 - backX) / 3.6}%`,
  } as CSSProperties;

  return (
    <section
      ref={ref}
      className={`wheel wheel--${section.variant}${expanded ? ' wheel--expanded' : ''}${parkSide ? ` wheel--parked wheel--parked-${parkSide}` : ''}`}
      style={wheelStyle}
      data-section={section.id}
      data-mobile-active={mobileActive}
      data-dragging={dragging}
      data-rotating={!Number.isInteger(position)}
      inert={!!parkSide}
      aria-labelledby={`${section.id}-title`}
      aria-describedby="wheel-instructions"
      {...(!hasExpansion && !detail ? handlers : {})}
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget && event.propertyName === 'width' && !expanded && detail) onCollapseComplete();
      }}
    >
      <h2 id={`${section.id}-title`} className="wheel-title">{section.title}</h2>
      <svg className="wheel-frame" viewBox="0 0 360 640" preserveAspectRatio="none" fill="none" aria-hidden="true">
        <RailFrame variant={section.variant} />
      </svg>

      <div className="wheel-surface" inert={!!detail} aria-hidden={!!detail}>
        {section.entries.map((entry, index) => {
          const active = selected === index;
          function activate() {
            if (!canActivate()) return;
            select(index);
            onActivate(section, entry);
          }
          return (
            <WheelSegment
              key={entry.id}
              entry={entry}
              index={index}
              offset={index - position}
              variant={section.variant}
              size={size}
              selected={active}
              expanded={expanded}
              onTouchRelease={(event) => {
                if (event.pointerType === 'touch' && isTap(event)) {
                  // Respond on release; the browser's synthesized click can be
                  // delayed after a drag and must not activate the item twice.
                  activate();
                  consumeClick();
                }
              }}
              onActivate={activate}
            />
          );
        })}
      </div>
      {detail && <DetailView selection={detail} active={expanded} onClose={onClose} />}
      {section.entries.length === 0 && <p className="wheel-empty">More to come.</p>}
    </section>
  );
}
