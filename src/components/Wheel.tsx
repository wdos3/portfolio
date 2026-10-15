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
const rotationRadius = 205;
const focusY = 310;
const surfaceTop = 70;
const headingY = surfaceTop + 80;
const entriesTop = headingY + 40;

interface RailCurve {
  edge: number;
  control: number;
  top: number;
  bottom: number;
}

const centerRail: RailCurve = { edge: 66, control: 25, top: surfaceTop, bottom: 600 };
const centerEnd: RailCurve = { ...centerRail, edge: 360 - centerRail.edge, control: 360 - centerRail.control };
const centerBack: RailCurve = { ...centerRail, edge: 50, control: 5 };
const outerRail: RailCurve = { edge: 125, control: 20, top: 0, bottom: 640 };
const outerBack: RailCurve = { ...outerRail, control: -18 };
const innerRail: RailCurve = { edge: 344, control: 320, top: surfaceTop, bottom: 600 };

function railPath({ edge, control, top, bottom }: RailCurve) {
  const third = (bottom - top) / 3;
  return `M ${edge} ${top} C ${control} ${top + third} ${control} ${bottom - third} ${edge} ${bottom}`;
}

function railX(rail: RailCurve, y: number) {
  // Equally spaced vertical control points make y linear in t. This evaluates
  // the actual rail, so separators meet its stroke rather than an approximation.
  const t = Math.max(0, Math.min(1, (y - rail.top) / (rail.bottom - rail.top)));
  return rail.edge + 3 * (rail.control - rail.edge) * t * (1 - t);
}

function rowGeometry(y: number, variant: WheelVariant) {
  if (variant === 'center') {
    const inset = railX(centerRail, y);
    return { left: inset, right: 360 - inset, leftY: y, rightY: y, skew: 0 };
  }
  const tilt = (y - 330) * 0.07;
  const leftY = y + tilt;
  const rightY = y - tilt;
  const left = railX(outerRail, leftY);
  const right = railX(innerRail, rightY);
  const skew = Math.atan2(rightY - leftY, right - left) * 180 / Math.PI;
  if (variant === 'right') {
    return { left: 360 - right, right: 360 - left, leftY: rightY, rightY: leftY, skew: -skew };
  }
  return { left, right, leftY, rightY, skew };
}

function RailFrame({ variant }: { variant: WheelVariant }) {
  if (variant === 'center') {
    return (
      <g>
        <path className="rail-back" d={`${railPath(centerBack)} ${railPath({ ...centerBack, edge: 360 - centerBack.edge, control: 360 - centerBack.control })}`} />
        <path className="rail-front rail-start" d={railPath(centerRail)} />
        <path className="rail-front rail-end" d={railPath(centerEnd)} />
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
  const rowY = (offset: number) => focusY + rotationRadius * Math.sin(offset * itemAngle);
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
          const headingClearance = Math.max(0, Math.min(1, (y - entriesTop) / 36));
          const bend = section.variant === 'left' ? 24 : section.variant === 'right' ? -24 : 0;
          const x = (row.left + row.right) / 2 + bend * (1 - depth);
          const visible = Math.abs(angle) < 1.4;
          const style = {
            '--item-x': x / 3.6,
            '--item-y': y / 6.4,
            '--item-width': (row.right - row.left - 32) / 3.6,
            '--icon-skew': `${row.skew}deg`,
            '--icon-tilt': `${-angle * 12}deg`,
            '--icon-scale': 0.78 + 0.22 * depth ** 4,
            '--entry-opacity': (0.5 + 0.5 * depth ** 4) * edgeFade * headingClearance,
            '--entry-depth': depth ** 4,
            '--entry-fade': edgeFade * headingClearance,
            visibility: visible ? 'visible' : 'hidden',
          } as CSSProperties;
          function activate() {
            if (!canActivate()) return;
            select(index);
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
