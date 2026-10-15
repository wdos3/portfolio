import type { CSSProperties } from 'react';
import type { PortfolioEntry, PortfolioSection, WheelVariant } from '../data/portfolio';
import { useWheel } from '../hooks/useWheel';
import { Icon } from './Icon';

interface WheelProps {
  section: PortfolioSection;
  mobileActive: boolean;
  onActivate: (section: PortfolioSection, entry: PortfolioEntry) => void;
}

// Coordinates share a 360 × 640 design space with the SVG rails.
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
        <path className="rail-front" d="M 66 80 C 25 118 25 554 66 595 M 294 80 C 335 118 335 554 294 595" />
      </g>
    );
  }
  return (
    <g transform={variant === 'right' ? 'translate(360 0) scale(-1 1)' : undefined}>
      <path className="rail-back" d="M 145 0 C -48 94 -48 546 145 640" />
      <path className="rail-front" d="M 145 0 C 5 80 5 560 145 640" />
      <path className="rail-inner" d="M 360 82 C 314 140 314 500 360 558" />
    </g>
  );
}

export function Wheel({ section, mobileActive, onActivate }: WheelProps) {
  const { ref, position, selected, select, canActivate, isTap, consumeClick, handlers } = useWheel(section.entries.length);
  const rowY = (offset: number) => 330 + 235 * Math.sin(offset * 0.48);
  const titleLine = rowGeometry(section.variant === 'center' ? 98 : 79, section.variant);
  const lastOffset = section.entries.length - position - 0.5;
  const lastLine = section.entries.length > 0 && Math.abs(lastOffset) < 3.2
    ? rowGeometry(rowY(lastOffset), section.variant)
    : null;

  return (
    <section
      ref={ref}
      className={`wheel wheel--${section.variant}`}
      data-mobile-active={mobileActive}
      aria-labelledby={`${section.id}-title`}
      aria-describedby="wheel-instructions"
      {...handlers}
    >
      <svg className="wheel-frame" viewBox="0 0 360 640" preserveAspectRatio="none" fill="none" aria-hidden="true">
        <RailFrame variant={section.variant} />
        <path className="row-line row-line--edge" d={`M ${titleLine.left} ${titleLine.leftY} L ${titleLine.right} ${titleLine.rightY}`} />
        {section.entries.map((entry, index) => {
          const offset = index - position;
          if (Math.abs(offset - 0.5) > 3.2) return null;
          const row = rowGeometry(rowY(offset - 0.5), section.variant);
          return <path key={entry.id} className="row-line" d={`M ${row.left} ${row.leftY} L ${row.right} ${row.rightY}`} />;
        })}
        {lastLine && <path className="row-line row-line--edge" d={`M ${lastLine.left} ${lastLine.leftY} L ${lastLine.right} ${lastLine.rightY}`} />}
      </svg>

      <h2 id={`${section.id}-title`} className="wheel-title">{section.title}</h2>
      <div className="wheel-surface">
        {section.entries.map((entry, index) => {
          const offset = index - position;
          const y = rowY(offset);
          const row = rowGeometry(y, section.variant);
          const active = selected === index;
          const angle = offset * 0.48;
          const depth = Math.max(0, Math.cos(angle));
          const edgeFade = Math.max(0, Math.min(1, (1.4 - Math.abs(angle)) / 0.25));
          const bend = section.variant === 'left' ? 52 : section.variant === 'right' ? -52 : 0;
          const x = (row.left + row.right) / 2 + bend * (1 - depth);
          const visible = Math.abs(angle) < 1.4;
          const style = {
            '--item-x': x / 3.6,
            '--item-y': y / 6.4,
            '--icon-skew': `${row.skew}deg`,
            '--icon-tilt': `${-angle * 24}deg`,
            '--icon-scale': 0.52 + 0.48 * depth ** 4,
            '--icon-opacity': (0.36 + 0.64 * depth ** 7) * edgeFade,
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
              aria-haspopup={entry.kind === 'contact' && entry.type === 'external' && entry.value ? undefined : 'dialog'}
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
              <Icon className="wheel-icon" name={entry.icon ?? 'folder'} />
              <span className="wheel-label" aria-hidden="true">{entry.name}</span>
            </button>
          );
        })}
      </div>
      {section.entries.length === 0 && <p className="wheel-empty">More to come.</p>}
    </section>
  );
}
