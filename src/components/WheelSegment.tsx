import type { CSSProperties, PointerEvent } from 'react';
import type { PortfolioEntry, WheelVariant } from '../data/portfolio';
import { segmentGeometry } from './wheelGeometry';
import type { WheelSize } from './wheelGeometry';
import { Icon } from './Icon';

interface WheelSegmentProps {
  entry: PortfolioEntry;
  index: number;
  offset: number;
  variant: WheelVariant;
  size: WheelSize;
  selected: boolean;
  expanded: boolean;
  onActivate: () => void;
  onTouchRelease: (event: PointerEvent<HTMLButtonElement>) => void;
}

export function WheelSegment({ entry, index, offset, variant, size, selected, expanded, onActivate, onTouchRelease }: WheelSegmentProps) {
  const geometry = segmentGeometry(offset, variant, size);
  const style = {
    width: geometry.width,
    height: geometry.height,
    transform: geometry.transform,
    visibility: geometry.visible ? 'visible' : 'hidden',
    '--entry-depth': geometry.depth,
    '--entry-fade': geometry.fade,
    '--entry-opacity': (0.5 + 0.5 * geometry.depth) * geometry.fade,
  } as CSSProperties;

  return (
    <div className="wheel-segment" style={style}>
      <svg className="segment-frame" viewBox="0 0 1 1" preserveAspectRatio="none" fill="none" aria-hidden="true">
        {index === 0 && <path className="row-line" d="M 0 0 L 1 0" />}
        <path className="row-line" d="M 0 1 L 1 1" />
      </svg>
      <button
        className="wheel-item"
        data-index={index}
        data-selected={selected}
        aria-label={entry.name}
        aria-pressed={selected}
        aria-expanded={expanded && selected}
        tabIndex={selected ? 0 : -1}
        onPointerUp={onTouchRelease}
        onClick={onActivate}
      >
        <span className="wheel-content">
          <span className="wheel-glyph"><Icon className="wheel-icon" name={entry.icon} /></span>
          <span className="wheel-label" aria-hidden="true">{entry.name}</span>
        </span>
      </button>
    </div>
  );
}
