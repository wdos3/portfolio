import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { PortfolioEntry, PortfolioSection, WheelVariant } from '../data/portfolio';
import { useWheel } from '../hooks/useWheel';
import { Icon } from './Icon';
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

// Coordinates share a 360 × 640 design space with the SVG rails.
const itemAngle = 0.48;
const rotationRadius = 235;
const entriesTop = 190;
// Both rail variants enclose their usable face from y=80. The fixed topic
// occupies the middle of the space above the rotating entries.
const headingY = (80 + entriesTop) / 2;

function rowGeometry(y: number, variant: WheelVariant) {
  if (variant === 'center') {
    const inset = 36 + 19 * ((y - 338) / 260) ** 2;
    return { left: inset, right: 360 - inset, leftY: y, rightY: y, skew: 0 };
  }
  const left = 40 + 105 * ((y - 320) / 320) ** 2;
  const right = 325 + 35 * ((y - 320) / 260) ** 2;
  const tilt = (y - 320) * 0.12;
  if (variant === 'right') {
    return { left: 360 - right, right: 360 - left, leftY: y - tilt, rightY: y + tilt, skew: (y - 320) * 0.036 };
  }
  return { left, right, leftY: y + tilt, rightY: y - tilt, skew: (320 - y) * 0.036 };
}

function RailFrame({ variant }: { variant: WheelVariant }) {
  if (variant === 'center') {
    return (
      <g>
        <path className="rail-back" d="M 50 82 C 5 118 5 554 50 595 M 310 82 C 355 118 355 554 310 595" />
        <path className="rail-front rail-start" d="M 66 80 C 25 118 25 554 66 595" />
        <path className="rail-front rail-end" d="M 294 80 C 335 118 335 554 294 595" />
      </g>
    );
  }
  return (
    <g transform={variant === 'right' ? 'translate(360 0) scale(-1 1)' : undefined}>
      <path className="rail-back" d="M 145 0 C -48 94 -48 546 145 640" />
      <path className="rail-front rail-start" d="M 145 0 C 5 80 5 560 145 640" />
      <path className="rail-inner rail-end" d="M 360 82 C 314 140 314 500 360 558" />
    </g>
  );
}

export function Wheel({ section, mobileActive, expanded, hasExpansion, parkSide, detail, onActivate, onClose, onCollapseComplete, onHorizontalSwipe }: WheelProps) {
  const { ref, position, selected, dragging, select, canActivate, isTap, consumeClick, handlers } = useWheel(section.entries.length, {
    dragStepRatio: rotationRadius * itemAngle / 640,
    enabled: !hasExpansion,
    initialIndex: section.id === 'work' ? 0 : 1,
    requestedIndex: expanded && detail ? section.entries.findIndex((entry) => entry.id === detail.entry.id) : undefined,
    onHorizontalSwipe,
  });
  const hadDetail = useRef(!!detail);
  useEffect(() => {
    if (hadDetail.current && !detail) {
      ref.current?.querySelector<HTMLButtonElement>(`[data-index="${selected}"]`)?.focus({ preventScroll: true });
    }
    hadDetail.current = !!detail;
  }, [detail, ref, selected]);
  const rowY = (offset: number) => 330 + rotationRadius * Math.sin(offset * itemAngle);
  const heading = rowGeometry(headingY, section.variant);
  const wheelStyle = {
    '--heading-x': `${(heading.left + heading.right) / 7.2}%`,
    '--heading-y': `${headingY / 6.4}%`,
    '--heading-skew': `${heading.skew}deg`,
    '--entries-top': `${entriesTop / 6.4}%`,
  } as CSSProperties;

  return (
    <section
      ref={ref}
      className={`wheel wheel--${section.variant}${expanded ? ' wheel--expanded' : ''}${parkSide ? ` wheel--parked wheel--parked-${parkSide}` : ''}`}
      style={wheelStyle}
      data-section={section.id}
      data-mobile-active={mobileActive}
      data-dragging={dragging}
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
        <defs>
          <clipPath id={`${section.id}-entries-clip`}>
            <rect x="-24" y={entriesTop} width="408" height={640 - entriesTop} />
          </clipPath>
        </defs>
        <RailFrame variant={section.variant} />
        <g clipPath={`url(#${section.id}-entries-clip)`}>
          {section.entries.length > 0 && Array.from({ length: section.entries.length + 1 }, (_, index) => {
            const offset = index - position - 0.5;
            if (Math.abs(offset) > 3.2) return null;
            const row = rowGeometry(rowY(offset), section.variant);
            const opacity = Math.max(0, Math.min(1, (Math.min(row.leftY, row.rightY) - entriesTop) / 32));
            return <path key={index} className={`row-line${index === section.entries.length ? ' row-line--edge' : ''}`} opacity={opacity} d={`M ${row.left} ${row.leftY} L ${row.right} ${row.rightY}`} />;
          })}
        </g>
      </svg>

      <div className="wheel-surface" inert={!!detail} aria-hidden={!!detail}>
        {section.entries.map((entry, index) => {
          const offset = index - position;
          const y = rowY(offset);
          const row = rowGeometry(y, section.variant);
          const active = selected === index;
          const angle = offset * itemAngle;
          const depth = Math.max(0, Math.cos(angle));
          const edgeFade = Math.max(0, Math.min(1, (1.4 - Math.abs(angle)) / 0.25));
          const headingClearance = Math.max(0, Math.min(1, (y - entriesTop) / 48));
          const bend = section.variant === 'left' ? 52 : section.variant === 'right' ? -52 : 0;
          const x = (row.left + row.right) / 2 + bend * (1 - depth);
          const visible = Math.abs(angle) < 1.4;
          const style = {
            '--item-x': x / 3.6,
            '--item-y': y / 6.4,
            '--icon-skew': `${row.skew}deg`,
            '--icon-tilt': `${-angle * 24}deg`,
            '--icon-scale': 0.52 + 0.48 * depth ** 4,
            '--icon-opacity': (0.36 + 0.64 * depth ** 7) * edgeFade * headingClearance,
            visibility: visible ? 'visible' : 'hidden',
          } as CSSProperties;
          function activate() {
            if (!canActivate()) return;
            if (!active) {
              select(index);
              return;
            }
            onActivate(section, entry);
          }
          return (
            <button
              key={entry.id}
              className="wheel-item"
              style={style}
              data-index={index}
              data-selected={active}
              aria-label={entry.name}
              aria-pressed={active}
              aria-expanded={expanded && active}
              tabIndex={active ? 0 : -1}
              onPointerUp={(event) => {
                if (event.pointerType === 'touch' && isTap(event)) {
                  // Respond on release; the browser's synthesized click can be
                  // delayed after a drag and must not activate the item twice.
                  activate();
                  consumeClick();
                }
              }}
              onClick={activate}
            >
              <Icon className="wheel-icon" name={entry.icon} />
              <span className="wheel-label" aria-hidden="true">{entry.name}</span>
            </button>
          );
        })}
      </div>
      {detail && <DetailView selection={detail} active={expanded} onClose={onClose} />}
      {section.entries.length === 0 && <p className="wheel-empty">More to come.</p>}
    </section>
  );
}
